// === VARIÁVEIS GLOBAIS MODIFICADAS ===
const MQTT_BROKER = "broker.hivemq.com"; 
const MQTT_PORT = 8000; // IMPORTANTE: Use 8000 para WebSockets (navegador)
const MQTT_CLIENT_ID = "DashboardCliente_" + Math.random().toString(16).substr(2, 8);
const UPDATE_INTERVAL = 3000; // Intervalo para o modo SIMULADO

// NOVO: Tópicos separados para dados e status
const MQTT_DATA_TOPIC = "heltec/gateway/data";   // Tópico dos dados
const MQTT_STATUS_TOPIC = "heltec/gateway/status"; // Tópico do 'online'/'offline'

let mqttClient = null;
// Fim das novas variáveis

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

// Cores fixas para o gráfico de linha
let lineChartData = {
    labels: [],
    datasets: [{
        label: 'Progresso (mm)',
        data: [],
        borderColor: '#2a7aed', 
        backgroundColor: 'rgba(42, 122, 237, 0.1)', 
        fill: true,
        tension: 0.3
    }]
};


// === FUNÇÃO switchMode (Sem alterações) ===
function switchMode() {
    mode = toggleMode.checked ? 'real' : 'simulado';
    modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    resetValues(); // Reseta os valores ao trocar de modo

    if (mode === 'real') {
        // Modo Real: Para o simulador e conecta ao MQTT
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
        }
        connectMQTT(); // Conecta ao broker

    } else {
        // Modo Simulado: Desconecta do MQTT e inicia o simulador
        if (mqttClient && mqttClient.isConnected()) {
            console.log("Desconectando do MQTT...");
            mqttClient.disconnect();
        }
        // Inicia o loop de simulação
        runSimulation(); // Roda uma vez imediatamente
        updateIntervalId = setInterval(runSimulation, UPDATE_INTERVAL); // E depois a cada X segundos
    }
}

// === FUNÇÃO fetchData RENOMEADA PARA runSimulation (Sem alterações) ===
async function runSimulation() {
    try {
        if (mode === 'simulado') {
            const latestData = generateSimulatedData();
            updateMetrics(latestData);
            updateRawData(latestData);
        }
    } catch (error) {
        console.error('Falha ao atualizar dashboard (simulado):', error);
    }
}


