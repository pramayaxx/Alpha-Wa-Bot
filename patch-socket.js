const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

const oldClose = `        if(connection === 'close') {
            botState.status = 'offline';
            io.emit('bot_state', botState);
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 3000); // Intentionally not passing pairingPhoneNumber to avoid invalidating the current code
            } else {`;

const newClose = `        if(connection === 'close') {
            botState.status = 'offline';
            io.emit('bot_state', botState);
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            // Clean up old socket before reconnecting
            if (globalSock) {
                globalSock.ev.removeAllListeners();
            }

            if(shouldReconnect) {
                console.log('[SYSTEM] Reconnecting... Status Code:', statusCode);
                setTimeout(() => connectToWhatsApp(), 3000); 
            } else {`;

code = code.replace(oldClose, newClose);
fs.writeFileSync('/app/applet/index.js', code);
