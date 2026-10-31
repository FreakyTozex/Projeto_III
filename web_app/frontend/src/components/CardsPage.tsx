import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

/** SHA-256 do UID (maiúsculas, sem separadores). O ESP32 tem de usar o mesmo formato. */
async function hashUid(uid: string): Promise<string> {
  const clean = uid.replace(/[^0-9a-f]/gi, "").toUpperCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clean));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function CardsPage() {
  const qc = useQueryClient();
  const { data: cards = [] } = useQuery({ queryKey: ["cards"], queryFn: api.cards });
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");

  const add = useMutation({
    mutationFn: async () => api.addCard({ name: name.trim(), uid_hash: await hashUid(uid) }),
    onSuccess: () => {
      setName("");
      setUid("");
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
  const remove = useMutation({
    mutationFn: api.removeCard,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });

  return (
    <div className="stack">
      <section className="panel" aria-labelledby="add-title">
        <h2 id="add-title">Registar cartão</h2>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <label>
            Nome do utilizador
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            UID do cartão
            <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="04:A2:3B:1C" required />
          </label>
          <button type="submit" disabled={add.isPending}>Guardar cartão</button>
        </form>
        <p className="muted small">O UID é convertido em hash no browser e nunca chega ao servidor em claro.</p>
        {add.isError && <p className="error">{(add.error as Error).message}</p>}
      </section>

      <section className="panel" aria-labelledby="cards-title">
        <h2 id="cards-title">Cartões autorizados</h2>
        {cards.length === 0 && <p className="muted">Nenhum cartão registado.</p>}
        <ul className="plain">
          {cards.map((c) => (
            <li key={c.id} className="card-row">
              <strong>{c.name}</strong>
              <span className="muted small">{c.uid_hash.slice(0, 12)}…</span>
              <button className="ghost" onClick={() => remove.mutate(c.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
