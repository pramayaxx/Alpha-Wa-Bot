const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const pino = require('pino');
const { Server } = require('socket.io');
const PDFDocument = require('pdfkit');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, jidNormalizedUser, fetchLatestBaileysVersion, Browsers, downloadMediaMessage, delay } = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');
const { GoogleGenAI } = require('@google/genai');
const { File: MegaFile } = require('megajs');

// Ensure dist/index.html is built
const distIndexPath = path.join(__dirname, 'dist', 'index.html');
if (!fs.existsSync(distIndexPath)) {
    try {
        console.log('[BUILD] dist/index.html not found. Running vite build...');
        execSync('npx vite build', { stdio: 'inherit' });
    } catch (e) {
        console.error('[BUILD] Auto-build failed:', e.message);
    }
}

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
            settings: { sessions: ['default'], deepseekKey: '', systemPrompt: 'You are a professional WhatsApp Shop Assistant for \'Alpha Mobile\'. Be extremely polite. Handle customer queries about products seamlessly.', deviceWelcomeMsg: '🚀 *ALPHA SHOP & AI ACTIVE* 🚀\n\nYour WhatsApp is now successfully connected!\n\n👤 *Session ID:* {session_id}\n🤖 *AI Engine:* DeepSeek\n🛒 *Shop Systems:* Online\n✅ *Status:* Active & Secured\n\n_Powered by ALPHA MOBILE_' }, 
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
        sessionStates.set(sessionId, { status: 'offline', pairingCode: null, pairingError: null, qr: null, user: null });
    }
    return sessionStates.get(sessionId);
}

function setBotState(sessionId, updates) {
    const state = getBotState(sessionId);
    Object.assign(state, updates);
    io.emit(`bot_state_${sessionId}`, state);
}

function getSessionDeviceInfo(sessionId) {
    const state = getBotState(sessionId);
    let registeredPhone = null;
    let userName = null;
    let isRegistered = false;

    // Check disk creds
    const credsPath = path.join(__dirname, `auth_info_${sessionId}`, 'creds.json');
    if (fs.existsSync(credsPath)) {
        try {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (creds.me && creds.me.id) {
                registeredPhone = creds.me.id.split(':')[0].split('@')[0];
                userName = creds.me.name || creds.me.notify || 'WhatsApp User';
                isRegistered = true;
            } else if (creds.registered) {
                isRegistered = true;
            }
        } catch(e) {}
    }

    if (state.user && state.user.phone) {
        registeredPhone = state.user.phone;
        userName = state.user.name || userName;
    }

    const db = readDB();
    const savedDev = db.settings?.devices?.[sessionId];
    if (savedDev && !registeredPhone) {
        registeredPhone = savedDev.phone;
        userName = savedDev.name || userName;
    }

    return {
        sessionId,
        status: state.status,
        isOnline: state.status === 'online',
        isRegistered,
        phone: registeredPhone,
        name: userName,
        user: state.user || (registeredPhone ? { phone: registeredPhone, name: userName } : null),
        qr: state.qr,
        pairingCode: state.pairingCode,
        pairingError: state.pairingError
    };
}

// --- AI INTEGRATION (DEEPSEEK & GEMINI) ---
async function askDeepSeek(prompt, userMsg, sender) {
    const db = readDB();
    const apiKey = db.settings?.deepseekKey;
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
            return reply;
        }
        return null;
    } catch (err) {
        console.error("DeepSeek Error:", err.message);
        return null;
    }
}

async function askGemini(prompt, userMsg, sender, customKey) {
    const apiKey = customKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
        const ai = new GoogleGenAI({ apiKey });
        const db = readDB();
        const chatHistory = (db.chats && db.chats[sender]) ? db.chats[sender] : [];
        const contents = [
            { role: 'user', parts: [{ text: `System Instructions:\n${prompt}` }] },
            { role: 'model', parts: [{ text: "Understood. I will act as the Alpha Mobile WhatsApp Assistant." }] },
            ...chatHistory.slice(-6).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            { role: 'user', parts: [{ text: userMsg }] }
        ];
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents
        });
        return response.text;
    } catch (e) {
        console.error("Gemini AI Error:", e.message);
        return null;
    }
}

