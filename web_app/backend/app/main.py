import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .mqtt import mqtt_service
from .routes import router
from .ws import manager

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    for attempt in range(1, 21):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)  # trocar por Alembic mais tarde
            break
        except OSError as exc:  # ConnectionRefusedError é subclasse de OSError
            logging.warning("BD indisponível (%s), tentativa %d/20", exc, attempt)
            await asyncio.sleep(2)
    else:
        raise RuntimeError("Não foi possível ligar à base de dados")
    task = asyncio.create_task(mqtt_service.run())
    yield
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)
    await engine.dispose()


app = FastAPI(title="ATM Dashboard API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # mantém a ligação aberta
    except WebSocketDisconnect:
        manager.disconnect(ws)
