const fs = require('fs');
let db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

const baseInstruction = "\n\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]\nWhen a customer wants to place an order, ALWAYS ask for their Full Name, Delivery Address, and Contact Number. Once they provide the delivery details, output EXACTLY: [CREATE_ORDER: ProductName || CustomerName || CustomerAddress || ContactNumber]\nTo check an order status, output EXACTLY: [CHECK_ORDER: OrderID]";

if (!db.settings.systemPrompt.includes('CREATE_ORDER')) {
    db.settings.systemPrompt += baseInstruction;
} else {
    db.settings.systemPrompt = db.settings.systemPrompt.replace(/\n\nIMPORTANT:.*CHECK_ORDER: OrderID\]/, '') + baseInstruction;
}

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log("DB Patched!");
