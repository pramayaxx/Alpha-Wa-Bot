const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const target = `const now = new Date();
            // Convert to Sri Lanka Time (UTC+5:30) or just local server time?
            // Usually we use server local time, but let's just use local time for now.
            // Wait, Date() gives server time. Let's assume server time.
            const currentTime = now.getHours() * 60 + now.getMinutes();`;

const replace = `const now = new Date();
            // Convert to Sri Lanka Time (UTC+5:30)
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const slTime = new Date(utc + (3600000 * 5.5));
            const currentTime = slTime.getHours() * 60 + slTime.getMinutes();`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    fs.writeFileSync('index.js', code);
    console.log("Patched timezone");
} else {
    console.log("Could not find timezone target");
}
