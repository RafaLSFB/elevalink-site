import paho.mqtt.client as mqtt
import json
import time
import random

BROKER = "broker.hivemq.com"
TOPIC = "elevador/scanner/dados"

client = mqtt.Client()
client.connect(BROKER, 1883, 60)

while True:
    dados = {
        "timestamp": int(time.time()),
        "distance": round(random.uniform(0, 100), 2),
        "ax": round(random.uniform(-90, 90), 2),
        "ay": round(random.uniform(-90, 90), 2),
        "rssi": random.randint(-100, -40)
    }

    client.publish(TOPIC, json.dumps(dados))
    print("Publicado:", dados)
    time.sleep(10)  # envia a cada 10 segundos
