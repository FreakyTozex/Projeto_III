import asyncio
import json
import logging
from datetime import datetime, timezone

import aiomqtt
from pydantic import BaseModel, ValidationError
from sqlalchemy.dialects.postgresql import insert

from .config import settings
from .db import SessionLocal
from .models import Device, Event
from .schemas import (
    AccessEvent,
    DeviceOut,
    EventOut,
    StatusPayload,
    TamperEvent,
    TransactionEvent,
)
from .ws import manager

log = logging.getLogger("mqtt")

EVENT_MODELS: dict[str, type[BaseModel]] = {
    "access": AccessEvent,
    "transaction": TransactionEvent,
    "tamper": TamperEvent,
}


async def handle_event(device_id: str, kind: str, data: dict) -> None:
    model = EVENT_MODELS[kind].model_validate(data)
    tx_type = getattr(model, "type", None)
    row = {
        "event_id": model.event_id,
        "device_id": device_id,
        "kind": kind,
        "ts": model.ts,
        "user_id": getattr(model, "user_id", None),
        "success": getattr(model, "success", None),
        "reason": getattr(model, "reason", None),
        "tx_type": tx_type.value if tx_type else None,
        "weight_delta_g": getattr(model, "weight_delta_g", None),
        "est_notes": getattr(model, "est_notes", None),
        "intensity": getattr(model, "intensity", None),
    }
    async with SessionLocal() as session:
        stmt = (
            insert(Event)
            .values(**row)
            .on_conflict_do_nothing(index_elements=["event_id"])  # QoS 1 pode duplicar
            .returning(Event)
        )
        event = (await session.execute(stmt)).scalar_one_or_none()
        await session.commit()
    if event is None:
        return  # duplicado, já processado
    await manager.broadcast(
        {"type": "event", "data": EventOut.model_validate(event).model_dump(mode="json")}
    )


async def handle_status(device_id: str, data: dict) -> None:
    status = StatusPayload.model_validate(data)
    values = {
        "device_id": device_id,
        "online": status.online,
        "door_open": status.door_open,
        "last_seen": datetime.now(timezone.utc),
    }
    async with SessionLocal() as session:
        stmt = insert(Device).values(**values)
        stmt = stmt.on_conflict_do_update(index_elements=["device_id"], set_=values).returning(Device)
        device = (await session.execute(stmt)).scalar_one()
        await session.commit()
    await manager.broadcast(
        {"type": "status", "data": DeviceOut.model_validate(device).model_dump(mode="json")}
    )


async def handle_message(topic: str, payload: bytes) -> None:
    # atm/{device_id}/events/{kind}  |  atm/{device_id}/status
    parts = topic.split("/")
    if len(parts) < 3 or parts[0] != "atm":
        return
    device_id = parts[1]
    try:
        data = json.loads(payload)
        if parts[2] == "status":
            await handle_status(device_id, data)
        elif parts[2] == "events" and len(parts) == 4 and parts[3] in EVENT_MODELS:
            await handle_event(device_id, parts[3], data)
    except (json.JSONDecodeError, ValidationError) as exc:
        log.warning("Payload inválido em %s: %s", topic, exc)


class MqttService:
    def __init__(self) -> None:
        self._client: aiomqtt.Client | None = None

    async def run(self) -> None:
        """Liga-se ao broker, subscreve e reconecta automaticamente."""
        while True:
            try:
                async with aiomqtt.Client(
                    hostname=settings.mqtt_host,
                    port=settings.mqtt_port,
                    username=settings.mqtt_user,
                    password=settings.mqtt_password,
                    identifier="atm-backend",
                    clean_session=False,  # o broker guarda eventos QoS 1 enquanto estivermos em baixo
                ) as client:
                    self._client = client
                    await client.subscribe("atm/+/events/+", qos=1)
                    await client.subscribe("atm/+/status", qos=1)
                    log.info("Ligado ao broker MQTT")
                    async for message in client.messages:
                        try:
                            await handle_message(str(message.topic), message.payload)
                        except Exception:
                            log.exception("Erro ao processar %s", message.topic)
            except aiomqtt.MqttError as exc:
                log.warning("MQTT desligado (%s). A tentar de novo em 5 s", exc)
                self._client = None
                await asyncio.sleep(5)

    async def publish(self, topic: str, payload: dict, qos: int = 1) -> None:
        if self._client is None:
            raise RuntimeError("Broker MQTT indisponível")
        await self._client.publish(topic, json.dumps(payload), qos=qos)


mqtt_service = MqttService()
