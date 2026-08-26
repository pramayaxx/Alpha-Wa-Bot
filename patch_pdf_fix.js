const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldCode = `                        setTimeout(async () => {
                            await sock.sendMessage(sender, { text: aiReply || \`🎉 Order Confirmed! Your Order ID is *\${orderId}*.\` });
                            // PDF logic omitted for brevity in this specific patch to avoid large buffers unless requested
                        }, 100);`;

const newCode = `                        // Generate Invoice PDF
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

                        setTimeout(async () => {
                            await sock.sendMessage(sender, { text: aiReply || \`🎉 Order Confirmed! Your Order ID is *\${orderId}*.\` });
                            try {
                                await sock.sendMessage(sender, { document: fs.readFileSync(pdfPath), mimetype: 'application/pdf', fileName: \`Invoice-\${orderId}.pdf\` });
                                fs.unlinkSync(pdfPath);
                            } catch(e) { console.error("PDF Send Error:", e); }
                        }, 1500);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('index.js', code);
