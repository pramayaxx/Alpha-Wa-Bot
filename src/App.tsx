import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { ShoppingCart, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle, Shield, Lock, LogOut, MessageSquare, Sparkles, Save, Server, Code } from 'lucide-react';

const socket = io();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('alpha_auth') === 'true');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');
  const [botState, setBotState] = useState({ status: 'offline', pairingCode: null, pairingError: null, qr: null });
  const [phoneInput, setPhoneInput] = useState('');
  const [config, setConfig] = useState<any>({ shop: {}, settings: { deepseekKey: '', systemPrompt: '' }, plugins: [] });
  const [plugins, setPlugins] = useState<string[]>([]);
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginCode, setNewPluginCode] = useState('module.exports = {\n  execute: async (sock, msg, sessionId) => {\n    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";\n    if (text === ".ping") {\n      await sock.sendMessage(msg.key.remoteJid, { text: "Pong!" }, { quoted: msg });\n    }\n  }\n};');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDetails, setPDetails] = useState('');
  const [pImage, setPImage] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastImg, setBroadcastImg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('alpha_session_id');
    if (!sid) { sid = Math.random().toString(36).substring(2, 10); localStorage.setItem('alpha_session_id', sid); }
    return sid;
  });

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const loadData = () => {
    fetch(`/api/state?sessionId=${sessionId}`).then(r => r.json()).then(data => setBotState(prev => ({ ...prev, ...data })));
    fetch('/api/config').then(r => r.json()).then(setConfig);
    fetch('/api/plugins').then(r => r.json()).then(setPlugins);
    fetch('/api/shop/products').then(r => r.json()).then(setProducts);
    fetch('/api/shop/customers').then(r => r.json()).then(setCustomers);
  }

  useEffect(() => {
    loadData();
    socket.on(`bot_state_${sessionId}`, data => setBotState(prev => ({ ...prev, ...data })));
    return () => { socket.off(`bot_state_${sessionId}`); };
  }, [sessionId]);

  const requestPairingCode = async () => {
    if (!phoneInput) return alert("Enter valid WhatsApp number");
    setBotState(prev => ({ ...prev, pairingCode: 'GENERATING...' }));
    const res = await fetch('/api/pair', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneInput, sessionId })
    });
    const data = await res.json();
    if (data.code) setBotState(prev => ({ ...prev, pairingCode: data.code }));
    else setBotState(prev => ({ ...prev, pairingCode: 'ERROR', pairingError: data.error }));
  };

  const resetSession = async () => {
    if(confirm('Are you sure you want to reset the entire session?')) {
      setBotState(prev => ({ ...prev, qr: null, pairingCode: null }));
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
    }
  };

  const saveConfig = async () => {
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
    alert('All configurations saved successfully!');
  };

  const savePlugin = async () => {
    if (!newPluginName) return alert('Enter a name');
    await fetch('/api/plugins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newPluginName, code: newPluginCode }) });
    setNewPluginName('');
    loadData();
  }

  const deletePlugin = async (name: string) => {
    if(!confirm(`Delete ${name}?`)) return;
    await fetch(`/api/plugins/${name}`, { method: 'DELETE' });
    loadData();
  }

  const handleImageUpload = (e: any, setter: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const syncPOS = async () => {
    setIsSyncing(true);
    try {
        const res = await fetch('/api/shop/pos-sync', { method: 'POST' });
        const data = await res.json();
        if(data.success) {
            alert(`Successfully synced ${data.count} products from Alpha POS!`);
            loadData();
        } else {
            alert('Sync Failed: ' + data.error);
        }
    } catch(e) {
        alert('Error connecting to POS API');
    }
    setIsSyncing(false);
  };

  const addProduct = async () => {
    if(!pName || !pPrice) return alert('Name and Price required');
    await fetch('/api/shop/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: pName, price: pPrice, details: pDetails, image: pImage })
    });
    setPName(''); setPPrice(''); setPDetails(''); setPImage('');
    loadData();
  };

  const deleteProduct = async (id: string) => {
    if(!confirm('Delete product?')) return;
    await fetch(`/api/shop/products/${id}`, { method: 'DELETE' });
    loadData();
  };

  const sendBroadcast = async () => {
    if(!broadcastMsg) return alert('Enter a message');
    if(!confirm(`Send broadcast to ${customers.length} saved contacts? (This uses an anti-ban delay of 1.5s per message)`)) return;
    setIsBroadcasting(true);
    const res = await fetch('/api/shop/broadcast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: broadcastMsg, image: broadcastImg })
    });
    const data = await res.json();
    setIsBroadcasting(false);
    if(data.success) alert(`Successfully sent broadcast to ${data.count} contacts!`);
    else alert(data.error);
  };

  const NavButton = ({ id, icon: Icon, label }: any) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
      <Icon size={18} /> {label}
    </button>
  );

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPass })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('alpha_auth', 'true');
        setIsLoggedIn(true);
      } else {
        alert('Invalid Admin Password!');
      }
    } catch (e) {
      alert('Login Error');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('alpha_auth');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-900 dark:text-slate-100">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 transform transition-all">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Alpha Mobile Admin</h1>
            <p className="text-slate-500 text-sm">Authorized personnel only. Please enter the master password to access the central dashboard.</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-slate-400" />
              </div>
              <input 
                type="password" 
                value={loginPass} 
                onChange={e => setLoginPass(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Enter password..." 
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent text-lg transition-all" 
              />
            </div>
            <button 
              onClick={handleLogin} 
              disabled={isLoggingIn || !loginPass}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              {isLoggingIn ? 'Verifying...' : 'Access Systems'}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">Hint: The default password is <b>alpha123</b></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3"><Terminal size={18} className="text-white" /></div>
          <h1 className="font-bold text-lg">ALPHA <span className="text-indigo-500">MOBILE</span></h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
          <NavButton id="connection" icon={RefreshCcw} label="Connection Hub" />
          <NavButton id="ai" icon={Bot} label="DeepSeek AI" />
          <NavButton id="shop" icon={ShoppingCart} label="Shop Settings" />
          <NavButton id="plugins" icon={Puzzle} label="Plugin Manager" />
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b flex justify-between items-center px-8">
          <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {activeTab === 'connection' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">Device Pairing (Unlimited Sessions)</h3>
                  <button onClick={resetSession} className="px-4 py-2 bg-rose-100 text-rose-600 rounded-lg text-sm font-medium">Reset Session</button>
                </div>
                {botState.status === 'online' ? (
                  <div className="text-center py-10"><Check size={48} className="mx-auto text-emerald-500 mb-4"/> Connected Successfully!</div>
                ) : (
                  <div className="flex gap-12 items-center">
                    <div className="flex-1">
                      <label className="block text-sm mb-2">Phone Number</label>
                      <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="9470000000" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-4 bg-transparent" />
                      <button onClick={requestPairingCode} className="w-full py-3 bg-indigo-600 text-white rounded-lg">Get Pairing Code</button>
                      {botState.pairingCode && <div className="mt-4 p-4 text-center text-3xl font-mono tracking-widest bg-slate-100 dark:bg-slate-800 rounded-lg">{botState.pairingCode}</div>}
                    </div>
                    <div className="w-px bg-slate-200 self-stretch"></div>
                    <div className="flex-1 text-center">
                      <p className="mb-4">Or scan QR Code</p>
                      {botState.qr ? <div className="inline-block p-4 bg-white rounded-xl"><QRCodeSVG value={botState.qr} size={200}/></div> : <div className="h-[200px] flex items-center justify-center text-slate-400 border-2 border-dashed rounded-xl">Waiting for QR...</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai' && (
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
            )}

            {activeTab === 'plugins' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Create New Custom Plugin</h3>
                  <input value={newPluginName} onChange={e => setNewPluginName(e.target.value)} placeholder="hello_world.js" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-4 bg-transparent" />
                  <textarea rows={8} value={newPluginCode} onChange={e => setNewPluginCode(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-4 bg-transparent font-mono text-sm" />
                  <button onClick={savePlugin} className="py-2 px-6 bg-indigo-600 text-white rounded-lg">Save & Load Plugin</button>
                  <p className="mt-4 text-xs text-slate-500">Plugins are injected immediately. No server restart required.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {plugins.length === 0 && <p className="text-slate-500 italic">No plugins installed.</p>}
                  {plugins.map(p => (
                    <div key={p} className="bg-white dark:bg-slate-900 p-4 rounded-xl border flex justify-between items-center">
                      <span className="font-mono text-indigo-400">{p}</span>
                      <button onClick={() => deletePlugin(p)} className="text-rose-500 hover:bg-rose-500/10 px-3 py-1 rounded">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'shop' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* CUSTOMER CRM & BROADCAST */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><Bot size={20}/> Customer CRM & Broadcast</h3>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-full text-sm font-bold">{customers.length} Saved Contacts</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Contacts are automatically captured and saved whenever someone messages your bot.</p>
                    <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Type your broadcast promotional message..." className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-3 bg-transparent h-24" />
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setBroadcastImg)} className="text-sm mb-3 text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    {broadcastImg && <img src={broadcastImg} alt="Preview" className="h-20 object-contain mb-3 rounded border" />}
                    <button onClick={sendBroadcast} disabled={isBroadcasting} className="mt-auto py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                      {isBroadcasting ? 'Broadcasting... (Anti-Ban Active)' : '1-Click Send Broadcast to All'}
                    </button>
                  </div>

                  {/* ADD PRODUCT */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={20}/> Add New Product</h3>
                    <div className="space-y-3">
                      <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Product Name (e.g., iPhone 15 Pro)" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent" />
                      <input value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="Price (e.g. LKR 1500)" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent" />
                      <textarea value={pDetails} onChange={e => setPDetails(e.target.value)} placeholder="Details/Description" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent h-20" />
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setPImage)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700" />
                      {pImage && <img src={pImage} alt="Product" className="h-20 object-contain rounded border" />}
                      <button onClick={addProduct} className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium">Save Product Catalog</button>
                    </div>
                  </div>
                </div>

                {/* PRODUCT LIST */}
                <h3 className="text-lg font-semibold mt-8 mb-4 border-b pb-2 dark:border-slate-800">Product Catalog (Auto-Injected to DeepSeek AI)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.length === 0 && <p className="text-slate-500 italic col-span-full">No products added yet.</p>}
                  {products.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden flex flex-col shadow-sm">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-40 object-cover" /> : <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">No Image</div>}
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="font-bold text-lg">{p.name}</h4>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-2">{p.price}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex-1">{p.details}</p>
                        <button onClick={() => deleteProduct(p.id)} className="mt-4 py-2 w-full border border-rose-200 text-rose-500 rounded-lg text-sm hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20 font-medium transition-colors">Remove Item</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
