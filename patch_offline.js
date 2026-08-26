const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldSocket = `        browser: ['Windows', 'Chrome', '120.0.0.0'],
        markOnlineOnConnect: true,
        syncFullHistory: false,
    });`;

const newSocket = `        browser: ['AlphaBot Server', 'Chrome', '120.0.0.0'],
        markOnlineOnConnect: true,
        syncFullHistory: false,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 5000,
        maxMsgRetryCount: 5,
        defaultQueryTimeoutMs: 60000
    });`;

code = code.replace(oldSocket, newSocket);
fs.writeFileSync('index.js', code);
console.log("Offline connection resilience patched.");
