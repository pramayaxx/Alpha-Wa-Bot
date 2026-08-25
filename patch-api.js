const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

code = code.replace(/await new Promise\\(r => setTimeout\\(r, 600\\)\\);/, 
  "await new Promise(r => setTimeout(r, 1500));");

fs.writeFileSync('/app/applet/index.js', code);
