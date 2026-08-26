const fs = require('fs');

// Patch index.js
let backendCode = fs.readFileSync('index.js', 'utf8');

const oldRegex = `const createMatch = aiReply.match(/\\[CREATE_ORDER:\\s*(.+?)\\s*\\|\\|\\s*(.+?)\\s*\\|\\|\\s*(.+?)\\]/i);`;
const newRegex = `const createMatch = aiReply.match(/\\[CREATE_ORDER:\\s*(.+?)\\s*\\|\\|\\s*(.+?)\\s*\\|\\|\\s*(.+?)(?:\\s*\\|\\|\\s*(.+?))?\\]/i);`;
backendCode = backendCode.replace(oldRegex, newRegex);

const oldPush = `db.shop.orders.push({ id: orderId, customerJid: sender, customerName, customerAddress, productName, status: 'Processing', date: new Date().toISOString() });`;
const newPush = `const contactNumber = createMatch[4] ? createMatch[4].trim() : sender.split('@')[0];
                        db.shop.orders.push({ id: orderId, customerJid: sender, customerName, customerAddress, contactNumber, productName, status: 'Processing', date: new Date().toISOString() });`;
backendCode = backendCode.replace(oldPush, newPush);

// Update PDF generation to include Contact Number
const oldPdf = `doc.fontSize(16).text(\`Customer Name: \${customerName}\`);
                        doc.text(\`Delivery Address: \${customerAddress}\`);
                        doc.text(\`Product: \${productName}\`);`;
const newPdf = `doc.fontSize(16).text(\`Customer Name: \${customerName}\`);
                        doc.text(\`Contact Number: \${contactNumber}\`);
                        doc.text(\`Delivery Address: \${customerAddress}\`);
                        doc.text(\`Product: \${productName}\`);`;
backendCode = backendCode.replace(oldPdf, newPdf);

fs.writeFileSync('index.js', backendCode);


// Patch App.tsx
let uiCode = fs.readFileSync('src/App.tsx', 'utf8');

const oldBaseInst = `const baseInstruction = "\\n\\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]\\nTo create an order, output EXACTLY: [CREATE_ORDER: ProductName || CustomerName || CustomerAddress]\\nTo check an order status, output EXACTLY: [CHECK_ORDER: OrderID]";`;
const newBaseInst = `const baseInstruction = "\\n\\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]\\nWhen a customer wants to place an order, ALWAYS ask for their Full Name, Delivery Address, and Contact Number. Once they provide the delivery details, output EXACTLY: [CREATE_ORDER: ProductName || CustomerName || CustomerAddress || ContactNumber]\\nTo check an order status, output EXACTLY: [CHECK_ORDER: OrderID]";`;
uiCode = uiCode.replace(oldBaseInst, newBaseInst);

const oldPromptReplace = `finalConfig.settings.systemPrompt += baseInstruction;`;
const newPromptReplace = `finalConfig.settings.systemPrompt = finalConfig.settings.systemPrompt.replace(/\\n\\nIMPORTANT:.*CHECK_ORDER: OrderID\\]/, '');\n        finalConfig.settings.systemPrompt += baseInstruction;`;
uiCode = uiCode.replace(oldPromptReplace, newPromptReplace);

fs.writeFileSync('src/App.tsx', uiCode);

console.log("Patched order creation logic.");
