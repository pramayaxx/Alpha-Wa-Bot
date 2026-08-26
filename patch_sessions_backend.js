const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. Ensure sessions exist in db.settings
const oldInitDb = `            settings: { deepseekKey: '', systemPrompt: 'You are a professional WhatsApp Shop Assistant for \\'Alpha Mobile\\'. Be extremely polite. Handle customer queries about products seamlessly.', deviceWelcomeMsg: '🚀 *ALPHA SHOP & AI ACTIVE* 🚀\\n\\nYour WhatsApp is now successfully connected!\\n\\n👤 *Session ID:* {session_id}\\n🤖 *AI Engine:* DeepSeek\\n🛒 *Shop Systems:* Online\\n✅ *Status:* Active & Secured\\n\\n_Powered by ALPHA MOBILE_' },`;
const newInitDb = `            settings: { sessions: ['default'], deepseekKey: '', systemPrompt: 'You are a professional WhatsApp Shop Assistant for \\'Alpha Mobile\\'. Be extremely polite. Handle customer queries about products seamlessly.', deviceWelcomeMsg: '🚀 *ALPHA SHOP & AI ACTIVE* 🚀\\n\\nYour WhatsApp is now successfully connected!\\n\\n👤 *Session ID:* {session_id}\\n🤖 *AI Engine:* DeepSeek\\n🛒 *Shop Systems:* Online\\n✅ *Status:* Active & Secured\\n\\n_Powered by ALPHA MOBILE_' },`;
code = code.replace(oldInitDb, newInitDb);

// 2. Add /api/sessions and /api/sessions/add
const sessionApis = `
app.get('/api/sessions', (req, res) => {
    const db = readDB();
    const sessions = db.settings.sessions || ['default'];
    res.json(sessions);
});
app.post('/api/sessions/add', (req, res) => {
    const { sessionId } = req.body;
    if(!sessionId || typeof sessionId !== 'string') return res.status(400).json({error: 'Invalid session ID'});
    const db = readDB();
    if(!db.settings.sessions) db.settings.sessions = ['default'];
    if(db.settings.sessions.length >= 10) return res.status(400).json({error: 'Maximum 10 devices allowed.'});
    if(db.settings.sessions.includes(sessionId)) return res.status(400).json({error: 'Session already exists.'});
    db.settings.sessions.push(sessionId);
    writeDB(db);
    connectToWhatsApp(sessionId);
    res.json({success: true, sessions: db.settings.sessions});
});
app.post('/api/sessions/remove', (req, res) => {
    const { sessionId } = req.body;
    if(sessionId === 'default') return res.status(400).json({error: 'Cannot remove default session.'});
    const db = readDB();
    if(!db.settings.sessions) db.settings.sessions = ['default'];
    db.settings.sessions = db.settings.sessions.filter(s => s !== sessionId);
    writeDB(db);
    
    let sock = activeSessions.get(sessionId);
    if(sock) {
        try { sock.ev.removeAllListeners(); sock.logout(); sock.end(new Error('Removed')); } catch(e){}
        activeSessions.delete(sessionId);
    }
    if (fs.existsSync(\`auth_info_\${sessionId}\`)) fs.rmSync(\`auth_info_\${sessionId}\`, { recursive: true, force: true });
    res.json({success: true, sessions: db.settings.sessions});
});
`;
code = code.replace("app.get('/api/state'", sessionApis + "app.get('/api/state'");

// 3. Fix startup to connect all sessions
code = code.replace("connectToWhatsApp(); // boot default session automatically", `const db = readDB(); (db.settings.sessions || ['default']).forEach(s => connectToWhatsApp(s));`);

// 4. Update the Retargeting Job to iterate over activeSessions
const oldRetarget = `const sock = activeSessions.get('default');`;
const newRetarget = `const sock = activeSessions.get(cust.sessionId || 'default') || Array.from(activeSessions.values())[0];`;
code = code.replace(oldRetarget, newRetarget);

// 5. Update /api/chat/send to use sessionId
const oldChatSend = `app.post('/api/chat/send', async (req, res) => {
    const { to, text } = req.body;
    const sock = activeSessions.get('default');`;
const newChatSend = `app.post('/api/chat/send', async (req, res) => {
    const { to, text } = req.body;
    const db = readDB();
    let cust = (db.shop?.customers || []).find(c => c.jid === to || c.id === to);
    const sock = activeSessions.get(cust?.sessionId || 'default') || Array.from(activeSessions.values())[0];`;
code = code.replace(oldChatSend, newChatSend);

// 6. In startBot (connectToWhatsApp), set sessionId on customer
const oldCustSet = `        let cust = db.shop.customers.find(c => c.jid === sender || c.id === sender);
        if (!cust) {
            cust = { jid: sender, id: sender, pushName, date: new Date().toISOString(), aiPaused: false };`;
const newCustSet = `        let cust = db.shop.customers.find(c => c.jid === sender || c.id === sender);
        if (!cust) {
            cust = { jid: sender, id: sender, pushName, date: new Date().toISOString(), aiPaused: false, sessionId };`;
code = code.replace(oldCustSet, newCustSet);

fs.writeFileSync('index.js', code);
