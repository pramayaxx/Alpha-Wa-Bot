const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Icons & States
const oldImports = `import { ShoppingCart, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle, Shield, Lock, LogOut, MessageSquare, Sparkles, Save, Server, Code, LayoutDashboard, Package, TrendingUp, Users } from 'lucide-react';`;
const newImports = `import { ShoppingCart, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle, Shield, Lock, LogOut, MessageSquare, Sparkles, Save, Server, Code, LayoutDashboard, Package, TrendingUp, Users, PauseCircle, Play, Image as ImageIcon, Mic } from 'lucide-react';`;
code = code.replace(oldImports, newImports);

const oldStates = `  const [orders, setOrders] = useState<any[]>([]);`;
const newStates = `  const [orders, setOrders] = useState<any[]>([]);
  const [chats, setChats] = useState<any>({});
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [broadcastSegment, setBroadcastSegment] = useState('ALL');`;
code = code.replace(oldStates, newStates);

// 2. Fetch chats on load & socket listener
const oldLoadData = `      const res4 = await fetch('/api/shop/orders');
      setOrders(await res4.json());
    } catch(e) { console.error(e) }
  };`;
const newLoadData = `      const res4 = await fetch('/api/shop/orders');
      setOrders(await res4.json());
      const res5 = await fetch('/api/chats');
      setChats(await res5.json());
    } catch(e) { console.error(e) }
  };

  useEffect(() => {
    if (socket) {
      socket.on('live_message', (msg) => {
        setChats(prev => {
          const updated = { ...prev };
          if (!updated[msg.to]) updated[msg.to] = [];
          updated[msg.to] = [...updated[msg.to], msg];
          return updated;
        });
      });
    }
  }, []);

  const toggleAI = async (jid, currentStatus) => {
    await fetch('/api/chat/toggle-ai', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ jid, pause: !currentStatus }) });
    loadData();
  };
  
  const sendLiveMessage = async () => {
    if(!liveMessage || !selectedChat) return;
    await fetch('/api/chat/send', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ to: selectedChat, text: liveMessage }) });
    setLiveMessage('');
  };
`;
code = code.replace(oldLoadData, newLoadData);

// 3. Add to Sidebar
const oldSidebar = `<button onClick={() => setActiveTab('customers')} className={\`w-full flex items-center px-6 py-3 \${activeTab === 'customers' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-r-2 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>
            <Users size={18} className="mr-3" /> Customers
          </button>`;
const newSidebar = `<button onClick={() => setActiveTab('livechat')} className={\`w-full flex items-center px-6 py-3 \${activeTab === 'livechat' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-r-2 border-emerald-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>
            <MessageSquare size={18} className="mr-3" /> Live Web Chat
          </button>
          <button onClick={() => setActiveTab('customers')} className={\`w-full flex items-center px-6 py-3 \${activeTab === 'customers' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-r-2 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>
            <Users size={18} className="mr-3" /> CRM & Broadcast
          </button>`;
code = code.replace(oldSidebar, newSidebar);

// 4. Update Gemini API Key in Settings
const oldSettings = `<div>
                      <label className="block text-sm font-medium mb-1">DeepSeek API Key</label>
                      <input type="password" value={config.settings?.deepseekKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, deepseekKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" placeholder="sk-..." />
                    </div>`;
const newSettings = `<div>
                      <label className="block text-sm font-medium mb-1">DeepSeek API Key (Core AI)</label>
                      <input type="password" value={config.settings?.deepseekKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, deepseekKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono mb-4" placeholder="sk-..." />
                      <label className="block text-sm font-medium mb-1 flex items-center gap-2"><ImageIcon size={16}/> Gemini API Key (Voice & Image Recognition)</label>
                      <p className="text-xs text-slate-500 mb-2">Required for Voice Notes & Image processing capabilities.</p>
                      <input type="password" value={config.settings?.geminiKey || ''} onChange={e => setConfig({...config, settings: {...config.settings, geminiKey: e.target.value}})} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-transparent font-mono" placeholder="AIzaSy..." />
                    </div>`;
code = code.replace(oldSettings, newSettings);

