const fs = require('fs');
const { execSync } = require('child_process');
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const PDFDocument = require('pdfkit');
require('dotenv').config();

// Auto-install dependencies if missing
if (!fs.existsSync('./node_modules')) {
    execSync('npm install', { stdio: 'inherit' });
}
// Build UI if missing
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    execSync('npm run build:ui', { stdio: 'inherit' });
}

// Make sure directories exist
['media', 'invoices', 'data'].forEach(d => { if(!fs.existsSync(d)) fs.mkdirSync(d); });

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

let globalSock = null;
let botState = {
    status: 'offline',
    qr: null,
    pairingCode: null
};

// --- DATA HELPERS ---
const dataFile = (name) => path.join(__dirname, 'data', `${name}.json`);
const readData = (name, defaultVal) => {
    if (fs.existsSync(dataFile(name))) {
        try {
            const content = fs.readFileSync(dataFile(name), 'utf8');
            return content.trim() ? JSON.parse(content) : defaultVal;
        } catch (e) {
            console.error(`💀 Error parsing ${name}.json. Resetting to default.`);
            return defaultVal;
        }
    }
    return defaultVal;
};
const writeData = (name, data) => fs.writeFileSync(dataFile(name), JSON.stringify(data, null, 2));

// Initialize default files if missing
if (!fs.existsSync(dataFile('shop_info'))) writeData('shop_info', {
    shopName: "Shadow Syndicate",
    welcomeMessage: "Welcome to ALPHA WA BOT! How can I assist you?",
    customInstruction: "Always answer politely.",
    keywords: { "location": "We are located at Cyber Nexus HQ.", "menu": "1. Catalog\n2. Order\n3. Support" }
});
if (!fs.existsSync(dataFile('contacts'))) writeData('contacts', []);
if (!fs.existsSync(dataFile('bot_settings'))) writeData('bot_settings', { mutedUsers: [] });
if (!fs.existsSync(dataFile('orders'))) writeData('orders', []);
if (!fs.existsSync(dataFile('history'))) writeData('history', {});
if (!fs.existsSync(dataFile('schedules'))) writeData('schedules', []);

// --- SOCKET.IO LIVE CHAT ---
io.on('connection', (socket) => {
    socket.emit('bot_state', botState);
    socket.emit('chat_history_full', readData('history', {}));
    
    socket.on('admin_send_msg', async (data) => {
        const { number, text } = data;
        if (globalSock && botState.status === 'online') {
            try {
                await globalSock.sendMessage(`${number}@s.whatsapp.net`, { text });
                
                // Mute bot automatically when admin intervenes
                let settings = readData('bot_settings', { mutedUsers: [] });
                if (!settings.mutedUsers.includes(number)) {
                    settings.mutedUsers.push(number);
                    writeData('bot_settings', settings);
                    io.emit('settings_update', settings);
                }

                // Log to history
                updateHistory(number, 'admin', text);
            } catch(e) { console.error('Socket Send Error:', e); }
        }
    });

    socket.on('toggle_mute', (number) => {
        let settings = readData('bot_settings', { mutedUsers: [] });
        if (settings.mutedUsers.includes(number)) {
            settings.mutedUsers = settings.mutedUsers.filter(n => n !== number);
        } else {
            settings.mutedUsers.push(number);
        }
        writeData('bot_settings', settings);
        io.emit('settings_update', settings);
    });
});

function updateHistory(number, role, content) {
    let historyMap = readData('history', {});
    if (!historyMap[number]) historyMap[number] = [];
    historyMap[number].push({ role, content, timestamp: new Date().toISOString() });
    
    // Keep only last 20 messages for context
    if (historyMap[number].length > 20) historyMap[number] = historyMap[number].slice(-20);
    
    writeData('history', historyMap);
    io.emit('new_message', { number, message: { role, content, timestamp: new Date().toISOString() } });
    return historyMap[number];
}

// --- API ENDPOINTS ---
app.get('/api/state', (req, res) => res.json(botState));
app.get('/api/contacts', (req, res) => res.json(readData('contacts', [])));
app.get('/api/shop', (req, res) => res.json(readData('shop_info', {})));
app.post('/api/shop', (req, res) => {
    writeData('shop_info', req.body);
    res.json({ success: true, message: 'Settings updated.' });
});
app.get('/api/settings', (req, res) => res.json(readData('bot_settings', { mutedUsers: [] })));
app.get('/api/orders', (req, res) => res.json(readData('orders', [])));
app.get('/api/schedules', (req, res) => res.json(readData('schedules', [])));

app.post('/api/schedules', (req, res) => {
    const { time, message } = req.body;
    let schedules = readData('schedules', []);
    schedules.push({ id: Date.now(), time, message, status: 'pending' });
    writeData('schedules', schedules);
    setupCrons();
    res.json({ success: true, schedules });
});

