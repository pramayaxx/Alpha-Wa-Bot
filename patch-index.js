const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

// replace the makeWASocket call
const oldMakeWASocket = `    const sock = makeWASocket({
        logger: pino({ level: 'info' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore ? makeCacheableSignalKeyStore(state.keys, pino({ level: 'info' })) : state.keys,
        },
        version,
        browser: Browsers.macOS('Safari'),
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false
    });`;

const newMakeWASocket = `    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop')
    });`;

code = code.replace(oldMakeWASocket, newMakeWASocket);

// replace the requestPairingCode logic
const oldPairingLogic = `                let code = await sock.requestPairingCode(pairingPhoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                botState.pairingCode = code;`;

const newPairingLogic = `                let code = await sock.requestPairingCode(pairingPhoneNumber);
                botState.pairingCode = code;`;

code = code.replace(oldPairingLogic, newPairingLogic);

const oldPairingLogic2 = `                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    botState.pairingCode = code;`;

const newPairingLogic2 = `                    let code = await sock.requestPairingCode(phoneNumber);
                    botState.pairingCode = code;`;
                    
code = code.replace(oldPairingLogic2, newPairingLogic2);

fs.writeFileSync('/app/applet/index.js', code);
