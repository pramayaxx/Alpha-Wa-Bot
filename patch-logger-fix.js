const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldLogger = `logger: pino({ level: 'info' }, fs.createWriteStream('/app/applet/wa.log')),`;
const newLogger = `logger: pino({ level: 'silent' }),`;

code = code.replace(oldLogger, newLogger);
fs.writeFileSync('index.js', code);