// --- SESSION ID RESTORATION HELPER ---
async function parseAndSaveSessionId(rawSessionId, targetSession = 'default') {
    if (!rawSessionId || typeof rawSessionId !== 'string') {
        throw new Error('Please enter a valid Session ID string.');
    }
    
    let text = rawSessionId.trim();
    let credsJson = null;

    // 1. Check direct JSON first
    if (text.startsWith('{') && text.endsWith('}')) {
        try {
            credsJson = JSON.parse(text);
        } catch(e) {}
    }

    // 2. Extract Pastebin / Paste.rs ID from prefixes like GlobalTechInfo/MEGA-MD_eRyqLeLT or MEGA-MD~eRyqLeLT
    if (!credsJson) {
        let cleanId = text
            .replace(/^GlobalTechInfo\//i, '')
            .replace(/^MEGA-MD[~_]/i, '')
            .replace(/^MEGA_MD[~_]/i, '')
            .replace(/^MEGA[~_]/i, '')
            .replace(/^SESSION[~_]/i, '')
            .replace(/^SHADOW[~_]/i, '')
            .replace(/^ALPHA[~_]/i, '')
            .trim();

        // If it's a short alphanumeric identifier (like eRyqLeLT), check Pastebin and paste.rs
        if (/^[a-zA-Z0-9_-]{4,30}$/.test(cleanId)) {
            const pasteUrls = [
                `https://pastebin.com/raw/${cleanId}`,
                `https://paste.rs/${cleanId}`,
                `https://rentry.co/${cleanId}/raw`
            ];

            for (const url of pasteUrls) {
                try {
                    console.log(`[SESSION-IMPORT] Checking paste URL: ${url}`);
                    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    if (res.ok) {
                        const rawBody = await res.text();
                        if (rawBody && rawBody.startsWith('{') && rawBody.includes('noiseKey')) {
                            credsJson = JSON.parse(rawBody);
                            console.log(`[SESSION-IMPORT] Successfully retrieved credentials from ${url}!`);
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`[SESSION-IMPORT] Paste trial failed for ${url}:`, e.message);
                }
            }
        }
    }

    // 3. Handle Mega.nz Session Format (e.g. GlobalTechInfo/MEGA-MD_eRyqLeLT#key or https://mega.nz/file/...)
    if (!credsJson && (
        text.includes('mega.nz') || 
        text.includes('#') ||
        text.includes('MEGA-MD') || 
        text.includes('GlobalTechInfo')
    )) {
        const megaUrlMatch = text.match(/https:\/\/mega\.nz\/file\/([a-zA-Z0-9_-]+)(?:#([a-zA-Z0-9_-]+))?/);
        const megaPrefixMatch = text.match(/(?:GlobalTechInfo\/)?MEGA-MD[~_]([a-zA-Z0-9_-]+)(?:[#_~]([a-zA-Z0-9_-]+))?/i);

        let fileId = '';
        let fileKey = '';

        if (megaUrlMatch) {
            fileId = megaUrlMatch[1];
            fileKey = megaUrlMatch[2] || '';
        } else if (megaPrefixMatch) {
            fileId = megaPrefixMatch[1];
            fileKey = megaPrefixMatch[2] || '';
        } else {
            let clean = text
                .replace(/^GlobalTechInfo\//i, '')
                .replace(/^MEGA-MD[~_]/i, '')
                .replace(/^MEGA_MD[~_]/i, '')
                .replace(/^MEGA[~_]/i, '')
                .trim();
            
            if (clean.includes('#')) {
                const parts = clean.split('#');
                fileId = parts[0].replace('https://mega.nz/file/', '');
                fileKey = parts[1];
            } else if (clean.includes('~')) {
                const parts = clean.split('~');
                fileId = parts[0];
                fileKey = parts[1];
            } else if (clean.includes('_') && clean.split('_').length === 2) {
                const parts = clean.split('_');
                fileId = parts[0];
                fileKey = parts[1];
            } else {
                fileId = clean;
            }
        }

        if (fileId && !fileKey) {
            const hashAnywhere = text.match(/#([a-zA-Z0-9_-]{8,})/);
            if (hashAnywhere) {
                fileKey = hashAnywhere[1];
            }
        }

        if (fileId && fileKey) {
            const possibleUrls = [
                `https://mega.nz/file/${fileId}#${fileKey}`,
                `https://mega.nz/file/${fileId}`
            ];

            for (const url of possibleUrls) {
                try {
                    console.log(`[MEGA-MD] Attempting download from Mega URL: ${url}`);
                    const file = MegaFile.fromURL(url);
                    const buffer = await file.downloadBuffer();
                    const content = buffer.toString('utf8');
                    try {
                        credsJson = JSON.parse(content);
                        if (credsJson) {
                            console.log(`[MEGA-MD] Successfully downloaded and parsed creds.json from Mega!`);
                            break;
                        }
                    } catch(e2) {
                        const decoded = Buffer.from(content.trim(), 'base64').toString('utf8');
                        credsJson = JSON.parse(decoded);
                        if (credsJson) break;
                    }
                } catch(err) {
                    console.log(`[MEGA-MD] Mega download trial failed (${url}):`, err.message);
                }
            }
        }
    }

    // 4. Base64 Decode
    if (!credsJson) {
        let b64Candidate = text;
        const base64PatternMatch = text.match(/(?:SHADOW~|ALPHA~|PRABATH~|SESSION~)?([A-Za-z0-9+/=_-]{100,})/);
        if (base64PatternMatch) {
            b64Candidate = base64PatternMatch[1];
        } else if (b64Candidate.includes('~')) {
            b64Candidate = b64Candidate.split('~').slice(1).join('~').trim();
        } else if (b64Candidate.includes(':::')) {
            b64Candidate = b64Candidate.split(':::')[1].trim();
        } else if (b64Candidate.startsWith('SESSION_') && b64Candidate.includes('_')) {
            b64Candidate = b64Candidate.substring(b64Candidate.indexOf('_') + 1).trim();
        }

        try {
            let normalizedBase64 = b64Candidate.replace(/-/g, '+').replace(/_/g, '/');
            while (normalizedBase64.length % 4 !== 0) {
                normalizedBase64 += '=';
            }
            const decoded = Buffer.from(normalizedBase64, 'base64').toString('utf8');
            credsJson = JSON.parse(decoded);
        } catch(e) {}
    }

    // 5. Remote URL Fetcher (Pastebin / Gist / RAW url)
    if (!credsJson && (text.startsWith('http://') || text.startsWith('https://'))) {
        try {
            const fetchRes = await fetch(text, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const bodyText = await fetchRes.text();
            try {
                credsJson = JSON.parse(bodyText);
            } catch(e2) {
                const decoded = Buffer.from(bodyText.trim(), 'base64').toString('utf8');
                credsJson = JSON.parse(decoded);
            }
        } catch(e) {}
    }

    if (!credsJson) {
        throw new Error('වලංගු නොවන Session ID එකකි. කරුණාකර ඔබගේ WhatsApp වෙත ලැබුණු සම්පූර්ණ Session ID කේතය හෝ සම්පූර්ණ පණිවිඩය Paste කරන්න.');
    }

    // Unwrap if wrapped in { creds: { ... } }
    if (credsJson && credsJson.creds && typeof credsJson.creds === 'object') {
        credsJson = credsJson.creds;
    }

    if (!credsJson || (!credsJson.noiseKey && !credsJson.signedIdentityKey && !credsJson.registrationId && !credsJson.me)) {
        throw new Error('Session ID does not contain valid WhatsApp credentials (missing noiseKey / identity keys).');
    }

    const sessionDir = path.join(__dirname, `auth_info_${targetSession}`);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const credsPath = path.join(sessionDir, 'creds.json');
    fs.writeFileSync(credsPath, JSON.stringify(credsJson, null, 2), 'utf8');

    // Close any previous socket cleanly
    let prevSock = activeSessions.get(targetSession);
    if (prevSock) {
        prevSock.isExplicitClosed = true;
        try {
            prevSock.ev.removeAllListeners();
            prevSock.ws?.close();
            prevSock.end(new Error('Reloading with Session ID'));
        } catch(e) {}
        activeSessions.delete(targetSession);
    }

    setBotState(targetSession, { 
        status: 'connecting', 
        qr: null, 
        pairingCode: null, 
        pairingError: null 
    });

    setTimeout(() => connectToWhatsApp(targetSession), 800);

    return {
        success: true,
        sessionId: targetSession,
        registeredPhone: credsJson.me?.id ? credsJson.me.id.split(':')[0].split('@')[0] : null,
        userName: credsJson.me?.name || credsJson.me?.notify || null
    };
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
async function connectToWhatsApp(sessionId = 'default') {
    try {
        const credsPath = path.join(__dirname, `auth_info_${sessionId}`, 'creds.json');
        const hasCreds = fs.existsSync(credsPath);

        if (!hasCreds) {
            console.log(`[WA] Session "${sessionId}" is waiting for Session ID input.`);
            setBotState(sessionId, { 
                status: 'offline', 
                qr: null, 
                pairingCode: null, 
                pairingError: null,
                user: null 
            });
            return;
        }

        const { state, saveCreds } = await useMultiFileAuthState(`auth_info_${sessionId}`);
        const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1043857760], isLatest: true }));
        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.windows('Firefox'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => {
                return { conversation: '' };
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: undefined,
        });

        sock.sessionId = sessionId;
        activeSessions.set(sessionId, sock);

        sock.ev.on('connection.update', async (update) => {
            if (activeSessions.get(sessionId) !== sock) return;
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                if (activeSessions.get(sessionId) !== sock) return;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log(`[WA] Session "${sessionId}" connection closed. Status code: ${statusCode}`);
                
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;
                const shouldReconnect = !isLoggedOut && !sock.isExplicitClosed;
                
                activeSessions.delete(sessionId);

                if (shouldReconnect) {
                    const currentCredsPath = path.join(__dirname, `auth_info_${sessionId}`, 'creds.json');
                    if (fs.existsSync(currentCredsPath)) {
                        setBotState(sessionId, { 
                            status: 'connecting',
                            pairingError: null
                        });
                        setTimeout(() => connectToWhatsApp(sessionId), 2500);
                    } else {
                        setBotState(sessionId, { status: 'offline', qr: null, pairingCode: null, user: null });
                    }
                } else {
                    if (isLoggedOut && fs.existsSync(`auth_info_${sessionId}`)) {
                        fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
                    }
                    setBotState(sessionId, { status: 'offline', qr: null, pairingCode: null, user: null });
                }
            } else if (connection === 'open') {
                const userPhone = sock.user?.id ? sock.user.id.split(':')[0].split('@')[0] : '';
                const userName = sock.user?.name || sock.user?.notify || 'WhatsApp User';
                const userJid = sock.user?.id ? jidNormalizedUser(sock.user.id) : '';

                console.log(`[WA] Connected successfully for ${sessionId}! Phone: ${userPhone}, Name: ${userName}`);

                setBotState(sessionId, { 
                    status: 'online', 
                    qr: null, 
                    pairingCode: null, 
                    pairingError: null,
                    user: {
                        id: userJid,
                        phone: userPhone,
                        name: userName
                    }
                });
                
                const db = readDB();
                if (!db.settings) db.settings = {};
                if (!db.settings.devices) db.settings.devices = {};
                db.settings.devices[sessionId] = {
                    sessionId,
                    phone: userPhone,
                    name: userName,
                    jid: userJid,
                    connectedAt: new Date().toISOString()
                };
                writeDB(db);

                let welcomeMsg = db.settings?.deviceWelcomeMsg || `🚀 *ALPHA SHOP & AI ACTIVE* 🚀\n\nYour WhatsApp is now successfully connected!\n\n👤 *Session ID:* {session_id}\n📱 *Phone:* {phone}\n🤖 *AI Engine:* DeepSeek\n🛒 *Shop Systems:* Online\n✅ *Status:* Active & Secured\n\n_Powered by ALPHA MOBILE_`;
                welcomeMsg = welcomeMsg.replace('{session_id}', sessionId).replace('{phone}', '+' + userPhone);

                try {
                    await sock.sendMessage(userJid, { text: welcomeMsg });
                    console.log(`[SYSTEM] Welcome message sent to ${userJid}`);
                } catch (err) {
                    console.error('[SYSTEM] Failed to send welcome message', err.message);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
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
            cust = { jid: sender, id: sender, pushName, date: new Date().toISOString(), aiPaused: false, sessionId };
            db.shop.customers.push(cust);
            writeDB(db);
            console.log(`[CRM] New contact saved: ${pushName} (${sender})`);
        }

        // 1. Run custom dynamic plugins
        loadPlugins(sock, msg, sessionId);

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
                    text += ` [MEDIA CONTENT: ${response.text}]`;
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

        // Check Working Hours
        if (db.settings.enableWorkHours && db.settings.workHourStart && db.settings.workHourEnd) {
            const now = new Date();
            // Convert to Sri Lanka Time (UTC+5:30)
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const slTime = new Date(utc + (3600000 * 5.5));
            const currentTime = slTime.getHours() * 60 + slTime.getMinutes();
            const [startH, startM] = db.settings.workHourStart.split(':').map(Number);
            const [endH, endM] = db.settings.workHourEnd.split(':').map(Number);
            const startTime = startH * 60 + startM;
            const endTime = endH * 60 + endM;
            
            let isWorkingHour = false;
            if (startTime <= endTime) {
                isWorkingHour = (currentTime >= startTime && currentTime <= endTime);
            } else {
                // cross midnight
                isWorkingHour = (currentTime >= startTime || currentTime <= endTime);
            }
            
            if (!isWorkingHour) {
                console.log(`[AI] Skipped response for ${sender} (Outside working hours)`);
                return; // Stop processing further AI/Live Chat logic
            }
        }

        // 2. AI Reply logic
        try {
            await sock.sendPresenceUpdate('composing', sender);
            
            let aiPrompt = db.settings?.systemPrompt || "You are a helpful assistant for Alpha Mobile.";
            if (db.shop?.products && db.shop.products.length > 0) {
                const catalog = db.shop.products.map(p => `- ${p.name} (Price: ${p.price}): ${p.details || 'Available'}`).join('\n');
                aiPrompt += `\n\nAVAILABLE PRODUCTS:\n${catalog}\n\nUse this product information to answer customer queries.`;
            }
            
            aiPrompt += "\n\nIMPORTANT INSTRUCTIONS:\nIf the user is asking about bulk/wholesale purchasing, append [SEGMENT: WHOLESALE]. If they purchase high value items consistently, append [SEGMENT: VIP]. If they only ask questions and don't buy, append [SEGMENT: WINDOW_SHOPPER].\n\n[MULTI-LANGUAGE ENGINE ACTIVE]:\n1. You must auto-detect the user's language (Sinhala, Singlish, Tamil, or English).\n2. You MUST reply in the EXACT SAME LANGUAGE and dialect they used.\n3. If they type in Singlish (Sinhala words in English alphabet), you MUST reply in natural Singlish.\n4. If they type in Sinhala Unicode or Tamil, reply in the exact same script.\n5. Always mirror their linguistic style naturally.";

            let aiReply = null;
            if (db.settings?.deepseekKey) {
                aiReply = await askDeepSeek(aiPrompt, text, sender);
            } else if (db.settings?.geminiKey || process.env.GEMINI_API_KEY) {
                aiReply = await askGemini(aiPrompt, text, sender, db.settings?.geminiKey);
            } else {
                // Built-in intelligent fallback when API keys are not yet added
                const lower = text.toLowerCase().trim();
                if (lower === '.ping' || lower === 'ping') {
                    aiReply = '🏓 Pong! Alpha Mobile Bot is active & online.';
                } else if (lower.includes('product') || lower.includes('item') || lower.includes('phone') || lower.includes('catalog') || lower.includes('price') || lower.includes('badu')) {
                    if (db.shop?.products && db.shop.products.length > 0) {
                        const productList = db.shop.products.map((p, i) => `${i + 1}. *${p.name}* - ${p.price}\n   ${p.details || ''}`).join('\n\n');
                        aiReply = `📱 *ALPHA MOBILE PRODUCTS*\n\n${productList}\n\nTo place an order, reply with the product name, your full name, delivery address, and contact number!`;
                    } else {
                        aiReply = `👋 Hello ${pushName}! Welcome to *Alpha Mobile*.\n\nOur product catalog is currently being updated. How can we help you today?`;
                    }
                } else if (lower.startsWith('order') || lower.includes('ord-')) {
                    const match = text.match(/ORD-\d+/i);
                    if (match && db.shop?.orders) {
                        const found = db.shop.orders.find(o => o.id.toLowerCase() === match[0].toLowerCase());
                        if (found) {
                            aiReply = `📦 *Order Status for #${found.id}*\n\n• *Product:* ${found.productName}\n• *Customer:* ${found.customerName}\n• *Status:* ${found.status}\n• *Date:* ${new Date(found.date).toLocaleString()}`;
                        } else {
                            aiReply = `⚠️ Order *${match[0]}* was not found in our system. Please check the ID and try again.`;
                        }
                    } else {
                        aiReply = `👋 To check your order status, please provide your Order ID (e.g. ORD-1234).\n\nTo place a new order, reply with the product name, your full name, delivery address, and phone number!`;
                    }
                } else {
                    aiReply = `👋 Hello *${pushName}*! Welcome to *Alpha Mobile*.\n\nHow can we help you today? You can ask about our products, prices, or check your orders!\n\n_Type *products* to see our available items._`;
                }
            }
            
            if (aiReply) {
                // Check Segments
                const segMatch = aiReply.match(/\[SEGMENT:\s*([A-Z_]+)\]/i);
                if (segMatch) {
                    aiReply = aiReply.replace(segMatch[0], '').trim();
                    cust.segment = segMatch[1];
                    writeDB(db);
                }

                // Check Order Status Lookup tag [CHECK_ORDER: ORD-XXXX]
                const checkMatch = aiReply.match(/\[CHECK_ORDER:\s*(.+?)\]/i);
                if (checkMatch) {
                    const targetId = checkMatch[1].trim();
                    aiReply = aiReply.replace(checkMatch[0], '').trim();
                    const existingOrder = db.shop?.orders?.find(o => o.id.toLowerCase() === targetId.toLowerCase());
                    if (existingOrder) {
                        aiReply += `\n\n📦 *Order Status for #${existingOrder.id}*:\n• *Product:* ${existingOrder.productName}\n• *Status:* ${existingOrder.status}`;
                    } else {
                        aiReply += `\n\n⚠️ Order *${targetId}* was not found in our records.`;
                    }
                }
                
                // Create Order Flow
                const createMatch = aiReply.match(/\[CREATE_ORDER:\s*(.+?)\s*\|\|\s*(.+?)\s*\|\|\s*(.+?)(?:\s*\|\|\s*(.+?))?\]/i);
                if (createMatch) {
                    aiReply = aiReply.replace(createMatch[0], '').trim();
                    const productName = createMatch[1].trim();
                    const customerName = createMatch[2].trim();
                    const customerAddress = createMatch[3].trim();
                    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
                    
                    if(!db.shop.orders) db.shop.orders = [];
                    const contactNumber = createMatch[4] ? createMatch[4].trim() : sender.split('@')[0];
                    db.shop.orders.push({ id: orderId, customerJid: sender, customerName, customerAddress, contactNumber, productName, status: 'Processing', date: new Date().toISOString() });
                    if(!db.analytics) db.analytics = { dailyMessages: {}, popularProducts: {}, totalSales: 0 };
                    db.analytics.popularProducts[productName] = (db.analytics.popularProducts[productName] || 0) + 1;
                    db.analytics.totalSales = (db.analytics.totalSales || 0) + 1;
                    writeDB(db);

                    // Generate Invoice PDF
                    const pdfPath = path.join(__dirname, orderId + '.pdf');
                    const doc = new PDFDocument();
                    doc.pipe(fs.createWriteStream(pdfPath));
                    doc.fontSize(25).text('ALPHA MOBILE INVOICE', { align: 'center' });
                    doc.moveDown();
                    doc.fontSize(14).text(`Order ID: ${orderId}`);
                    doc.text(`Date: ${new Date().toLocaleString()}`);
                    doc.moveDown();
                    doc.text(`Customer Name: ${customerName}`);
                    doc.text(`Contact Number: ${contactNumber}`);
                    doc.text(`Delivery Address: ${customerAddress}`);
                    doc.moveDown();
                    doc.text(`Product: ${productName}`);
                    doc.text(`Status: Processing`);
                    doc.moveDown(2);
                    doc.text('Thank you for shopping with Alpha Mobile!', { align: 'center' });
                    doc.end();

                    setTimeout(async () => {
                        await sock.sendMessage(sender, { text: aiReply || `🎉 Order Confirmed! Your Order ID is *${orderId}*.` });
                        try {
                            await sock.sendMessage(sender, { document: fs.readFileSync(pdfPath), mimetype: 'application/pdf', fileName: `Invoice-${orderId}.pdf` });
                            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
                        } catch(e) { console.error("PDF Send Error:", e); }
                    }, 1500);
                } else {
                    // Format Options / Buttons cleanly for WhatsApp
                    const optMatch = aiReply.match(/\[OPTIONS:\s*(.+?)\]/i);
                    if (optMatch) {
                        const rawOptions = optMatch[1].split(',').map(o => o.trim()).filter(Boolean);
                        aiReply = aiReply.replace(optMatch[0], '').trim();
                        if (rawOptions.length > 0) {
                            aiReply += '\n\n*Options:*\n' + rawOptions.map(o => `▫️ ${o}`).join('\n');
                        }
                    }
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
    });
    } catch (err) {
        console.error(`[WA] connectToWhatsApp failed for ${sessionId}:`, err.message);
        setBotState(sessionId, { status: 'offline', pairingError: err.message });
    }
}

// --- API ROUTES ---

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
    if (fs.existsSync(`auth_info_${sessionId}`)) fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
    res.json({success: true, sessions: db.settings.sessions});
});
app.get('/api/state', (req, res) => {
    const sessionId = req.query.sessionId || 'default';
    const devInfo = getSessionDeviceInfo(sessionId);
    res.json({
        ...getBotState(sessionId),
        registeredPhone: devInfo.phone,
        userName: devInfo.name,
        isRegistered: devInfo.isRegistered
    });
});

app.get('/api/devices', (req, res) => {
    const db = readDB();
    const sessionList = db.settings.sessions || ['default'];
    const devices = sessionList.map(s => getSessionDeviceInfo(s));
    res.json(devices);
});

app.post('/api/send-test', async (req, res) => {
    try {
        const { sessionId = 'default', targetPhone, message } = req.body;
        const sock = activeSessions.get(sessionId);
        if (!sock) {
            return res.status(400).json({ error: 'WhatsApp session is not active or connected.' });
        }
        
        let jid = targetPhone;
        if (!jid) {
            if (sock.user && sock.user.id) {
                jid = jidNormalizedUser(sock.user.id);
            } else {
                return res.status(400).json({ error: 'No target phone number specified.' });
            }
        } else {
            let clean = targetPhone.replace(/[^0-9]/g, '');
            if (clean.startsWith('00')) clean = clean.substring(2);
            if (clean.startsWith('0')) clean = '94' + clean.substring(1);
            else if (clean.length === 9 && clean.startsWith('7')) clean = '94' + clean;
            jid = clean + '@s.whatsapp.net';
        }

        const testText = message || `⚡ *ALPHA MOBILE TEST NOTIFICATION* ⚡\n\n✅ Your WhatsApp connection is live, verified, and operational!\n\n🕒 *Time:* ${new Date().toLocaleTimeString()}\n👤 *Session:* ${sessionId}\n🤖 *AI Engine:* Ready`;
        await sock.sendMessage(jid, { text: testText });
        res.json({ success: true, target: jid });
    } catch (err) {
        console.error('Test message send error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/pair', async (req, res) => {
    try {
        const { phone, sessionId = 'default' } = req.body;
        const bState = getBotState(sessionId);
        if (bState.status === 'online') return res.status(400).json({ error: 'Already connected.' });
        
        let cleanNumber = phone ? phone.replace(/[^0-9]/g, '') : '';
        if (cleanNumber.startsWith('00')) cleanNumber = cleanNumber.substring(2);
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '94' + cleanNumber.substring(1);
        } else if (cleanNumber.length === 9 && cleanNumber.startsWith('7')) {
            cleanNumber = '94' + cleanNumber;
        }

        if (!cleanNumber || cleanNumber.length < 8) {
            return res.status(400).json({ error: 'Please enter a valid phone number with country code.' });
        }
        
        setBotState(sessionId, { pairingCode: 'GENERATING...', qr: null, pairingError: null, pairedPhone: cleanNumber, status: 'connecting' });
        
        let sock = activeSessions.get(sessionId);
        if (sock) {
            sock.isExplicitClosed = true;
            try { sock.ev.removeAllListeners(); sock.ws?.close(); } catch(e){}
            activeSessions.delete(sessionId);
        }
        
        if (fs.existsSync(`auth_info_${sessionId}`)) fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
        
        setTimeout(() => connectToWhatsApp(sessionId, cleanNumber), 600);
        
        let attempts = 0;
        const checkCode = setInterval(() => {
            const currentCode = getBotState(sessionId).pairingCode;
            if (currentCode && currentCode !== 'GENERATING...') {
                clearInterval(checkCode);
                if (currentCode === 'ERROR') return res.status(500).json({ error: getBotState(sessionId).pairingError || 'Pairing error' });
                return res.json({ success: true, code: currentCode, phoneNumber: cleanNumber });
            }
            if (++attempts > 30) {
                clearInterval(checkCode);
                res.status(500).json({ error: 'Timeout waiting for pairing code from WhatsApp' });
            }
        }, 500);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', async (req, res) => {
    const { sessionId = 'default' } = req.body;
    if (fs.existsSync(`auth_info_${sessionId}`)) {
        fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
    }
    setBotState(sessionId, { status: 'offline', qr: null, pairingCode: null, pairingError: null });
    
    let sock = activeSessions.get(sessionId);
    if (sock) {
        sock.isExplicitClosed = true;
        try { 
            sock.ev.removeAllListeners(); 
            await sock.logout().catch(() => {});
            sock.end(new Error('Logged out')); 
        } catch(e){}
        activeSessions.delete(sessionId);
    }
    setTimeout(() => connectToWhatsApp(sessionId), 1500);
    res.json({ success: true });
});

app.post('/api/qr/refresh', (req, res) => {
    const { sessionId = 'default' } = req.body;
    let sock = activeSessions.get(sessionId);
    if (sock) {
        sock.isExplicitClosed = true;
        try { sock.ev.removeAllListeners(); sock.end(new Error('Refresh QR')); } catch(e){}
        activeSessions.delete(sessionId);
    }
    if (fs.existsSync(`auth_info_${sessionId}`)) {
        fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
    }
    setBotState(sessionId, { status: 'connecting', qr: null, pairingCode: null, pairingError: null });
    setTimeout(() => connectToWhatsApp(sessionId), 800);
    res.json({ success: true });
});

app.post('/api/session-id/import', async (req, res) => {
    try {
        const { sessionId = 'default', sessionData } = req.body;
        if (!sessionData || !sessionData.trim()) {
            return res.status(400).json({ error: 'Please enter or paste your WhatsApp Session ID.' });
        }
        const result = await parseAndSaveSessionId(sessionData, sessionId);
        res.json(result);
    } catch(err) {
        console.error('Session ID Import Error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/session-id/export', (req, res) => {
    const { sessionId = 'default' } = req.query;
    const credsPath = path.join(__dirname, `auth_info_${sessionId}`, 'creds.json');
    if (!fs.existsSync(credsPath)) {
        return res.status(404).json({ error: 'No active credentials found for this session.' });
    }
    try {
        const data = fs.readFileSync(credsPath, 'utf8');
        const b64 = Buffer.from(data).toString('base64');
        const sessionIdString = `SHADOW~${b64}`;
        res.json({ success: true, sessionId: sessionIdString, rawBase64: b64 });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/reset', (req, res) => {
    const { sessionId = 'default' } = req.body;
    if (fs.existsSync(`auth_info_${sessionId}`)) {
        fs.rmSync(`auth_info_${sessionId}`, { recursive: true, force: true });
    }
    setBotState(sessionId, { status: 'offline', qr: null, pairingCode: null, pairingError: null });
    
    let sock = activeSessions.get(sessionId);
    if (sock) {
        sock.isExplicitClosed = true;
        try { sock.ev.removeAllListeners(); sock.end(new Error('Reset')); } catch(e){}
        activeSessions.delete(sessionId);
    }
    setTimeout(() => connectToWhatsApp(sessionId), 1200);
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

app.post('/api/settings', (req, res) => {
    const db = readDB();
    db.settings = { ...(db.settings || {}), ...req.body };
    writeDB(db);
    res.json({ success: true, settings: db.settings });
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


app.get('/api/chats', (req, res) => res.json(readDB().chats || {}));
app.post('/api/chat/send', async (req, res) => {
    const { to, text, sessionId = 'default' } = req.body;
    const db = readDB();
    const cust = db.shop?.customers?.find(c => c.jid === to || c.id === to);
    const targetSession = cust?.sessionId || sessionId;
    const sock = activeSessions.get(targetSession) || Array.from(activeSessions.values())[0];
    if (!sock) return res.status(400).json({error: 'Bot offline'});
    try {
        await sock.sendMessage(to, { text });
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

app.get('/api/analytics', (req, res) => res.json(readDB().analytics || {}));
app.get('/api/shop/orders', (req, res) => res.json(readDB().shop?.orders || []));
app.put('/api/shop/orders/:id', (req, res) => {
    const db = readDB();
    if(!db.shop) db.shop = { products: [], customers: [], orders: [] };
    if(!db.shop.orders) db.shop.orders = [];
    const order = db.shop.orders.find(o => o.id === req.params.id);
    if(order) {
        order.status = req.body.status;
        writeDB(db);
        // Notify customer via WhatsApp
        const sock = activeSessions.get('default'); // simplistic handling for now
        if(sock && order.customerJid) {
            sock.sendMessage(order.customerJid, { text: `📦 *Order Update*\n\nYour order *#${order.id}* is now: *${order.status}*` }).catch(console.error);
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});
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
            } catch(e) { console.error(`Failed to broadcast to ${c.jid}`); }
        }
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
    const adminPass = db.settings?.adminPassword ?? 'alpha123';
    if (password === adminPass) {
        res.json({ success: true, token: 'alpha_auth_success' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    try {
        execSync('npx vite build', { stdio: 'inherit' });
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    } catch (e) {
        console.error('[BUILD] Fallback build failed:', e.message);
    }
    res.status(503).send('<html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>Building application assets...</h2><p>Please refresh in 5 seconds.</p><script>setTimeout(()=>location.reload(), 3000);</script></body></html>');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`💀 ALPHA MOBILE SERVER ACTIVE ON ${PORT}.`);
    const db = readDB(); (db.settings.sessions || ['default']).forEach(s => connectToWhatsApp(s));
});

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    console.log('Caught exception: ', err);
});
