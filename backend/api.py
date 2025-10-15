from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import random
import sqlite3
import time

app = Flask(__name__)
CORS(app)

# =============================
# CONFIGURAÇÃO
# =============================
USE_SIMULATED_DATA = False  # True = dados simulados | False = dados reais do SQLite
DB_FILE = 'elevador.db'

# =============================
# FUNÇÕES DE SIMULAÇÃO
# =============================
def generate_simulated_data():
    return {
        "progresso": round(random.uniform(0, 1000), 2),
        "angulo_x": round(random.uniform(-30, 30), 2),
        "angulo_y": round(random.uniform(-30, 30), 2),
        "status": random.choice([0,1]),
        "bmi160": {
            "accel": {"x": round(random.uniform(-2,2),2), "y": round(random.uniform(-2,2),2), "z": round(random.uniform(-2,2),2)},
            "gyro": {"x": round(random.uniform(-250,250),2), "y": round(random.uniform(-250,250),2), "z": round(random.uniform(-250,250),2)}
        },
        "tfluna": {"distance": round(random.uniform(10,2000),1), "temperature": round(random.uniform(20,40),1), "strength": random.randint(0,100)},
        "vl53l1x": {"distance": round(random.uniform(10,4000),1)},
        "ina219": {"current": round(random.uniform(0,5000),2)},
        "rtc": {"time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")},
        "joystick": {"x": random.randint(-100,100), "y": random.randint(-100,100), "button": random.choice([0,1])}
    }

# =============================
# FUNÇÃO PARA DADOS REAIS
# =============================
def get_latest_real_data():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT * FROM leituras ORDER BY timestamp_unix DESC LIMIT 1")
    row = c.fetchone()
    conn.close()

    if not row:
        return generate_simulated_data()  # fallback caso o banco esteja vazio

    # Ajuste o mapeamento conforme as colunas do seu banco
    data = {
        "progresso": row[2],
        "angulo_x": row[3],
        "angulo_y": row[4],
        "status": row[7],
        "bmi160": {"accel":{"x":0,"y":0,"z":0}, "gyro":{"x":0,"y":0,"z":0}},  # se não tiver no banco, mantem zeros
        "tfluna": {"distance": row[5], "temperature": 25, "strength": 50},
        "vl53l1x": {"distance": 100},
        "ina219": {"current": 500},
        "rtc": {"time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")},
        "joystick": {"x":0,"y":0,"button":0}
    }
    return data

# =============================
# ROTAS
# =============================
@app.route('/')
def index():
    return "API do Elevador está funcionando!"

@app.route('/api/dados/latest')
def get_latest_data():
    if USE_SIMULATED_DATA:
        return jsonify(generate_simulated_data())
    else:
        return jsonify(get_latest_real_data())

# =============================
# RODAR A API
# =============================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)