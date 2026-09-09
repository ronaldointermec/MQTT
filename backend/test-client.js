const dgram = require('dgram');
const client = dgram.createSocket('udp4');

// O JSON exatamente como a GS1 pediu
const message = JSON.stringify({
    Id_sender: 777,
    Command: "scan",
    Content: "E2801160600002120C698D02",
    Id_receiver: [77]
});

const buffer = Buffer.from(message);

client.send(buffer, 0, buffer.length, 12345, '127.0.0.1', (err) => {
    if (err) {
        console.error('❌ Erro ao enviar:', err);
    } else {
        console.log('🚀 Mensagem de teste enviada com sucesso para 127.0.0.1:12345');
    }
    client.close();
});
