const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. Add GenAI and media downloader
code = code.replace(
    "const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');", 
    "const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');\nconst { GoogleGenAI } = require('@google/genai');"
);

// 2. Add Live Chat & AI Toggle APIs
const newApis = `
app.get('/api/chats', (req, res) => res.json(readDB().chats || {}));
app.post('/api/chat/send', async (req, res) => {
    const { to, text } = req.body;
    const sock = activeSessions.get('default');
    if (!sock) return res.status(400).json({error: 'Bot offline'});
    try {
        await sock.sendMessage(to, { text });
        const db = readDB();
        if(!db.chats) db.chats = {};
        if(!db.chats[to]) db.chats[to] = [];
        db.chats[to].push({ role: 'assistant', content: text, timestamp: Date.now(), isManual: true });
        writeDB(db);
        io.emit('live_message', { to, role: 'assistant', content: text, timestamp: Date.now(), isManual: true });
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});
app.post('/api/chat/toggle-ai', (req, res) => {
    const { jid, pause } = req.body;
    const db = readDB();
    if(!db.shop) db.shop = {customers:[]};
    if(!db.shop.customers) db.shop.customers = [];
    let cust = db.shop.customers.find(c => c.id === jid || c.jid === jid);
    if(!cust) { cust = { jid, pushName: jid.split('@')[0], date: new Date().toISOString() }; db.shop.customers.push(cust); }
    cust.aiPaused = pause;
    writeDB(db);
    res.json({ success: true, aiPaused: pause });
});
// End Live Chat APIs
`;

if (!code.includes('/api/chats')) {
    code = code.replace("app.get('/api/analytics'", newApis + "\napp.get('/api/analytics'");
}

// 3. Replace messages.upsert
const startMsg = "    sock.ev.on('messages.upsert', async (m) => {";
const endMsg = "    });\n}";
const startIndex = code.indexOf(startMsg);
const endIndex = code.indexOf(endMsg, startIndex) + "    });\n".length;

