# Um só Dockerfile com um estágio por serviço (usado com `target:` no compose).

# ---------- backend (FastAPI) ----------
FROM python:3.12-slim AS backend
WORKDIR /srv
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY backend/scripts ./scripts
# UM só worker: o consumidor MQTT corre dentro do processo.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ---------- frontend (build do React) ----------
# Compila e copia o resultado para o volume partilhado com o Nginx; depois termina.
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ .
RUN npm run build
CMD ["sh", "-c", "rm -rf /dist/* && cp -r /app/dist/. /dist/"]
