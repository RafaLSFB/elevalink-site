// frontend/script.js (versão sem gráficos)

const API_BASE_URL = 'http://127.0.0.1:5000/api/dados';

// A variável let progressoChart, angulosChart; FOI REMOVIDA

function updateMetrics(data) {
    document.getElementById('progresso-value').textContent = data.progresso.toFixed(2);
    document.getElementById('angulo-x-value').textContent = data.angulo_x.toFixed(2);
    document.getElementById('angulo-y-value').textContent = data.angulo_y.toFixed(2);

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

// A FUNÇÃO createOrUpdateCharts FOI COMPLETAMENTE REMOVIDA

async function fetchData() {
    try {
        // Agora busca apenas a última leitura, não o histórico
        const response = await fetch(`${API_BASE_URL}/latest`);

        if (!response.ok) {
            document.querySelector('.container').innerHTML = '<h1>Erro ao conectar com a API. Verifique se o backend está rodando.</h1>';
            throw new Error('Erro ao buscar dados da API');
        }

        const latestData = await response.json();
        updateMetrics(latestData);

        // A chamada para createOrUpdateCharts FOI REMOVIDA
    } catch (error) {
        console.error('Falha ao atualizar dashboard:', error);
    }
}

function initializeDashboard() {
    fetchData();
    setInterval(fetchData, 10000); // Mantivemos o intervalo de atualização para os cards

    VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 10,
        speed: 400,
        glare: true,
        "max-glare": 0.2
    });
}

document.addEventListener('DOMContentLoaded', initializeDashboard);