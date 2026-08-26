const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const loginRoute = `
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const db = readDB();
    const adminPass = db.settings?.adminPassword || 'alpha123';
    if (password === adminPass) {
        res.json({ success: true, token: 'alpha_auth_success' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});
`;

code = code.replace("app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));", loginRoute + "\napp.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));");
fs.writeFileSync('index.js', code);
