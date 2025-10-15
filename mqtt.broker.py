import json
import time
from flask import Flask, jsonify
import threading
import paho.mqtt.client as mqtt

app = Flask(__name__)
latest_data = {}  # Armazena o último pacote recebido

# ==== MQTT ====
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "elevador/dados"

def on_connect(client, userdata, flags, rc):
    print("Conectado ao broker MQTT!")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    global latest_data
    try:
        payload = msg.payload.decode('utf-8')
        latest_data = json.loads(payload)
        print(f"📩 Dados recebidos: {latest_data}")
    except Exception as e:
        print(f"Erro ao processar mensagem MQTT: {e}")

def mqtt_thread():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()

# ==== API ====
@app.route("/api/dados/latest", methods=["GET"])
def get_latest_data():
    if not latest_data:
        return jsonify({"status": 0}), 200
    return jsonify(latest_data), 200

if __name__ == "__main__":
    # Inicia MQTT em thread separada
    threading.Thread(target=mqtt_thread, daemon=True).start()

    print("Servidor Flask rodando em http://127.0.0.1:5000")
    app.run(debug=True, use_reloader=False)
