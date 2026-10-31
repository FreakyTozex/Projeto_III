export type EventKind = "access" | "transaction" | "tamper";

export interface ApiEvent {
  id: number;
  event_id: string;
  device_id: string;
  kind: EventKind;
  ts: string;
  user_id: string | null;
  success: boolean | null;
  reason: string | null;
  tx_type: "deposit" | "withdrawal" | null;
  weight_delta_g: number | null;
  est_notes: number | null;
  intensity: number | null;
}

export interface Device {
  device_id: string;
  online: boolean;
  door_open: boolean;
  last_seen: string | null;
}

export interface DailyStat {
  day: string;
  deposits: number;
  withdrawals: number;
  notes_in: number;
  notes_out: number;
}

export interface Card {
  id: number;
  uid_hash: string;
  name: string;
  active: boolean;
}

export type LiveMessage =
  | { type: "event"; data: ApiEvent }
  | { type: "status"; data: Device };
