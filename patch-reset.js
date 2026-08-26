const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

// Add reset endpoint
const expressImport = `app.use(express.json());`;
const resetEndpoint = `app.use(express.json());

app.post('/api/reset', (req, res) => {
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
});
`;
code = code.replace(expressImport, resetEndpoint);

fs.writeFileSync('/app/applet/index.js', code);
