const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. UPDATE DEEPSEEK FUNCTION FOR 24H MEMORY
const oldAskDeepSeek = `async function askDeepSeek(prompt, userMsg) {
    const db = readDB();
    const apiKey = db.settings.deepseekKey;
    if (!apiKey) return null;
    
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: userMsg }
                ]
            }),
            headers: { 'Authorization': \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        }
        return null;
    } catch (err) {
        console.error("DeepSeek Error:", err.message);
        return null;
    }
}`;

const newAskDeepSeek = `async function askDeepSeek(prompt, userMsg, sender) {
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
            headers: { 'Authorization': \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' }
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
}`;
code = code.replace(oldAskDeepSeek, newAskDeepSeek);

// Update call to askDeepSeek
code = code.replace('let aiReply = await askDeepSeek(aiPrompt, text);', 'let aiReply = await askDeepSeek(aiPrompt, text, sender);');

// 2. ADD POS SYNC ROUTE
const posRoute = `
app.post('/api/shop/pos-sync', async (req, res) => {
    const db = readDB();
    const posUrl = db.settings.posApiUrl || 'https://alphapos.zone.id/api/products';
    const posKey = db.settings.posApiKey || '';
    try {
        const response = await fetch(posUrl, {
            headers: posKey ? { 'Authorization': \`Bearer \${posKey}\`, 'Accept': 'application/json' } : { 'Accept': 'application/json' }
        });
        if(!response.ok) throw new Error(\`HTTP Status \${response.status}\`);
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
`;
code = code.replace(`app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));`, posRoute + `\napp.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));`);

fs.writeFileSync('index.js', code);
