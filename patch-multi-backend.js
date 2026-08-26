const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// Replace global variables and connectToWhatsApp
const oldGlobal = `let globalSock = null;
let botState = { status: 'offline', pairingCode: null, pairingError: null, qr: null };`;
const newGlobal = `const activeSessions = new Map();
const sessionStates = new Map();

function getBotState(sessionId) {
    if (!sessionStates.has(sessionId)) {
        sessionStates.set(sessionId, { status: 'offline', pairingCode: null, pairingError: null, qr: null });
    }
    return sessionStates.get(sessionId);
}

function setBotState(sessionId, updates) {
    const state = getBotState(sessionId);
    Object.assign(state, updates);
    io.emit(\`bot_state_\${sessionId}\`, state);
}
`;
code = code.replace(oldGlobal, newGlobal);

// Replace connectToWhatsApp signature and internals
const oldConnectStart = `async function connectToWhatsApp (pairingPhoneNumber = null) {`;
const newConnectStart = `async function connectToWhatsApp (sessionId = 'default', pairingPhoneNumber = null) {`;
code = code.replace(oldConnectStart, newConnectStart);

const oldAuthState = `const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');`;
const newAuthState = `const { state, saveCreds } = await useMultiFileAuthState(\`auth_info_\${sessionId}\`);`;
code = code.replace(oldAuthState, newAuthState);

// Replace globalSock assignment
const oldGlobalSockAssign = `    globalSock = sock;
    let pairingCodeRequested = false;`;
const newGlobalSockAssign = `    activeSessions.set(sessionId, sock);
    if (sessionId === 'default') globalSock = sock; // keep legacy support for other plugins
    let pairingCodeRequested = false;`;
code = code.replace(oldGlobalSockAssign, newGlobalSockAssign);

// Fix botState references inside connectToWhatsApp
code = code.replace(/botState\.pairingCode = /g, `getBotState(sessionId).pairingCode = `);
code = code.replace(/botState\.qr = /g, `getBotState(sessionId).qr = `);
code = code.replace(/botState\.pairingError = /g, `getBotState(sessionId).pairingError = `);
code = code.replace(/botState\.status = /g, `getBotState(sessionId).status = `);
code = code.replace(/io\.emit\('bot_state', botState\);/g, `setBotState(sessionId, {});`);

// Fix reconnect block
const oldReconnect = `            if (globalSock) {
                globalSock.ev.removeAllListeners();
            }

            if(shouldReconnect) {
                console.log('[SYSTEM] Reconnecting... Status Code:', statusCode);
                setTimeout(() => connectToWhatsApp(), 3000); 
            }`;
const newReconnect = `            if (activeSessions.get(sessionId)) {
                activeSessions.get(sessionId).ev.removeAllListeners();
                activeSessions.delete(sessionId);
            }

            if(shouldReconnect) {
                console.log(\`[SYSTEM] Reconnecting \${sessionId}... Status Code:\`, statusCode);
                setTimeout(() => connectToWhatsApp(sessionId), 3000); 
            }`;
code = code.replace(oldReconnect, newReconnect);

// Add welcome message on open
const oldOpen = `        } else if(connection === 'open') {
            getBotState(sessionId).status = 'online';
            getBotState(sessionId).qr = null;
            getBotState(sessionId).pairingCode = null;
            setBotState(sessionId, {});
            console.log('⚡ ALPHA MOBILE BOT IS ONLINE & FORTIFIED.');`;
const newOpen = `        } else if(connection === 'open') {
            getBotState(sessionId).status = 'online';
            getBotState(sessionId).qr = null;
            getBotState(sessionId).pairingCode = null;
            setBotState(sessionId, {});
            console.log(\`⚡ SESSION \${sessionId} IS ONLINE & FORTIFIED.\`);
            
            // Send professional welcome message
            const welcomeMsg = \`🚀 *ALPHA SERVER CONNECTED* 🚀\n\nYour device is now securely linked to the central node.\n\n👤 *Session ID:* \${sessionId}\n🛡️ *Engine:* Baileys MD\n✅ *Status:* Active & Secured\n\n_Powered by CAT SHADOW_\`;
            try {
                const jid = sock.user.id;
                await sock.sendMessage(jid, { text: welcomeMsg });
            } catch (err) {
                console.error('Failed to send welcome message:', err);
            }
`;
code = code.replace(oldOpen, newOpen);

fs.writeFileSync('index.js', code);
