from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict


# ---------- Payloads recebidos do ESP32 ----------
class TxType(str, Enum):
    deposit = "deposit"
    withdrawal = "withdrawal"


class TransactionEvent(BaseModel):
    event_id: str
    ts: datetime
    user_id: str
    type: TxType
    weight_delta_g: float
    est_notes: int | None = None


class AccessEvent(BaseModel):
    event_id: str
    ts: datetime
    user_id: str | None = None
    success: bool
    reason: str | None = None  # wrong_pin | unknown_card | locked


class TamperEvent(BaseModel):
    event_id: str
    ts: datetime
    intensity: float


class StatusPayload(BaseModel):
    online: bool
    door_open: bool = False


# ---------- Respostas da API ----------
class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: str
    device_id: str
    kind: str
    ts: datetime
    user_id: str | None
    success: bool | None
    reason: str | None
    tx_type: str | None
    weight_delta_g: float | None
    est_notes: int | None
    intensity: float | None


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    online: bool
    door_open: bool
    last_seen: datetime | None


class DailyStat(BaseModel):
    day: date
    deposits: int
    withdrawals: int
    notes_in: int
    notes_out: int


class CardIn(BaseModel):
    uid_hash: str
    name: str


class CardOut(CardIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    active: bool


class Command(BaseModel):
    action: Literal["lock", "unlock"]
