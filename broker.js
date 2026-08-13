// // // broker.js
// // import("aedes").then((modulo) =>
// //   console.log("📦 Conteúdo do pacote:", Object.keys(modulo)),
// // );

// // broker.js

// async function iniciarBroker() {
//   // Pegamos a classe Aedes exatamente como ela é exportada no pacote
//   const { Aedes } = await import("aedes");

//   // Criamos o broker usando o método correto da classe
//   const aedes = await Aedes.createBroker();

//   const server = require("net").createServer(aedes.handle);

//   // Porta padrão do MQTT é a 1883
//   const PORT = 1883;

//   server.listen(PORT, function () {
//     console.log(`🚀 Broker MQTT rodando na porta ${PORT}`);
//   });
// }

// // Executa a função para ligar o servidor
// iniciarBroker().catch(console.error);
// broker.js

async function iniciarBroker() {
  // Importa a classe principal do pacote
  const { Aedes } = await import("aedes");

  // Cria a instância do broker
  const aedes = await Aedes.createBroker();

  const server = require("net").createServer(aedes.handle);
  const PORT = 1883;

  // =================================================================
  // 📊 EVENTOS DE LOGS PARA ESTUDO (A MÁGICA ACONTECE AQUI)
  // =================================================================

  // 1. Log quando um dispositivo se conecta
  aedes.on("client", (client) => {
    console.log(`🔌 [CONEXÃO] Novo dispositivo conectado! ID: ${client.id}`);
  });

  // 2. Log quando um dispositivo se desconecta
  aedes.on("clientDisconnect", (client) => {
    console.log(`❌ [DESCONEXÃO] O dispositivo saiu. ID: ${client.id}`);
  });

  // 3. Log quando alguém ASSINA (Subscribe) um tópico
  aedes.on("subscribe", (subscriptions, client) => {
    subscriptions.forEach((sub) => {
      console.log(
        `📌 [ASSINATURA] O cliente [${client.id}] assinou o tópico: ${sub.topic}`,
      );
    });
  });

  // 4. Log quando uma mensagem é PUBLICADA (Publish) e passa pelo Broker
  aedes.on("publish", (packet, client) => {
    // Filtramos para não mostrar mensagens internas de controle do próprio Aedes
    if (client) {
      console.log(
        `📩 [TRAFÉGO] Mensagem de [${client.id}] no tópico [${packet.topic}]: ${packet.payload.toString()}`,
      );
    }
  });

  // =================================================================

  server.listen(PORT, function () {
    console.clear(); // Limpa logs antigos ao iniciar
    console.log("==================================================");
    console.log(`🚀 BROKER MQTT ATIVO E MONITORANDO A PORTA ${PORT}`);
    console.log("==================================================\n");
  });
}

iniciarBroker().catch(console.error);
