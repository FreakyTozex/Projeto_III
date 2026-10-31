import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";

export default function DailyChart() {
  const { data = [] } = useQuery({ queryKey: ["stats"], queryFn: api.daily });
  const rows = data.map((d) => ({
    dia: new Date(d.day).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
    "Notas depositadas": d.notes_in,
    "Notas levantadas": d.notes_out,
  }));

  return (
    <section className="panel" aria-labelledby="chart-title">
      <h2 id="chart-title">Notas por dia (últimos 14 dias)</h2>
      {rows.length === 0 ? (
        <p className="muted">Sem transações neste período.</p>
      ) : (
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#D5D9E0" vertical={false} />
              <XAxis dataKey="dia" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(26,34,51,0.05)" }} />
              <Legend />
              <Bar dataKey="Notas depositadas" fill="#17795A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Notas levantadas" fill="#A8481C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
