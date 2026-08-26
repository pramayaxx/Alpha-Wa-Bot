const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
    `<div className="flex-1 w-full text-center">
                        <p className="mb-6 font-bold text-slate-700 dark:text-slate-300">Or Scan QR Code</p>
                        {botState.qr ? <div className="inline-block p-6 bg-white rounded-2xl shadow-lg border"><QRCodeSVG value={botState.qr} size={240}/></div> : <div className="h-[240px] w-[240px] mx-auto flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 font-medium">Waiting for QR...</div>}
                      </div>`,
    `<div className="flex-1 w-full text-center flex flex-col items-center">
                        <p className="mb-6 font-bold text-slate-700 dark:text-slate-300">Or Scan QR Code</p>
                        {botState.qr ? <div className="inline-block p-6 bg-white rounded-2xl shadow-lg border"><QRCodeSVG value={botState.qr} size={240}/></div> : <div className="h-[240px] w-[240px] mx-auto flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 font-medium">Waiting for QR...</div>}
                        <button onClick={resetSession} className="mt-4 px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">↻ Restart Connection</button>
                      </div>`
);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
