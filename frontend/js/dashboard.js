// === VARIÁVEIS GLOBAIS (MODIFICADAS PARA O NOVO BROKER) ===
const MQTT_BROKER = "iot.eclipse.org";  // MODIFICADO
const MQTT_PORT = 443;                  // MODIFICADO: Porta 443 (HTTPS/WSS)
const MQTT_PATH = "/ws";                // MODIFICADO: Necessário para este broker
const MQTT_CLIENT_ID = "DashboardCliente_" + Math.random().toString(16).substr(2, 8);
const UPDATE_INTERVAL = 3000; 

// Tópicos (permanecem os mesmos)
const MQTT_DATA_TOPIC = "heltec/gateway/data";
const MQTT_STATUS_TOPIC = "heltec/gateway/status"; 

let mqttClient = null;
// ... (resto das variáveis globais) ...
const rawDataGrid = document.getElementById('raw-data-grid');
const settingsButton = document.getElementById('settings-button');
// ... (etc) ...

// ... (função switchMode - sem alterações) ...
function switchMode() {
    mode = toggleMode.checked ? 'real' : 'simulado';
    modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    resetValues(); 
    if (mode === 'real') {
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
        }
        connectMQTT(); 
    } else {
        if (mqttClient && mqttClient.isConnected()) {
            console.log("Desconectando do MQTT...");
            mqttClient.disconnect();
        }
        runSimulation(); 
        updateIntervalId = setInterval(runSimulation, UPDATE_INTERVAL); 
    }
}

// ... (função runSimulation - sem alterações) ...
// ... (funções updateMetrics, createExpandableCard, updateRawData, generateSimulatedData, resetValues - sem alterações) ...


// === FUNÇÕES MQTT (MODIFICADAS) ===

/**
 * Inicializa e configura o cliente MQTT
 */
function setupMQTT() {
    if (!mqttClient) {
        // MODIFICADO: O construtor agora inclui o MQTT_PATH
        mqttClient = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, MQTT_PATH, MQTT_CLIENT_ID);
        
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
        console.log(`Conectando ao broker MQTT: ${MQTT_BROKER}:${MQTT_PORT}${MQTT_PATH}...`); // Log atualizado
        try {
            mqttClient.connect({
                onSuccess: onConnect, 
                onFailure: (err) => {
                    console.error("Falha ao conectar ao MQTT:", err);
                    resetValues(); 
                    handleGatewayStatus("offline"); 
                },
                useSSL: true, // MODIFICADO: Continua 'true' para usar WSS
                cleanSession: true,
                reconnect: true, // Adicionado para robustez
                timeout: 10 // Aumenta o timeout para 10 segundos
            });
        } catch (e) {
            console.error("Erro ao tentar conectar:", e);
        }
    }
}

// ... (Restante do arquivo: onConnect, onConnectionLost, onMessageArrived, handleGatewayStatus, updateLoRaStats, funções de gráfico, initializeDashboard) ...
// NENHUMA OUTRA MUDANÇA É NECESSÁRIA.
// As funções abaixo são apenas para garantir que o arquivo esteja completo
// para você copiar e colar.

/**
 * Callback: Chamado quando o cliente se conecta com sucesso
 */
function onConnect() {
    console.log("Conectado ao MQTT!");
    console.log("Assinando o tópico de DADOS:", MQTT_DATA_TOPIC);
    mqttClient.subscribe(MQTT_DATA_TOPIC);
    console.log("Assinando o tópico de STATUS:", MQTT_STATUS_TOPIC);
    mqttClient.subscribe(MQTT_STATUS_TOPIC);
}

/**
 * Callback: Chamado quando a conexão com o BROKER é perdida
 */
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error("Conexão MQTT (com Broker) perdida:", responseObject.errorMessage);
        const statusValueElement = document.getElementById('status-value');
        statusValueElement.textContent = 'Broker Desconectado';
        const statusCardElement = statusValueElement.closest('.card');
        statusCardElement.classList.add('erro');
        statusCardElement.classList.remove('ok');
        resetValues(); 
        if(mode === 'real') {
            setTimeout(connectMQTT, 5000); 
        }
    }
}

/**
 * Callback: Chamado quando uma nova mensagem chega de QUALQUER tópico
 */
