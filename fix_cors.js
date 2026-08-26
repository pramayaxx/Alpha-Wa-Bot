const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const ioRequire = `const { Server } = require('socket.io');`;
const ioSetup = `const io = new Server(server, { cors: { origin: '*' } });`;

code = code.replace(`const io = require('socket.io')(server);`, `const io = require('socket.io')(server, { cors: { origin: '*' } });`);
fs.writeFileSync('index.js', code);
