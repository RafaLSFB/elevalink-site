from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import random
import time

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "API do Elevador está funcionando!"

@app.route('/api/dados/latest')
def get_latest_data():
    """
    Retorna uma leitura simulada completa com todos os sensores.
    """
    data = {
        "progresso": round(random.uniform(0, 1000), 2),
        "angulo_x": round(random.uniform(-30, 30), 2),
        "angulo_y": round(random.uniform(-30, 30), 2),
        "status": random.choice([0,1]),
        "bmi160": {
            "accel": {
                "x": round(random.uniform(-2, 2), 2),
                "y": round(random.uniform(-2, 2), 2),
                "z": round(random.uniform(-2, 2), 2)
            },
            "gyro": {
                "x": round(random.uniform(-250, 250), 2),
                "y": round(random.uniform(-250, 250), 2),
                "z": round(random.uniform(-250, 250), 2)
            }
        },
        "tfluna": {
            "distance": round(random.uniform(10, 2000), 1),
            "temperature": round(random.uniform(20, 40), 1),
            "strength": random.randint(0, 100)
        },
        "vl53l1x": {
            "distance": round(random.uniform(10, 4000), 1)
        },
        "ina219": {
            "current": round(random.uniform(0, 5000), 2)
        },
        "rtc": {
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "joystick": {
            "x": random.randint(-100, 100),
            "y": random.randint(-100, 100),
            "button": random.choice([0,1])
        }
    }

    return jsonify(data)

if __name__ == '__main__':
    # Roda na rede local na porta 5000
    app.run(host='0.0.0.0', port=5000, debug=True)