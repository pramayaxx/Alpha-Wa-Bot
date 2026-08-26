const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = "const [isSyncing, setIsSyncing] = useState(false);";
const replace = target + "\n  const [sessions, setSessions] = useState<string[]>(['default']);\n  const [sessionId, setSessionId] = useState('default');";

if (code.includes(target)) {
    code = code.replace("const [sessionId] = useState(() => {", "const [oldSessionId] = useState(() => {");
    code = code.replace(target, replace);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched missing states.");
}
