// publisher.js
//hic041474: 10.246.148.151
//rsilva: 10.80.171.22
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883", {
  clientId: "sensor_temperatura_sala",
  // username: "honeywell_user", // O usuário que você criou no Linux
  // password: "Senha123",
  connectTimeout: 5000,
  protocolVersion: 4, // <-- Força o uso do MQTT 3.1.1 (Altamente compatível)
  // krejectUnauthorized: false, // <-- Desativa validações estritas de segurança de rede corporativa
  wsOptions: {}, // ⚠️ ESSA LINHA É OBRIGATÓRIA PARA ATIVAR O PROTOCOLO WEBSOCKET NO NODE.JS MQTT v5!
});

client.on("connect", () => {
  // Limpa o terminal na hora que conecta
  console.clear();
  console.log("🚀 Sensor de Temperatura Iniciado!");

  setInterval(() => {
    const temperaturaSimulada = (24 + Math.random() * 4).toFixed(1);
    client.publish("casa/sala/temperatura", `${temperaturaSimulada}°C`);

    // LIMPEZA: Apaga o histórico e mostra apenas a última linha
    console.clear();
    console.log("🚀 Sensor de Temperatura Rodando...");
    console.log(`➡️  Última temperatura enviada: ${temperaturaSimulada}°C`);
  }, 3000);
});