// (Funções de dados: updateMetrics, createExpandableCard, updateRawData, generateSimulatedData... permanecem as mesmas)
// ... (cole suas funções aqui) ...
function updateMetrics(data) {
    if (!data) return;
    
    const statusValueElement = document.getElementById('status-value');
    const statusCardElement = statusValueElement.closest('.card');
    
    // MODIFICADO: Só atualiza o status se NÃO for o Heltec Desconectado
    if (statusValueElement.textContent !== 'Heltec Desconectado') {
        if (data.status === 1) {
            statusValueElement.textContent = 'OK'; // Dados recebidos
            statusCardElement.classList.add('ok');
            statusCardElement.classList.remove('erro');
        } else {
            statusValueElement.textContent = 'ERRO'; // Erro reportado pelo sensor
            statusCardElement.classList.add('erro');
            statusCardElement.classList.remove('ok');
        }
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

// === resetValues (MODIFICADO) ===
function resetValues() {
    // MODIFICADO: Não limpa o status se ele for "Heltec Desconectado"
    const statusValueElement = document.getElementById('status-value');
    if (statusValueElement.textContent !== 'Heltec Desconectado') {
        statusValueElement.textContent = '--';
        const statusCardElement = statusValueElement.closest('.card');
        statusCardElement.classList.remove('ok', 'erro');
    }
    
    // Reseta o card LoRa
    const loraCard = document.getElementById('lora-status-card');
    if (loraCard) {
        document.getElementById('lora-rssi-value').textContent = '-- dBm';
        document.getElementById('lora-snr-value').textContent = '-- dB';
        loraCard.classList.remove('ok', 'warn', 'erro');
    }

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
// Fim das funções de dados


// === FUNÇÕES MQTT (MODIFICADAS) ===

/**
 * Inicializa e configura o cliente MQTT
 */
function setupMQTT() {
    if (!mqttClient) {
        mqttClient = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, MQTT_CLIENT_ID);
        
        // Define as funções de callback
        mqttClient.onConnectionLost = onConnectionLost;
        mqttClient.onMessageArrived = onMessageArrived;
    }
}

/**
 * Tenta se conectar ao broker MQTT
 */
function connectMQTT() {
    if (mqttClient && !mqttClient.isConnected()) {
        console.log(`Conectando ao broker MQTT: ${MQTT_BROKER}:${MQTT_PORT}...`);
        try {
            mqttClient.connect({
                onSuccess: onConnect, // Função de callback modificada
                onFailure: (err) => {
                    console.error("Falha ao conectar ao MQTT:", err);
                    resetValues(); 
                    handleGatewayStatus("offline"); // Mostra desconectado
                },
                useSSL: false,
                cleanSession: true
            });
        } catch (e) {
            console.error("Erro ao tentar conectar:", e);
        }
    }
}

/**
 * Callback: Chamado quando o cliente se conecta com sucesso (MODIFICADO)
 */
function onConnect() {
    console.log("Conectado ao MQTT!");
    
    // Assina os DOIS tópicos
    console.log("Assinando o tópico de DADOS:", MQTT_DATA_TOPIC);
    mqttClient.subscribe(MQTT_DATA_TOPIC);
    
    console.log("Assinando o tópico de STATUS:", MQTT_STATUS_TOPIC);
    mqttClient.subscribe(MQTT_STATUS_TOPIC);
    
    // Agora esperamos a mensagem de "online" chegar
    // A função handleGatewayStatus cuidará de atualizar o texto.
}

/**
 * Callback: Chamado quando a conexão é perdida (MODIFICADO)
 */
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error("Conexão MQTT (com Broker) perdida:", responseObject.errorMessage);
        
        // MODIFICADO: Atualiza o status para "Broker Desconectado"
        const statusValueElement = document.getElementById('status-value');
        statusValueElement.textContent = 'Broker Desconectado';
        const statusCardElement = statusValueElement.closest('.card');
        statusCardElement.classList.add('erro');
        statusCardElement.classList.remove('ok');
        
        resetValues(); 

        if(mode === 'real') {
            setTimeout(connectMQTT, 2000); // Tenta reconectar em 2 segundos
        }
    }
}

/**
 * Callback: Chamado quando uma nova mensagem chega (MODIFICADO)
 */
function onMessageArrived(message) {
    try {
        // NOVO: Verifica de qual tópico a mensagem veio
        
        if (message.destinationName === MQTT_DATA_TOPIC) {
            // --- É uma mensagem de DADOS (JSON dos sensores) ---
            console.log("Mensagem de DADOS recebida:", message.payloadString);
            
            const gatewayData = JSON.parse(message.payloadString);
            const sensorData = JSON.parse(gatewayData.payload);
            
            updateMetrics(sensorData);
            if (toggleRawData.checked) {
                updateRawData(sensorData);
            }
            updateLoRaStats(gatewayData.rssi, gatewayData.snr);

        } else if (message.destinationName === MQTT_STATUS_TOPIC) {
            // --- É uma mensagem de STATUS ('online' ou 'offline') ---
            const status = message.payloadString;
            console.log("Mensagem de STATUS recebida:", status);
            handleGatewayStatus(status);
        }

    } catch (e) {
        console.error("Erro ao processar mensagem MQTT:", e);
        console.error("Payload recebido:", message.payloadString);
        document.getElementById('status-value').textContent = 'Erro JSON';
    }
}

/**
 * NOVO: Atualiza o card de status principal
 */
function handleGatewayStatus(status) {
    const statusValueElement = document.getElementById('status-value');
    const statusCardElement = statusValueElement.closest('.card');
    
    if (status === "online") {
        statusValueElement.textContent = 'Aguardando Dados...';
        statusCardElement.classList.add('ok');
        statusCardElement.classList.remove('erro');
    } else if (status === "offline") {
        statusValueElement.textContent = 'Heltec Desconectado';
        statusCardElement.classList.add('erro');
        statusCardElement.classList.remove('ok');
        resetValues(); // Reseta os gráficos se o Heltec ficar offline
    }
}

