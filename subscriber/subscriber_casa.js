// subscriber.js

//hic041474: 10.246.148.151
//rsilva: 10.80.171.22
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883", {
  clientId: "central_automacao_casa",
  connectTimeout: 5000,
  protocolVersion: 4,
  // wsOptions: {}, // ⚠️ ESSA LINHA É OBRIGATÓRIA PARA ATIVAR O PROTOCOLO WEBSOCKET NO NODE.JS MQTT v5!
});

// LOGS DE DIAGNÓSTICO DE CONEXÃO:
client.on("connect", () => {
  console.log("✅ Conectado com sucesso ao Broker!");
});

client.on("reconnect", () => {
  console.log("🔄 Tentando reconectar ao Broker...");
});

client.on("error", (err) => {
  console.error("❌ ERRO NO MQTT:", err.message);
});

client.on("offline", () => {
  console.log("⚠️ O cliente ficou offline!");
});

// Variáveis para guardar o ÚLTIMO estado recebido de cada coisa
let ultimaTemperatura = "Aguardando leitura...";
let ultimoStatusArCondicionado = "Aguardando comando...";

client.on("connect", () => {
  console.clear();
  console.log("✅ Central Inteligente Conectada!");
  client.subscribe(["casa/sala/ar-condicionado", "casa/sala/temperatura"]);
});

client.on("message", (topic, message) => {
  const textoMensagem = message.toString();

  // 1. Processamento do Tópico de Temperatura
  if (topic === "casa/sala/temperatura") {
    ultimaTemperatura = textoMensagem;

    // Converte a string (ex: "26.5°C") em um número puro
    const temperatura = parseFloat(textoMensagem.replace("°C", ""));

    // CORREÇÃO DO LOOP INFINITO: Só publica se o estado mudou de verdade!
    if (temperatura > 25.0) {
      if (ultimoStatusArCondicionado !== "LIGAR (Ar Condicionado)") {
        client.publish("casa/sala/ar-condicionado", "LIGAR (Ar Condicionado)");
      }
    } else {
      if (ultimoStatusArCondicionado !== "DESLIGAR (Ar Condicionado)") {
        client.publish(
          "casa/sala/ar-condicionado",
          "DESLIGAR (Ar Condicionado)",
        );
      }
    }
  }

  // 2. Processamento do Tópico do Ar Condicionado
  if (topic === "casa/sala/ar-condicionado") {
    ultimoStatusArCondicionado = textoMensagem;
  }

  // 3. LIMPEZA E DESENHO DO PAINEL
  console.clear();
  console.log("====================================");
  console.log("      📊 PAINEL INTELIGENTE  ");
  console.log("====================================");
  console.log(`      🌡️  Temperatura Atual: ${ultimaTemperatura}`);
  console.log(`      💡  Status do Aparelho: ${ultimoStatusArCondicionado}`);
  console.log("====================================");
  console.log(" Aguardando novas atualizações em tempo real...");
});
