import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Clock, ShoppingCart, Smartphone, Plus, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle, Shield, Lock, LogOut, MessageSquare, Sparkles, Save, Server, Code, LayoutDashboard, Package, TrendingUp, Users, PauseCircle, Play, Image as ImageIcon, Mic, Copy, CheckCheck, AlertCircle, Wifi, WifiOff, Send, Key, FileCode, ExternalLink, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const socket = io();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('alpha_auth') === 'true');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');
  const [analytics, setAnalytics] = useState<any>({ dailyMessages: {}, popularProducts: {}, totalSales: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [chats, setChats] = useState<any>({});
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [broadcastSegment, setBroadcastSegment] = useState('ALL');
  const [botState, setBotState] = useState<any>({ status: 'offline' });
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
  const [sessions, setSessions] = useState<string[]>(['default']);
  const [sessionId, setSessionId] = useState('default');
  const [devices, setDevices] = useState<any[]>([]);
  const [testTargetPhone, setTestTargetPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  // Session ID Connection Mode States
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [isImportingSession, setIsImportingSession] = useState(false);
  const [sessionImportError, setSessionImportError] = useState<string | null>(null);
  const [sessionImportSuccess, setSessionImportSuccess] = useState<string | null>(null);
  const [exportedSessionId, setExportedSessionId] = useState<string | null>(null);
  const [copiedExportedId, setCopiedExportedId] = useState(false);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const loadData = () => {
    fetch(`/api/state?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(data => setBotState(prev => ({ ...prev, ...data })))
      .catch(() => {});
    fetch('/api/devices').then(r => r.json()).then(setDevices).catch(() => {});
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {});
    fetch('/api/plugins').then(r => r.json()).then(setPlugins).catch(() => {});
    fetch('/api/shop/products').then(r => r.json()).then(setProducts).catch(() => {});
    fetch('/api/shop/customers').then(r => r.json()).then(setCustomers).catch(() => {});
    fetch('/api/shop/orders').then(r => r.json()).then(setOrders).catch(() => {});
    fetch("/api/sessions").then(r => r.json()).then(setSessions).catch(() => {});
  };

  useEffect(() => {
    loadData();
    // Realtime Polling fallback every 2 seconds for QR / Pairing & Device status updates
    const timer = setInterval(() => {
      fetch(`/api/state?sessionId=${sessionId}`)
        .then(r => r.json())
        .then(data => setBotState(prev => ({ ...prev, ...data })))
        .catch(() => {});
      fetch('/api/devices').then(r => r.json()).then(setDevices).catch(() => {});
    }, 2500);

    const onStateUpdate = (data: any) => {
      setBotState(prev => ({ ...prev, ...data }));
      fetch('/api/devices').then(r => r.json()).then(setDevices).catch(() => {});
    };
    socket.on(`bot_state_${sessionId}`, onStateUpdate);

    return () => {
      clearInterval(timer);
      socket.off(`bot_state_${sessionId}`, onStateUpdate);
    };
  }, [sessionId]);

  const sendTestPing = async (targetSession = sessionId) => {
    setIsSendingTest(true);
    setTestSuccess(null);
    try {
      const res = await fetch('/api/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSession,
          targetPhone: testTargetPhone || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestSuccess(`✅ Test message successfully delivered to ${data.target}!`);
        setTimeout(() => setTestSuccess(null), 5000);
      } else {
        alert('Test Message Error: ' + (data.error || 'Failed'));
      }
    } catch(e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const connectWithSessionId = async () => {
    if (!sessionIdInput.trim()) {
      alert("Please paste your WhatsApp Session ID string.");
      return;
    }
    setIsImportingSession(true);
    setSessionImportError(null);
    setSessionImportSuccess(null);
    try {
      const res = await fetch('/api/session-id/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sessionData: sessionIdInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSessionImportSuccess(`✅ Session ID connected! WhatsApp credentials loaded for "${sessionId}". Initializing connection...`);
        setSessionIdInput('');
        setTimeout(loadData, 1500);
      } else {
        setSessionImportError(data.error || 'Failed to import Session ID.');
      }
    } catch (e: any) {
      setSessionImportError(e.message || 'Connection error');
    } finally {
      setIsImportingSession(false);
    }
  };

  const exportCurrentSessionId = async () => {
    try {
      const res = await fetch(`/api/session-id/export?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setExportedSessionId(data.sessionId);
        navigator.clipboard.writeText(data.sessionId);
        setCopiedExportedId(true);
        setTimeout(() => setCopiedExportedId(false), 3000);
      } else {
        alert(data.error || 'Could not export Session ID.');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const resetSession = async () => {
    if(confirm('Are you sure you want to reset and restart this WhatsApp connection?')) {
      setBotState(prev => ({ ...prev, qr: null, pairingCode: null }));
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
      setTimeout(loadData, 2000);
    }
  };

    const saveConfig = async () => {
    let finalConfig = { ...config };
    const baseInstruction = "\n\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]\nWhen a customer wants to place an order, ALWAYS ask for their Full Name, Delivery Address, and Contact Number. Once they provide the delivery details, output EXACTLY: [CREATE_ORDER: ProductName || CustomerName || CustomerAddress || ContactNumber]\nTo check an order status, output EXACTLY: [CHECK_ORDER: OrderID]";
    
    if (finalConfig.settings && finalConfig.settings.systemPrompt && !finalConfig.settings.systemPrompt.includes('CREATE_ORDER')) {
        finalConfig.settings.systemPrompt = finalConfig.settings.systemPrompt.replace(/\n\nIMPORTANT:.*CHECK_ORDER: OrderID\]/, '');
        finalConfig.settings.systemPrompt += baseInstruction;
    }

    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalConfig) });
    setConfig(finalConfig);
    alert('All configurations saved successfully! AI Instructions were updated.');
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
              <div className="space-y-6">
                {/* Session Tabs & Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Smartphone size={22} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">WhatsApp Connection Hub</h3>
                        <p className="text-xs text-slate-500">Manage up to 10 multi-device staff numbers for Alpha Mobile</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if(sessions.length >= 10) return alert('Max 10 devices reached');
                      const newId = prompt('Enter a unique ID for the new staff account (e.g., staff-02, support-desk):');
                      if(!newId) return;
                      const cleanId = newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                      if(!cleanId) return alert('Please enter a valid alphanumeric name');
                      const res = await fetch('/api/sessions/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sessionId: cleanId }) });
                      const data = await res.json();
                      if(data.success) { setSessions(data.sessions); setSessionId(cleanId); } else { alert(data.error); }
                    }} 
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 text-sm font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <Plus size={16} /> Link New Device
                  </button>
                </div>
                
                {/* Device Selector Pills */}
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {sessions.map(s => {
                    const isSelected = sessionId === s;
                    const isCurOnline = isSelected && botState.status === 'online';
                    return (
                      <button 
                        key={s} 
                        onClick={() => setSessionId(s)} 
                        className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all border ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25' 
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${isCurOnline ? 'bg-emerald-400 animate-pulse' : isSelected ? 'bg-amber-300' : 'bg-slate-400'}`}></span>
                        <span>{s.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b dark:border-slate-800 mb-8">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Current Session
                      </div>
                      <h4 className="text-2xl font-black flex items-center gap-3">
                        <span>Device: <span className="text-indigo-600 dark:text-indigo-400">{sessionId.toUpperCase()}</span></span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      {botState.status === 'online' ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-900/50">
                          <Wifi size={14} className="animate-pulse" /> Bot Online & Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-200 dark:border-amber-900/50">
                          <WifiOff size={14} /> Ready To Connect
                        </div>
                      )}

                      <button 
                        onClick={resetSession} 
                        title="Restart connection process"
                        className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <RefreshCcw size={18} />
                      </button>
                    </div>
                  </div>

                  {botState.status === 'online' ? (
                    <div className="py-4">
                      <div className="max-w-xl mx-auto text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                          <Check size={32} className="stroke-[3]" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">WhatsApp Device is Connected!</h3>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
                          Session: {sessionId.toUpperCase()} • Status: Active & Operational
                        </p>

                        {/* Connected Device Info Badge */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-left mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                              <Smartphone size={20} />
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Linked WhatsApp Number</div>
                              <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
                                {botState.registeredPhone ? `+${botState.registeredPhone}` : (botState.user?.phone ? `+${botState.user.phone}` : 'Connected & Active')}
                              </div>
                            </div>
                          </div>
                          {(botState.userName || botState.user?.name) && (
                            <div className="text-right">
                              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">WhatsApp Profile</div>
                              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{botState.userName || botState.user?.name}</div>
                            </div>
                          )}
                        </div>

                        {/* Instant Test Message Console */}
                        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 text-left mb-6">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5">
                            <Send size={14} /> Send WhatsApp Test Message (Confirm Bot Online)
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                            Send an immediate test WhatsApp ping to yourself or any client number:
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              value={testTargetPhone}
                              onChange={e => setTestTargetPhone(e.target.value)}
                              placeholder="Target phone (e.g. 0771234567, or leave blank for self)"
                              className="flex-1 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => sendTestPing(sessionId)}
                              disabled={isSendingTest}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Send size={13} className={isSendingTest ? 'animate-spin' : ''} />
                              <span>{isSendingTest ? 'Sending...' : 'Send Test Ping'}</span>
                            </button>
                          </div>
                          {testSuccess && (
                            <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCheck size={14} />
                              <span>{testSuccess}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            onClick={exportCurrentSessionId}
                            className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                          >
                            {copiedExportedId ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            <span>{copiedExportedId ? 'Session ID Copied!' : 'Copy Current Session ID'}</span>
                          </button>

                          <button 
                            onClick={async () => {
                              if(confirm(`Logout session "${sessionId}"?`)) {
                                await fetch('/api/logout', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sessionId }) });
                                setTimeout(loadData, 1500);
                              }
                            }} 
                            className="px-5 py-2.5 border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                          >
                            Logout Device
                          </button>
                          {sessionId !== 'default' && (
                            <button 
                              onClick={async () => {
                                if(confirm(`Delete session "${sessionId}" permanently?`)) {
                                  const res = await fetch('/api/sessions/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sessionId }) });
                                  const data = await res.json();
                                  if(data.success) { setSessions(data.sessions); setSessionId('default'); }
                                }
                              }} 
                              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                            >
                              Remove Device
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Direct Session ID Connection Center */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-6 md:p-8 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold mb-2">
                            <Key size={22} />
                            <span className="text-lg sm:text-xl">Connect WhatsApp Bot via Session ID</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Generate your <b>Session ID</b> using your external Pair Code / QR Generator web application, then paste it here to activate the bot.
                          </p>

                          <div className="space-y-4">
                            <div className="relative">
                              <textarea
                                rows={4}
                                value={sessionIdInput}
                                onChange={e => setSessionIdInput(e.target.value)}
                                placeholder="Paste your Session ID string here (e.g. SHADOW~eyJub2lzZUtleSI6... or raw base64 credentials)"
                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-xs text-slate-800 dark:text-slate-200 transition-all resize-none shadow-inner"
                              />
                              {sessionIdInput && (
                                <button
                                  onClick={() => setSessionIdInput('')}
                                  className="absolute top-3 right-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <button
                                onClick={connectWithSessionId}
                                disabled={isImportingSession || !sessionIdInput.trim()}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                {isImportingSession ? (
                                  <>
                                    <RefreshCcw size={16} className="animate-spin" />
                                    <span>Connecting WhatsApp Session...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Connect Bot with Session ID</span>
                                    <ArrowRight size={16} />
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const text = await navigator.clipboard.readText();
                                    if (text) setSessionIdInput(text.trim());
                                  } catch(e) {
                                    alert("Please allow clipboard permissions or paste manually into the text box.");
                                  }
                                }}
                                className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Copy size={14} />
                                <span>Paste from Clipboard</span>
                              </button>
                            </div>

                            {sessionImportSuccess && (
                              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs font-semibold flex items-center gap-2">
                                <CheckCheck size={16} className="shrink-0" />
                                <span>{sessionImportSuccess}</span>
                              </div>
                            )}

                            {sessionImportError && (
                              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-medium flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{sessionImportError}</span>
                              </div>
                            )}
                          </div>

                          {/* Step-by-Step Connection Instructions */}
                          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                            <p className="font-bold text-slate-700 dark:text-slate-300">How to connect with your Session ID:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <span className="font-bold text-indigo-600 block mb-1">1. Generate Session ID</span>
                                <span className="leading-relaxed">Open your deployed Pair Code / QR Generator web app and link your WhatsApp number.</span>
                              </div>
                              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <span className="font-bold text-indigo-600 block mb-1">2. Copy Received Code</span>
                                <span className="leading-relaxed">Copy the Session ID message sent to your WhatsApp (starts with <code className="font-mono">SHADOW~</code> or base64).</span>
                              </div>
                              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <span className="font-bold text-indigo-600 block mb-1">3. Paste & Connect</span>
                                <span className="leading-relaxed">Paste the code in the box above and click <b>Connect Bot</b>. The bot goes online instantly.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Linked Devices Summary Table / Cards */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b dark:border-slate-800 mb-6">
                    <div>
                      <h4 className="text-lg font-bold flex items-center gap-2">
                        <Smartphone size={18} className="text-indigo-500" />
                        <span>All Linked WhatsApp Devices & Numbers</span>
                      </h4>
                      <p className="text-xs text-slate-500">Live list of all WhatsApp staff slots and active linked phone numbers</p>
                    </div>
                    <div className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      {devices.length} / 10 Active Slots
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {devices.map(dev => {
                      const isCurrent = dev.sessionId === sessionId;
                      const isOnline = dev.status === 'online' || dev.isOnline;
                      return (
                        <div 
                          key={dev.sessionId}
                          className={`p-5 rounded-2xl border transition-all ${
                            isCurrent 
                              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 shadow-sm' 
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              <span className="font-black text-sm uppercase tracking-wide">{dev.sessionId}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isOnline 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                                : (dev.isRegistered ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300')
                            }`}>
                              {isOnline ? 'ONLINE' : (dev.isRegistered ? 'REGISTERED' : 'READY')}
                            </span>
                          </div>

                          <div className="space-y-1 mb-4">
                            <div className="text-[11px] font-semibold text-slate-400">Linked WhatsApp Number:</div>
                            <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                              {dev.phone ? `+${dev.phone}` : 'No phone linked yet'}
                            </div>
                            {dev.name && (
                              <div className="text-xs text-slate-500">
                                Profile: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{dev.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                              onClick={() => setSessionId(dev.sessionId)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                isCurrent 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isCurrent ? 'Active View' : 'Select'}
                            </button>
                            {isOnline && (
                              <button
                                onClick={() => sendTestPing(dev.sessionId)}
                                title="Send instant test WhatsApp message"
                                className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-900 cursor-pointer flex items-center gap-1"
                              >
                                <Send size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                      <input type="text" value={config.settings?.adminPassword ?? ''} onChange={e => setConfig({...config, settings: {...config.settings, adminPassword: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" placeholder="alpha123" />
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
                          <input type="time" value={config.settings?.workHourStart ?? '09:00'} onChange={e => setConfig({...config, settings: {...config.settings, workHourStart: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">End Time</label>
                          <input type="time" value={config.settings?.workHourEnd ?? '17:00'} onChange={e => setConfig({...config, settings: {...config.settings, workHourEnd: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-6 border-t dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /> DeepSeek Engine Setup <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200">🌍 MULTI-LANGUAGE AUTO-DETECT ACTIVE</span></h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">DeepSeek API Key (Core AI)</label>
                      <input type="password" value={config.settings?.deepseekKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, deepseekKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono mb-4" placeholder="sk-..." />
                      <label className="block text-sm font-medium mb-1 flex items-center gap-2"><ImageIcon size={16}/> Gemini API Key (Voice & Image Recognition)</label>
                      <p className="text-xs text-slate-500 mb-2">Required for Voice Notes & Image processing capabilities.</p>
                      <input type="password" value={config.settings?.geminiKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, geminiKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" placeholder="AIzaSy..." />
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
                        <input value={config.settings?.posApiUrl ?? ''} onChange={e => setConfig({...config, settings: {...config.settings, posApiUrl: e.target.value}})} className="flex-1 p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent" placeholder="POS API URL (https://alphapos.zone.id/api/products)" />
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

                
                {/* RECENT ORDERS */}
                <h3 className="text-lg font-semibold mt-8 mb-4 border-b pb-2 dark:border-slate-800 flex items-center gap-2"><Package size={20}/> Recent Orders</h3>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-x-auto mb-6">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium border-b dark:border-slate-700">
                      <tr>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Address</th>
                        <th className="p-4">Product</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No orders placed yet.</td></tr>
                      ) : (
                        orders.slice().reverse().map(o => (
                          <tr key={o.id} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-4 font-mono font-medium">{o.id}</td>
                            <td className="p-4 text-slate-500">{new Date(o.date).toLocaleDateString()}</td>
                            <td className="p-4 font-medium">{o.customerName || 'N/A'}</td>
                            <td className="p-4">{o.contactNumber || 'N/A'}</td>
                            <td className="p-4 max-w-xs truncate">{o.customerAddress || 'N/A'}</td>
                            <td className="p-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md font-medium text-xs">{o.productName}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
