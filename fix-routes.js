const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// The function getBotState was added earlier.
// We need to completely rewrite the route app.post('/api/pair' ... )
// Since regex matching the whole route is tricky, let's use string manipulation

const startIndex = code.indexOf(`app.post('/api/pair', async (req, res) => {`);
const resetIndex = code.indexOf(`app.post('/api/reset', (req, res) => {`);
const refreshQrIndex = code.indexOf(`app.post('/api/refresh-qr', async (req, res) => {`);
const sendFileIndex = code.indexOf(`app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));`);

// We want to replace from startIndex up to sendFileIndex
const beforeRoutes = code.substring(0, startIndex);
const afterRoutes = code.substring(sendFileIndex);

const newRoutes = `app.post('/api/pair', async (req, res) => {
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
        
        let attempts = 0;
        const checkCode = setInterval(() => {
            const currentCode = getBotState(sessionId).pairingCode;
            if (currentCode && currentCode !== 'GENERATING...') {
                clearInterval(checkCode);
                if (currentCode === 'ERROR') {
                    return res.status(500).json({ error: getBotState(sessionId).pairingError || 'Failed to generate code' });
                }
                return res.json({ success: true, code: currentCode });
            }
            if (++attempts > 30) {
                clearInterval(checkCode);
                res.status(500).json({ error: 'Timeout waiting for pairing code' });
            }
        }, 500);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reset', (req, res) => {
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
});

`;

code = beforeRoutes + newRoutes + afterRoutes;
fs.writeFileSync('index.js', code);
