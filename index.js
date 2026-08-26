const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const { Server } = require('socket.io');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, jidNormalizedUser } = require('@whiskeysockets/baileys');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- DATABASE SIMULATION ---
const dataFile = path.join(__dirname, 'db.json');
function readDB() {
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify({ 
            shop: { products: [], customers: [] }, 
            settings: { deepseekKey: '', systemPrompt: 'You are a professional WhatsApp Shop Assistant for \'Alpha Mobile\'. Be extremely polite. Handle customer queries about products seamlessly.', deviceWelcomeMsg: '🚀 *ALPHA SHOP & AI ACTIVE* 🚀\n\nYour WhatsApp is now successfully connected!\n\n👤 *Session ID:* {session_id}\n🤖 *AI Engine:* DeepSeek\n🛒 *Shop Systems:* Online\n✅ *Status:* Active & Secured\n\n_Powered by ALPHA MOBILE_' }, 
            plugins: [] 
        }));
    }
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}
function writeDB(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// --- STATE MANAGEMENT ---
const activeSessions = new Map();
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
    io.emit(`bot_state_${sessionId}`, state);
}

// --- DEEPSEEK AI INTEGRATION ---
async function askDeepSeek(prompt, userMsg, sender) {
    const db = readDB();
    const apiKey = db.settings.deepseekKey;
    if (!apiKey) return null;

    if (!db.chats) db.chats = {};
    if (!db.chats[sender]) db.chats[sender] = [];
    
    // Cleanup messages older than 24 Hours
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    db.chats[sender] = db.chats[sender].filter(msg => (now - msg.timestamp) < ONE_DAY);
    
    const messages = [
        { role: "system", content: prompt },
        ...db.chats[sender].map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg }
    ];
    
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: messages
            }),
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.choices && data.choices[0]) {
            const reply = data.choices[0].message.content;
            // Save to memory
            db.chats[sender].push({ role: 'user', content: userMsg, timestamp: now });
            db.chats[sender].push({ role: 'assistant', content: reply, timestamp: Date.now() });
            writeDB(db);
            return reply;
        }
        return null;
    } catch (err) {
        console.error("DeepSeek Error:", err.message);
        return null;
    }
}

// --- DYNAMIC PLUGIN LOADER ---
const pluginsDir = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);

function loadPlugins(sock, msg, sessionId) {
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
    for (let file of files) {
        try {
            // Delete cache to allow dynamic reloading
            delete require.cache[require.resolve(path.join(pluginsDir, file))];
            const plugin = require(path.join(pluginsDir, file));
            if (typeof plugin.execute === 'function') {
                plugin.execute(sock, msg, sessionId);
            }
        } catch (e) {
            console.error(`Error loading plugin ${file}:`, e.message);
        }
    }
}

