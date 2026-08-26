const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

const oldMakeWASocket = `    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop')
    });`;

const newMakeWASocket = `    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.macOS('Desktop')
    });`;

code = code.replace(oldMakeWASocket, newMakeWASocket);
fs.writeFileSync('/app/applet/index.js', code);
