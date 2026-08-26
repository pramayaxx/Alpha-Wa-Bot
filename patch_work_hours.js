const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="pt-6 border-t dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /> DeepSeek Engine Setup`;

const replace = `<div className="pt-6 border-t dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock size={20} className="text-indigo-500" /> Bot Working Hours</h3>
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 mb-2">Configure the bot to automatically pause AI responses outside of these hours.</p>
                    <div className="flex items-center gap-3 mb-4">
                      <input type="checkbox" checked={config.settings?.enableWorkHours || false} onChange={e => setConfig({...config, settings: {...config.settings, enableWorkHours: e.target.checked}})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <label className="text-sm font-medium">Enable Working Hours restriction</label>
                    </div>
                    {config.settings?.enableWorkHours && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Start Time</label>
                          <input type="time" value={config.settings?.workHourStart || '09:00'} onChange={e => setConfig({...config, settings: {...config.settings, workHourStart: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">End Time</label>
                          <input type="time" value={config.settings?.workHourEnd || '17:00'} onChange={e => setConfig({...config, settings: {...config.settings, workHourEnd: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-6 border-t dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /> DeepSeek Engine Setup`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    
    if (!code.includes("Clock")) {
        code = code.replace("import { Smartphone, Database, Server, RefreshCcw, LogOut, CheckCircle2, Shield, MessageSquare, Bot, AlertTriangle, MessageCircle, Send, Play, Square, ShoppingCart, Puzzle, Code, Trash2, Plus, Sparkles, ImageIcon, Save } from 'lucide-react';", "import { Smartphone, Database, Server, RefreshCcw, LogOut, CheckCircle2, Shield, MessageSquare, Bot, AlertTriangle, MessageCircle, Send, Play, Square, ShoppingCart, Puzzle, Code, Trash2, Plus, Sparkles, ImageIcon, Save, Clock } from 'lucide-react';");
    }
    
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx for work hours");
} else {
    console.log("Could not find target in App.tsx");
}
