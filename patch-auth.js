const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

const oldAuth = `        printQRInTerminal: false,
        auth: state,
        version,`;

const newAuth = `        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        version,`;

code = code.replace(oldAuth, newAuth);
fs.writeFileSync('/app/applet/index.js', code);
