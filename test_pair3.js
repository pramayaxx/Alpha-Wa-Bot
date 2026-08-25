const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function test() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const { state } = await useMultiFileAuthState('test_auth3');
    const sock = makeWASocket({
        logger: pino({ level: 'trace' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: ['Ubuntu', 'Chrome', '110.0.0.0']
    });
    
    sock.ev.on('connection.update', (update) => {
        console.log('Update:', update);
    });

    setTimeout(async () => {
        try {
            console.log('Requesting code...');
            let code = await sock.requestPairingCode('94770000000');
            console.log('CODE:', code);
        } catch(e) {
            console.log('ERROR:', e.message);
        }
    }, 3000);
}
test();
