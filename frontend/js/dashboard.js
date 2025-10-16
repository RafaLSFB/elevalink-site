const API_BASE_URL = 'http://127.0.0.1:5000/api/dados';
const UPDATE_INTERVAL = 500; // meio segundo
const rawDataGrid = document.getElementById('raw-data-grid');
const modeToggleButton = document.getElementById('mode-toggle-button');

let expandedStates = {};
let mode = 'simulado'; // simulado ou real
let updateIntervalId = null;

// Alterna modo
modeToggleButton.addEventListener('click', () => {
    mode = mode === 'simulado' ? 'real' : 'simulado';
    modeToggleButton.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    resetValues();

    // Reinicia o intervalo para respeitar o modo atual
    if (updateIntervalId) clearInterval(updateIntervalId);
    updateIntervalId = setInterval(fetchData, UPDATE_INTERVAL);

    fetchData(); // força atualização imediata no novo modo
});

// Atualiza os cards principais
function updateMetrics(data) {
    if (!data) return;
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

// Cria card expansível
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

// Atualiza dados crus
function updateRawData(data) {
    if (!data) return;

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

    createExpandableCard('VL53L1X', { 'Distance': vl53l1x.distance });
    createExpandableCard('INA219', { 'Current (mA)': ina219.current });
    createExpandableCard('RTC', { 'Time': rtc.time });
    createExpandableCard('Joystick', { 'X': joystick.x, 'Y': joystick.y, 'Button': joystick.button });
}

// Simula dados
function generateSimulatedData() {
    return {
        "progresso": Math.random() * 1000,
        "angulo_x": Math.random() * 60 - 30,
        "angulo_y": Math.random() * 60 - 30,
        "status": Math.random() > 0.1 ? 1 : 0,
        "bmi160": {
            "accel": { x: (Math.random()*4-2).toFixed(2), y:(Math.random()*4-2).toFixed(2), z:(Math.random()*4-2).toFixed(2) },
            "gyro": { x:(Math.random()*500-250).toFixed(2), y:(Math.random()*500-250).toFixed(2), z:(Math.random()*500-250).toFixed(2) }
        },
        "tfluna": { distance:(Math.random()*1990+10).toFixed(1), temperature:(Math.random()*20+20).toFixed(1), strength: Math.floor(Math.random()*100) },
        "vl53l1x": { distance:(Math.random()*3990+10).toFixed(1) },
        "ina219": { current:(Math.random()*5000).toFixed(2) },
        "rtc": { time: new Date().toISOString() },
        "joystick": { x: Math.floor(Math.random()*201-100), y: Math.floor(Math.random()*201-100), button: Math.random()>0.5?1:0 }
    };
}

// Reseta todos os valores da dashboard
function resetValues() {
    document.getElementById('progresso-value').textContent = '--';
    document.getElementById('angulo-x-value').textContent = '--';
    document.getElementById('angulo-y-value').textContent = '--';
    const statusValueElement = document.getElementById('status-value');
    statusValueElement.textContent = '--';
    const statusCardElement = statusValueElement.closest('.card');
    statusCardElement.classList.remove('ok', 'erro');
    rawDataGrid.innerHTML = '';
    expandedStates = {};
}

// Busca dados (API real ou simulado)
async function fetchData() {
    try {
        if (mode === 'real') {
            const response = await fetch(`${API_BASE_URL}/latest`);
            if (response.ok) {
                const latestData = await response.json();
                updateMetrics(latestData);
                updateRawData(latestData);
            } else {
                resetValues(); // Nenhum dado real
            }
        } else if (mode === 'simulado') {
            const latestData = generateSimulatedData();
            updateMetrics(latestData);
            updateRawData(latestData);
        }
    } catch (error) {
        console.error('Falha ao atualizar dashboard:', error);
        if (mode === 'real') resetValues();
    }
}

// Inicializa dashboard
function initializeDashboard() {
    fetchData();
    updateIntervalId = setInterval(fetchData, UPDATE_INTERVAL);

    VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 10,
        speed: 400,
        glare: true,
        "max-glare": 0.2
    });

    modeToggleButton.textContent = `Modo: Simulado`;
}

document.addEventListener('DOMContentLoaded', initializeDashboard);