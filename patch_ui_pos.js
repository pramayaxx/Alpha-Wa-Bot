const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldState = `  const [isBroadcasting, setIsBroadcasting] = useState(false);`;
const newState = `  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);`;
code = code.replace(oldState, newState);

const oldFunc = `  const addProduct = async () => {`;
const newFunc = `  const syncPOS = async () => {
    setIsSyncing(true);
    try {
        const res = await fetch('/api/shop/pos-sync', { method: 'POST' });
        const data = await res.json();
        if(data.success) {
            alert(\`Successfully synced \${data.count} products from Alpha POS!\`);
            loadData();
        } else {
            alert('Sync Failed: ' + data.error);
        }
    } catch(e) {
        alert('Error connecting to POS API');
    }
    setIsSyncing(false);
  };

  const addProduct = async () => {`;
code = code.replace(oldFunc, newFunc);

const oldUI = `                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;
const newUI = `                <div className="grid grid-cols-1 gap-6">
                  {/* POS SYNC */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm col-span-full">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><RefreshCcw size={20}/> Alpha POS Integration</h3>
                    <p className="text-sm text-slate-500 mb-4">Automatically sync your products from <b>alphapos.zone.id</b>. Configure the API endpoint below.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input value={config.settings?.posApiUrl || 'https://alphapos.zone.id/api/products'} onChange={e => setConfig({...config, settings: {...config.settings, posApiUrl: e.target.value}})} className="flex-1 p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent" placeholder="POS API URL (https://alphapos.zone.id/api/products)" />
                        <input value={config.settings?.posApiKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, posApiKey: e.target.value}})} className="flex-1 p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent" placeholder="API Key / Bearer Token (Optional)" />
                        <button onClick={async () => {
                            await fetch('/api/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(config.settings)});
                            syncPOS();
                        }} disabled={isSyncing} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 min-w-[160px]">
                            {isSyncing ? 'Syncing...' : 'Sync Products'}
                        </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">`;
code = code.replace(oldUI, newUI);

fs.writeFileSync('src/App.tsx', code);
