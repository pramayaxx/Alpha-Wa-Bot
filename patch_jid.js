const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.replace(
    'DisconnectReason, makeCacheableSignalKeyStore } = require(\'@whiskeysockets/baileys\');',
    'DisconnectReason, makeCacheableSignalKeyStore, jidNormalizedUser } = require(\'@whiskeysockets/baileys\');'
);

const oldOpen = `        } else if(connection === 'open') {
            getBotState(sessionId).status = 'online';
            getBotState(sessionId).qr = null;
            getBotState(sessionId).pairingCode = null;
            setBotState(sessionId, {});
            
            const welcomeMsg = \`🚀 *ALPHA SHOP & AI ACTIVE* 🚀\\n\\nYour device is now securely linked to the central node.\\n\\n👤 *Session ID:* \${sessionId}\\n🤖 *AI Engine:* DeepSeek v3\\n🛒 *Shop Systems:* Online\\n✅ *Status:* Active & Secured\\n\\n_Powered by CAT SHADOW_\`;
            try {
                await sock.sendMessage(sock.user.id, { text: welcomeMsg });
            } catch (err) {}
        }`;

const newOpen = `        } else if(connection === 'open') {
            getBotState(sessionId).status = 'online';
            getBotState(sessionId).qr = null;
            getBotState(sessionId).pairingCode = null;
            setBotState(sessionId, {});
            
            const welcomeMsg = \`🚀 *ALPHA SHOP & AI ACTIVE* 🚀\\n\\nYour WhatsApp is now successfully connected!\\n\\n👤 *Session ID:* \${sessionId}\\n🤖 *AI Engine:* DeepSeek\\n🛒 *Shop Systems:* Online\\n✅ *Status:* Active & Secured\\n\\n_Powered by CAT SHADOW_\`;
            try {
                const myJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(myJid, { text: welcomeMsg });
                console.log(\`[SYSTEM] Welcome message sent to \${myJid}\`);
            } catch (err) {
                console.error('[SYSTEM] Failed to send welcome message', err);
            }
        }`;

code = code.replace(oldOpen, newOpen);
fs.writeFileSync('index.js', code);
