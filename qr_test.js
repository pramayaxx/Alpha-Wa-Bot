const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
async function test() {
    const { state, saveCreds } = await useMultiFileAuthState('test_auth');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });
    sock.ev.on('connection.update', (update) => {
        if(update.qr) {
            console.log("QR received!");
            process.exit(0);
        }
    });
}
test();
