const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldPairAPI = `app.post('/api/pair', async (req, res) => {
    try {
        const { phone } = req.body;
        if (botState.status === 'online') return res.status(400).json({ error: 'Bot is already connected and online.' });
        
        let cleanNumber = phone ? phone.replace(/[^0-9]/g, '') : '';
        if (cleanNumber.startsWith('00')) cleanNumber = cleanNumber.substring(2);
        if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
            cleanNumber = '94' + cleanNumber.substring(1);
        }
        
        if (!cleanNumber || cleanNumber.length < 8) return res.status(400).json({ error: 'Please enter a valid phone number with country code (e.g. 94781234567).' });
        
        botState.pairingCode = 'GENERATING...';
        botState.qr = null;
        io.emit('bot_state', botState);
        if (globalSock) {
            try { globalSock.ev.removeAllListeners(); } catch(e){}
            try { globalSock.ws.close(); } catch(e){}
            globalSock = null;
        }
        
        const fs = require('fs');
        if (fs.existsSync('auth_info_baileys')) fs.rmSync('auth_info_baileys', { recursive: true, force: true });
        
        setTimeout(() => {
            connectToWhatsApp(cleanNumber);
        }, 1000);
        
        res.json({ success: true, message: 'Requesting code...' });
    } catch (error) {
        botState.pairingCode = 'ERROR';
        botState.pairingError = error.message;
        io.emit('bot_state', botState);
        res.status(500).json({ error: error.message });
    }
});`;

const newPairAPI = `app.post('/api/pair', async (req, res) => {
    try {
        const { phone, sessionId = 'default' } = req.body;
        const bState = getBotState(sessionId);
        if (bState.status === 'online') return res.status(400).json({ error: 'Bot is already connected and online.' });
        
        let cleanNumber = phone ? phone.replace(/[^0-9]/g, '') : '';
        if (cleanNumber.startsWith('00')) cleanNumber = cleanNumber.substring(2);
        if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
            cleanNumber = '94' + cleanNumber.substring(1);
        }
        
        if (!cleanNumber || cleanNumber.length < 8) return res.status(400).json({ error: 'Please enter a valid phone number with country code (e.g. 94781234567).' });
        
        bState.pairingCode = 'GENERATING...';
        bState.qr = null;
        setBotState(sessionId, {});
        
        let sock = activeSessions.get(sessionId);
        if (sock) {
            try { sock.ev.removeAllListeners(); } catch(e){}
            try { sock.ws.close(); } catch(e){}
            activeSessions.delete(sessionId);
        }
        
        const fs = require('fs');
        if (fs.existsSync(\`auth_info_\${sessionId}\`)) fs.rmSync(\`auth_info_\${sessionId}\`, { recursive: true, force: true });
        
        setTimeout(() => {
            connectToWhatsApp(sessionId, cleanNumber);
        }, 1000);
        
        res.json({ success: true, message: 'Requesting code...' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});`;
code = code.replace(oldPairAPI, newPairAPI);

const oldReset = `app.post('/api/reset', (req, res) => {
    console.log('[SYSTEM] Session reset requested. Deleting auth_info_baileys...');
    const fs = require('fs');
    if (fs.existsSync('auth_info_baileys')) {
        fs.rmSync('auth_info_baileys', { recursive: true, force: true });
    }
    botState.qr = null;
    botState.pairingCode = null;
    botState.pairingError = null;
    
    // Disconnect current socket if exists
    if (globalSock) {
        globalSock.ev.removeAllListeners();
        globalSock.end(new Error('Reset requested'));
    }
    
    setTimeout(() => {
        connectToWhatsApp();
    }, 2000);
    
    res.json({ success: true });
});`;

const newReset = `app.post('/api/reset', (req, res) => {
    const { sessionId = 'default' } = req.body;
    console.log(\`[SYSTEM] Session \${sessionId} reset requested. Deleting auth_info...\`);
    const fs = require('fs');
    if (fs.existsSync(\`auth_info_\${sessionId}\`)) {
        fs.rmSync(\`auth_info_\${sessionId}\`, { recursive: true, force: true });
    }
    const bState = getBotState(sessionId);
    bState.qr = null;
    bState.pairingCode = null;
    bState.pairingError = null;
    bState.status = 'offline';
    setBotState(sessionId, {});
    
    let sock = activeSessions.get(sessionId);
    if (sock) {
        try { sock.ev.removeAllListeners(); } catch(e){}
        try { sock.end(new Error('Reset requested')); } catch(e){}
        activeSessions.delete(sessionId);
    }
    
    setTimeout(() => {
        connectToWhatsApp(sessionId);
    }, 2000);
    
    res.json({ success: true });
});`;
code = code.replace(oldReset, newReset);

// also update the /api/state GET request
const oldStateAPI = `app.get('/api/state', (req, res) => res.json(botState));`;
const newStateAPI = `app.get('/api/state', (req, res) => {
    const sessionId = req.query.sessionId || 'default';
    res.json(getBotState(sessionId));
});`;
// Ensure we replace all occurrences safely
code = code.split(oldStateAPI).join(newStateAPI);

fs.writeFileSync('index.js', code);
