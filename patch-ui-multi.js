const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(data => setBotState(prev => ({ ...prev, ...data }))).catch(() => {});
    fetch('/api/system-stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});

    socket.on('bot_state', data => setBotState(prev => ({ ...prev, ...data })));
    socket.on('log', msg => setLogs(prev => [msg, ...prev].slice(0, 50)));
    return () => { socket.off('bot_state'); socket.off('log'); };
  }, []);`;

const newUseEffect = `  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('alpha_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 10);
      localStorage.setItem('alpha_session_id', sid);
    }
    return sid;
  });

  useEffect(() => {
    fetch(\`/api/state?sessionId=\${sessionId}\`).then(r => r.json()).then(data => setBotState(prev => ({ ...prev, ...data }))).catch(() => {});
    fetch('/api/system-stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});

    socket.on(\`bot_state_\${sessionId}\`, data => setBotState(prev => ({ ...prev, ...data })));
    socket.on('log', msg => setLogs(prev => [msg, ...prev].slice(0, 50)));
    
    return () => { socket.off(\`bot_state_\${sessionId}\`); socket.off('log'); };
  }, [sessionId]);`;
code = code.replace(oldUseEffect, newUseEffect);

const oldPairRequest = `      const res = await fetch('/api/pair', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput })
      });`;
const newPairRequest = `      const res = await fetch('/api/pair', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, sessionId })
      });`;
code = code.replace(oldPairRequest, newPairRequest);

const oldResetRequest = `      await fetch('/api/reset', { method: 'POST' });`;
const newResetRequest = `      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });`;
code = code.replace(oldResetRequest, newResetRequest);

fs.writeFileSync('src/App.tsx', code);
