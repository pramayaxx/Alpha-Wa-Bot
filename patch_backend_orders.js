const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. Add pdfkit and new DB structures
const oldRequires = `const { Server } = require('socket.io');`;
const newRequires = `const { Server } = require('socket.io');\nconst PDFDocument = require('pdfkit');`;
code = code.replace(oldRequires, newRequires);

const oldInitDB = `             shop: { products: [], customers: [] },`;
const newInitDB = `             shop: { products: [], customers: [], orders: [] },\n             analytics: { dailyMessages: {}, popularProducts: {}, totalSales: 0 },`;
code = code.replace(oldInitDB, newInitDB);

// 2. Add API routes for analytics and orders
const oldRoutes = `app.get('/api/shop/products', (req, res) => res.json(readDB().shop?.products || []));`;
const newRoutes = `
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
            sock.sendMessage(order.customerJid, { text: \`📦 *Order Update*\\n\\nYour order *#\${order.id}* is now: *\${order.status}*\` }).catch(console.error);
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});
app.get('/api/shop/products', (req, res) => res.json(readDB().shop?.products || []));
`;
code = code.replace(oldRoutes, newRoutes);

// 3. Analytics tracking in message handler
const oldMsgHandler = `        sock.ev.on('messages.upsert', async m => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;`;
const newMsgHandler = `        sock.ev.on('messages.upsert', async m => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            // Analytics tracking
            const db = readDB();
            if(!db.analytics) db.analytics = { dailyMessages: {}, popularProducts: {}, totalSales: 0 };
            const today = new Date().toISOString().split('T')[0];
            db.analytics.dailyMessages[today] = (db.analytics.dailyMessages[today] || 0) + 1;
            writeDB(db);
`;
code = code.replace(oldMsgHandler, newMsgHandler);

// 4. Update AI Logic to handle CREATE_ORDER and CHECK_ORDER
const oldAiLogic = `                let aiReply = await askDeepSeek(aiPrompt, text, sender);
                if (aiReply) {
                    const optionsMatch = aiReply.match(/\\[OPTIONS:\\s*(.+?)\\]/i);`;
const newAiLogic = `                let aiReply = await askDeepSeek(aiPrompt, text, sender);
                if (aiReply) {
                    // Check for Order Creation
                    const createMatch = aiReply.match(/\\[CREATE_ORDER:\\s*(.+?)\\s*\\|\\|\\s*(.+?)\\s*\\|\\|\\s*(.+?)\\]/i);
                    if (createMatch) {
                        aiReply = aiReply.replace(createMatch[0], '').trim();
                        const productName = createMatch[1].trim();
                        const customerName = createMatch[2].trim();
                        const customerAddress = createMatch[3].trim();
                        const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
                        
                        const db = readDB();
                        if(!db.shop.orders) db.shop.orders = [];
                        db.shop.orders.push({
                            id: orderId, customerJid: sender, customerName, customerAddress, productName, status: 'Processing', date: new Date().toISOString()
                        });
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
                        doc.fontSize(14).text(\`Order ID: \${orderId}\`);
                        doc.text(\`Date: \${new Date().toLocaleString()}\`);
                        doc.moveDown();
                        doc.text(\`Customer Name: \${customerName}\`);
                        doc.text(\`Delivery Address: \${customerAddress}\`);
                        doc.moveDown();
                        doc.text(\`Product: \${productName}\`);
                        doc.text(\`Status: Processing\`);
                        doc.moveDown(2);
                        doc.text('Thank you for shopping with Alpha Mobile!', { align: 'center' });
                        doc.end();

                        // Send confirmation + PDF
                        setTimeout(async () => {
                            await sock.sendMessage(sender, { text: aiReply || \`🎉 Order Confirmed! Your Order ID is *\${orderId}*.\` });
                            await sock.sendMessage(sender, { document: fs.readFileSync(pdfPath), mimetype: 'application/pdf', fileName: \`Invoice-\${orderId}.pdf\` });
                            fs.unlinkSync(pdfPath);
                        }, 1000);
                        return; // Stop further processing for this message
                    }

                    // Check for Order Status Lookup
                    const checkMatch = aiReply.match(/\\[CHECK_ORDER:\\s*(.+?)\\]/i);
                    if (checkMatch) {
                        const orderId = checkMatch[1].trim();
                        const db = readDB();
                        const order = db.shop?.orders?.find(o => o.id === orderId);
                        if (order) {
                            aiReply = aiReply.replace(checkMatch[0], \`\\n📦 *Order Status:* \${order.status}\\n*Product:* \${order.productName}\\n*Address:* \${order.customerAddress}\`);
                        } else {
                            aiReply = aiReply.replace(checkMatch[0], \`\\n⚠️ Sorry, I couldn't find order #\${orderId}. Please check the number and try again.\`);
                        }
                    }

                    // Retargeting tracker (store last product interaction)
                    const dbTracker = readDB();
                    if(!dbTracker.shop.customers) dbTracker.shop.customers = [];
                    let cust = dbTracker.shop.customers.find(c => c.id === sender);
                    if(!cust) { cust = { id: sender, name: sender.split('@')[0], lastActive: Date.now() }; dbTracker.shop.customers.push(cust); }
                    cust.lastActive = Date.now();
                    writeDB(dbTracker);

                    const optionsMatch = aiReply.match(/\\[OPTIONS:\\s*(.+?)\\]/i);`;
code = code.replace(oldAiLogic, newAiLogic);

// 5. Automated Follow-ups (Retargeting Job)
const retargetJob = `
// Background Job for AI Retargeting (runs every hour)
setInterval(() => {
    const db = readDB();
    const now = Date.now();
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    
    if(db.shop && db.shop.customers) {
        db.shop.customers.forEach(async (cust) => {
            // If inactive for 2 days and hasn't been retargeted recently
            if(cust.lastActive && (now - cust.lastActive > TWO_DAYS) && (!cust.lastRetargeted || (now - cust.lastRetargeted > TWO_DAYS))) {
                const sock = activeSessions.get('default');
                if(sock) {
                    try {
                        await sock.sendMessage(cust.id, { text: \`👋 Hello again from Alpha Mobile!\\n\\nAre you still looking for the perfect product? We have some special discounts today! Let me know if you need any help.\` });
                        cust.lastRetargeted = now;
                        writeDB(db);
                    } catch(e) {}
                }
            }
        });
    }
}, 60 * 60 * 1000); // 1 hour
`;
code += retargetJob;

fs.writeFileSync('index.js', code);
