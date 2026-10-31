import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../api";

export default function DevicePanel() {
  const { data: devices = [], isLoading } = useQuery({ queryKey: ["devices"], queryFn: api.devices });
  const cmd = useMutation({
    mutationFn: (v: { id: string; action: "lock" | "unlock" }) => api.command(v.id, v.action),
  });

  return (
    <section className="panel" aria-labelledby="devices-title">
      <h2 id="devices-title">Caixas</h2>
      {isLoading && <p className="muted">A carregar…</p>}
      {!isLoading && devices.length === 0 && (
        <p className="muted">Ainda nenhuma caixa se ligou. Liga o ESP32 ou corre o simulador.</p>
      )}
      <ul className="devices">
        {devices.map((d) => (
          <li key={d.device_id} className="device">
            <div className="device-head">
              <span className={`dot ${d.online ? "on" : "off"}`} aria-hidden />
              <strong>{d.device_id}</strong>
              <span className="muted">{d.online ? "online" : "offline"}</span>
            </div>
            <p className={d.door_open ? "door open" : "door"}>
              {d.door_open ? "Gaveta aberta" : "Gaveta fechada"}
            </p>
            {d.last_seen && (
              <p className="muted small">
                Último sinal às {new Date(d.last_seen).toLocaleTimeString("pt-PT")}
              </p>
            )}
            <div className="row">
              <button disabled={!d.online || cmd.isPending} onClick={() => cmd.mutate({ id: d.device_id, action: "lock" })}>
                Bloquear
              </button>
              <button className="ghost" disabled={!d.online || cmd.isPending} onClick={() => cmd.mutate({ id: d.device_id, action: "unlock" })}>
                Desbloquear
              </button>
            </div>
          </li>
        ))}
      </ul>
      {cmd.isError && <p className="error">{(cmd.error as Error).message}</p>}
    </section>
  );
}