// --- WHATSAPP CORE ---
async function connectToWhatsApp(sessionId = 'default', pairingPhoneNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState(`auth_info_${sessionId}`);

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ['Windows', 'Chrome', '120.0.0.0'],
        markOnlineOnConnect: true,
        syncFullHistory: false,
    });

    activeSessions.set(sessionId, sock);
    let pairingCodeRequested = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            if (pairingPhoneNumber && !pairingCodeRequested && !sock.authState.creds.registered) {
                pairingCodeRequested = true;
                try {
                    await new Promise(r => setTimeout(r, 2000));
                    let code = await sock.requestPairingCode(pairingPhoneNumber);
                    getBotState(sessionId).pairingCode = code;
                    getBotState(sessionId).qr = null;
                    setBotState(sessionId, {});
                } catch(e) {
                    getBotState(sessionId).pairingCode = 'ERROR';
                    getBotState(sessionId).pairingError = e.message;
                    setBotState(sessionId, {});
                }
            } else if (!pairingPhoneNumber) {
                getBotState(sessionId).qr = qr;
                setBotState(sessionId, {});
            }
        }

        if(connection === 'close') {
            getBotState(sessionId).status = 'offline';
            setBotState(sessionId, {});
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (activeSessions.get(sessionId)) {
                activeSessions.get(sessionId).ev.removeAllListeners();
                activeSessions.delete(sessionId);
            }

            if(shouldReconnect) {
                setTimeout(() => connectToWhatsApp(sessionId), 3000); 
            } else {
                getBotState(sessionId).qr = null;
                getBotState(sessionId).pairingCode = null;
                setBotState(sessionId, {});
            }
        } else if(connection === 'open') {
            getBotState(sessionId).status = 'online';
            getBotState(sessionId).qr = null;
            getBotState(sessionId).pairingCode = null;
            setBotState(sessionId, {});
            
            const db = readDB();
            let welcomeMsg = db.settings?.deviceWelcomeMsg || `🚀 *ALPHA SHOP & AI ACTIVE* 🚀\n\nYour WhatsApp is now successfully connected!\n\n👤 *Session ID:* {session_id}\n🤖 *AI Engine:* DeepSeek\n🛒 *Shop Systems:* Online\n✅ *Status:* Active & Secured\n\n_Powered by ALPHA MOBILE_`;
            welcomeMsg = welcomeMsg.replace('{session_id}', sessionId);

            try {
                const myJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(myJid, { text: welcomeMsg });
                console.log(`[SYSTEM] Welcome message sent to ${myJid}`);
            } catch (err) {
                console.error('[SYSTEM] Failed to send welcome message', err);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if(!text) return;

        // 1. Run custom dynamic plugins
        loadPlugins(sock, msg, sessionId);

        const db = readDB();
        // AUTO-SAVE CUSTOMER CONTACT
        if (!db.shop) db.shop = { products: [], customers: [] };
        if (!db.shop.customers) db.shop.customers = [];
        const pushName = msg.pushName || "Unknown";
        if (!db.shop.customers.find(c => c.jid === sender)) {
            db.shop.customers.push({ jid: sender, pushName, date: new Date().toISOString() });
            writeDB(db);
            console.log(`[CRM] New contact saved: ${pushName} (${sender})`);
        }

        // 2. AI Reply logic
        if (db.settings.deepseekKey) {
            try {
                await sock.sendPresenceUpdate('composing', sender);
                
                // INJECT PRODUCT CATALOG INTO AI KNOWLEDGE
                let aiPrompt = db.settings.systemPrompt;
                if (db.shop.products && db.shop.products.length > 0) {
                    const catalog = db.shop.products.map(p => `- ${p.name} (Price: ${p.price}): ${p.details}`).join('\n');
                    aiPrompt += `\n\nAVAILABLE PRODUCTS IN SHOP:\n${catalog}\n\nUse this product information to answer customer queries.`;
                }

                const aiReply = await askDeepSeek(aiPrompt, text);
                if (aiReply) {
                    await sock.sendMessage(sender, { text: aiReply }, { quoted: msg });
                }
            } catch (err) {
                console.error("Failed to send AI message", err);
            }
        }
    });
}

// --- API ROUTES ---
app.get('/api/state', (req, res) => {
    const sessionId = req.query.sessionId || 'default';
    res.json(getBotState(sessionId));
});

