const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. Add deviceWelcomeMsg to default DB
code = code.replace(
    "settings: { deepseekKey: '', systemPrompt: 'You are a professional WhatsApp Shop Assistant. Be extremely polite. Handle customer queries about products seamlessly.' },",
    "settings: { deepseekKey: '', systemPrompt: 'You are a professional WhatsApp Shop Assistant. Be extremely polite. Handle customer queries about products seamlessly.', deviceWelcomeMsg: '🚀 *ALPHA SHOP & AI ACTIVE* 🚀\\n\\nYour WhatsApp is now successfully connected!\\n\\n👤 *Session ID:* {session_id}\\n🤖 *AI Engine:* DeepSeek\\n🛒 *Shop Systems:* Online\\n✅ *Status:* Active & Secured\\n\\n_Powered by CAT SHADOW_' },"
);

// 2. Update the connection welcome logic
const oldConnectionLogic = `            getBotState(sessionId).pairingCode = null;
            setBotState(sessionId, {});
            
            const welcomeMsg = \`🚀 *ALPHA SHOP & AI ACTIVE* 🚀\\n\\nYour WhatsApp is now successfully connected!\\n\\n👤 *Session ID:* \${sessionId}\\n🤖 *AI Engine:* DeepSeek\\n🛒 *Shop Systems:* Online\\n✅ *Status:* Active & Secured\\n\\n_Powered by CAT SHADOW_\`;
            try {
                const myJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(myJid, { text: welcomeMsg });`;

const newConnectionLogic = `            getBotState(sessionId).pairingCode = null;
            setBotState(sessionId, {});
            
            const db = readDB();
            let welcomeMsg = db.settings?.deviceWelcomeMsg || \`🚀 *ALPHA SHOP & AI ACTIVE* 🚀\\n\\nYour WhatsApp is now successfully connected!\\n\\n👤 *Session ID:* {session_id}\\n🤖 *AI Engine:* DeepSeek\\n🛒 *Shop Systems:* Online\\n✅ *Status:* Active & Secured\\n\\n_Powered by CAT SHADOW_\`;
            welcomeMsg = welcomeMsg.replace('{session_id}', sessionId);

            try {
                const myJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(myJid, { text: welcomeMsg });`;

code = code.replace(oldConnectionLogic, newConnectionLogic);

// 3. Update the AI response logic to send Polls as Buttons
const oldAiLogic = `                const aiReply = await askDeepSeek(aiPrompt, text);
                if (aiReply) await sock.sendMessage(sender, { text: aiReply }, { quoted: msg });
            } catch (e) {
                console.error('AI Error:', e);
            }
        }`;

const newAiLogic = `                let aiReply = await askDeepSeek(aiPrompt, text);
                if (aiReply) {
                    const optionsMatch = aiReply.match(/\\[OPTIONS:\\s*(.+?)\\]/i);
                    if (optionsMatch) {
                        aiReply = aiReply.replace(optionsMatch[0], '').trim();
                        const options = optionsMatch[1].split(',').map(s => s.trim()).filter(s => s).slice(0, 12); // Polls support max 12 options
                        
                        if (aiReply) {
                            await sock.sendMessage(sender, { text: aiReply }, { quoted: msg });
                        }
                        if (options.length > 0) {
                            await sock.sendMessage(sender, { 
                                poll: { 
                                    name: "👉 Please select an option:", 
                                    values: options 
                                } 
                            });
                        }
                    } else {
                        await sock.sendMessage(sender, { text: aiReply }, { quoted: msg });
                    }
                }
            } catch (e) {
                console.error('AI Error:', e);
            }
        }`;

code = code.replace(oldAiLogic, newAiLogic);

fs.writeFileSync('index.js', code);
