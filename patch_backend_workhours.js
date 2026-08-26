const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const target = `// 2. AI Reply logic
        if (db.settings.deepseekKey) {`;

const replace = `// Check Working Hours
        if (db.settings.enableWorkHours && db.settings.workHourStart && db.settings.workHourEnd) {
            const now = new Date();
            // Convert to Sri Lanka Time (UTC+5:30) or just local server time?
            // Usually we use server local time, but let's just use local time for now.
            // Wait, Date() gives server time. Let's assume server time.
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startH, startM] = db.settings.workHourStart.split(':').map(Number);
            const [endH, endM] = db.settings.workHourEnd.split(':').map(Number);
            const startTime = startH * 60 + startM;
            const endTime = endH * 60 + endM;
            
            let isWorkingHour = false;
            if (startTime <= endTime) {
                isWorkingHour = (currentTime >= startTime && currentTime <= endTime);
            } else {
                // cross midnight
                isWorkingHour = (currentTime >= startTime || currentTime <= endTime);
            }
            
            if (!isWorkingHour) {
                console.log(\`[AI] Skipped response for \${sender} (Outside working hours)\`);
                return; // Stop processing further AI/Live Chat logic
            }
        }

        // 2. AI Reply logic
        if (db.settings.deepseekKey) {`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    fs.writeFileSync('index.js', code);
    console.log("Patched index.js for working hours");
} else {
    console.log("Could not find target in index.js");
}
