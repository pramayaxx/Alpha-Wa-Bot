const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

const oldBlock = `        if (qr) {
            if (pairingPhoneNumber && !pairingCodeRequested && !sock.authState.creds.registered) {
                pairingCodeRequested = true;
                try {
                    await new Promise(r => setTimeout(r, 2000));
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
                        await new Promise(r => setTimeout(r, 2000));
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

const newBlock = `        if (qr) {
            botState.qr = qr;
            io.emit('bot_state', botState);
            console.log('[QR READY] New WhatsApp QR Code generated.');
            
            if (pairingPhoneNumber && !pairingCodeRequested && !sock.authState.creds.registered) {
                pairingCodeRequested = true;
                try {
                    await new Promise(r => setTimeout(r, 2500)); // Crucial delay
                    let code = await sock.requestPairingCode(pairingPhoneNumber);
                    botState.pairingCode = code;
                    io.emit('bot_state', botState);
                    console.log(\`[PAIRING CODE GENERATED]: \${code}\`);
                } catch(e) {
                    console.log('Pairing code generation error:', e.message);
                    botState.pairingCode = 'ERROR';
                    botState.pairingError = e.message;
                    io.emit('bot_state', botState);
                }
            }
        }`;

code = code.replace(oldBlock, newBlock);

// Force browser string to Chrome Windows to look like a normal web client
const oldBrowser = `browser: Browsers.ubuntu('Chrome'),`;
const newBrowser = `browser: ['Windows', 'Chrome', '120.0.0.0'],`;
code = code.replace(oldBrowser, newBrowser);

fs.writeFileSync('/app/applet/index.js', code);
