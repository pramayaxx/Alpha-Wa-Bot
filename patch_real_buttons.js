const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldAiLogic = `                        if (options.length > 0) {
                            await sock.sendMessage(sender, { 
                                poll: { 
                                    name: "👉 Please select an option:", 
                                    values: options 
                                } 
                            });
                        }`;

const newAiLogic = `                        if (options.length > 0) {
                            // Convert to Baileys Interactive Buttons
                            const buttons = options.map((opt, i) => ({
                                buttonId: 'btn_' + i,
                                buttonText: { displayText: opt },
                                type: 1
                            }));
                            
                            try {
                                await sock.sendMessage(sender, { 
                                    text: "👉 Please select an option below:",
                                    buttons: buttons,
                                    headerType: 1
                                });
                            } catch (e) {
                                // Fallback to poll if standard buttons fail
                                await sock.sendMessage(sender, { poll: { name: "👉 Please select an option:", values: options } });
                            }
                        }`;

code = code.replace(oldAiLogic, newAiLogic);
fs.writeFileSync('index.js', code);
