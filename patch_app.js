const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSettingsSave = `  const saveSettings = async () => {
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.settings)
    });
    alert('Settings Saved Successfully!');
  };`;

const newSettingsSave = `  const saveSettings = async () => {
    // Inject system prompt instructions for Buttons
    const originalPrompt = config.settings.systemPrompt || '';
    const instruction = "\\n\\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]";
    let finalPrompt = originalPrompt;
    if(!originalPrompt.includes('[OPTIONS:')) {
      finalPrompt += instruction;
    }
    const finalSettings = { ...config.settings, systemPrompt: finalPrompt };
    
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalSettings)
    });
    alert('Settings Saved! Interactive buttons are enabled.');
    loadData();
  };`;

code = code.replace(oldSettingsSave, newSettingsSave);

const oldAiTab = `{/* AI SETTINGS */}
            {activeTab === 'ai' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="text-indigo-500" /> DeepSeek Engine Setup</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">DeepSeek API Key</label>
                    <input type="password" value={config.settings?.deepseekKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, deepseekKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" placeholder="sk-..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">AI Shop Assistant Persona (System Prompt)</label>
                    <textarea value={config.settings?.systemPrompt || ''} onChange={e => setConfig({...config, settings: {...config.settings, systemPrompt: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent h-40" />
                  </div>
                  <button onClick={saveSettings} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"><Save size={18} /> Save AI Configuration</button>
                </div>
              </div>
            )}`;

const newAiTab = `{/* AI SETTINGS */}
            {activeTab === 'ai' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><MessageSquare className="text-indigo-500" /> WhatsApp Customization</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Custom Device Link Welcome Message</label>
                      <p className="text-xs text-slate-500 mb-2">This is sent to your device when WhatsApp connects. Use {"{session_id}"} to show the current session ID.</p>
                      <textarea value={config.settings?.deviceWelcomeMsg || ''} onChange={e => setConfig({...config, settings: {...config.settings, deviceWelcomeMsg: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent h-32" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="text-indigo-500" /> DeepSeek Engine Setup</h3>
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
                    <button onClick={saveSettings} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"><Save size={18} /> Save Configurations</button>
                  </div>
                </div>
              </div>
            )}`;

code = code.replace(oldAiTab, newAiTab);
fs.writeFileSync('src/App.tsx', code);
