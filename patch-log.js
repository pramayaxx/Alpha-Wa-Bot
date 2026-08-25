const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

// replace console.log
code = code.replace(/console\.log\(/g, `require('fs').appendFileSync('bot-log.txt', String(`);
code = code.replace(/console\.error\(/g, `require('fs').appendFileSync('bot-log.txt', String(`);

// wait, that's dangerous. Let's just override console.log at the very top of index.js.
code = `
const _fs = require('fs');
const _util = require('util');
const origLog = console.log;
const origError = console.error;
console.log = function(...args) {
  _fs.appendFileSync('bot-log.txt', '[LOG] ' + _util.format(...args) + '\\n');
  origLog.apply(console, args);
};
console.error = function(...args) {
  _fs.appendFileSync('bot-log.txt', '[ERR] ' + _util.format(...args) + '\\n');
  origError.apply(console, args);
};
` + code;

fs.writeFileSync('/app/applet/index.js', code);
