const fs = require('fs');

// 1. Update index.js
let indexCode = fs.readFileSync('index.js', 'utf8');
indexCode = indexCode.replace(/CAT SHADOW/g, 'ALPHA MOBILE');
indexCode = indexCode.replace(/WhatsApp Shop Assistant\./g, "WhatsApp Shop Assistant for 'Alpha Mobile'.");
fs.writeFileSync('index.js', indexCode);

// 2. Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/CAT <span className="text-indigo-500">SHADOW<\/span>/g, 'ALPHA <span className="text-indigo-500">MOBILE</span>');
appCode = appCode.replace(/CAT SHADOW/g, 'ALPHA MOBILE');
fs.writeFileSync('src/App.tsx', appCode);

// 3. Update db.json
if (fs.existsSync('db.json')) {
    let db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    if (db.settings) {
        if (db.settings.systemPrompt) {
            db.settings.systemPrompt = db.settings.systemPrompt.replace(/WhatsApp Shop Assistant\./g, "WhatsApp Shop Assistant for 'Alpha Mobile'.");
        }
        if (db.settings.deviceWelcomeMsg) {
            db.settings.deviceWelcomeMsg = db.settings.deviceWelcomeMsg.replace(/CAT SHADOW/g, "ALPHA MOBILE");
        }
    }
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
}

console.log("Renamed to Alpha Mobile successfully.");
