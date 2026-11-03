import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, ShieldAlert, Vault, type LucideIcon } from "lucide-react";
import { api } from "../api";

const fmt = (n: number) => n.toLocaleString("pt-PT");

interface Kpi {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
}

export default function KpiBand() {
  const { data: devices = [] } = useQuery({ queryKey: ["devices"], queryFn: api.devices });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: api.events });
  const { data: stats = [] } = useQuery({ queryKey: ["stats"], queryFn: api.daily });

  const today = stats.find((s) => s.day === new Date().toISOString().slice(0, 10));
  const notesIn = today?.notes_in ?? 0;
  const notesOut = today?.notes_out ?? 0;
  const net = notesIn - notesOut;
  const alerts = events.filter(
    (e) =>
      new Date(e.ts).toDateString() === new Date().toDateString() &&
      (e.kind === "tamper" || (e.kind === "access" && e.success === false)),
  ).length;
  const online = devices.filter((d) => d.online).length;

  const items: Kpi[] = [
    { label: "Caixas online", value: `${online}/${devices.length}`, hint: online === devices.length && devices.length > 0 ? "Todas ligadas" : "Verificar ligação", icon: Vault, tone: "steel" },
    { label: "Notas depositadas hoje", value: fmt(notesIn), hint: `${today?.deposits ?? 0} depósitos`, icon: ArrowDownToLine, tone: "in" },
    { label: "Notas levantadas hoje", value: fmt(notesOut), hint: `Saldo do dia ${net >= 0 ? "+" : "−"}${fmt(Math.abs(net))}`, icon: ArrowUpFromLine, tone: "out" },
    { label: "Alertas hoje", value: fmt(alerts), hint: alerts ? "Violações e acessos recusados" : "Sem ocorrências", icon: ShieldAlert, tone: alerts ? "alert" : "steel" },
  ];

  return (
    <section className="kpis" aria-label="Resumo do dia">
      {items.map(({ icon: Icon, ...k }) => (
        <div key={k.label} className={`kpi ${k.tone}`}>
          <span className="kpi-label"><Icon size={16} aria-hidden /> {k.label}</span>
          <strong className="kpi-value">{k.value}</strong>
          <span className="kpi-hint">{k.hint}</span>
        </div>
      ))}
    </section>
  );
}
