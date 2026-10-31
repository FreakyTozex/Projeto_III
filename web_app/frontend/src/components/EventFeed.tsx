import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { ApiEvent } from "../types";

const REASONS: Record<string, string> = {
  wrong_pin: "PIN errado",
  unknown_card: "cartão desconhecido",
  locked: "caixa bloqueada",
};

function describe(e: ApiEvent): { tone: string; text: string } {
  switch (e.kind) {
    case "transaction": {
      const grams = Math.abs(e.weight_delta_g ?? 0).toLocaleString("pt-PT", { maximumFractionDigits: 1 });
      const notes = e.est_notes != null ? `${e.est_notes} notas (${grams} g)` : `${grams} g`;
      return e.tx_type === "deposit"
        ? { tone: "in", text: `${e.user_id} depositou ${notes}` }
        : { tone: "out", text: `${e.user_id} levantou ${notes}` };
    }
    case "access":
      return e.success
        ? { tone: "ok", text: `${e.user_id ?? "Utilizador"} abriu a caixa` }
        : { tone: "alert", text: `Acesso recusado: ${REASONS[e.reason ?? ""] ?? e.reason ?? "motivo desconhecido"}` };
    case "tamper":
      return { tone: "alert strong", text: `Possível violação da caixa (intensidade ${e.intensity})` };
  }
}

export default function EventFeed() {
  const { data: events = [], isLoading, isError } = useQuery({ queryKey: ["events"], queryFn: api.events });

  return (
    <section className="panel" aria-labelledby="feed-title">
      <h2 id="feed-title">Atividade</h2>
      {isLoading && <p className="muted">A carregar…</p>}
      {isError && <p className="error">Não foi possível obter os eventos. O back-end está a correr?</p>}
      {!isLoading && !isError && events.length === 0 && (
        <p className="muted">Sem atividade registada. Os eventos aparecem aqui em tempo real.</p>
      )}
      <ol className="feed" aria-live="polite">
        {events.map((e) => {
          const { tone, text } = describe(e);
          return (
            <li key={e.event_id} className={`event ${tone}`}>
              <time dateTime={e.ts}>
                {new Date(e.ts).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </time>
              <span>{text}</span>
              <span className="muted small">{e.device_id}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