// 5. Build Live Chat Tab and Customers Segmentation
const oldCustTab = `{/* CUSTOMERS */}`;
const newLiveChatAndCust = `
{/* LIVE CHAT */}
{activeTab === 'livechat' && (
  <div className="flex bg-white dark:bg-slate-900 rounded-2xl border shadow-sm h-[80vh] overflow-hidden">
    <div className="w-1/3 border-r dark:border-slate-800 flex flex-col">
      <div className="p-4 border-b dark:border-slate-800 font-bold flex items-center justify-between">
        <span>Active Chats</span>
        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">{Object.keys(chats).length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {customers.map(c => (
          <div key={c.jid || c.id} onClick={() => setSelectedChat(c.jid || c.id)} className={\`p-4 border-b dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 \${selectedChat === (c.jid || c.id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}\`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold truncate">{c.pushName || c.name}</span>
              {c.aiPaused ? <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded font-bold">AI PAUSED</span> : <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">AI ACTIVE</span>}
            </div>
            <div className="text-xs text-slate-500 truncate">{c.jid || c.id}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex-1 flex flex-col">
      {selectedChat ? (
        <>
          <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold">{customers.find(c => (c.jid||c.id) === selectedChat)?.pushName || 'User'}</h3>
              <p className="text-xs text-slate-500">{selectedChat}</p>
            </div>
            <button onClick={() => toggleAI(selectedChat, customers.find(c => (c.jid||c.id) === selectedChat)?.aiPaused)} className={\`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 \${customers.find(c => (c.jid||c.id) === selectedChat)?.aiPaused ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}\`}>
              {customers.find(c => (c.jid||c.id) === selectedChat)?.aiPaused ? <><Play size={16}/> Resume AI</> : <><PauseCircle size={16}/> Pause AI</>}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(chats[selectedChat] || []).map((msg, idx) => (
              <div key={idx} className={\`max-w-[80%] p-3 rounded-2xl \${msg.role === 'user' ? 'bg-slate-100 dark:bg-slate-800 rounded-tl-none self-start' : 'bg-indigo-600 text-white rounded-tr-none self-end ml-auto'}\`}>
                <div className="text-sm">{msg.content}</div>
                <div className="text-[10px] mt-1 opacity-60 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString()} {msg.isManual ? ' (Admin)' : (msg.role==='assistant' ? ' (AI)' : '')}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
            <input value={liveMessage} onChange={e => setLiveMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendLiveMessage()} placeholder="Type manual message (Pauses AI if they reply...)" className="flex-1 p-3 rounded-xl border dark:border-slate-700 bg-transparent focus:outline-none focus:border-indigo-500" />
            <button onClick={sendLiveMessage} disabled={!liveMessage} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold">Send</button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">Select a chat from the left to start messaging.</div>
      )}
    </div>
  </div>
)}

{/* CUSTOMERS */}
`;
code = code.replace(oldCustTab, newLiveChatAndCust);

// 6. Update Customer Tab to include Segment logic
const oldBroadcast = `<button onClick={sendBroadcast} disabled={isBroadcasting} className="py-2 px-6 bg-indigo-600 text-white rounded-lg">`;
const newBroadcast = `
<select value={broadcastSegment} onChange={e => setBroadcastSegment(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 mb-4 bg-transparent">
  <option value="ALL">All Customers</option>
  <option value="VIP">VIP Only</option>
  <option value="WHOLESALE">Wholesale Only</option>
  <option value="WINDOW_SHOPPER">Window Shoppers Only</option>
</select>
<button onClick={async () => {
    setIsBroadcasting(true);
    let target = customers;
    if(broadcastSegment !== 'ALL') target = target.filter(c => c.segment === broadcastSegment);
    for (let c of target) {
      try {
        await fetch('/api/shop/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'default', message: broadcastMsg }) });
      } catch(e) {}
    }
    alert('Broadcast sent to ' + target.length + ' customers!');
    setIsBroadcasting(false);
}} disabled={isBroadcasting} className="py-2 px-6 bg-indigo-600 text-white rounded-lg">`;
code = code.replace(oldBroadcast, newBroadcast);

// Add Segment to Table
const oldTr = `<td className="py-3">{c.pushName || c.name}</td>`;
const newTr = `<td className="py-3">{c.pushName || c.name} {c.segment && <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded font-bold">{c.segment}</span>}</td>`;
code = code.replace(oldTr, newTr);

fs.writeFileSync('src/App.tsx', code);
