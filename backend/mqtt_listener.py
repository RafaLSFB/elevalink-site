# backend/mqtt_listener.py (versão corrigida e atualizada)

import paho.mqtt.client as mqtt
import sqlite3
import json
import time

# --- Configurações ---
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC = "elevador/scanner/dados"
DB_FILE = 'elevador.db'

def criar_banco_se_nao_existir():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS leituras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp_unix INTEGER NOT NULL,
            progresso REAL DEFAULT 0,
            angulo_x REAL DEFAULT 0,
            angulo_y REAL DEFAULT 0,
            tempo REAL DEFAULT 0,
            erro_distancia REAL DEFAULT 0,
            status INTEGER DEFAULT 0,
            rssi INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def salvar_leitura(dados_json):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    leitura_formatada = {
        'timestamp': dados_json.get('timestamp', int(time.time())),
        'progresso': dados_json.get('distance', 0),
        'angulo_x': dados_json.get('ax', 0),
        'angulo_y': dados_json.get('ay', 0),
        'status': 1,
        'rssi': dados_json.get('rssi', -100)
    }
    c.execute('''
        INSERT INTO leituras (timestamp_unix, progresso, angulo_x, angulo_y, status, rssi)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        leitura_formatada['timestamp'],
        leitura_formatada['progresso'],
        leitura_formatada['angulo_x'],
        leitura_formatada['angulo_y'],
        leitura_formatada['status'],
        leitura_formatada['rssi']
    ))
    conn.commit()
    conn.close()
    print(f"Dados do MQTT salvos no banco: {leitura_formatada}")

def on_connect(client, userdata, flags, rc, properties=None): # Adicionado properties para compatibilidade
    if rc == 0:
        print("Listener conectado ao Broker MQTT!")
        client.subscribe(MQTT_TOPIC)
        print(f"Inscrito no tópico: {MQTT_TOPIC}")
    else:
        print(f"Falha na conexão, código: {rc}")

def on_message(client, userdata, msg):
    print(f"Mensagem recebida: {msg.payload.decode()}")
    try:
        dados = json.loads(msg.payload.decode())
        salvar_leitura(dados)
    except Exception as e:
        print(f"Erro ao processar mensagem: {e}")

# --- Programa Principal ---
criar_banco_se_nao_existir()

# CORREÇÃO DO AVISO: Inicializa o cliente com a nova versão da API de Callback
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

print(f"Conectando ao broker {MQTT_BROKER}...")
client.connect(MQTT_BROKER, MQTT_PORT, 60)

client.loop_forever()