app.post('/api/broadcast', async (req, res) => {
    const { message } = req.body;
    if(!globalSock || botState.status !== 'online') return res.status(500).json({ error: "💀 Bot is offline." });
    
    try {
        let contacts = readData('contacts', []);
        let sent = 0;
        for (let c of contacts) {
            try {
                await globalSock.sendMessage(c.number + '@s.whatsapp.net', { text: message });
                sent++;
            } catch(err) {}
        }
        res.json({ success: true, sent });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pair', async (req, res) => {
    try {
        const { phone } = req.body;
        if (botState.status === 'online') return res.status(400).json({ error: '💀 Bot is already online.' });
        const cleanNumber = phone.replace(/[^0-9]/g, '');
        if (!cleanNumber) return res.status(400).json({ error: '💀 Invalid phone number.' });
        
        if (globalSock) {
            globalSock.ev.removeAllListeners();
            try { globalSock.ws.close(); } catch(e){}
        }
        
        // DANGER ZONE: Wipe old corrupted sessions to ensure fresh crypto keys
        if (fs.existsSync('auth_info_baileys')) {
            fs.rmSync('auth_info_baileys', { recursive: true, force: true });
        }

        await new Promise(r => setTimeout(r, 1000));
        connectToWhatsApp(cleanNumber);
        await new Promise(r => setTimeout(r, 3000));
        
        const code = await globalSock.requestPairingCode(cleanNumber);
        botState.pairingCode = code;
        res.json({ success: true, code });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

// --- CRON SCHEDULING ---
function setupCrons() {
    cron.getTasks().forEach(t => t.stop()); // clear old
    let schedules = readData('schedules', []);
    schedules.forEach(s => {
        if (s.status === 'pending') {
            cron.schedule(s.time, async () => {
                if(globalSock && botState.status === 'online') {
                    let contacts = readData('contacts', []);
                    for (let c of contacts) {
                        try { await globalSock.sendMessage(c.number + '@s.whatsapp.net', { text: s.message }); } catch(err) {}
                    }
                    s.status = 'completed';
                    writeData('schedules', schedules);
                    setupCrons();
                }
            });
        }
    });
}
setupCrons();

// --- WHATSAPP BOT CORE ---
async function connectToWhatsApp (pairingPhoneNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Mac OS', 'Chrome', '121.0.0.0'] // Updated to a stable desktop identifier
    });
    
    globalSock = sock;

    if (process.env.USE_PAIRING_CODE === 'true' && !sock.authState.creds.registered && !pairingPhoneNumber) {
        const phoneNumber = process.env.BOT_PHONE_NUMBER?.replace(/[^0-9]/g, '');
        if(phoneNumber) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    botState.pairingCode = code;
                } catch(e) {}
            }, 3000);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) botState.qr = qr;

        if(connection === 'close') {
            botState.status = 'offline';
            io.emit('bot_state', botState);
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) setTimeout(() => connectToWhatsApp(), 2000);
            else { botState.qr = null; botState.pairingCode = null; }
        } else if(connection === 'open') {
            botState.status = 'online';
            botState.qr = null;
            botState.pairingCode = null;
            io.emit('bot_state', botState);
            console.log('💀 ALPHA WA BOT IS ONLINE.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        if(from.endsWith('@g.us')) return; // Ignore groups

        const pushName = msg.pushName || 'Unknown User';
        const senderNumber = from.split('@')[0];
        const isNewContact = saveContact(senderNumber, pushName);
        
        let text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Media Handling
        if (msg.message.imageMessage || msg.message.audioMessage || msg.message.documentMessage) {
            try {
                const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                const ext = msg.message.imageMessage ? 'jpg' : msg.message.audioMessage ? 'ogg' : 'pdf';
                const filename = `${senderNumber}_${Date.now()}.${ext}`;
                fs.writeFileSync(path.join(__dirname, 'media', filename), buffer);
                text = `[MEDIA RECEIVED: ${ext.toUpperCase()}]`;
                await sock.sendMessage(from, { text: "💀 Media asset downloaded and secured to ALPHA server." });
            } catch(e) { console.error('Media download error'); }
        }

        // Live Chat Logging
        updateHistory(senderNumber, 'user', text);

        let shopInfo = readData('shop_info', {});
        
        if (isNewContact && shopInfo.welcomeMessage) {
            await sock.sendMessage(from, { text: shopInfo.welcomeMessage });
            updateHistory(senderNumber, 'bot', shopInfo.welcomeMessage);
        }

        // Check if Bot is Muted for this user
        let settings = readData('bot_settings', { mutedUsers: [] });
        if (settings.mutedUsers.includes(senderNumber)) {
            return; // Admin handles this chat, AI stays silent.
        }

        // Keyword Triggers (Rule-based)
        if (shopInfo.keywords && text && shopInfo.keywords[text.toLowerCase().trim()]) {
            const reply = shopInfo.keywords[text.toLowerCase().trim()];
            await sock.sendMessage(from, { text: reply });
            updateHistory(senderNumber, 'bot', reply);
            return;
        }

        // Payment & Order Management commands
        if (text.toLowerCase().startsWith('!order ')) {
            const item = text.substring(7);
            let orders = readData('orders', []);
            orders.push({ id: `ORD_${Date.now()}`, customer: senderNumber, item, status: 'Pending', date: new Date().toISOString() });
            writeData('orders', orders);
            const reply = `💀 Order registered for [${item}]. Send '!checkout' to finalize and generate invoice.`;
            await sock.sendMessage(from, { text: reply });
            updateHistory(senderNumber, 'bot', reply);
            return;
        }

        if (text.toLowerCase() === '!checkout') {
            let orders = readData('orders', []);
            let userOrders = orders.filter(o => o.customer === senderNumber && o.status === 'Pending');
            if (userOrders.length === 0) {
                await sock.sendMessage(from, { text: "💀 Cart is empty. Use '!order [item]' to add items." });
                return;
            }
            
            // Generate Invoice PDF
            const invName = `INV_${Date.now()}.pdf`;
            const invPath = path.join(__dirname, 'invoices', invName);
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(invPath));
            doc.fontSize(25).text('ALPHA SYNDICATE INVOICE', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text(`Customer Identity: ${senderNumber}`);
            doc.text(`Timestamp: ${new Date().toLocaleString()}`);
            doc.moveDown();
            doc.text('Items Ordered:');
            userOrders.forEach(o => doc.text(`- ${o.item}`));
            doc.moveDown();
            doc.text('TOTAL: Pending Admin Review');
            doc.end();

            userOrders.forEach(o => o.status = 'Invoiced');
            writeData('orders', orders);

            setTimeout(async () => {
                await sock.sendMessage(from, { 
                    document: { url: invPath }, 
                    mimetype: 'application/pdf', 
                    fileName: invName,
                    caption: "💀 Digital Invoice Generated."
                });
                updateHistory(senderNumber, 'bot', '[SENT PDF INVOICE]');
            }, 1500); // wait for pdf to write
            return;
        }

        // Interactive List fallback (Some phones drop real lists, so we use string menus)
        if (text.toLowerCase() === '!menu') {
            const listMenu = "💀 *ALPHA INTERACTIVE MENU* 💀\n\n1️⃣ View Catalog\n2️⃣ My Orders\n3️⃣ Support\n\n_Reply with a number to select._";
            await sock.sendMessage(from, { text: listMenu });
            updateHistory(senderNumber, 'bot', listMenu);
            return;
        }

        // DeepSeek AI Core with Context Injection
        if (text) {
            const aiResponse = await getAIResponse(senderNumber, text, shopInfo);
            await sock.sendMessage(from, { text: aiResponse });
            updateHistory(senderNumber, 'bot', aiResponse);
        }
    });
}

