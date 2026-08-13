// // broker.js
// import("aedes").then((modulo) =>
//   console.log("📦 Conteúdo do pacote:", Object.keys(modulo)),
// );

// broker.js

async function iniciarBroker() {
  // Pegamos a classe Aedes exatamente como ela é exportada no pacote
  const { Aedes } = await import("aedes");

  // Criamos o broker usando o método correto da classe
  const aedes = await Aedes.createBroker();

  const server = require("net").createServer(aedes.handle);

  // Porta padrão do MQTT é a 1883
  const PORT = 1883;

  server.listen(PORT, function () {
    console.log(`🚀 Broker MQTT rodando na porta ${PORT}`);
  });
}

// Executa a função para ligar o servidor
iniciarBroker().catch(console.error);
