const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldApi = `app.post('/api/shop/broadcast', async (req, res) => {
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
});`;

const newApi = `app.post('/api/shop/broadcast', async (req, res) => {
    const { message, image } = req.body;
    
    const db = readDB();
    const customers = db.shop?.customers || [];
    let count = 0;
    
    for (let c of customers) {
        // Smart Routing: Use the exact bot session the customer originally contacted
        const custSessionId = c.sessionId || 'default';
        const sock = activeSessions.get(custSessionId);
        
        if (sock) {
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
    }
    res.json({ success: true, count });
});`;

if (code.includes("app.post('/api/shop/broadcast'")) {
    code = code.replace(oldApi, newApi);
    fs.writeFileSync('index.js', code);
    console.log("Patched broadcast API");
}
