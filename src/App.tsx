import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { 
  Activity, MessageSquare, Users, Settings, Terminal, Smartphone, ShieldCheck, 
  ShieldAlert, RefreshCcw, Copy, Check, PlayCircle, Box, Gamepad2, Network, 
  Clock, ShoppingCart, Puzzle
} from 'lucide-react';

const socket = io();

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [botState, setBotState] = useState({ 
    status: 'offline', pairingCode: null, pairingError: null, qr: null 
  });
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(data => setBotState(prev => ({ ...prev, ...data }))).catch(() => {});
    fetch('/api/system-stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});

    socket.on('bot_state', data => setBotState(prev => ({ ...prev, ...data })));
    socket.on('log', msg => setLogs(prev => [msg, ...prev].slice(0, 50)));
    return () => { socket.off('bot_state'); socket.off('log'); };
  }, []);

  const requestPairingCode = async () => {
    if (!phoneInput) return alert("Enter valid WhatsApp number");
    setBotState(prev => ({ ...prev, pairingCode: 'GENERATING...' }));
    try {
      const res = await fetch('/api/pair', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput })
      });
      const data = await res.json();
      if (data.success && data.code) setBotState(prev => ({ ...prev, pairingCode: data.code }));
      else setBotState(prev => ({ ...prev, pairingCode: 'ERROR', pairingError: data.error }));
    } catch (e) {
      setBotState(prev => ({ ...prev, pairingCode: 'ERROR', pairingError: 'Network Error' }));
    }
  };

  const resetSession = async () => {
    if(confirm('Are you sure you want to reset the entire session? This will log you out.')) {
      setBotState(prev => ({ ...prev, qr: null, pairingCode: null }));
      await fetch('/api/reset', { method: 'POST' });
    }
  };

  const NavButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        activeTab === id 
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3">
            <Activity size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-lg">Central <span className="text-indigo-500">Hub</span></h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
          <NavButton id="overview" icon={Activity} label="Dashboard" />
          <NavButton id="settings" icon={Settings} label="Bot Settings" />
          <NavButton id="plugins" icon={Puzzle} label="Plugins (Levanter)" />
          <NavButton id="knight" icon={Gamepad2} label="KnightBot Games" />
          <NavButton id="dsh" icon={Network} label="DSH-IM Gateway" />
          <NavButton id="wpp" icon={Box} label="WppConnect API" />
          <NavButton id="logs" icon={Terminal} label="System Logs" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b flex justify-between items-center px-8">
          <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            Toggle Theme
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border">
                    <p className="text-sm text-slate-500">Status</p>
                    <h3 className={`text-2xl font-bold ${botState.status === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {botState.status.toUpperCase()}
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border">
                    <p className="text-sm text-slate-500">Uptime</p>
                    <h3 className="text-2xl font-bold">{stats?.uptime || '00:00:00'}</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border">
                    <p className="text-sm text-slate-500">Memory Usage</p>
                    <h3 className="text-2xl font-bold">{stats?.memory?.rss || '0 MB'}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Smartphone /> Device Pairing</h3>
                    <button onClick={resetSession} className="px-4 py-2 bg-rose-100 text-rose-600 rounded-lg text-sm font-medium">
                      Reset Session
                    </button>
                  </div>

                  {botState.status === 'online' ? (
                    <div className="text-center py-10"><Check size={48} className="mx-auto text-emerald-500 mb-4"/> Connected Successfully!</div>
                  ) : (
                    <div className="flex gap-12 items-center">
                      <div className="flex-1">
                        <label className="block text-sm mb-2">Phone Number</label>
                        <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="9470000000" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-4" />
                        <button onClick={requestPairingCode} className="w-full py-3 bg-indigo-600 text-white rounded-lg">Get Pairing Code</button>
                        {botState.pairingCode && <div className="mt-4 p-4 text-center text-3xl font-mono tracking-widest bg-slate-100 dark:bg-slate-800 rounded-lg">{botState.pairingCode}</div>}
                        {botState.pairingError && <div className="mt-4 text-rose-500">{botState.pairingError}</div>}
                      </div>
                      <div className="w-px bg-slate-200 self-stretch"></div>
                      <div className="flex-1 text-center">
                        <p className="mb-4">Or scan QR Code</p>
                        {botState.qr ? <div className="inline-block p-4 bg-white rounded-xl"><QRCodeSVG value={botState.qr} size={200}/></div> : <div className="h-[200px] flex items-center justify-center text-slate-400 border-2 border-dashed rounded-xl">Waiting for QR...</div>}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm">
                <h3 className="text-lg font-semibold mb-6">Bot Configuration</h3>
                {settings ? (
                  <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm">{JSON.stringify(settings, null, 2)}</pre>
                ) : <p>Loading settings...</p>}
                <p className="mt-4 text-sm text-slate-500">Note: API endpoints detected in backend (/api/settings) are now connected.</p>
              </div>
            )}

            {activeTab === 'knight' && (
              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
                   <h3 className="font-semibold mb-2">Truth or Dare</h3>
                   <button className="px-4 py-2 bg-indigo-600 text-white rounded mr-2" onClick={() => fetch('/api/knight/games/truth-dare?type=truth').then(r=>r.json()).then(d=>alert(d.prompt))}>Truth</button>
                   <button className="px-4 py-2 bg-rose-600 text-white rounded" onClick={() => fetch('/api/knight/games/truth-dare?type=dare').then(r=>r.json()).then(d=>alert(d.prompt))}>Dare</button>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
                   <h3 className="font-semibold mb-2">8-Ball Predictor</h3>
                   <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => fetch('/api/knight/games/8ball').then(r=>r.json()).then(d=>alert(d.answer))}>Shake 8-Ball</button>
                 </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 h-[600px] overflow-y-auto font-mono text-sm text-slate-300">
                {logs.map((l, i) => <div key={i}>$ {l}</div>)}
              </div>
            )}
            
            {['plugins', 'dsh', 'wpp'].includes(activeTab) && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm text-center py-20">
                <IconDisplay tab={activeTab} />
                <h3 className="text-xl font-semibold mt-4 mb-2">Backend Detected</h3>
                <p className="text-slate-500 max-w-md mx-auto">This section has been restored. The backend API routes for {activeTab.toUpperCase()} are intact. Full UI reconstruction is underway based on your original endpoints.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

const IconDisplay = ({tab}: {tab: string}) => {
  if (tab === 'plugins') return <Puzzle size={48} className="mx-auto text-indigo-500" />;
  if (tab === 'dsh') return <Network size={48} className="mx-auto text-indigo-500" />;
  return <Box size={48} className="mx-auto text-indigo-500" />;
}
