const API_BASE_URL = 'http://127.0.0.1:5000/api/dados';
const UPDATE_INTERVAL = 5000; // 10 segundos
const rawDataGrid = document.getElementById('raw-data-grid');
let expandedStates = {}; // Armazena quais cards estão abertos

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

// Cria um card expansível com controle de estado
function createExpandableCard(title, fields) {
    const card = document.createElement('div');
    card.classList.add('card', 'tilt-card', 'expandable-card');

    const header = document.createElement('h2');
    header.textContent = title;
    card.appendChild(header);

    const details = document.createElement('div');
    details.classList.add('details');

    // Preenche os dados
    for (const [key, value] of Object.entries(fields)) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${key}:</strong> ${value}`;
        details.appendChild(p);
    }

    // Estado inicial baseado no histórico
    const isExpanded = expandedStates[title] ?? false;
    details.style.display = isExpanded ? 'block' : 'none';

    // Alternar visibilidade ao clicar
    card.addEventListener('click', () => {
        const isVisible = details.style.display === 'block';
        details.style.display = isVisible ? 'none' : 'block';
        expandedStates[title] = !isVisible;
    });

    card.appendChild(details);
    rawDataGrid.appendChild(card);
}

function updateRawData(data) {
    // Guarda quais cards estavam expandidos antes da atualização
    const currentStates = { ...expandedStates };

    rawDataGrid.innerHTML = '';

    // Mantém o estado anterior
    expandedStates = { ...currentStates };

    // Garante que todos os sensores existam
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

// Busca dados da API
async function fetchData() {
    try {
        const response = await fetch(`${API_BASE_URL}/latest`);
        const latestData = response.ok ? await response.json() : {};

        updateMetrics(latestData);
        updateRawData(latestData);
    } catch (error) {
        console.error('Falha ao atualizar dashboard:', error);
        updateMetrics({});
        updateRawData({});
    }
}

function initializeDashboard() {
    fetchData();
    setInterval(fetchData, UPDATE_INTERVAL); // Atualiza a cada 10s

    VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 10,
        speed: 400,
        glare: true,
        "max-glare": 0.2
    });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);
