const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("import { Clock, QRCodeSVG } from 'qrcode.react';", "import { QRCodeSVG } from 'qrcode.react';");
code = code.replace("import { Clock, io } from 'socket.io-client';", "import { io } from 'socket.io-client';");
code = code.replace("import { Clock, LineChart,", "import { LineChart,");

fs.writeFileSync('src/App.tsx', code);