if (startIndex > -1 && endIndex > -1) {
    const newMsgHandler = `    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        const db = readDB();
        if (!db.shop) db.shop = { products: [], customers: [] };
        if (!db.shop.customers) db.shop.customers = [];
        const pushName = msg.pushName || "Unknown";
        
        let cust = db.shop.customers.find(c => c.jid === sender || c.id === sender);
        if (!cust) {
            cust = { jid: sender, id: sender, pushName, date: new Date().toISOString(), aiPaused: false };
            db.shop.customers.push(cust);
            writeDB(db);
            console.log(\`[CRM] New contact saved: \${pushName} (\${sender})\`);
        }

        // 1. Run custom dynamic plugins
        loadPlugins(sock, msg, 'default');

        // MULTI-MODAL: Image & Voice Recognition (Gemini)
        const hasMedia = msg.message.imageMessage || msg.message.audioMessage;
        if (hasMedia) {
            const geminiKey = db.settings.geminiKey;
            if (geminiKey) {
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', { }, { logger: console });
                    const ai = new GoogleGenAI({ apiKey: geminiKey });
                    const mime = msg.message.imageMessage ? msg.message.imageMessage.mimetype : msg.message.audioMessage.mimetype;
                    const mediaPart = { inlineData: { data: buffer.toString("base64"), mimeType: mime } };
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: [
                            { role: 'user', parts: [mediaPart, { text: "You are an AI assistant for a shop. Describe this image in detail or transcribe this audio exactly as it relates to a customer inquiry." }] }
                        ]
                    });
                    text += \` [MEDIA CONTENT: \${response.text}]\`;
                } catch (e) {
                    console.error("Gemini Media Error:", e.message);
                }
            } else {
                text += " [MEDIA ATTACHED - Ignore, Gemini Key not set]";
            }
        }

        if(!text.trim()) return;

        // Save Chat History & Emit Live Event
        if(!db.chats) db.chats = {};
        if(!db.chats[sender]) db.chats[sender] = [];
        db.chats[sender].push({ role: 'user', content: text, timestamp: Date.now() });
        writeDB(db);
        io.emit('live_message', { to: sender, role: 'user', content: text, timestamp: Date.now() });

        // Check if AI is manually paused
        if (cust.aiPaused) return;

        // Analytics tracking
        if(!db.analytics) db.analytics = { dailyMessages: {}, popularProducts: {}, totalSales: 0 };
        const today = new Date().toISOString().split('T')[0];
        db.analytics.dailyMessages[today] = (db.analytics.dailyMessages[today] || 0) + 1;
        writeDB(db);

        // 2. AI Reply logic
        if (db.settings.deepseekKey) {
            try {
                await sock.sendPresenceUpdate('composing', sender);
                
                let aiPrompt = db.settings.systemPrompt;
                if (db.shop.products && db.shop.products.length > 0) {
                    const catalog = db.shop.products.map(p => \`- \${p.name} (Price: \${p.price}): \${p.details}\`).join('\\n');
                    aiPrompt += \`\\n\\nAVAILABLE PRODUCTS:\\n\${catalog}\\n\\nUse this product information to answer customer queries.\`;
                }
                
                aiPrompt += "\\n\\nIMPORTANT INSTRUCTIONS:\\nIf the user is asking about bulk/wholesale purchasing, append [SEGMENT: WHOLESALE]. If they purchase high value items consistently, append [SEGMENT: VIP]. If they only ask questions and don't buy, append [SEGMENT: WINDOW_SHOPPER].";

                let aiReply = await askDeepSeek(aiPrompt, text);
                
                if (aiReply) {
                    // Check Segments
                    const segMatch = aiReply.match(/\\[SEGMENT:\\s*([A-Z_]+)\\]/i);
                    if (segMatch) {
                        aiReply = aiReply.replace(segMatch[0], '').trim();
                        cust.segment = segMatch[1];
                        writeDB(db);
                    }
                    
                    // Create Order Flow
                    const createMatch = aiReply.match(/\\[CREATE_ORDER:\\s*(.+?)\\s*\\|\\|\\s*(.+?)\\s*\\|\\|\\s*(.+?)\\]/i);
                    if (createMatch) {
                        aiReply = aiReply.replace(createMatch[0], '').trim();
                        const productName = createMatch[1].trim();
                        const customerName = createMatch[2].trim();
                        const customerAddress = createMatch[3].trim();
                        const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
                        
                        if(!db.shop.orders) db.shop.orders = [];
                        db.shop.orders.push({ id: orderId, customerJid: sender, customerName, customerAddress, productName, status: 'Processing', date: new Date().toISOString() });
                        if(!db.analytics) db.analytics = { dailyMessages: {}, popularProducts: {}, totalSales: 0 };
                        db.analytics.popularProducts[productName] = (db.analytics.popularProducts[productName] || 0) + 1;
                        db.analytics.totalSales = (db.analytics.totalSales || 0) + 1;
                        writeDB(db);

                        setTimeout(async () => {
                            await sock.sendMessage(sender, { text: aiReply || \`🎉 Order Confirmed! Your Order ID is *\${orderId}*.\` });
                            // PDF logic omitted for brevity in this specific patch to avoid large buffers unless requested
                        }, 100);
                    } else {
                        await sock.sendMessage(sender, { text: aiReply }, { quoted: msg });
                    }
                    
                    // Save Bot Reply & Emit Live Event
                    const freshDB = readDB();
                    if(!freshDB.chats) freshDB.chats = {};
                    if(!freshDB.chats[sender]) freshDB.chats[sender] = [];
                    freshDB.chats[sender].push({ role: 'assistant', content: aiReply, timestamp: Date.now() });
                    writeDB(freshDB);
                    io.emit('live_message', { to: sender, role: 'assistant', content: aiReply, timestamp: Date.now() });
                }
            } catch (err) {
                console.error("Failed to send AI message", err);
            }
        }
    });
`;
    
    code = code.substring(0, startIndex) + newMsgHandler + code.substring(endIndex);
    fs.writeFileSync('index.js', code);
    console.log("Patched Live Chat & Media processing successfully.");
} else {
    console.log("Could not find message upsert block.");
}
