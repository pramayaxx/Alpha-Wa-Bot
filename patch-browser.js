const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

const oldConfig = `    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        markOnlineOnConnect: false
    });`;

const newConfig = `    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: true,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false
    });`;

code = code.replace(oldConfig, newConfig);
fs.writeFileSync('/app/applet/index.js', code);
