// ============================
// CONFIGURAÇÃO DE MODO
// ============================
const USE_SIMULATED_DATA = true; // true = simulado, false = real
const API_REAL_URL = 'https://SEU_SERVIDOR_REAL/api/dados/latest'; // colocar a URL real quando sensores estiverem online
const UPDATE_INTERVAL = 10000; // 10 segundos

// ============================
// ELEMENTOS
// ============================
const rawDataGrid = document.getElementById('raw-data-grid');
let expandedStates = {}; // guarda quais cards estão abertos

// ============================
// FUNÇÕES AUXILIARES
// ============================

// Atualiza os cards principais
function updateMetrics(data) {
    document.getElementById('progresso-value').textContent = data.progresso?.toFixed(2) ?? '--';
    document.getElementById('angulo-x-value').textContent = data.angulo_x?.toFixed(2) ?? '--';
    document.getElementById('angulo-y-value').textContent = data.angulo_y?.toFixed(2) ?? '--';

    const statusValueElement = document.getElementById('status-value');
    const statusCardElement = statusValueElement.closest('.card');

    if (data.status === 1) {
        statusValueElement.textContent = 'OK';
        statusCardElement.classList.add('ok');
        statusCardElement.classList.remove('erro');
    } else {
        statusValueElement.textContent = 'ERRO';
        statusCardElement.classList.add('erro');
        statusCardElement.classList.remove('ok');
    }
}

// Cria um card expansível
function createExpandableCard(title, fields) {
    const card = document.createElement('div');
    card.classList.add('card', 'tilt-card', 'expandable-card');

    const header = document.createElement('h2');
    header.textContent = title;
    card.appendChild(header);

    const details = document.createElement('div');
    details.classList.add('details');

    for (const [key, value] of Object.entries(fields)) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${key}:</strong> ${value}`;
        details.appendChild(p);
    }

    // Mantém estado anterior
    const isExpanded = expandedStates[title] ?? false;
    details.style.display = isExpanded ? 'block' : 'none';

    card.addEventListener('click', () => {
        const isVisible = details.style.display === 'block';
        details.style.display = isVisible ? 'none' : 'block';
        expandedStates[title] = !isVisible;
    });

    card.appendChild(details);
    rawDataGrid.appendChild(card);
}

// Atualiza os dados crus
function updateRawData(data) {
    const currentStates = { ...expandedStates };
    rawDataGrid.innerHTML = '';
    expandedStates = { ...currentStates };

    const bmi160 = data.bmi160 || { accel:{x:'--',y:'--',z:'--'}, gyro:{x:'--',y:'--',z:'--'} };
    const tfluna = data.tfluna || { distance:'--', temperature:'--', strength:'--' };
    const vl53l1x = data.vl53l1x || { distance:'--' };
    const ina219 = data.ina219 || { current:'--' };
    const rtc = data.rtc || { time:'--' };
    const joystick = data.joystick || { x:'--', y:'--', button:'--' };

    createExpandableCard('BMI160', {
        'Accel X': bmi160.accel.x,
        'Accel Y': bmi160.accel.y,
        'Accel Z': bmi160.accel.z,
        'Gyro X': bmi160.gyro.x,
        'Gyro Y': bmi160.gyro.y,
        'Gyro Z': bmi160.gyro.z
    });

    createExpandableCard('TFLUNA', {
        'Distance': tfluna.distance,
        'Temperature': tfluna.temperature,
        'Strength': tfluna.strength
    });

    createExpandableCard('VL53L1X', {
        'Distance': vl53l1x.distance
    });

    createExpandableCard('INA219', {
        'Current (mA)': ina219.current
    });

    createExpandableCard('RTC', {
        'Time': rtc.time
    });

    createExpandableCard('Joystick', {
        'X': joystick.x,
        'Y': joystick.y,
        'Button': joystick.button
    });
}

// ============================
// GERAÇÃO DE DADOS SIMULADOS
// ============================
function generateSimulatedData() {
    return {
        "progresso": +(Math.random()*1000).toFixed(2),
        "angulo_x": +(Math.random()*60-30).toFixed(2),
        "angulo_y": +(Math.random()*60-30).toFixed(2),
        "status": Math.random()>0.5?1:0,
        "bmi160": {
            "accel": {x: +(Math.random()*4-2).toFixed(2), y: +(Math.random()*4-2).toFixed(2), z: +(Math.random()*4-2).toFixed(2)},
            "gyro": {x: +(Math.random()*500-250).toFixed(2), y: +(Math.random()*500-250).toFixed(2), z: +(Math.random()*500-250).toFixed(2)}
        },
        "tfluna": {distance: +(Math.random()*2000+10).toFixed(1), temperature: +(Math.random()*20+20).toFixed(1), strength: Math.floor(Math.random()*100)},
        "vl53l1x": {distance: +(Math.random()*4000+10).toFixed(1)},
        "ina219": {current: +(Math.random()*5000).toFixed(2)},
        "rtc": {time: new Date().toISOString()},
        "joystick": {x: Math.floor(Math.random()*200-100), y: Math.floor(Math.random()*200-100), button: Math.random()>0.5?1:0}
    };
}

// ============================
// BUSCA DE DADOS
// ============================
async function fetchData() {
    let data;
    if (USE_SIMULATED_DATA) {
        data = generateSimulatedData();
    } else {
        try {
            const response = await fetch(API_REAL_URL);
            data = response.ok ? await response.json() : {};
        } catch(e) {
            console.error("Erro ao buscar dados reais:", e);
            data = {};
        }
    }

    updateMetrics(data);
    updateRawData(data);
}

// ============================
// INICIALIZAÇÃO
// ============================
function initializeDashboard() {
    fetchData();
    setInterval(fetchData, UPDATE_INTERVAL);

    VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 10,
        speed: 400,
        glare: true,
        "max-glare": 0.2
    });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);
