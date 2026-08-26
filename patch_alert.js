const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("alert('DeepSeek AI configuration saved successfully!');", "alert('All configurations saved successfully!');");

fs.writeFileSync('src/App.tsx', code);
