const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

// 1. Remove the standalone requestPairingCode blocks
const blockToRemove = `
    if (pairingPhoneNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(pairingPhoneNumber);
                botState.pairingCode = code;
                botState.qr = null;
                io.emit('bot_state', botState);
                console.log(\`[PAIRING CODE GENERATED]: \${code}\`);
            } catch(e) {
                console.log('Pairing code generation error:', e.message);
                botState.pairingCode = 'ERROR';
                botState.pairingError = e.message;
            }
        }, 3000);
    } else if (!pairingPhoneNumber && process.env.USE_PAIRING_CODE === 'true' && !sock.authState.creds.registered) {
        const phoneNumber = process.env.BOT_PHONE_NUMBER?.replace(/[^0-9]/g, '');
        if(phoneNumber) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    botState.pairingCode = code;
                    botState.qr = null;
                    io.emit('bot_state', botState);
                } catch(e) {
                    botState.pairingCode = 'ERROR';
                    botState.pairingError = e.message;
                }
            }, 3000);
        }
    }`;

code = code.replace(blockToRemove, "");

// 2. Insert into the qr block
const oldQrBlock = `        if (qr && !pairingPhoneNumber) {
            botState.qr = qr;
            io.emit('bot_state', botState);
            console.log('[QR READY] New WhatsApp QR Code generated.');
        }`;

const newQrBlock = `        if (qr) {
            if (pairingPhoneNumber && !pairingCodeRequested && !sock.authState.creds.registered) {
                pairingCodeRequested = true;
                try {
                    let code = await sock.requestPairingCode(pairingPhoneNumber);
                    botState.pairingCode = code;
                    botState.qr = null;
                    io.emit('bot_state', botState);
                    console.log(\`[PAIRING CODE GENERATED]: \${code}\`);
                } catch(e) {
                    console.log('Pairing code generation error:', e.message);
                    botState.pairingCode = 'ERROR';
                    botState.pairingError = e.message;
                }
            } else if (!pairingPhoneNumber && !pairingCodeRequested && process.env.USE_PAIRING_CODE === 'true' && !sock.authState.creds.registered) {
                const phoneNumber = process.env.BOT_PHONE_NUMBER?.replace(/[^0-9]/g, '');
                if (phoneNumber) {
                    pairingCodeRequested = true;
                    try {
                        let code = await sock.requestPairingCode(phoneNumber);
                        botState.pairingCode = code;
                        botState.qr = null;
                        io.emit('bot_state', botState);
                        console.log(\`[PAIRING CODE GENERATED VIA ENV]: \${code}\`);
                    } catch(e) {
                        console.log('Pairing code generation error:', e.message);
                        botState.pairingCode = 'ERROR';
                        botState.pairingError = e.message;
                    }
                }
            } else if (!pairingPhoneNumber) {
                botState.qr = qr;
                io.emit('bot_state', botState);
                console.log('[QR READY] New WhatsApp QR Code generated.');
            }
        }`;

code = code.replace(oldQrBlock, newQrBlock);

fs.writeFileSync('/app/applet/index.js', code);
