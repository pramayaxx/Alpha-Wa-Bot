const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldTab = `{activeTab === 'ai' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm">
                <h3 className="text-lg font-semibold mb-6">DeepSeek AI Configuration</h3>
                <label className="block text-sm mb-2">DeepSeek API Key</label>
                <input type="password" value={config.settings?.deepseekKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, deepseekKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-4 bg-transparent" placeholder="sk-..." />
                <label className="block text-sm mb-2">System Prompt (AI Persona)</label>
                <textarea rows={4} value={config.settings?.systemPrompt || ''} onChange={e => setConfig({...config, settings: {...config.settings, systemPrompt: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-4 bg-transparent" placeholder="You are a helpful assistant..." />
                <button onClick={saveConfig} className="py-2 px-6 bg-indigo-600 text-white rounded-lg">Save AI Config</button>
              </div>
            )}`;

const newTab = `{activeTab === 'ai' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield size={20} className="text-indigo-500" /> Admin Security</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Dashboard Admin Password</label>
                      <p className="text-xs text-slate-500 mb-2">Change the password used to login to this dashboard. (Default: alpha123)</p>
                      <input type="text" value={config.settings?.adminPassword || 'alpha123'} onChange={e => setConfig({...config, settings: {...config.settings, adminPassword: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" placeholder="alpha123" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><MessageSquare size={20} className="text-indigo-500" /> WhatsApp Customization</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Custom Device Link Welcome Message</label>
                      <p className="text-xs text-slate-500 mb-2">This is sent to your device when WhatsApp connects. Use {"{session_id}"} to show the current session ID.</p>
                      <textarea value={config.settings?.deviceWelcomeMsg || ''} onChange={e => setConfig({...config, settings: {...config.settings, deviceWelcomeMsg: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent h-32" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /> DeepSeek Engine Setup</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">DeepSeek API Key</label>
                      <input type="password" value={config.settings?.deepseekKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, deepseekKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" placeholder="sk-..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">AI Shop Assistant Persona (System Prompt)</label>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2 font-medium">💡 Pro Tip: To show clickable WhatsApp buttons to users, type "[OPTIONS: Option 1, Option 2]" in your prompt instructions!</p>
                      <textarea value={config.settings?.systemPrompt || ''} onChange={e => setConfig({...config, settings: {...config.settings, systemPrompt: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent h-40" />
                    </div>
                    <button onClick={saveConfig} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"><Save size={18} /> Save All Configurations</button>
                  </div>
                </div>
              </div>
            )}`;

if (code.includes(oldTab)) {
    code = code.replace(oldTab, newTab);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Tab updated");
} else {
    console.log("Could not find the old tab snippet.");
}
