# api.py
import sqlite3
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS # Importa o CORS

# --- Configuração do App Flask ---
app = Flask(__name__)
# Habilita o CORS para permitir que seu HTML (de um domínio diferente)
# acesse esta API. Essencial para o desenvolvimento.
CORS(app)

DB_FILE = "elevador.db"

def carregar_dados_do_banco(limit=50):
    """Função para buscar dados do banco de dados."""
    conn = sqlite3.connect(DB_FILE)
    # Seleciona as colunas mais importantes e ordena pela mais recente
    query = f"SELECT timestamp_unix, progresso, angulo_x, angulo_y, status FROM leituras ORDER BY id DESC LIMIT {limit}"
    df = pd.read_sql_query(query, conn)
    conn.close()
    if not df.empty:
        # --- CORREÇÃO APLICADA AQUI ---
        # Convertemos a coluna para datetime e depois aplicamos a função
        # isoformat() a cada linha individualmente com .apply()
        datetime_series = pd.to_datetime(df['timestamp_unix'], unit='s')
        df['timestamp'] = datetime_series.apply(lambda dt: dt.isoformat())
    return df

# --- Definição dos Endpoints da API ---

@app.route('/')
def index():
    """Endpoint inicial apenas para testar se a API está no ar."""
    return "API do Elevador está funcionando!"

@app.route('/api/dados/latest')
def get_latest_data():
    """
    Endpoint que retorna a leitura MAIS RECENTE do banco de dados.
    """
    df = carregar_dados_do_banco(limit=1)
    if df.empty:
        # Retorna um erro 404 se não houver dados
        return jsonify({"error": "Nenhum dado encontrado"}), 404
    
    # Converte a primeira (e única) linha do DataFrame para um dicionário e o retorna como JSON
    latest_data = df.iloc[0].to_dict()
    return jsonify(latest_data)

@app.route('/api/dados/history')
def get_history_data():
    """
    Endpoint que retorna o HISTÓRICO de leituras (últimas 50).
    """
    df = carregar_dados_do_banco(limit=50)
    if df.empty:
        return jsonify({"error": "Nenhum dado encontrado"}), 404
    
    # Converte o DataFrame inteiro para uma lista de dicionários e retorna como JSON
    history_data = df.to_dict(orient='records')
    return jsonify(history_data)

# --- Execução da API ---
if __name__ == '__main__':
    # Roda a API na rede local, na porta 5000.  
    # O 'debug=True' faz com que o servidor reinicie automaticamente quando você salva o arquivo.
    app.run(host='0.0.0.0', port=5000, debug=True)