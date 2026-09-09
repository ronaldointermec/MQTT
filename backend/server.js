const mqtt = require("mqtt");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const express = require("express");

const WEB_PORT = 3000;
const app = express();
const httpServer = http.createServer(app);

// --- CONFIGURAÇÃO DE CAMINHOS ---
const isPkg = typeof process.pkg !== "undefined";
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;

const produtosPath = path.join(baseDir, "produtos.json");
const logPath = path.join(baseDir, "leituras_log.txt");
const configPath = path.join(process.cwd(), "config.json");
const distPath = path.join(__dirname, "dist");

// --- CARREGAR IP DO BROKER MQTT ---
let brokerIp = "localhost";
try {
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configFile);
    if (config.broker_ip) brokerIp = config.broker_ip;
  }
} catch (err) {
  console.error("❌ Erro ao ler arquivo de configuração:", err.message);
}

// --- CARREGAR BASE DE PRODUTOS ---
let produtosBase = [];
function carregarProdutos() {
  try {
    if (!fs.existsSync(produtosPath)) {
      fs.writeFileSync(produtosPath, JSON.stringify([], null, 2));
    }
    const rawData = fs.readFileSync(produtosPath, "utf8");
    produtosBase = JSON.parse(rawData);
    console.log(
      `📦 Base atualizada: ${produtosBase.length} produtos carregados.`,
    );
  } catch (err) {
    console.error("❌ Erro crítico no JSON de produtos. Mantendo anterior.");
  }
}
fs.watchFile(produtosPath, () => carregarProdutos());
carregarProdutos();

// --- SERVIR FRONTEND ---
app.use(express.static(distPath));
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send("Frontend não encontrado.");
});

// --- SOCKET.IO ---
const io = new Server(httpServer, { cors: { origin: "*" } });

// --- CLIENTE MQTT ---
const mqttClient = mqtt.connect(`mqtt://${brokerIp}:1883`, {
  clientId: "central_automacao_rfid_brady",
  connectTimeout: 5000,
  protocolVersion: 4,
});

mqttClient.on("connect", () => {
  console.log(`✅ Conectado com sucesso ao Broker MQTT em: ${brokerIp}`);
  mqttClient.subscribe("rfid/leitura");
});

mqttClient.on("message", (topic, message) => {
  if (topic !== "rfid/leitura") return;

  try {
    const payload = JSON.parse(message.toString());
    const epcLido = payload.epcHex; // Mapeamento para a nova chave do payload MQTT
    if (!epcLido) return;

    // Comando de limpeza via payload MQTT se aplicável
    if (payload.Command === "clear" || payload.Action === "START_SESSION") {
      io.emit("clear-list");
      return;
    }

    // Busca no banco de dados local
    const produtoMatch = produtosBase.find((p) => p.tag === epcLido);

    // Formatação de data e hora local
    const dataObjeto = payload.timestamp
      ? new Date(payload.timestamp)
      : new Date();
    const dataHoje = dataObjeto.toLocaleDateString("pt-BR");
    const timestamp = dataObjeto.toLocaleTimeString("pt-BR");

    const tagData = {
      Content: epcLido, // Mantém a compatibilidade com a chave do front
      readermodel: payload.readermodel || "Desconhecido",
      info: payload.info || "N/A",
      reader: payload.reader || "N/A",
      rssi: payload.rssi !== undefined ? payload.rssi : -100,
      description: produtoMatch
        ? produtoMatch.description
        : "⚠️ Produto Não Cadastrado",
      dataHoje,
      timestamp,
      isValid: !!produtoMatch,
    };

    // 1. Emite para o front processar a agregação
    io.emit("new-tag", tagData);

    // 2. Registra o log histórico persistente
    const logEntry = `[${timestamp}] Model: ${tagData.readermodel} | EPC: ${epcLido} | RSSI: ${tagData.rssi}dBm | Match: ${tagData.isValid}\n`;
    fs.appendFile(logPath, logEntry, (err) => {
      if (err) console.error("Erro log:", err);
    });
  } catch (e) {
    console.error("❌ Erro ao decodificar payload MQTT:", e.message);
  }
});

httpServer.listen(WEB_PORT, () => {
  console.log(
    `🚀 SERVIDOR INTEGRADO BRADY MQTT PRONTO!\n🌐 Interface: http://localhost:${WEB_PORT}`,
  );
});
