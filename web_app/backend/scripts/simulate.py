"""Simula um ESP32: publica status e eventos aleatórios.
Uso:  python scripts/simulate.py [device_id]
"""
import asyncio
import json
import os
import random
import sys
import uuid
from datetime import datetime, timezone

import aiomqtt

DEVICE = sys.argv[1] if len(sys.argv) > 1 else "atm-01"
BASE = f"atm/{DEVICE}"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def j(**kw) -> str:
    return json.dumps(kw)


async def main() -> None:
    will = aiomqtt.Will(f"{BASE}/status", j(online=False, door_open=False), qos=1, retain=True)
    async with aiomqtt.Client(
        os.getenv("MQTT_HOST", "localhost"),
        username=os.getenv("MQTT_USER") or None,
        password=os.getenv("MQTT_PASSWORD") or None,
        will=will,
    ) as c:
        await c.publish(f"{BASE}/status", j(online=True, door_open=False), qos=1, retain=True)
        while True:
            await asyncio.sleep(random.uniform(2, 5))
            roll = random.random()
            if roll < 0.55:
                kind = random.choice(["deposit", "withdrawal"])
                notes = random.randint(5, 80)
                sign = 1 if kind == "deposit" else -1
                await c.publish(f"{BASE}/events/access", j(
                    event_id=str(uuid.uuid4()), ts=now(), user_id="carlos", success=True), qos=1)
                await c.publish(f"{BASE}/status", j(online=True, door_open=True), qos=1, retain=True)
                await asyncio.sleep(1.5)
                await c.publish(f"{BASE}/events/transaction", j(
                    event_id=str(uuid.uuid4()), ts=now(), user_id="carlos", type=kind,
                    weight_delta_g=round(sign * notes * 1.0, 1), est_notes=notes), qos=1)
                await c.publish(f"{BASE}/status", j(online=True, door_open=False), qos=1, retain=True)
            elif roll < 0.85:
                await c.publish(f"{BASE}/events/access", j(
                    event_id=str(uuid.uuid4()), ts=now(), success=False,
                    reason=random.choice(["wrong_pin", "unknown_card"])), qos=1)
            else:
                await c.publish(f"{BASE}/events/tamper", j(
                    event_id=str(uuid.uuid4()), ts=now(), intensity=round(random.uniform(0.4, 1), 2)), qos=1)


asyncio.run(main(), loop_factory=asyncio.SelectorEventLoop)  # necessário no Windows
