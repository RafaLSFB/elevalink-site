# backend/mqtt_listener_real.py
import paho.mqtt.client as mqtt
import sqlite3
import json
import time

# --- Configurações ---
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC = "elevador/scanner/dados"
DB_FILE = 'elevador.db'

# --- Banco de dados ---
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
            rssi INTEGER DEFAULT -100,
            bmi_accel_x REAL DEFAULT 0,
            bmi_accel_y REAL DEFAULT 0,
            bmi_accel_z REAL DEFAULT 0,
            bmi_gyro_x REAL DEFAULT 0,
            bmi_gyro_y REAL DEFAULT 0,
            bmi_gyro_z REAL DEFAULT 0,
            tfluna_distance REAL DEFAULT 0,
            tfluna_temperature REAL DEFAULT 0,
            tfluna_strength INTEGER DEFAULT 0,
            vl53l1x_distance REAL DEFAULT 0,
            ina219_current REAL DEFAULT 0,
            joystick_x REAL DEFAULT 0,
            joystick_y REAL DEFAULT 0,
            joystick_button INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# --- Salvar leitura ---
def salvar_leitura(dados):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    leitura = {
        'timestamp': dados.get('timestamp', int(time.time())),
        'progresso': dados.get('distance', 0),
        'angulo_x': dados.get('ax', 0),
        'angulo_y': dados.get('ay', 0),
        'status': dados.get('status', 1),
        'rssi': dados.get('rssi', -100),
        'bmi_accel_x': dados.get('bmi160', {}).get('accel', {}).get('x', 0),
        'bmi_accel_y': dados.get('bmi160', {}).get('accel', {}).get('y', 0),
        'bmi_accel_z': dados.get('bmi160', {}).get('accel', {}).get('z', 0),
        'bmi_gyro_x': dados.get('bmi160', {}).get('gyro', {}).get('x', 0),
        'bmi_gyro_y': dados.get('bmi160', {}).get('gyro', {}).get('y', 0),
        'bmi_gyro_z': dados.get('bmi160', {}).get('gyro', {}).get('z', 0),
        'tfluna_distance': dados.get('tfluna', {}).get('distance', 0),
        'tfluna_temperature': dados.get('tfluna', {}).get('temperature', 0),
        'tfluna_strength': dados.get('tfluna', {}).get('strength', 0),
        'vl53l1x_distance': dados.get('vl53l1x', {}).get('distance', 0),
        'ina219_current': dados.get('ina219', {}).get('current', 0),
        'joystick_x': dados.get('joystick', {}).get('x', 0),
        'joystick_y': dados.get('joystick', {}).get('y', 0),
        'joystick_button': dados.get('joystick', {}).get('button', 0)
    }
    
    c.execute('''
        INSERT INTO leituras (
            timestamp_unix, progresso, angulo_x, angulo_y, status, rssi,
            bmi_accel_x, bmi_accel_y, bmi_accel_z,
            bmi_gyro_x, bmi_gyro_y, bmi_gyro_z,
            tfluna_distance, tfluna_temperature, tfluna_strength,
            vl53l1x_distance, ina219_current,
            joystick_x, joystick_y, joystick_button
        ) VALUES (
            :timestamp, :progresso, :angulo_x, :angulo_y, :status, :rssi,
            :bmi_accel_x, :bmi_accel_y, :bmi_accel_z,
            :bmi_gyro_x, :bmi_gyro_y, :bmi_gyro_z,
            :tfluna_distance, :tfluna_temperature, :tfluna_strength,
            :vl53l1x_distance, :ina219_current,
            :joystick_x, :joystick_y, :joystick_button
        )
    ''', leitura)
    
    conn.commit()
    conn.close()
    print(f"[MQTT] Dados salvos: {leitura}")

# --- Callbacks MQTT ---
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("Conectado ao Broker MQTT!")
        client.subscribe(MQTT_TOPIC)
        print(f"Inscrito no tópico: {MQTT_TOPIC}")
    else:
        print(f"Falha na conexão, código: {rc}")

def on_message(client, userdata, msg):
    try:
        dados = json.loads(msg.payload.decode())
        salvar_leitura(dados)
    except Exception as e:
        print(f"Erro ao processar mensagem: {e}")

# --- Programa principal ---
criar_banco_se_nao_existir()
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.on_message = on_message

print(f"Conectando ao broker {MQTT_BROKER}...")
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_forever()