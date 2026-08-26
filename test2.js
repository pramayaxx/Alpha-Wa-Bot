const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
async function test() {
    const { version } = await fetchLatestBaileysVersion();
    const { state } = await useMultiFileAuthState('test_auth_6');
    const sock = makeWASocket({
        logger: pino({ level: 'trace' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.macOS('Desktop')
    });
    
    sock.ev.on('connection.update', async (update) => {
        console.log('Update:', update);
        if (update.qr) {
            console.log('Got QR, requesting pairing code...');
            let code = await sock.requestPairingCode('94770000000');
            console.log('CODE:', code);
            process.exit(0);
        }
    });
}
test();
