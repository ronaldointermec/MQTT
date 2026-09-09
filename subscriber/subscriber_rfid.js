// subscriber.js
//hic041474: 10.246.148.151
//rsilva: 10.80.171.22
const mqtt = require("mqtt");
const fs = require("fs");
const path = require("path");

const configPath = path.join(process.cwd(), "config.json");

let brokerIp = "localhost";

try {
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configFile);
    if (config.broker_ip) {
      brokerIp = config.broker_ip;
    }
  } else {
    console.warn(
      "⚠️ Arquivo de configuração não encontrado. Usando IP padrão do broker: localhost",
    );
  }
} catch (err) {
  console.error("❌ ERRO AO LER O ARQUIVO DE CONFIGURAÇÃO:", err.message);
}

const client = mqtt.connect(`mqtt://${brokerIp}:1883`, {
  clientId: "central_automacao_rfid", // <--- Nome limpo e personalizado!
  // username: "honeywell_user", // O usuário que você criou no Linux
  // password: "Senha123",
  connectTimeout: 5000,
  protocolVersion: 4, // <-- Força o uso do MQTT 3.1.1 (Altamente compatível)
  // rejectUnauthorized: false, // <-- Desativa validações estritas de segurança de rede corporativa
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
let ultimoRfid = "Nenhuma tag lida...";
let contadorTags = 0; // 🔢 Inicializa o contador global de tags
client.on("connect", () => {
  console.clear();
  console.log("==========================================================");
  console.log("      📊 RFID TRANSFER WEDGE");
  console.log("==========================================================");
  client.subscribe(["rfid/leitura"]);
});

client.on("message", (topic, message) => {
  const textoMensagem = message.toString();

  // Processamento do Tópico do Leitor RFID Android
  if (topic === "rfid/leitura") {
    contadorTags++;
    try {
      // 1. Converte a string JSON recebida em um objeto JavaScript
      const dadosTag = JSON.parse(textoMensagem);

      // 3. Formata o payload bruto para JSON "bonitinho" com recuo de 4 espaços
      // O truque do split e join aplica o recuo correto para alinhar no painel do console
      const jsonBonito = JSON.stringify(dadosTag, null, 4);
      payloadFormatado = jsonBonito.split("\n").join("\n                 ");
    } catch (e) {
      // Caso chegue algo que não seja um JSON válido, exibe o texto bruto como segurança
      ultimoRfid = textoMensagem;
    }
  }
  // 2. DESENHO DO PAINEL NO CONSOLE (Com o contador adicionado)
  console.clear();
  console.log("==========================================================");
  console.log("      📊 RFID TRANSFER WEDGE");
  console.log("==========================================================");
  console.log("==========================================================");
  console.log(`      🔢  Tags Lidas Até o Momento: ${contadorTags}`); // <-- Nova linha do contador
  console.log("==========================================================");
  console.log(`      🆔  Payload:\n               ${payloadFormatado}`);
  console.log("==========================================================");
}); // <-- Chaves e parênteses fechados corretamente aqui!
