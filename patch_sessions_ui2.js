const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /{activeTab === 'connection' && \([\s\S]*?\)\s*}\s*{activeTab === 'ai' && \(/;

const newConnTab = `{activeTab === 'connection' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6 border-b dark:border-slate-800 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Smartphone size={24} className="text-indigo-500" /> Linked Devices ({sessions.length}/10)</h3>
                  <button 
                    onClick={async () => {
                      if(sessions.length >= 10) return alert('Max 10 devices reached');
                      const newId = prompt('Enter a unique name for the new device (e.g., branch-colombo):');
                      if(!newId) return;
                      const res = await fetch('/api/sessions/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sessionId: newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') }) });
                      const data = await res.json();
                      if(data.success) { setSessions(data.sessions); setSessionId(newId); } else { alert(data.error); }
                    }} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm font-bold"
                  >
                    <Plus size={16} /> Link New Device
                  </button>
                </div>
                
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                  {sessions.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setSessionId(s)} 
                      className={\`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all \${sessionId === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm flex flex-col items-center">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2">Connect Device: <span className="text-indigo-500">{sessionId.toUpperCase()}</span></h3>
                  {botState.status === 'online' ? (
                    <div className="text-center py-10">
                      <Check size={64} className="mx-auto text-emerald-500 mb-6 bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full"/> 
                      <h2 className="text-2xl font-bold mb-2">Connected Successfully!</h2>
                      <p className="text-slate-500 mb-8">This device is actively sending and receiving messages.</p>
                      <button onClick={async () => {
                          if(confirm('Logout this device?')) {
                              await fetch('/api/logout', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sessionId }) });
                              setTimeout(loadData, 2000);
                          }
                      }} className="px-6 py-2 border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 font-bold">Logout Device</button>
                      {sessionId !== 'default' && (
                        <button onClick={async () => {
                            if(confirm('Delete this device permanently?')) {
                                const res = await fetch('/api/sessions/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sessionId }) });
                                const data = await res.json();
                                if(data.success) { setSessions(data.sessions); setSessionId('default'); }
                            }
                        }} className="px-6 py-2 ml-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold">Delete Device</button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-4xl flex flex-col md:flex-row gap-12 items-center">
                      <div className="flex-1 w-full">
                        <label className="block text-sm mb-2 font-bold text-slate-700 dark:text-slate-300">Link with Phone Number</label>
                        <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="9470000000" className="w-full p-4 rounded-xl border-2 dark:border-slate-700 mb-4 bg-transparent focus:border-indigo-500 outline-none transition-colors font-mono text-lg" />
                        <button onClick={requestPairingCode} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all">Get Pairing Code</button>
                        {botState.pairingCode && <div className="mt-6 p-6 text-center text-4xl font-mono tracking-widest bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-indigo-600 border border-indigo-200 dark:border-indigo-900/50">{botState.pairingCode}</div>}
                        {botState.pairingError && <div className="mt-4 p-4 text-rose-500 text-center text-sm font-bold bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200">{botState.pairingError}</div>}
                      </div>
                      <div className="w-full md:w-px h-px md:h-64 bg-slate-200 dark:bg-slate-800"></div>
                      <div className="flex-1 w-full text-center">
                        <p className="mb-6 font-bold text-slate-700 dark:text-slate-300">Or Scan QR Code</p>
                        {botState.qr ? <div className="inline-block p-6 bg-white rounded-2xl shadow-lg border"><QRCodeSVG value={botState.qr} size={240}/></div> : <div className="h-[240px] w-[240px] mx-auto flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 font-medium">Waiting for QR...</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'ai' && (`;

if (regex.test(code)) {
    code = code.replace(regex, newConnTab);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched Connection Tab Successfully!");
} else {
    console.log("Regex did not match.");
}
