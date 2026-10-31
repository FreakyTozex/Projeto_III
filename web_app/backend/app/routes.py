from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_session
from .models import Card, Device, Event
from .mqtt import mqtt_service
from .schemas import CardIn, CardOut, Command, DailyStat, DeviceOut, EventOut

router = APIRouter(prefix="/api")


@router.get("/events", response_model=list[EventOut])
async def list_events(
    kind: str | None = None,
    device_id: str | None = None,
    limit: int = Query(100, le=500),
    session: AsyncSession = Depends(get_session),
):
    q = select(Event).order_by(Event.ts.desc()).limit(limit)
    if kind:
        q = q.where(Event.kind == kind)
    if device_id:
        q = q.where(Event.device_id == device_id)
    return (await session.scalars(q)).all()


@router.get("/devices", response_model=list[DeviceOut])
async def list_devices(session: AsyncSession = Depends(get_session)):
    return (await session.scalars(select(Device).order_by(Device.device_id))).all()


@router.post("/devices/{device_id}/cmd", status_code=202)
async def send_command(device_id: str, cmd: Command):
    try:
        await mqtt_service.publish(f"atm/{device_id}/cmd", {"action": cmd.action})
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    return {"sent": cmd.action}


@router.get("/stats/daily", response_model=list[DailyStat])
async def daily_stats(days: int = Query(14, le=90), session: AsyncSession = Depends(get_session)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    day = func.date_trunc("day", Event.ts)
    q = (
        select(
            day.label("day"),
            Event.tx_type,
            func.count().label("n"),
            func.coalesce(func.sum(Event.est_notes), 0).label("notes"),
        )
        .where(Event.kind == "transaction", Event.ts >= since)
        .group_by(day, Event.tx_type)
        .order_by(day)
    )
    acc: dict[date, dict[str, int]] = defaultdict(
        lambda: {"deposits": 0, "withdrawals": 0, "notes_in": 0, "notes_out": 0}
    )
    for d, tx_type, n, notes in (await session.execute(q)).all():
        bucket = acc[d.date()]
        if tx_type == "deposit":
            bucket["deposits"], bucket["notes_in"] = n, int(notes)
        else:
            bucket["withdrawals"], bucket["notes_out"] = n, int(notes)
    return [DailyStat(day=d, **v) for d, v in sorted(acc.items())]


@router.get("/cards", response_model=list[CardOut])
async def list_cards(session: AsyncSession = Depends(get_session)):
    return (await session.scalars(select(Card).order_by(Card.name))).all()


@router.post("/cards", response_model=CardOut, status_code=201)
async def add_card(body: CardIn, session: AsyncSession = Depends(get_session)):
    card = Card(uid_hash=body.uid_hash, name=body.name)
    session.add(card)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "Este cartão já está registado")
    return card


@router.delete("/cards/{card_id}", status_code=204)
async def remove_card(card_id: int, session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Card).where(Card.id == card_id))
    await session.commit()
