import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { 
  Activity, 
  MessageSquare, 
  Users, 
  Settings, 
  Terminal, 
  Smartphone, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCcw, 
  Copy, 
  Check,
  AlertTriangle,
  PlayCircle,
  Sun,
  Moon
} from 'lucide-react';

const socket = io();

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [botState, setBotState] = useState({ 
    status: 'offline', 
    pairingCode: null, 
    pairingError: null,
    qr: null, 
    totalMessages: 0,
    deletedMessagesCaught: 0,
    antiLinkBlocks: 0,
    antiSpamBlocks: 0
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState('');
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true; // Default to dark for hacker vibe
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetch('/api/state').then(r => r.json()).then(data => {
      setBotState(prev => ({ ...prev, ...data }));
    }).catch(() => {});

    socket.on('bot_state', (data) => {
      setBotState(prev => ({ ...prev, ...data }));
    });

    socket.on('log', (msg) => {
      setLogs(prev => {
        const newLogs = [msg, ...prev].slice(0, 50);
        return newLogs;
      });
    });

    return () => {
      socket.off('bot_state');
      socket.off('log');
    };
  }, []);

  const requestPairingCode = async () => {
    if (!phoneInput) {
      alert("Please enter a valid WhatsApp phone number with country code (e.g. 94781234567)");
      return;
    }
    
    setIsPairingLoading(true);
    setBotState(prev => ({ ...prev, pairingCode: 'GENERATING...', pairingError: null }));
    
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success && data.code) {
        setBotState(prev => ({ ...prev, pairingCode: data.code, pairingError: null }));
      } else {
        setBotState(prev => ({ ...prev, pairingCode: null, pairingError: data.error || 'Failed to generate code.' }));
      }
    } catch (e) {
      setBotState(prev => ({ ...prev, pairingCode: null, pairingError: 'Network Error while requesting pairing code.' }));
    } finally {
      setIsPairingLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm z-10 transition-colors duration-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3">
            <MessageSquare size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">Alpha<span className="text-indigo-600 dark:text-indigo-400">Bot</span></h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'overview' 
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Activity size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'logs' 
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Terminal size={18} /> System Logs
          </button>
        </nav>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${botState.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              {botState.status === 'online' && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30"></div>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Status</p>
              <p className={`text-sm font-medium ${botState.status === 'online' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {botState.status === 'online' ? 'Connected' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-sm transition-colors duration-200">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">WhatsApp Engine v2.0</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Messages Processed</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{botState.totalMessages}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Deleted Messages</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{botState.deletedMessagesCaught}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                        <ShieldAlert size={20} className="text-rose-600 dark:text-rose-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Anti-Link Blocks</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{botState.antiLinkBlocks}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                        <ShieldCheck size={20} className="text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Anti-Spam Blocks</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{botState.antiSpamBlocks}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <Activity size={20} className="text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Smartphone size={18} className="text-indigo-600 dark:text-indigo-400" /> Device Pairing
                    </h3>
                  </div>
                  
                  <div className="p-8">
                    {botState.status === 'online' ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                          <Check size={40} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">System Online</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          WhatsApp Bot is successfully connected and processing messages. No further action is required.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-12">
                        {/* Pairing Code Section */}
                        <div className="flex-1">
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Pair with Phone Number</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your WhatsApp number to receive an 8-digit pairing code. This is the fastest way to connect.</p>
                          </div>
                          
                          <div className="space-y-4 max-w-sm">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number (with country code)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">+</span>
                                <input 
                                  type="text"
                                  value={phoneInput}
                                  onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
                                  placeholder="94770000000"
                                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all"
                                  disabled={isPairingLoading || botState.pairingCode === 'GENERATING...'}
                                />
                              </div>
                            </div>
                            
                            <button 
                              onClick={requestPairingCode}
                              disabled={isPairingLoading || !phoneInput || botState.pairingCode === 'GENERATING...'}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900 dark:disabled:text-indigo-400 text-white font-medium rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm"
                            >
                              {isPairingLoading || botState.pairingCode === 'GENERATING...' ? (
                                <RefreshCcw size={18} className="animate-spin" />
                              ) : (
                                <PlayCircle size={18} />
                              )}
                              {botState.pairingCode === 'GENERATING...' ? 'Generating Code...' : 'Get Pairing Code'}
                            </button>
                            
                            {botState.pairingError && (
                              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-2 mt-4 text-rose-700 dark:text-rose-400 text-sm">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                <p>{botState.pairingError}</p>
                              </div>
                            )}

                            {botState.pairingCode && botState.pairingCode !== 'GENERATING...' && !botState.pairingError && (
                              <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3 uppercase tracking-wider">Your Pairing Code</p>
                                <div className="text-4xl font-black text-indigo-700 dark:text-indigo-400 tracking-[0.2em] mb-4 font-mono">
                                  {botState.pairingCode}
                                </div>
                                <button 
                                  onClick={() => copyCode(botState.pairingCode!)}
                                  className="mx-auto flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
                                >
                                  {copiedCode ? <Check size={16} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={16} />}
                                  {copiedCode ? 'Copied to Clipboard' : 'Copy Code'}
                                </button>
                                <p className="text-xs text-slate-400 mt-4">Open WhatsApp &gt; Linked Devices &gt; Link with phone number instead</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:flex w-px bg-slate-200 dark:bg-slate-800"></div>

                        {/* QR Section */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Scan QR Code</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 max-w-xs">Alternatively, you can scan the QR code below from WhatsApp Linked Devices.</p>
                          
                          <div className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm relative overflow-hidden flex items-center justify-center">
                            {botState.qr ? (
                              <div className="bg-white p-2 rounded-xl">
                                <QRCodeSVG value={botState.qr} size={200} />
                              </div>
                            ) : (
                              <div className="w-[200px] h-[200px] bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 border-dashed">
                                <RefreshCcw size={32} className="animate-spin mb-3 text-slate-300 dark:text-slate-600" />
                                <span className="text-sm font-medium">Waiting for QR...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'logs' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[600px] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Terminal size={18} className="text-indigo-600 dark:text-indigo-400" /> System Terminal Stream
                  </h3>
                </div>
                <div className="flex-1 bg-slate-900 dark:bg-slate-950 p-6 overflow-y-auto">
                  <div className="space-y-1 font-mono text-sm">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 italic">No logs generated yet...</p>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className="text-slate-300">
                          <span className="text-indigo-400 mr-2">[{new Date().toLocaleTimeString()}]</span>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
