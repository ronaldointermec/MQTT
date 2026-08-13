// publisher.js
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  // Limpa o terminal na hora que conecta
  console.clear();
  console.log("🚀 Sensor de Temperatura Iniciado!");

  setInterval(() => {
    const temperaturaSimulada = (22 + Math.random() * 4).toFixed(1);
    client.publish("casa/sala/temperatura", `${temperaturaSimulada}°C`);

    // LIMPEZA: Apaga o histórico e mostra apenas a última linha
    console.clear();
    console.log("🚀 Sensor de Temperatura Rodando...");
    console.log(`➡️  Última temperatura enviada: ${temperaturaSimulada}°C`);
  }, 3000);
});
