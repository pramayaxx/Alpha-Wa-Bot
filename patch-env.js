const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.js', 'utf8');

// Disable auto env pairing code request to force QR
const oldEnv = `else if (!pairingPhoneNumber && !pairingCodeRequested && process.env.USE_PAIRING_CODE === 'true' && !sock.authState.creds.registered)`;
const newEnv = `else if (false)`;

code = code.replace(oldEnv, newEnv);
fs.writeFileSync('/app/applet/index.js', code);