/**
 * NOVO: Atualiza o card de status do LoRa
 */
function updateLoRaStats(rssi, snr) {
    const rssiElement = document.getElementById('lora-rssi-value');
    const snrElement = document.getElementById('lora-snr-value');
    const cardElement = document.getElementById('lora-status-card');

    rssiElement.textContent = `${rssi} dBm`;
    snrElement.textContent = `${snr.toFixed(1)} dB`;

    // Remove classes antigas
    cardElement.classList.remove('ok', 'warn', 'erro');

    // Adiciona classes de cor baseadas na força do sinal (RSSI)
    if (rssi > -90) {
        cardElement.classList.add('ok'); // Sinal forte
    } else if (rssi > -110) {
        cardElement.classList.add('warn'); // Sinal médio
    } else {
        cardElement.classList.add('erro'); // Sinal fraco
    }
}

// === FIM DAS FUNÇÕES MQTT ===


// (Funções de Gráfico: createDoughnutChart, updateDoughnutChart, updateLineChart... permanecem as mesmas)
// ... (cole suas funções de gráfico aqui) ...
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

function updateDoughnutChart(chart, value, maxValue, unit) {
    if (!chart) return;
    
    let displayValue = value ?? 0;
    let percentageValue = (Math.abs(displayValue) / maxValue);
    if (percentageValue > 1) percentageValue = 1;

    chart.data.datasets[0].data[0] = parseFloat(displayValue.toFixed(1));
    chart.data.datasets[0].data[1] = Math.max(0, maxValue - (maxValue * percentageValue));
    
    chart.options.plugins.centerText.unit = unit;

    if (percentageValue > 0.85) {
        chart.data.datasets[0].backgroundColor[0] = '#ef4444'; // Vermelho
    } else if (percentageValue > 0.6) {
        chart.data.datasets[0].backgroundColor[0] = '#f59e0b'; // Laranja
    } else {
        chart.data.datasets[0].backgroundColor[0] = '#2a7aed'; // Azul Fixo
    }

    chart.update();
}

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


// === FUNÇÃO initializeDashboard (MODIFICADA) ===
function initializeDashboard() {
    
    // === Listeners do Modal (sem alterações) ===
    settingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        toggleMode.checked = (mode === 'real');
        modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    });
    // ... (resto dos listeners) ...
    modalCloseButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    colorPicker.addEventListener('input', (e) => {
        const newColor = e.target.value;
        document.documentElement.style.setProperty('--color-background', newColor);
    });
    toggleRawData.addEventListener('change', (e) => {
        rawDataWrapper.style.display = e.target.checked ? 'block' : 'none';
    });

    toggleMode.addEventListener('change', switchMode); // <== Ponto de controle

    // Define o modo simulado como padrão no carregamento
    mode = 'simulado'; 
    toggleMode.checked = false; // Garante que o switch esteja em "Simulado"
    modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    rawDataWrapper.style.display = toggleRawData.checked ? 'block' : 'none';
    
    // === Fim dos Listeners ===

    // 1. Cria as instâncias dos gráficos
    try {
        // ... (criação dos gráficos - sem alteração) ...
        document.documentElement.style.setProperty('--color-background', colorPicker.value);
        progressoChartInstance = createDoughnutChart('progresso-chart', 'Progresso');
        anguloXChartInstance = createDoughnutChart('angulo-x-chart', 'Ângulo X');
        anguloYChartInstance = createDoughnutChart('angulo-y-chart', 'Ângulo Y');
        const lineCtx = document.getElementById('line-chart-progresso').getContext('2d');
        lineChartInstance = new Chart(lineCtx, {
            type: 'line', data: lineChartData, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } } }, plugins: { legend: { display: false } } }
        });
    } catch (e) {
        console.error("Erro ao inicializar gráficos:", e);
    }
    
    // 2. Configura o cliente MQTT (NOVO)
    setupMQTT();

    // 3. Inicializa o modo (MODIFICADO)
    switchMode(); // Inicia no modo simulado, como definido acima
    
    // 4. Inicializa VanillaTilt
    VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 10, speed: 400, glare: true, "max-glare": 0.2
    });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);