app.post('/api/pair', async (req, res) => {
    try {
        const { phone, sessionId = 'default' } = req.body;
        const bState = getBotState(sessionId);
        if (bState.status === 'online') return res.status(400).json({ error: 'Already connected.' });
        
        let cleanNumber = phone ? phone.replace(/[^0-9]/g, '') : '';
        if (cleanNumber.startsWith('00')) cleanNumber = cleanNumber.substring(2);
        if (cleanNumber.startsWith('0')) cleanNumber = '94' + cleanNumber.substring(1);
        
        bState.pairingCode = 'GENERATING...';
        bState.qr = null;
        setBotState(sessionId, {});
        
        let sock = activeSessions.get(sessionId);
        if (sock) {
            try { sock.ev.removeAllListeners(); sock.ws.close(); } catch(e){}
            activeSessions.delete(sessionId);
        }
        
        if (fs.existsSync(`auth_info_${sessionId}`)) fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
        
        setTimeout(() => connectToWhatsApp(sessionId, cleanNumber), 1000);
        
        let attempts = 0;
        const checkCode = setInterval(() => {
            const currentCode = getBotState(sessionId).pairingCode;
            if (currentCode && currentCode !== 'GENERATING...') {
                clearInterval(checkCode);
                if (currentCode === 'ERROR') return res.status(500).json({ error: getBotState(sessionId).pairingError });
                return res.json({ success: true, code: currentCode });
            }
            if (++attempts > 30) {
                clearInterval(checkCode);
                res.status(500).json({ error: 'Timeout' });
            }
        }, 500);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reset', (req, res) => {
    const { sessionId = 'default' } = req.body;
    if (fs.existsSync(`auth_info_${sessionId}`)) {
        fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
    }
    const bState = getBotState(sessionId);
    bState.status = 'offline';
    setBotState(sessionId, {});
    
    let sock = activeSessions.get(sessionId);
    if (sock) {
        try { sock.ev.removeAllListeners(); sock.end(new Error('Reset')); } catch(e){}
        activeSessions.delete(sessionId);
    }
    setTimeout(() => connectToWhatsApp(sessionId), 2000);
    res.json({ success: true });
});

app.get('/api/config', (req, res) => {
    res.json(readDB());
});

app.post('/api/config', (req, res) => {
    const db = readDB();
    const newDb = { ...db, ...req.body };
    writeDB(newDb);
    res.json({ success: true });
});

// Plugin Manager APIs
app.get('/api/plugins', (req, res) => {
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
    res.json(files);
});

app.post('/api/plugins', (req, res) => {
    const { name, code } = req.body;
    fs.writeFileSync(path.join(pluginsDir, name.endsWith('.js') ? name : name + '.js'), code);
    res.json({ success: true });
});

app.delete('/api/plugins/:name', (req, res) => {
    const name = req.params.name;
    const p = path.join(pluginsDir, name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    res.json({ success: true });
});


// --- SHOP APIs ---
app.get('/api/shop/products', (req, res) => res.json(readDB().shop?.products || []));
app.post('/api/shop/products', (req, res) => {
    const db = readDB();
    if(!db.shop) db.shop = { products: [], customers: [] };
    if(!db.shop.products) db.shop.products = [];
    db.shop.products.push({ id: Date.now().toString(), ...req.body });
    writeDB(db);
    res.json({ success: true });
});
app.delete('/api/shop/products/:id', (req, res) => {
    const db = readDB();
    if(db.shop?.products) {
        db.shop.products = db.shop.products.filter(p => p.id !== req.params.id);
        writeDB(db);
    }
    res.json({ success: true });
});

app.get('/api/shop/customers', (req, res) => res.json(readDB().shop?.customers || []));

app.post('/api/shop/broadcast', async (req, res) => {
    const { sessionId = 'default', message, image } = req.body;
    const sock = activeSessions.get(sessionId);
    if (!sock) return res.status(400).json({ error: 'WhatsApp session not active' });
    
    const db = readDB();
    const customers = db.shop?.customers || [];
    let count = 0;
    
    for (let c of customers) {
        try {
            if (image) {
                const buffer = Buffer.from(image.split(',')[1], 'base64');
                await sock.sendMessage(c.jid, { image: buffer, caption: message });
            } else {
                await sock.sendMessage(c.jid, { text: message });
            }
            count++;
            await new Promise(resolve => setTimeout(resolve, 1500)); // Anti-ban delay
        } catch(e) { console.error(`Failed to broadcast to ${c.jid}`); }
    }
    res.json({ success: true, count });
});


app.post('/api/shop/pos-sync', async (req, res) => {
    const db = readDB();
    const posUrl = db.settings.posApiUrl || 'https://alphapos.zone.id/api/products';
    const posKey = db.settings.posApiKey || '';
    try {
        const response = await fetch(posUrl, {
            headers: posKey ? { 'Authorization': `Bearer ${posKey}`, 'Accept': 'application/json' } : { 'Accept': 'application/json' }
        });
        if(!response.ok) throw new Error(`HTTP Status ${response.status}`);
        const data = await response.json();
        
        let products = Array.isArray(data) ? data : (data.data || data.products || []);
        if (products.length > 0) {
            if(!db.shop) db.shop = { products: [], customers: [] };
            db.shop.products = products.map(p => ({
                id: p.id ? p.id.toString() : Date.now().toString() + Math.random(),
                name: p.name || p.title || p.product_name || 'Unknown',
                price: p.price || p.selling_price || '0',
                details: p.description || p.details || '',
                image: p.image || p.image_url || ''
            }));
            writeDB(db);
            res.json({ success: true, count: db.shop.products.length });
        } else {
            res.status(400).json({ error: 'No products array found in POS response' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const db = readDB();
    const adminPass = db.settings?.adminPassword || 'alpha123';
    if (password === adminPass) {
        res.json({ success: true, token: 'alpha_auth_success' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`💀 ALPHA MOBILE SERVER ACTIVE ON ${PORT}.`);
    connectToWhatsApp(); // boot default session automatically
});
