const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

// replace the event listener part
code = code.replace(/if \(qr\) {[\s\S]*?if\(connection === 'close'\)/, `
        if (qr && !pairingPhoneNumber) {
            botState.qr = qr;
            io.emit('bot_state', botState);
            console.log('[QR READY] New WhatsApp QR Code generated.');
        }

        if(connection === 'close')`);

// add the pairing code request OUTSIDE
code = code.replace(/globalSock = sock;\n    let pairingCodeRequested = false;/, `globalSock = sock;
    let pairingCodeRequested = false;

    if (pairingPhoneNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(pairingPhoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                botState.pairingCode = code;
                botState.qr = null;
                io.emit('bot_state', botState);
                console.log(\`[PAIRING CODE GENERATED]: \${code}\`);
            } catch(e) {
                console.error('Pairing code generation error:', e.message);
            }
        }, 3000);
    } else if (!pairingPhoneNumber && process.env.USE_PAIRING_CODE === 'true' && !sock.authState.creds.registered) {
        const phoneNumber = process.env.BOT_PHONE_NUMBER?.replace(/[^0-9]/g, '');
        if(phoneNumber) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    botState.pairingCode = code;
                    botState.qr = null;
                    io.emit('bot_state', botState);
                } catch(e) {}
            }, 3000);
        }
    }
`);

fs.writeFileSync('/app/applet/index.js', code);