function onMessageArrived(message) {
    try {
        if (message.destinationName === MQTT_DATA_TOPIC) {
            console.log("Mensagem de DADOS recebida:", message.payloadString);
            const gatewayData = JSON.parse(message.payloadString);
            const sensorData = JSON.parse(gatewayData.payload);
            updateMetrics(sensorData);
            if (toggleRawData.checked) {
                updateRawData(sensorData);
            }
            updateLoRaStats(gatewayData.rssi, gatewayData.snr);
        } else if (message.destinationName === MQTT_STATUS_TOPIC) {
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
 * Atualiza o card de status principal (Heltec Conectado/Desconectado)
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
        resetValues(); 
    }
}

/**
 * Atualiza o card de status do LoRa (RSSI/SNR)
 */
function updateLoRaStats(rssi, snr) {
    const rssiElement = document.getElementById('lora-rssi-value');
    const snrElement = document.getElementById('lora-snr-value');
    const cardElement = document.getElementById('lora-status-card');
    rssiElement.textContent = `${rssi} dBm`;
    snrElement.textContent = `${snr.toFixed(1)} dB`;
    cardElement.classList.remove('ok', 'warn', 'erro');
    if (rssi > -90) {
        cardElement.classList.add('ok'); 
    } else if (rssi > -110) {
        cardElement.classList.add('warn'); 
    } else {
        cardElement.classList.add('erro'); 
    }
}

// === Funções de Gráfico (Sem alterações) ===
function createDoughnutChart(canvasId, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');
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
                borderColor: ['#232b40'], 
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
        chart.data.datasets[0].backgroundColor[0] = '#ef4444'; 
    } else if (percentageValue > 0.6) {
        chart.data.datasets[0].backgroundColor[0] = '#f59e0b'; 
    } else {
        chart.data.datasets[0].backgroundColor[0] = '#2a7aed'; 
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
// (Funções de dados que você já tinha)
function updateRawData(data) {
    if (!data) return;
    const currentStates = { ...expandedStates };
    rawDataGrid.innerHTML = '';
    expandedStates = { ...currentStates };
    const bmi160 = data.bmi160 || { accel:{x:'--',y:'--',z:'--'}, gyro:{x:'--',y:'--',z:'--'} };
    const tfluna = data.tfluna || { distance:'--', temperature:'--', strength:'--' };
    createExpandableCard('BMI160', { 'Accel X': bmi160.accel.x, 'Accel Y': bmi160.accel.y, 'Accel Z': bmi160.accel.z, 'Gyro X': bmi160.gyro.x, 'Gyro Y': bmi160.gyro.y, 'Gyro Z': bmi160.gyro.z });
    createExpandableCard('TFLUNA', { 'Distance': tfluna.distance, 'Temperature': tfluna.temperature, 'Strength': tfluna.strength });
}
function generateSimulatedData() {
    return {
        "progresso": Math.random() * 1500,
        "angulo_x": Math.random() * 180 - 90,
        "angulo_y": Math.random() * 180 - 90,
        "status": Math.random() > 0.1 ? 1 : 0,
        "bmi160": { "accel": { "x": (Math.random()*4-2).toFixed(2), "y":(Math.random()*4-2).toFixed(2), "z":(Math.random()*4-2).toFixed(2) }, "gyro": { "x":(Math.random()*500-250).toFixed(2), "y":(Math.random()*500-250).toFixed(2), "z":(Math.random()*500-250).toFixed(2) } },
        "tfluna": { "distance":(Math.random()*1990+10).toFixed(1), "temperature":(Math.random()*20+20).toFixed(1), "strength": Math.floor(Math.random()*100) },
    };
}
function resetValues() {
    const statusValueElement = document.getElementById('status-value');
    if (statusValueElement.textContent !== 'Heltec Desconectado') {
        statusValueElement.textContent = '--';
        const statusCardElement = statusValueElement.closest('.card');
        statusCardElement.classList.remove('ok', 'erro');
    }
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
// === FIM DAS FUNÇÕES DE GRÁFICO ===


// === FUNÇÃO DE INICIALIZAÇÃO ===
function initializeDashboard() {
    
    // --- Listeners do Modal ---
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
    colorPicker.addEventListener('input', (e) => {
        const newColor = e.target.value;
        document.documentElement.style.setProperty('--color-background', newColor);
    });
    toggleRawData.addEventListener('change', (e) => {
        rawDataWrapper.style.display = e.target.checked ? 'block' : 'none';
    });
    toggleMode.addEventListener('change', switchMode); 
    // --- Fim dos Listeners ---

    mode = 'simulado'; 
    toggleMode.checked = false; 
    modeStatusText.textContent = `Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    rawDataWrapper.style.display = toggleRawData.checked ? 'block' : 'none';
    
    // 1. Cria as instâncias dos gráficos
    try {
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
    
    // 2. Configura o cliente MQTT
    setupMQTT();

    // 3. Inicializa o modo (começa em simulado)
    switchMode(); 
    
    // 4. Inicializa VanillaTilt
    VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 10, speed: 400, glare: true, "max-glare": 0.2
    });
}

// Inicia tudo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeDashboard);