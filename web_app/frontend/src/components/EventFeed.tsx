import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, KeyRound, ShieldAlert, ShieldX, type LucideIcon } from "lucide-react";
import { api } from "../api";
import type { ApiEvent } from "../types";

const REASONS: Record<string, string> = {
  wrong_pin: "PIN errado",
  unknown_card: "Cartão desconhecido",
  locked: "Caixa bloqueada",
};

type Filter = "all" | "transaction" | "access" | "alert";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "transaction", label: "Transações" },
  { id: "access", label: "Acessos" },
  { id: "alert", label: "Alertas" },
];

const isAlert = (e: ApiEvent) => e.kind === "tamper" || (e.kind === "access" && e.success === false);

function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `há ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `há ${h} h` : new Date(iso).toLocaleDateString("pt-PT");
}

function describe(e: ApiEvent): { tone: string; Icon: LucideIcon; title: string; detail: string; amount?: string } {
  switch (e.kind) {
    case "transaction": {
      const grams = Math.abs(e.weight_delta_g ?? 0).toLocaleString("pt-PT", { maximumFractionDigits: 1 });
      const dep = e.tx_type === "deposit";
      return {
        tone: dep ? "in" : "out",
        Icon: dep ? ArrowDownToLine : ArrowUpFromLine,
        title: dep ? "Depósito" : "Levantamento",
        detail: `${e.user_id} · ${grams} g`,
        amount: e.est_notes != null ? `${dep ? "+" : "−"}${e.est_notes} notas` : undefined,
      };
    }
    case "access":
      return e.success
        ? { tone: "ok", Icon: KeyRound, title: "Acesso autorizado", detail: e.user_id ?? "Utilizador" }
        : { tone: "alert", Icon: ShieldX, title: "Acesso recusado", detail: REASONS[e.reason ?? ""] ?? e.reason ?? "Motivo desconhecido" };
    case "tamper":
      return { tone: "alert strong", Icon: ShieldAlert, title: "Possível violação", detail: `Intensidade ${e.intensity}` };
  }
}

export default function EventFeed() {
  const { data: events = [], isLoading, isError } = useQuery({ queryKey: ["events"], queryFn: api.events });
  const [filter, setFilter] = useState<Filter>("all");
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30_000); // atualiza os "há x min"
    return () => window.clearInterval(t);
  }, []);

  const shown = events.filter((e) => filter === "all" || (filter === "alert" ? isAlert(e) : e.kind === filter));

  return (
    <section className="panel" aria-labelledby="feed-title">
      <div className="panel-head">
        <h2 id="feed-title">Registo de atividade</h2>
        <div className="seg" role="group" aria-label="Filtrar atividade">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "on" : ""} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading && <p className="muted">A carregar…</p>}
      {isError && <p className="error">Não foi possível obter os eventos. Verifica se o back-end está a correr.</p>}
      {!isLoading && !isError && shown.length === 0 && <p className="muted">Sem registos para este filtro. Os novos eventos aparecem aqui em direto.</p>}
      <ol className="ledger" aria-live="polite">
        {shown.map((e) => {
          const { tone, Icon, title, detail, amount } = describe(e);
          return (
            <li key={e.event_id} className={`entry ${tone}`}>
              <span className="entry-icon"><Icon size={18} aria-hidden /></span>
              <div className="entry-main">
                <strong>{title}</strong>
                <span className="muted">{detail}</span>
              </div>
              <span className="entry-amount">{amount}</span>
              <time className="entry-time" dateTime={e.ts} title={new Date(e.ts).toLocaleString("pt-PT")}>
                {ago(e.ts)}<span className="muted small"> · {e.device_id}</span>
              </time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
