import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiEvent, Device, LiveMessage } from "./types";

/** Liga ao WebSocket do back-end e mantém a cache do React Query atualizada. */
export function useLive(): boolean {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: number | undefined;
    let attempt = 0;
    let closed = false;

    const open = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/ws`);

      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
        qc.invalidateQueries(); // recupera o que se perdeu enquanto estava offline
      };

      ws.onmessage = (msg) => {
        const live = JSON.parse(msg.data) as LiveMessage;
        if (live.type === "event") {
          qc.setQueryData<ApiEvent[]>(["events"], (prev = []) =>
            [live.data, ...prev.filter((e) => e.event_id !== live.data.event_id)].slice(0, 100),
          );
          if (live.data.kind === "transaction") qc.invalidateQueries({ queryKey: ["stats"] });
        } else {
          qc.setQueryData<Device[]>(["devices"], (prev = []) =>
            [...prev.filter((d) => d.device_id !== live.data.device_id), live.data].sort((a, b) =>
              a.device_id.localeCompare(b.device_id),
            ),
          );
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!closed) timer = window.setTimeout(open, Math.min(1000 * 2 ** attempt++, 15000));
      };
    };

    open();
    return () => {
      closed = true;
      window.clearTimeout(timer);
      ws?.close();
    };
  }, [qc]);

  return connected;
}
