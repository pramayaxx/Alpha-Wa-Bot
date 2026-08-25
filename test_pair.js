const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function test() {
    const { state } = await useMultiFileAuthState('test_auth');
    const sock = makeWASocket({
        logger: pino({ level: 'trace' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop')
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
