import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Users, Database, Radio, Activity, Send, ShieldAlert, Cpu, QrCode, ScanLine, Smartphone, ExternalLink, MessageSquare, ShoppingCart, Calendar, BellOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

// Connect to same host
const socket = io();

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [botState, setBotState] = useState({ status: 'offline', pairingCode: null, qr: null });
  const [contacts, setContacts] = useState([]);
  const [shopInfo, setShopInfo] = useState('');
  
  // Advanced States
  const [chatHistory, setChatHistory] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [settings, setSettings] = useState({ mutedUsers: [] });
  
  // Sub forms
  const [phoneInput, setPhoneInput] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedMsg, setSchedMsg] = useState('');
  
  const [logs, setLogs] = useState(['[SYSTEM] Alpha WA Bot UI Initialized...']);
  const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.on('bot_state', setBotState);
    socket.on('chat_history_full', setChatHistory);
    socket.on('new_message', (data) => {
      setChatHistory(prev => {
        const h = { ...prev };
        if (!h[data.number]) h[data.number] = [];
        h[data.number] = [...h[data.number], data.message];
        return h;
      });
    });
    socket.on('settings_update', setSettings);

    return () => {
      socket.off('bot_state');
      socket.off('chat_history_full');
      socket.off('new_message');
      socket.off('settings_update');
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeChat]);

  const fetchData = async () => {
    fetch('/api/contacts').then(r => r.json()).then(setContacts);
    fetch('/api/shop').then(r => r.json()).then(data => setShopInfo(JSON.stringify(data, null, 2)));
    fetch('/api/orders').then(r => r.json()).then(setOrders);
    fetch('/api/schedules').then(r => r.json()).then(setSchedules);
    fetch('/api/settings').then(r => r.json()).then(setSettings);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // --- Handlers ---
  const sendAdminChat = (e) => {
    e.preventDefault();
    if (!chatInput || !activeChat) return;
    socket.emit('admin_send_msg', { number: activeChat, text: chatInput });
    setChatInput('');
  };

  const toggleMute = (number) => socket.emit('toggle_mute', number);

  const scheduleBroadcast = async () => {
    if (!schedTime || !schedMsg) return alert('Fill time (Cron format e.g. "0 9 * * *") and message');
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: schedTime, message: schedMsg })
    });
    setSchedTime(''); setSchedMsg('');
    fetchData();
  };

  const saveShopInfo = async () => {
    try {
      const parsed = JSON.parse(shopInfo);
      await fetch('/api/shop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
      addLog('Shop parameters successfully updated.');
      alert('💀 Data Overwritten Successfully.');
    } catch (e) { alert('💀 INVALID JSON SYNTAX. FIX IT.'); }
  };

  const requestPairingCode = async () => {
    if (!phoneInput) return alert("💀 Enter phone number");
    addLog(`Requesting pairing code for ${phoneInput}...`);
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput })
      });
      const data = await res.json();
      if (!data.success) alert(`💀 ${data.error}`);
    } catch (e) { addLog('Network Error.'); }
  };

  // --- UI Renders ---
  const renderAuthUI = () => (
    <div className="bg-gradient-to-b from-cyan-950/20 to-black/40 border border-cyan-800 p-8 flex flex-col items-center justify-center min-h-[350px] relative">
      {botState.status === 'online' ? (
        <div className="text-center flex flex-col items-center gap-6">
          <Activity size={50} className="text-cyan-300 animate-pulse" />
          <p className="text-2xl font-black text-cyan-300 tracking-[0.2em]">NEURAL LINK ACTIVE</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4 md:border-r border-cyan-900/50 md:pr-8">
            <p className="text-cyan-600 text-xs tracking-widest uppercase flex items-center gap-2"><ScanLine size={16} /> Matrix QR</p>
            {botState.qr ? <QRCodeSVG value={botState.qr} size={200} /> : <div className="w-[200px] h-[200px] border border-cyan-900 flex items-center justify-center text-xs text-cyan-800">WAITING...</div>}
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-fuchsia-500 text-xs tracking-widest uppercase flex items-center gap-2"><Smartphone size={16} /> Pairing Code</p>
            {botState.pairingCode ? (
              <div className="text-4xl font-black tracking-[0.25em] text-fuchsia-400">{botState.pairingCode}</div>
            ) : (
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <input type="text" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="Bot Number (947X...)" className="w-full bg-black border border-cyan-800 p-3 text-cyan-400 text-center" />
                <button onClick={requestPairingCode} className="w-full bg-fuchsia-900 border-2 border-fuchsia-500 text-fuchsia-300 py-2 uppercase tracking-widest font-bold">Request Code</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030014] text-cyan-400 font-mono p-4 md:p-6 flex flex-col relative">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-[#030014] to-[#030014] z-0"></div>
      
      {/* HEADER */}
      <header className="relative z-10 border-b border-cyan-900 pb-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Terminal size={32} className="text-fuchsia-500" />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">ALPHA_WA_BOT_NEXUS</h1>
            <p className="text-cyan-700 text-xs tracking-widest uppercase">Multi-Agent Operations Command</p>
          </div>
        </div>
        <div className={`px-4 py-1 border-2 flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${botState.status === 'online' ? 'border-cyan-500 text-cyan-400' : 'border-red-500 text-red-500'}`}>
          <Activity size={16} className={botState.status === 'online' ? 'animate-spin-slow' : ''} /> {botState.status}
        </div>
      </header>

      {/* LAYOUT */}
      <div className="relative z-10 flex flex-col md:flex-row gap-6 flex-1 h-[calc(100vh-140px)]">
        
        {/* NAV */}
        <nav className="w-full md:w-56 flex flex-col gap-2 shrink-0">
          {[
            { id: 'overview', icon: Cpu, label: 'SYSTEM CORE' },
            { id: 'live_chat', icon: MessageSquare, label: 'LIVE CHAT' },
            { id: 'orders', icon: ShoppingCart, label: 'ORDERS / CART' },
            { id: 'schedules', icon: Calendar, label: 'SCHEDULES' },
            { id: 'contacts', icon: Users, label: 'CRM / ENTITIES' },
            { id: 'shop', icon: Database, label: 'NEURAL PAYLOAD' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 p-3 text-left border-l-4 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === t.id ? 'border-fuchsia-500 bg-fuchsia-900/20 text-fuchsia-300' : 'border-cyan-900/50 text-cyan-600 hover:text-cyan-300'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        {/* CONTENT */}
        <main className="flex-1 border border-cyan-900/50 bg-black/60 p-6 flex flex-col overflow-hidden relative backdrop-blur-sm">
          
          {/* SYSTEM CORE */}
          {activeTab === 'overview' && (
            <div className="overflow-auto flex flex-col gap-6">
              <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest border-b border-cyan-900 pb-2"><ShieldAlert size={18}/> SYSTEM AUTH</h2>
              {renderAuthUI()}
              <div className="mt-2 border border-cyan-900/50 bg-black/80 p-3 h-40 overflow-y-auto font-mono text-xs text-cyan-600">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            </div>
          )}

          {/* LIVE CHAT */}
          {activeTab === 'live_chat' && (
            <div className="flex h-full gap-4">
              <div className="w-1/3 border border-cyan-900/50 flex flex-col">
                <div className="p-3 border-b border-cyan-900 bg-cyan-950/30 text-xs font-bold uppercase tracking-widest text-cyan-500">Active Sessions</div>
                <div className="overflow-y-auto flex-1">
                  {Object.keys(chatHistory).map(num => (
                    <button key={num} onClick={() => setActiveChat(num)} className={`w-full text-left p-3 border-b border-cyan-900/30 flex justify-between items-center hover:bg-cyan-900/20 ${activeChat === num ? 'bg-cyan-900/40 text-cyan-300' : 'text-cyan-600'}`}>
                      <span className="font-mono text-sm">{num}</span>
                      {settings.mutedUsers.includes(num) && <BellOff size={14} className="text-red-500" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-2/3 border border-cyan-900/50 flex flex-col relative">
                {activeChat ? (
                  <>
                    <div className="p-3 border-b border-cyan-900 bg-cyan-950/30 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-cyan-400">Target: {activeChat}</span>
                      <button onClick={() => toggleMute(activeChat)} className={`text-xs px-2 py-1 uppercase tracking-widest ${settings.mutedUsers.includes(activeChat) ? 'bg-red-900/50 text-red-400 border border-red-500' : 'bg-cyan-900/50 text-cyan-400 border border-cyan-500'}`}>
                        {settings.mutedUsers.includes(activeChat) ? 'Bot Muted (Admin Manual Mode)' : 'Bot Active (AI Auto-Reply)'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                      {chatHistory[activeChat]?.map((msg, i) => (
                        <div key={i} className={`max-w-[80%] p-3 rounded-sm text-sm font-mono ${msg.role === 'user' ? 'self-start bg-cyan-950/40 border border-cyan-900 text-cyan-300' : msg.role === 'admin' ? 'self-end bg-fuchsia-950/40 border border-fuchsia-900 text-fuchsia-300' : 'self-end bg-gray-900 border border-gray-700 text-gray-400'}`}>
                          <div className="text-[10px] uppercase opacity-50 mb-1">{msg.role} - {new Date(msg.timestamp).toLocaleTimeString()}</div>
                          {msg.content}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendAdminChat} className="border-t border-cyan-900 p-3 flex gap-2">
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send message as Admin..." className="flex-1 bg-black border border-cyan-800 p-2 text-sm focus:border-cyan-400 focus:outline-none" />
                      <button type="submit" className="bg-cyan-900 text-cyan-300 px-4 flex items-center justify-center hover:bg-cyan-700"><Send size={18} /></button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-cyan-800 text-sm uppercase tracking-widest">Select a chat session</div>
                )}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest border-b border-cyan-900 pb-2 mb-4"><ShoppingCart size={18}/> DIGITAL CART LOGS</h2>
              <div className="flex-1 overflow-auto border border-cyan-900/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cyan-950 text-cyan-400 sticky top-0">
                    <tr><th className="p-3 border-b border-cyan-800">Order ID</th><th className="p-3 border-b border-cyan-800">Customer</th><th className="p-3 border-b border-cyan-800">Item Details</th><th className="p-3 border-b border-cyan-800">Status</th><th className="p-3 border-b border-cyan-800">Time</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={i} className="border-b border-cyan-900/30 hover:bg-cyan-900/20">
                        <td className="p-3 text-cyan-500 font-bold">{o.id}</td><td className="p-3">{o.customer}</td><td className="p-3">{o.item}</td><td className="p-3"><span className={`px-2 py-1 ${o.status === 'Pending' ? 'bg-yellow-900/50 text-yellow-500' : 'bg-green-900/50 text-green-400'}`}>{o.status}</span></td><td className="p-3 font-mono opacity-50">{new Date(o.date).toLocaleString()}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-cyan-800">No orders logged.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCHEDULES */}
          {activeTab === 'schedules' && (
            <div className="flex flex-col h-full gap-4">
              <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest border-b border-cyan-900 pb-2"><Calendar size={18}/> BROADCAST SCHEDULER</h2>
              <div className="flex gap-4 items-end bg-black/40 p-4 border border-cyan-900">
                <div className="flex flex-col flex-1 gap-2">
                  <label className="text-xs uppercase text-cyan-600">Cron Format (e.g. "0 9 * * *" for 9AM everyday):</label>
                  <input type="text" value={schedTime} onChange={e => setSchedTime(e.target.value)} placeholder="Cron string..." className="bg-black border border-cyan-800 p-2 text-sm focus:border-cyan-400" />
                </div>
                <div className="flex flex-col flex-[2] gap-2">
                  <label className="text-xs uppercase text-cyan-600">Broadcast Payload:</label>
                  <input type="text" value={schedMsg} onChange={e => setSchedMsg(e.target.value)} placeholder="Message text..." className="bg-black border border-cyan-800 p-2 text-sm focus:border-cyan-400" />
                </div>
                <button onClick={scheduleBroadcast} className="bg-fuchsia-900 text-fuchsia-300 px-6 py-2 uppercase text-sm font-bold border border-fuchsia-500 hover:bg-fuchsia-700">INJECT</button>
              </div>
              <div className="flex-1 overflow-auto border border-cyan-900/50 mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cyan-950 text-cyan-400 sticky top-0">
                    <tr><th className="p-3 border-b border-cyan-800">ID</th><th className="p-3 border-b border-cyan-800">Cron Schedule</th><th className="p-3 border-b border-cyan-800">Payload</th><th className="p-3 border-b border-cyan-800">Status</th></tr>
                  </thead>
                  <tbody>
                    {schedules.map((s, i) => (
                      <tr key={i} className="border-b border-cyan-900/30">
                        <td className="p-3 text-cyan-700">{s.id}</td><td className="p-3 text-fuchsia-400">{s.time}</td><td className="p-3">{s.message}</td><td className="p-3">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CRM */}
          {activeTab === 'contacts' && (
            <div className="flex flex-col h-full">
              <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest border-b border-cyan-900 pb-2 mb-4"><Users size={18}/> CRM ENTITIES</h2>
              <div className="flex-1 overflow-auto border border-cyan-900/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cyan-950 text-cyan-400 sticky top-0">
                    <tr><th className="p-3 border-b border-cyan-800">Number</th><th className="p-3 border-b border-cyan-800">Push Name</th><th className="p-3 border-b border-cyan-800">Tags</th><th className="p-3 border-b border-cyan-800">Timestamp</th></tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={i} className="border-b border-cyan-900/30 hover:bg-cyan-900/20">
                        <td className="p-3 font-bold text-cyan-400">{c.number}</td><td className="p-3">{c.pushName}</td><td className="p-3"><span className="bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded-sm">{c.tags?.join(', ') || 'None'}</span></td><td className="p-3 font-mono opacity-50">{new Date(c.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NEURAL PAYLOAD */}
          {activeTab === 'shop' && (
            <div className="flex flex-col h-full gap-4">
              <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest border-b border-cyan-900 pb-2"><Database size={18}/> NEURAL CORE CONFIG</h2>
              <textarea 
                className="flex-1 bg-black/80 border border-cyan-800/50 text-cyan-300 p-4 font-mono text-xs focus:outline-none focus:border-fuchsia-500 resize-none leading-relaxed"
                value={shopInfo} onChange={(e) => setShopInfo(e.target.value)} spellCheck="false"
              />
              <button onClick={saveShopInfo} className="bg-fuchsia-950 border-2 border-fuchsia-500 text-fuchsia-400 py-3 text-sm font-black tracking-widest uppercase hover:bg-fuchsia-800">OVERWRITE JSON CONFIG</button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
