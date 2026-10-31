import type { ApiEvent, Card, DailyStat, Device } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? `Erro ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  events: () => request<ApiEvent[]>("/events?limit=100"),
  devices: () => request<Device[]>("/devices"),
  daily: () => request<DailyStat[]>("/stats/daily?days=14"),
  command: (id: string, action: "lock" | "unlock") =>
    request(`/devices/${encodeURIComponent(id)}/cmd`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  cards: () => request<Card[]>("/cards"),
  addCard: (body: { uid_hash: string; name: string }) =>
    request<Card>("/cards", { method: "POST", body: JSON.stringify(body) }),
  removeCard: (id: number) => request<void>(`/cards/${id}`, { method: "DELETE" }),
};
