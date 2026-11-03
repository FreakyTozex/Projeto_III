import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";

const tick = { fill: "#5d6b75", fontSize: 12 };

export default function DailyChart() {
  const { data = [] } = useQuery({ queryKey: ["stats"], queryFn: api.daily });
  const rows = data.map((d) => ({
    dia: new Date(d.day).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
    "Depositadas": d.notes_in,
    "Levantadas": d.notes_out,
  }));

  return (
    <section className="panel" aria-labelledby="chart-title">
      <h2 id="chart-title">Notas por dia</h2>
      {rows.length === 0 ? (
        <p className="muted">Ainda não há transações nos últimos 14 dias.</p>
      ) : (
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barGap={3}>
              <CartesianGrid stroke="#d9dfe2" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="dia" tick={tick} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(22,35,43,0.05)" }} contentStyle={{ borderRadius: 8, border: "1px solid #d9dfe2" }} />
              <Legend iconType="circle" />
              <Bar dataKey="Depositadas" fill="#1d7a58" radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="Levantadas" fill="#b4531f" radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
