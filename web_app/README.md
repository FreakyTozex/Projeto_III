# Painel da caixa ATM (ESP32 + MQTT + FastAPI + React)

## Estrutura no servidor

```
~/web_app/
├── docker-compose.yml     nginx · frontend · backend · mosquitto · db
├── Dockerfile             estágios "backend" e "frontend"
├── .env                   passwords (copiar de .env.example)
├── nginx/default.conf     configuração do nginx
├── mosquitto/mosquitto.conf
├── backend/               código FastAPI
└── frontend/              código React
```

## Arranque

```bash
cd ~/web_app
cp .env.example .env          # e muda POSTGRES_PASSWORD
docker compose up -d --build
```

- Dashboard: `http://IP-DO-SERVIDOR` · Docs da API: `/docs`
- ESP32 → MQTT: `IP-DO-SERVIDOR:1883`
- Sem hardware: `docker compose --profile sim up -d simulator`
- Logs: `docker compose logs -f backend`

## Tópicos MQTT

| Tópico | Direção | Payload |
|---|---|---|
| `atm/{id}/events/access` | ESP32 → servidor | `event_id, ts, user_id?, success, reason?` |
| `atm/{id}/events/transaction` | ESP32 → servidor | `event_id, ts, user_id, type (deposit/withdrawal), weight_delta_g, est_notes?` |
| `atm/{id}/events/tamper` | ESP32 → servidor | `event_id, ts, intensity` |
| `atm/{id}/status` (retained + LWT) | ESP32 → servidor | `{"online": true, "door_open": false}` |
| `atm/{id}/cmd` | servidor → ESP32 | `{"action": "lock" \| "unlock"}` |

O LWT do ESP32 deve publicar `{"online": false, "door_open": false}` em `atm/{id}/status`.
Eventos com QoS 1 e `event_id` único (UUID); o servidor ignora duplicados.

## Estrutura

```
backend/app/   main.py (lifespan + WS) · mqtt.py (consumidor) · routes.py (REST)
               models.py · schemas.py · ws.py · config.py · db.py
backend/scripts/simulate.py   simulador de ESP32
frontend/src/  App.tsx · useLive.ts (WebSocket → cache) · components/
```

## Por fazer a seguir

- Autenticação (JWT) + papéis, e proteger `/api` e `/ws`.
- Mosquitto com utilizador/password, ACLs por dispositivo e TLS.
- Alembic em vez de `create_all`.
- ESP32 e backend têm de usar o mesmo hash do UID: SHA-256 do UID em hex maiúsculo, sem separadores.
- Se correres vários workers, separa o consumidor MQTT num processo próprio (ver nota no Dockerfile).