function saveContact(number, pushName) {
    let contacts = readData('contacts', []);
    let exist = contacts.find(c => c.number === number);
    if (!exist) {
        contacts.push({ number, pushName, tags: ['New'], timestamp: new Date().toISOString() });
        writeData('contacts', contacts);
        return true;
    }
    // Update pushName if it changed
    if (exist.pushName !== pushName) {
        exist.pushName = pushName;
        writeData('contacts', contacts);
    }
    return false;
}

async function getAIResponse(number, userMessage, shopInfo) {
    try {
        if(!process.env.DEEPSEEK_API_KEY) return '💀 DeepSeek API Key missing in environment payload.';
        
        let history = readData('history', {})[number] || [];
        // Map history to deepseek format (only last 5 messages for token saving)
        let messages = [
            { 
                role: 'system', 
                content: `You are an expert WhatsApp assistant for ${shopInfo.shopName || 'our store'}. 
                          Reply fluently in Sinhala or English depending on the user's language. 
                          Be professional and concise. Shop Details: ${JSON.stringify(shopInfo)}
                          ${shopInfo.customInstruction ? `\nCRITICAL SYSTEM INSTRUCTION: ${shopInfo.customInstruction}` : ''}` 
            }
        ];

        history.slice(-5).forEach(m => {
            if (m.role === 'user' || m.role === 'bot') {
                messages.push({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content });
            }
        });

        // Ensure last is user (we just pushed it in the upsert, so it's already there)

        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: 'deepseek-chat',
            messages: messages
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    } catch (e) {
        console.error('💀 DeepSeek Error:', e?.response?.data || e.message);
        return '💀 AI Core temporarily offline. Shadow Hacker protocol engaging repair...';
    }
}

// IGNITION
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`💀 Alpha Nexus server active on port ${PORT}.`));
connectToWhatsApp();
