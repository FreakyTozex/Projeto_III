from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Event(Base):
    """Registo de auditoria: só se insere, nunca se atualiza nem apaga."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[str] = mapped_column(String(64), unique=True)  # dedupe
    device_id: Mapped[str] = mapped_column(String(64), index=True)
    kind: Mapped[str] = mapped_column(String(16), index=True)  # access | transaction | tamper
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    user_id: Mapped[str | None] = mapped_column(String(64))
    success: Mapped[bool | None] = mapped_column(Boolean)
    reason: Mapped[str | None] = mapped_column(String(64))
    tx_type: Mapped[str | None] = mapped_column(String(16))
    weight_delta_g: Mapped[float | None] = mapped_column(Float)
    est_notes: Mapped[int | None] = mapped_column(Integer)
    intensity: Mapped[float | None] = mapped_column(Float)


class Device(Base):
    __tablename__ = "devices"

    device_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    online: Mapped[bool] = mapped_column(Boolean, default=False)
    door_open: Mapped[bool] = mapped_column(Boolean, default=False)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Card(Base):
    """Cartões RFID autorizados. Guarda o hash do UID, nunca o UID em claro."""

    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    uid_hash: Mapped[str] = mapped_column(String(128), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
