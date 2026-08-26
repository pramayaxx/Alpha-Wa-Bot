const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldSettingsRoute = `app.post('/api/settings', (req, res) => {
    const db = readDB();
    db.settings = { ...db.settings, ...req.body };
    writeDB(db);
    res.json({ success: true });
});`;

const newSettingsRoute = `app.post('/api/settings', (req, res) => {
    const db = readDB();
    db.settings = { ...db.settings, ...req.body };
    writeDB(db);
    res.json({ success: true });
});`;
// Just checking if settings route exists. It actually just merges req.body into db.settings. That means if I send deviceWelcomeMsg in the POST request, it will be saved!
