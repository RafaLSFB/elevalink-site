const API_BASE_URL = 'http://127.0.0.1:5000/api/dados';
const UPDATE_INTERVAL = 3000;
const rawDataGrid = document.getElementById('raw-data-grid');

const settingsButton = document.getElementById('settings-button');
const modal = document.getElementById('settings-modal');
const modalCloseButton = document.getElementById('modal-close-button');

const colorPicker = document.getElementById('color-picker');
const toggleRawData = document.getElementById('toggle-raw-data');
const toggleMode = document.getElementById('toggle-mode');
const modeStatusText = document.getElementById('mode-status-text');
const rawDataWrapper = document.getElementById('raw-data-wrapper');

let expandedStates = {};
let mode = 'simulado';
let updateIntervalId = null;

let progressoChartInstance = null;
let anguloXChartInstance = null;
let anguloYChartInstance = null;
let lineChartInstance = null;

// === MODIFICADO: Cores fixas para o gráfico de linha ===
let lineChartData = {
    labels: [],
    datasets: [{
        label: 'Progresso (mm)',
        data: [],
        borderColor: '#2a7aed', // Azul fixo
        backgroundColor: 'rgba(42, 122, 237, 0.1)', // Azul fixo com transparência
        fill: true,
        tension: 0.3
    }]
};


function switchMode() {
    mode = toggleMode.checked ? 'real' : 'simulado';
    modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    resetValues();
    if (updateIntervalId) clearInterval(updateIntervalId);
    updateIntervalId = setInterval(fetchData, UPDATE_INTERVAL);
    fetchData();
}

// (As funções updateMetrics, createExpandableCard, updateRawData, generateSimulatedData, resetValues, fetchData... permanecem as mesmas)

