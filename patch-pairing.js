const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

// 1. Update Browser Config
const oldConfig = `    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.macOS('Desktop')
    });`;

const newConfig = `    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        markOnlineOnConnect: false
    });`;

code = code.replace(oldConfig, newConfig);

// 2. Add delay before requestPairingCode
const oldRequestBlock = `        if (qr) {
            if (pairingPhoneNumber && !pairingCodeRequested && !sock.authState.creds.registered) {
                pairingCodeRequested = true;
                try {
                    let code = await sock.requestPairingCode(pairingPhoneNumber);`;

const newRequestBlock = `        if (qr) {
            if (pairingPhoneNumber && !pairingCodeRequested && !sock.authState.creds.registered) {
                pairingCodeRequested = true;
                try {
                    await new Promise(r => setTimeout(r, 2000)); // Delay for crypto init
                    let code = await sock.requestPairingCode(pairingPhoneNumber);`;

code = code.replace(oldRequestBlock, newRequestBlock);

const oldEnvRequestBlock = `            } else if (!pairingPhoneNumber && !pairingCodeRequested && process.env.USE_PAIRING_CODE === 'true' && !sock.authState.creds.registered) {
                const phoneNumber = process.env.BOT_PHONE_NUMBER?.replace(/[^0-9]/g, '');
                if (phoneNumber) {
                    pairingCodeRequested = true;
                    try {
                        let code = await sock.requestPairingCode(phoneNumber);`;

const newEnvRequestBlock = `            } else if (!pairingPhoneNumber && !pairingCodeRequested && process.env.USE_PAIRING_CODE === 'true' && !sock.authState.creds.registered) {
                const phoneNumber = process.env.BOT_PHONE_NUMBER?.replace(/[^0-9]/g, '');
                if (phoneNumber) {
                    pairingCodeRequested = true;
                    try {
                        await new Promise(r => setTimeout(r, 2000));
                        let code = await sock.requestPairingCode(phoneNumber);`;

code = code.replace(oldEnvRequestBlock, newEnvRequestBlock);

fs.writeFileSync('/app/applet/index.js', code);
