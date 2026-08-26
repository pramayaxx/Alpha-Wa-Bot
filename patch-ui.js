const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');

const oldHeader = `<h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Smartphone size={18} className="text-indigo-600 dark:text-indigo-400" /> Device Pairing
                    </h3>`;

const newHeader = `<h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Smartphone size={18} className="text-indigo-600 dark:text-indigo-400" /> Device Pairing
                    </h3>
                    <button 
                      onClick={async () => {
                        if(confirm('Warning: This will delete the current connection session completely and generate a fresh QR code. Proceed?')) {
                          setBotState(prev => ({ ...prev, qr: null, pairingCode: null }));
                          await fetch('/api/reset', { method: 'POST' });
                        }
                      }}
                      className="text-xs px-3 py-1.5 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium rounded-lg hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-500/20"
                    >
                      <RefreshCcw size={14} /> Reset Session
                    </button>`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('/app/applet/src/App.tsx', code);
