const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

const oldLogger = `logger: pino({ level: 'silent' }),`;
const newLogger = `logger: pino({ level: 'info' }, fs.createWriteStream('/app/applet/wa.log')),`;

code = code.replace(oldLogger, newLogger);
fs.writeFileSync('/app/applet/index.js', code);
