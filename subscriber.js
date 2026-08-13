// subscriber.js
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

// Variáveis para guardar o ÚLTIMO estado recebido de cada coisa
let ultimaTemperatura = "Aguardando leitura...";
let ultimoStatusLampada = "Aguardando comando...";

client.on("connect", () => {
  console.clear();
  console.log("✅ Central Inteligente Conectada!");
  client.subscribe(["casa/sala/lampada", "casa/sala/temperatura"]);
});

client.on("message", (topic, message) => {
  const textoMensagem = message.toString();

  // 1. Atualiza a variável correta dependendo do tópico que chegou
  if (topic === "casa/sala/temperatura") {
    ultimaTemperatura = textoMensagem;

    // Lógica de decisão automática
    const temperatura = parseFloat(textoMensagem.replace("°C", ""));
    if (temperatura > 25.0) {
      client.publish("casa/sala/lampada", "LIGAR (Ar Condicionado)");
    } else {
      client.publish("casa/sala/lampada", "DESLIGAR (Ar Condicionado)");
    }
  }

  if (topic === "casa/sala/lampada") {
    ultimoStatusLampada = textoMensagem;
  }

  // 2. LIMPEZA E DESENHO DO PAINEL
  console.clear();
  console.log("====================================");
  console.log("      📊 PAINEL DA CASA INTELIGENTE  ");
  console.log("====================================");
  console.log(`      🌡️  Temperatura Atual: ${ultimaTemperatura}`);
  console.log(`      💡 Status do Aparelho: ${ultimoStatusLampada}`);
  console.log("====================================");
  console.log(" Aguardando novas atualizações em tempo real...");
}); // <-- Chaves e parênteses fechados corretamente aqui!