// ... (Cole suas funções de dados aqui) ...
function updateMetrics(data) {
    if (!data) return;
    
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
    const MAX_PROGRESSO = 1500;
    const MAX_ANGULO = 90;
    
    updateDoughnutChart(progressoChartInstance, data.progresso, MAX_PROGRESSO, 'mm');
    updateDoughnutChart(anguloXChartInstance, data.angulo_x, MAX_ANGULO, '°');
    updateDoughnutChart(anguloYChartInstance, data.angulo_y, MAX_ANGULO, '°');
    updateLineChart(lineChartInstance, data.progresso);
}
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
    createExpandableCard('BMI160', { 'Accel X': bmi160.accel.x, 'Accel Y': bmi160.accel.y, 'Accel Z': bmi160.accel.z, 'Gyro X': bmi160.gyro.x, 'Gyro Y': bmi160.gyro.y, 'Gyro Z': bmi160.gyro.z });
    createExpandableCard('TFLUNA', { 'Distance': tfluna.distance, 'Temperature': tfluna.temperature, 'Strength': tfluna.strength });
    createExpandableCard('VL53L1X', { 'Distance': vl53l1x.distance });
    createExpandableCard('INA219', { 'Current (mA)': ina219.current });
    createExpandableCard('RTC', { 'Time': rtc.time });
    createExpandableCard('Joystick', { 'X': joystick.x, 'Y': joystick.y, 'Button': joystick.button });
}
function generateSimulatedData() {
    return {
        "progresso": Math.random() * 1500,
        "angulo_x": Math.random() * 180 - 90,
        "angulo_y": Math.random() * 180 - 90,
        "status": Math.random() > 0.1 ? 1 : 0,
        "bmi160": { "accel": { x: (Math.random()*4-2).toFixed(2), y:(Math.random()*4-2).toFixed(2), z:(Math.random()*4-2).toFixed(2) }, "gyro": { x:(Math.random()*500-250).toFixed(2), y:(Math.random()*500-250).toFixed(2), z:(Math.random()*500-250).toFixed(2) } },
        "tfluna": { distance:(Math.random()*1990+10).toFixed(1), temperature:(Math.random()*20+20).toFixed(1), strength: Math.floor(Math.random()*100) },
        "vl53l1x": { distance:(Math.random()*3990+10).toFixed(1) },
        "ina219": { current:(Math.random()*5000).toFixed(2) },
        "rtc": { time: new Date().toISOString() },
        "joystick": { x: Math.floor(Math.random()*201-100), y: Math.floor(Math.random()*201-100), button: Math.random()>0.5?1:0 }
    };
}
function resetValues() {
    const statusValueElement = document.getElementById('status-value');
    statusValueElement.textContent = '--';
    const statusCardElement = statusValueElement.closest('.card');
    statusCardElement.classList.remove('ok', 'erro');
    rawDataGrid.innerHTML = '';
    expandedStates = {};
    updateDoughnutChart(progressoChartInstance, 0, 1000, 'mm');
    updateDoughnutChart(anguloXChartInstance, 0, 90, '°');
    updateDoughnutChart(anguloYChartInstance, 0, 90, '°');
    if (lineChartInstance) {
        lineChartInstance.data.labels = [];
        lineChartInstance.data.datasets[0].data = [];
        lineChartInstance.update();
    }
}
async function fetchData() {
    try {
        if (mode === 'real') {
            const response = await fetch(`${API_BASE_URL}/latest`);
            if (response.ok) {
                const latestData = await response.json();
                updateMetrics(latestData);
                updateRawData(latestData);
            } else {
                resetValues(); 
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


/**
 * Cria um gráfico de rosca (Doughnut)
 */
function createDoughnutChart(canvasId, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Plugin de texto central (igual ao anterior)
    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw: (chart) => {
            const { ctx, data } = chart;
            const value = data.datasets[0].data[0];
            const unit = chart.options.plugins.centerText.unit;
            ctx.save();
            const x = chart.getDatasetMeta(0).data[0].x;
            const y = chart.getDatasetMeta(0).data[0].y;
            ctx.font = 'bold 24px Inter';
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${value.toFixed(1)}${unit}`, x, y);
            ctx.restore();
        }
    };

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [label, 'Restante'],
            datasets: [{
                data: [0, 100], 
                // MODIFICADO: Cor de fundo do "restante" é a cor do card
                backgroundColor: ['#2a7aed', '#232b40'], 
                borderColor: ['#232b40'], // Borda da cor do card
                borderWidth: 2,
                circumference: 270,
                rotation: 225,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                centerText: { unit: '°' } 
            }
        },
        plugins: [centerTextPlugin]
    });
}

/**
 * Atualiza um gráfico de rosca
 */
function updateDoughnutChart(chart, value, maxValue, unit) {
    if (!chart) return;
    
    let displayValue = value ?? 0;
    let percentageValue = (Math.abs(displayValue) / maxValue);
    if (percentageValue > 1) percentageValue = 1;

    chart.data.datasets[0].data[0] = parseFloat(displayValue.toFixed(1));
    chart.data.datasets[0].data[1] = Math.max(0, maxValue - (maxValue * percentageValue));
    
    chart.options.plugins.centerText.unit = unit;

    // === MODIFICADO: Cores fixas para os gráficos ===
    // Baseado na sua imagem: Progresso (Vermelho), Ângulo X (Laranja), Ângulo Y (Vermelho/Erro)
    // Vamos usar a lógica de porcentagem para definir a cor
    if (percentageValue > 0.85) {
        chart.data.datasets[0].backgroundColor[0] = '#ef4444'; // Vermelho
    } else if (percentageValue > 0.6) {
        chart.data.datasets[0].backgroundColor[0] = '#f59e0b'; // Laranja
    } else {
        // Cor padrão "OK" (azul que estava nos seus dados simulados)
        chart.data.datasets[0].backgroundColor[0] = '#2a7aed'; // Azul Fixo
    }

    chart.update();
}

/**
 * Atualiza o gráfico de linha
 */
function updateLineChart(chart, newValue) {
    if (!chart) return;
    const now = new Date().toLocaleTimeString();
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(newValue);
    const MAX_DATA_POINTS = 20;
    if (chart.data.labels.length > MAX_DATA_POINTS) {
        chart.data.labels.shift(); 
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}


// === FUNÇÃO updateChartColors REMOVIDA ===


// Inicializa dashboard e gráficos
function initializeDashboard() {
    
    // === MODIFICADO: Listeners ===
    
    settingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        toggleMode.checked = (mode === 'real');
        modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    });

    modalCloseButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // MODIFICADO: Listener do Color Picker agora só muda o fundo
    colorPicker.addEventListener('input', (e) => {
        const newColor = e.target.value;
        // Atualiza a variável CSS do fundo
        document.documentElement.style.setProperty('--color-background', newColor);
    });

    toggleRawData.addEventListener('change', (e) => {
        rawDataWrapper.style.display = e.target.checked ? 'block' : 'none';
    });

    toggleMode.addEventListener('change', switchMode);

    toggleMode.checked = (mode === 'real');
    modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    rawDataWrapper.style.display = toggleRawData.checked ? 'block' : 'none';
    
    // === Fim dos Listeners ===

    // 1. Cria as instâncias dos gráficos
    try {
        // Define o fundo inicial (caso o valor padrão do CSS seja diferente do seletor)
        document.documentElement.style.setProperty('--color-background', colorPicker.value);

        progressoChartInstance = createDoughnutChart('progresso-chart', 'Progresso');
        anguloXChartInstance = createDoughnutChart('angulo-x-chart', 'Ângulo X');
        anguloYChartInstance = createDoughnutChart('angulo-y-chart', 'Ângulo Y');
        
        // Cria o gráfico de linha (cores já estão fixas em lineChartData)
        const lineCtx = document.getElementById('line-chart-progresso').getContext('2d');
        lineChartInstance = new Chart(lineCtx, {
            type: 'line',
            data: lineChartData, // Usa os dados com cores fixas
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { color: '#94a3b8' }, 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    }
                },
                plugins: { 
                    legend: { display: false }
                }
            }
        });

    } catch (e) {
        console.error("Erro ao inicializar gráficos:", e);
        document.querySelectorAll('canvas').forEach(c => c.remove());
    }

    // 2. Busca dados
    fetchData();
    updateIntervalId = setInterval(fetchData, UPDATE_INTERVAL);

    // 3. Inicializa VanillaTilt
    VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 10,
        speed: 400,
        glare: true,
        "max-glare": 0.2
    });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);