import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock, LockOpen } from "lucide-react";
import { api } from "../api";

/** Mostrador do cofre: a roda gira quando a gaveta abre. */
function Dial({ open, online }: { open: boolean; online: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={`dial${open ? " open" : ""}${online ? "" : " off"}`} role="img"
      aria-label={open ? "Gaveta aberta" : "Gaveta fechada"}>
      <circle className="dial-ticks" cx="60" cy="60" r="54" />
      <circle className="dial-face" cx="60" cy="60" r="42" />
      <g className="dial-handle">
        {[0, 120, 240].map((a) => (
          <line key={a} x1="60" y1="60" x2="60" y2="30" transform={`rotate(${a} 60 60)`} />
        ))}
        <circle cx="60" cy="60" r="8" />
      </g>
    </svg>
  );
}

export default function DevicePanel() {
  const { data: devices = [], isLoading } = useQuery({ queryKey: ["devices"], queryFn: api.devices });
  const cmd = useMutation({ mutationFn: (v: { id: string; action: "lock" | "unlock" }) => api.command(v.id, v.action) });

  return (
    <section className="panel" aria-labelledby="devices-title">
      <h2 id="devices-title">Caixas</h2>
      {isLoading && <p className="muted">A carregar…</p>}
      {!isLoading && devices.length === 0 && (
        <p className="muted">Nenhuma caixa ligada. Liga o ESP32 ou arranca o simulador.</p>
      )}
      <ul className="devices">
        {devices.map((d) => (
          <li key={d.device_id} className="device">
            <Dial open={d.door_open} online={d.online} />
            <div className="device-info">
              <strong>{d.device_id}</strong>
              <span className={`pill ${d.online ? "ok" : "off"}`}>{d.online ? "Online" : "Offline"}</span>
              <p className={d.door_open ? "door open" : "door"}>{d.door_open ? "Gaveta aberta" : "Gaveta fechada"}</p>
              {d.last_seen && <p className="muted small">Último sinal às {new Date(d.last_seen).toLocaleTimeString("pt-PT")}</p>}
              <div className="row">
                <button disabled={!d.online || cmd.isPending} onClick={() => cmd.mutate({ id: d.device_id, action: "lock" })}>
                  <Lock size={15} aria-hidden /> Bloquear
                </button>
                <button className="ghost" disabled={!d.online || cmd.isPending} onClick={() => cmd.mutate({ id: d.device_id, action: "unlock" })}>
                  <LockOpen size={15} aria-hidden /> Desbloquear
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {cmd.isError && <p className="error">{(cmd.error as Error).message}</p>}
    </section>
  );
}
