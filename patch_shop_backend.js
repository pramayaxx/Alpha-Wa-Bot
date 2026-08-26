const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.replace(
    `shop: {},`,
    `shop: { products: [], customers: [] },`
);

const oldUpsertStart = `        // 1. Run custom dynamic plugins
        loadPlugins(sock, msg, sessionId);

        // 2. AI Reply logic
        const db = readDB();
        if (db.settings.deepseekKey) {
            try {
                await sock.sendPresenceUpdate('composing', sender);
                const aiReply = await askDeepSeek(db.settings.systemPrompt, text);`;

const newUpsertStart = `        // 1. Run custom dynamic plugins
        loadPlugins(sock, msg, sessionId);

        const db = readDB();
        // AUTO-SAVE CUSTOMER CONTACT
        if (!db.shop) db.shop = { products: [], customers: [] };
        if (!db.shop.customers) db.shop.customers = [];
        const pushName = msg.pushName || "Unknown";
        if (!db.shop.customers.find(c => c.jid === sender)) {
            db.shop.customers.push({ jid: sender, pushName, date: new Date().toISOString() });
            writeDB(db);
            console.log(\`[CRM] New contact saved: \${pushName} (\${sender})\`);
        }

        // 2. AI Reply logic
        if (db.settings.deepseekKey) {
            try {
                await sock.sendPresenceUpdate('composing', sender);
                
                // INJECT PRODUCT CATALOG INTO AI KNOWLEDGE
                let aiPrompt = db.settings.systemPrompt;
                if (db.shop.products && db.shop.products.length > 0) {
                    const catalog = db.shop.products.map(p => \`- \${p.name} (Price: \${p.price}): \${p.details}\`).join('\\n');
                    aiPrompt += \`\\n\\nAVAILABLE PRODUCTS IN SHOP:\\n\${catalog}\\n\\nUse this product information to answer customer queries.\`;
                }

                const aiReply = await askDeepSeek(aiPrompt, text);`;

code = code.replace(oldUpsertStart, newUpsertStart);

const apiRoutes = `
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
        } catch(e) { console.error(\`Failed to broadcast to \${c.jid}\`); }
    }
    res.json({ success: true, count });
});
`;
code = code.replace(`app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));`, apiRoutes + `\napp.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));`);

fs.writeFileSync('index.js', code);
