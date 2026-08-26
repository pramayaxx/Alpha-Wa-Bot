const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
db.settings.sessions = db.settings.sessions.filter(s => s !== 'staff-kamal');
fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log("Removed staff-kamal from db.json");
