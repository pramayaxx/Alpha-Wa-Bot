const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldPdf = `doc.text(\`Customer Name: \${customerName}\`);
                        doc.text(\`Delivery Address: \${customerAddress}\`);
                        doc.moveDown();
                        doc.text(\`Product: \${productName}\`);`;
const newPdf = `doc.text(\`Customer Name: \${customerName}\`);
                        doc.text(\`Contact Number: \${contactNumber}\`);
                        doc.text(\`Delivery Address: \${customerAddress}\`);
                        doc.moveDown();
                        doc.text(\`Product: \${productName}\`);`;

if (code.includes('doc.text(`Customer Name: ${customerName}`);')) {
    code = code.replace(oldPdf, newPdf);
    fs.writeFileSync('index.js', code);
    console.log("PDF Patched!");
} else {
    console.log("Could not find PDF generation code to patch.");
}
