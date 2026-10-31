import { useState } from "react";
import { useLive } from "./useLive";
import DevicePanel from "./components/DevicePanel";
import DailyChart from "./components/DailyChart";
import EventFeed from "./components/EventFeed";
import CardsPage from "./components/CardsPage";

export default function App() {
  const connected = useLive();
  const [tab, setTab] = useState<"panel" | "cards">("panel");

  return (
    <>
      <header className="topbar">
        <h1>Painel da caixa ATM</h1>
        <nav aria-label="Secções">
          <button className={tab === "panel" ? "tab active" : "tab"} onClick={() => setTab("panel")}>Painel</button>
          <button className={tab === "cards" ? "tab active" : "tab"} onClick={() => setTab("cards")}>Cartões</button>
        </nav>
        <span className="live" role="status">
          <span className={`dot ${connected ? "on" : "off"}`} aria-hidden />
          {connected ? "Em direto" : "Sem ligação, a tentar de novo…"}
        </span>
      </header>

      <main>
        {tab === "panel" ? (
          <div className="layout">
            <DevicePanel />
            <div className="stack">
              <EventFeed />
              <DailyChart />
            </div>
          </div>
        ) : (
          <CardsPage />
        )}
      </main>
    </>
  );
}
