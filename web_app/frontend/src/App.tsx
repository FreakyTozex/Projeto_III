import { useState } from "react";
import { CreditCard, LayoutDashboard, Vault } from "lucide-react";
import { useLive } from "./useLive";
import KpiBand from "./components/KpiBand";
import DevicePanel from "./components/DevicePanel";
import DailyChart from "./components/DailyChart";
import EventFeed from "./components/EventFeed";
import CardsPage from "./components/CardsPage";

type Tab = "panel" | "cards";

export default function App() {
  const connected = useLive();
  const [tab, setTab] = useState<Tab>("panel");
  const date = new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Vault size={20} aria-hidden /></span>
          <span>Cofre ATM</span>
        </div>
        <nav aria-label="Secções">
          <button className={tab === "panel" ? "nav on" : "nav"} onClick={() => setTab("panel")} aria-current={tab === "panel" ? "page" : undefined}>
            <LayoutDashboard size={18} aria-hidden /> Painel
          </button>
          <button className={tab === "cards" ? "nav on" : "nav"} onClick={() => setTab("cards")} aria-current={tab === "cards" ? "page" : undefined}>
            <CreditCard size={18} aria-hidden /> Cartões
          </button>
        </nav>
        <span className="live" role="status">
          <span className={`dot ${connected ? "on" : "off"}`} aria-hidden />
          {connected ? "Em direto" : "A reconectar…"}
        </span>
      </aside>

      <main>
        <header className="page-head">
          <h1>{tab === "panel" ? "Painel" : "Cartões"}</h1>
          <span className="muted">{date}</span>
        </header>
        {tab === "panel" ? (
          <>
            <KpiBand />
            <div className="layout">
              <div className="stack">
                <EventFeed />
                <DailyChart />
              </div>
              <DevicePanel />
            </div>
          </>
        ) : (
          <CardsPage />
        )}
      </main>
    </div>
  );
}
