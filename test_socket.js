const io = require('socket.io-client');
const socket = io('http://localhost:3000');
socket.on('bot_state_default', (data) => {
    console.log('Received state:', data);
});
