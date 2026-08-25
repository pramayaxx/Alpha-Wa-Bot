import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Users, Database, Radio, Activity, Send, ShieldAlert, Cpu, 
  QrCode, ScanLine, Smartphone, ExternalLink, MessageSquare, ShoppingCart, 
  Calendar, BellOff, Zap, Sliders, Volume2, Globe, BookOpen, Image, 
  Music, Quote, CheckCircle, XCircle, Play, Server, Clock, HardDrive,
  Shield, Trash2, Code2, Webhook, Plus, Eye, Check, Gamepad2, Swords,
  Sparkles, HelpCircle, Smile, Flame, RefreshCw, UserX, UserCheck, VolumeX,
  Share2, Film, Download, ShieldCheck, Network, Brain, Layers, Workflow,
  FileText, SlidersHorizontal, Cable, MessageCircle, SendHorizontal
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

const socket = io();

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [botState, setBotState] = useState({ 
    status: 'offline', 
    pairingCode: null, 
    qr: null, 
    totalMessages: 0,
    deletedMessagesCaught: 0,
    antiLinkBlocks: 0,
    antiSpamBlocks: 0
  });
  const [contacts, setContacts] = useState([]);
  const [shopInfo, setShopInfo] = useState('');
  
  // Advanced States
  const [chatHistory, setChatHistory] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [deletedLogs, setDeletedLogs] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  
  // DSH-IM (DeepSeek Harness IM Connector) States
  const [dshChannels, setDshChannels] = useState([]);
  const [dshWorkspaces, setDshWorkspaces] = useState([]);
  const [dshDocs, setDshDocs] = useState([]);
  const [dshRelayLogs, setDshRelayLogs] = useState([]);
  const [dshSelectedChannel, setDshSelectedChannel] = useState(null);
  const [dshRelaySource, setDshRelaySource] = useState('WhatsApp');
  const [dshRelayTarget, setDshRelayTarget] = useState('Telegram');
  const [dshRelayMessage, setDshRelayMessage] = useState('');
  const [dshRelaySending, setDshRelaySending] = useState(false);
  const [dshDeepSeekPrompt, setDshDeepSeekPrompt] = useState('Explain how DSH-IM bridges multi-channel bots to DeepSeek reasoning models.');
  const [dshDeepSeekModel, setDshDeepSeekModel] = useState('deepseek-reasoner');
  const [dshDeepSeekResult, setDshDeepSeekResult] = useState(null);
  const [dshIsRunningDeepSeek, setDshIsRunningDeepSeek] = useState(false);
  const [dshNewDocTitle, setDshNewDocTitle] = useState('');
  const [dshNewDocCategory, setDshNewDocCategory] = useState('Knowledge Base');
  const [dshNewDocContent, setDshNewDocContent] = useState('');
  const [dshShowNewDocModal, setDshShowNewDocModal] = useState(false);
  const [dshWebhookPayload, setDshWebhookPayload] = useState('{"event": "message_create", "user": "TelegramUser99", "text": "Testing DSH-IM multi-channel gateway"}');
  const [dshWebhookChannel, setDshWebhookChannel] = useState('telegram');
  const [dshWebhookSending, setDshWebhookSending] = useState(false);

  // WPPConnect (WhatsApp Web Automation & WA-JS Framework) States
  const [wppSessions, setWppSessions] = useState([]);
  const [wppActiveSession, setWppActiveSession] = useState('session-default');
  const [wppStories, setWppStories] = useState([]);
  const [wppLogs, setWppLogs] = useState([]);
  const [wppTargetPhone, setWppTargetPhone] = useState('94781112233');
  const [wppMsgText, setWppMsgText] = useState('Hello from WPPConnect Automation Engine!');
  const [wppButtonTitle, setWppButtonTitle] = useState('ALPHA BOT EXCLUSIVE SERVICES');
  const [wppButtonMsg, setWppButtonMsg] = useState('Select an option below to trigger instant WhatsApp bot workflows:');
  const [wppButton1, setWppButton1] = useState('⚡ Verify Account');
  const [wppButton2, setWppButton2] = useState('📋 View Main Menu');
  const [wppButton3, setWppButton3] = useState('📞 Support Live Desk');
  const [wppPollTitle, setWppPollTitle] = useState('Vote for the best WhatsApp Bot stack:');
  const [wppPollOpt1, setWppPollOpt1] = useState('WPPConnect (WA-JS)');
  const [wppPollOpt2, setWppPollOpt2] = useState('Levanter-MD / Baileys');
  const [wppPollOpt3, setWppPollOpt3] = useState('Knightbot-MD');
  const [wppPollOpt4, setWppPollOpt4] = useState('DeepSeek Harness (DSH-IM)');
  const [wppStoryText, setWppStoryText] = useState('⚡ ALPHA WA BOT status story broadcast powered by WPPConnect v3.1!');
  const [wppStoryBg, setWppStoryBg] = useState('#0f172a');
  const [wppWajsCode, setWppWajsCode] = useState('await WPP.profile.getMyProfilePicture();');
  const [wppWajsResult, setWppWajsResult] = useState(null);
  const [wppIsExecutingWajs, setWppIsExecutingWajs] = useState(false);
  const [wppNewSessionName, setWppNewSessionName] = useState('');
  const [wppNewSessionPhone, setWppNewSessionPhone] = useState('');
  const [wppShowNewSessionModal, setWppShowNewSessionModal] = useState(false);
  const [wppSendingAction, setWppSendingAction] = useState(false);

  // Knightbot-MD Interactive States
  const [knightTtt, setKnightTtt] = useState({
    board: ['1','2','3','4','5','6','7','8','9'],
    turn: 'X',
    winner: null,
    scoreX: 0,
    scoreO: 0
  });
  const [knightTrivia, setKnightTrivia] = useState(null);
  const [knightTriviaAnswer, setKnightTriviaAnswer] = useState(null);
  const [knightTriviaXp, setKnightTriviaXp] = useState(40);
  const [knightTruthDare, setKnightTruthDare] = useState({ type: 'truth', prompt: 'What is the most illegal or mischievous thing you\'ve ever done on a computer?' });
  const [knight8BallQ, setKnight8BallQ] = useState('Will our WhatsApp automation bot become the best in Sri Lanka?');
  const [knight8BallAns, setKnight8BallAns] = useState('🎱 Without a doubt.');
  const [knightJoke, setKnightJoke] = useState({ setup: 'Why do programmers prefer dark mode?', punchline: 'Because light attracts bugs!' });
  const [knightWarns, setKnightWarns] = useState({ '94781112233': 2, '94712345678': 1 });
  const [knightAttpText, setKnightAttpText] = useState('KNIGHT LEVANTER V4');
  const [knightEmoji1, setKnightEmoji1] = useState('🔥');
  const [knightEmoji2, setKnightEmoji2] = useState('🤖');
  const [knightMediaUrl, setKnightMediaUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [knightMediaResult, setKnightMediaResult] = useState(null);
  const [isCleaningCache, setIsCleaningCache] = useState(false);

  const [settings, setSettings] = useState({
    workType: 'public',
    prefix: '!',
    ownerNumber: '94781574894',
    botName: 'KNIGHT-LEVANTER MD V4.0',
    botBanner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    botLang: 'en',
    aliveMsg: '⚡ KNIGHT-LEVANTER MD IS ONLINE & FORTIFIED',
    plugins: {
      ai: true,
      tts: true,
      translate: true,
      wiki: true,
      stickers: true,
      qr: true,
      orders: true,
      groupAdmin: true,
      quotes: true,
      songSearch: true,
      antidelete: true,
      antilink: true,
      antispam: true,
      antiword: true,
      welcomeGoodbye: true,
      readReceipts: true,
      games: true,
      warnSystem: true,
      attp: true,
      emojimix: true,
      mediaDownloader: true,
      funCommands: true
    },
    bannedWords: ['spam', 'free money', 't.me/', 'whatsapp.com/channel/'],
    customPlugins: [
      { name: 'calc', desc: 'Quick math evaluator', code: 'return eval(args.join(" "));' },
      { name: 'flip', desc: 'Coin flipper', code: 'return Math.random() > 0.5 ? "🪙 Heads!" : "🪙 Tails!";' },
      { name: 'roll', desc: 'Dice roller', code: 'return `🎲 You rolled: ${Math.floor(Math.random() * 6) + 1}`;' }
    ],
    mutedUsers: []
  });
  
  // Telemetry
  const [systemStats, setSystemStats] = useState(null);
  
  // Sub forms
  const [phoneInput, setPhoneInput] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedMsg, setSchedMsg] = useState('');
  
  // Custom Plugin Creator Form
  const [newPlugName, setNewPlugName] = useState('');
  const [newPlugDesc, setNewPlugDesc] = useState('');
  const [newPlugCode, setNewPlugCode] = useState('return `Hello from custom plugin! You sent: ${args.join(" ")}`;');
  
  // API Mode Test Form
  const [apiRecipient, setApiRecipient] = useState('');
  const [apiMsgPayload, setApiMsgPayload] = useState('');
  const [apiSending, setApiSending] = useState(false);
  
  // Command Simulator
  const [simCommand, setSimCommand] = useState('!alive');
  const [simOutput, setSimOutput] = useState('Type a command or pick a preset above to test Levanter-MD engine.');
  const [simLoading, setSimLoading] = useState(false);
  
  const [logs, setLogs] = useState(['[SYSTEM] Levanter-MD Multi-Session Bot UI Initialized...']);
  const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.on('bot_state', setBotState);
    socket.on('chat_history_full', setChatHistory);
    socket.on('deleted_messages', setDeletedLogs);
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
      socket.off('deleted_messages');
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
    fetch('/api/contacts').then(r => r.json()).then(setContacts).catch(() => {});
    fetch('/api/shop').then(r => r.json()).then(data => setShopInfo(JSON.stringify(data, null, 2))).catch(() => {});
    fetch('/api/orders').then(r => r.json()).then(setOrders).catch(() => {});
    fetch('/api/schedules').then(r => r.json()).then(setSchedules).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});
    fetch('/api/antidelete-logs').then(r => r.json()).then(setDeletedLogs).catch(() => {});
    fetch('/api/webhook-logs').then(r => r.json()).then(setWebhookLogs).catch(() => {});
    fetch('/api/system-stats').then(r => r.json()).then(setSystemStats).catch(() => {});
    fetch('/api/knight/warnings').then(r => r.json()).then(setKnightWarns).catch(() => {});
    fetch('/api/knight/games/trivia').then(r => r.json()).then(setKnightTrivia).catch(() => {});
    fetch('/api/dsh-im/channels').then(r => r.json()).then(setDshChannels).catch(() => {});
    fetch('/api/dsh-im/workspaces').then(r => r.json()).then(setDshWorkspaces).catch(() => {});
    fetch('/api/dsh-im/docs').then(r => r.json()).then(setDshDocs).catch(() => {});
    fetch('/api/dsh-im/relay-logs').then(r => r.json()).then(setDshRelayLogs).catch(() => {});
    fetch('/api/wppconnect/sessions').then(r => r.json()).then(setWppSessions).catch(() => {});
    fetch('/api/wppconnect/stories').then(r => r.json()).then(setWppStories).catch(() => {});
    fetch('/api/wppconnect/logs').then(r => r.json()).then(setWppLogs).catch(() => {});
  };

  // --- Knightbot Interactive Handlers ---
  const checkTttWinner = (b) => {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let w of wins) {
      if (b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return b[w[0]];
    }
    if (b.every(c => c === 'X' || c === 'O')) return 'tie';
    return null;
  };

  const playTttCell = (index) => {
    if (knightTtt.winner || knightTtt.board[index] === 'X' || knightTtt.board[index] === 'O') return;
    
    const newBoard = [...knightTtt.board];
    newBoard[index] = 'X';
    
    let winner = checkTttWinner(newBoard);
    let newScoreX = knightTtt.scoreX;
    let newScoreO = knightTtt.scoreO;

    if (winner === 'X') {
      newScoreX += 1;
      setKnightTtt({ ...knightTtt, board: newBoard, winner: 'X', scoreX: newScoreX });
      return;
    } else if (winner === 'tie') {
      setKnightTtt({ ...knightTtt, board: newBoard, winner: 'tie' });
      return;
    }

    // AI Turn
    const available = newBoard.map((v, i) => (v !== 'X' && v !== 'O' ? i : null)).filter(v => v !== null);
    if (available.length > 0) {
      const aiPick = available[Math.floor(Math.random() * available.length)];
      newBoard[aiPick] = 'O';
      winner = checkTttWinner(newBoard);
      if (winner === 'O') newScoreO += 1;
    }

    setKnightTtt({
      ...knightTtt,
      board: newBoard,
      winner: winner || null,
      scoreX: newScoreX,
      scoreO: newScoreO
    });
  };

  const resetTtt = () => {
    setKnightTtt(prev => ({
      ...prev,
      board: ['1','2','3','4','5','6','7','8','9'],
      turn: 'X',
      winner: null
    }));
  };

  const fetchKnightTrivia = async () => {
    try {
      const res = await fetch('/api/knight/games/trivia');
      const data = await res.json();
      setKnightTrivia(data);
      setKnightTriviaAnswer(null);
    } catch(e){}
  };

  const submitKnightTriviaAnswer = async (ansIndex) => {
    if (!knightTrivia || knightTriviaAnswer !== null) return;
    try {
      const res = await fetch('/api/knight/games/trivia/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: knightTrivia.id, answerIndex: ansIndex })
      });
      const data = await res.json();
      setKnightTriviaAnswer(data);
      if (data.isCorrect) {
        setKnightTriviaXp(prev => prev + 10);
      }
    } catch(e){}
  };

  const fetchKnightTruthDare = async (type) => {
    try {
      const res = await fetch(`/api/knight/games/truth-dare?type=${type}`);
      const data = await res.json();
      setKnightTruthDare(data);
    } catch(e){}
  };

  const askKnight8Ball = async () => {
    try {
      const res = await fetch(`/api/knight/games/8ball?q=${encodeURIComponent(knight8BallQ)}`);
      const data = await res.json();
      setKnight8BallAns(data.answer);
    } catch(e){}
  };

  const fetchKnightJoke = async () => {
    try {
      const res = await fetch('/api/knight/games/joke');
      const data = await res.json();
      setKnightJoke(data);
    } catch(e){}
  };

  const resetKnightWarns = async (user) => {
    try {
      const res = await fetch('/api/knight/warnings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
      const data = await res.json();
      setKnightWarns(data.warns || {});
      alert('⚡ Warning strikes cleared.');
    } catch(e){}
  };

  const cleanKnightSystemCache = async () => {
    setIsCleaningCache(true);
    try {
      const res = await fetch('/api/knight/system/clean', { method: 'POST' });
      const data = await res.json();
      addLog(`🧹 Cleaned cache: ${data.filesDeleted || 0} media temp files purged.`);
      alert(`🧹 Cache Cleaned! ${data.filesDeleted || 0} files purged.`);
    } catch(e) {
      alert('Clean cache error.');
    } finally {
      setIsCleaningCache(false);
    }
  };

  // --- DSH-IM (DeepSeek Harness IM Connector) Handlers ---
  const toggleDshChannel = async (id) => {
    try {
      const res = await fetch(`/api/dsh-im/channels/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDshChannels(data.channels);
        addLog(`⚡ DSH-IM Channel [${id.toUpperCase()}] status: ${data.channel.enabled ? 'ONLINE' : 'IDLE'}`);
      }
    } catch(e) {
      alert('Toggle channel failed');
    }
  };

  const sendDshRelay = async (e) => {
    e.preventDefault();
    if (!dshRelayMessage) return alert('Enter relay message payload');
    setDshRelaySending(true);
    try {
      const res = await fetch('/api/dsh-im/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: dshRelaySource, target: dshRelayTarget, message: dshRelayMessage })
      });
      const data = await res.json();
      if (data.success) {
        setDshRelayMessage('');
        setDshRelayLogs(data.relayLogs);
        addLog(`⚡ DSH-IM Relay dispatched: [${dshRelaySource}] ➔ [${dshRelayTarget}]`);
        alert(`⚡ Message dispatched across IM Gateway: ${dshRelaySource} ➔ ${dshRelayTarget}`);
      }
    } catch(e) {
      alert('Relay failed');
    } finally {
      setDshRelaySending(false);
    }
  };

  const runDeepSeekInference = async () => {
    if (!dshDeepSeekPrompt) return alert('Enter prompt for DeepSeek reasoning');
    setDshIsRunningDeepSeek(true);
    setDshDeepSeekResult(null);
    try {
      const res = await fetch('/api/dsh-im/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: dshDeepSeekPrompt, model: dshDeepSeekModel })
      });
      const data = await res.json();
      if (data.success) {
        setDshDeepSeekResult(data);
        addLog(`🧠 DeepSeek Harness [${data.model}] inference completed in ${data.durationMs}ms (${data.tokens} tokens)`);
      }
    } catch(e) {
      alert('DeepSeek inference error');
    } finally {
      setDshIsRunningDeepSeek(false);
    }
  };

  const createDshDoc = async (e) => {
    e.preventDefault();
    if (!dshNewDocTitle || !dshNewDocContent) return alert('Title & Content required');
    try {
      const res = await fetch('/api/dsh-im/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: dshNewDocTitle, category: dshNewDocCategory, content: dshNewDocContent })
      });
      const data = await res.json();
      if (data.success) {
        setDshDocs(data.docs);
        setDshNewDocTitle('');
        setDshNewDocContent('');
        setDshShowNewDocModal(false);
        addLog(`📚 DSH-IM Knowledge Document [${dshNewDocTitle}] registered.`);
        alert('⚡ AI Office Knowledge Doc saved!');
      }
    } catch(e){}
  };

  const deleteDshDoc = async (id) => {
    try {
      const res = await fetch(`/api/dsh-im/docs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDshDocs(data.docs);
        addLog('📚 DSH-IM Knowledge Doc removed.');
      }
    } catch(e){}
  };

  const sendDshTestWebhook = async () => {
    setDshWebhookSending(true);
    try {
      let parsed = {};
      try { parsed = JSON.parse(dshWebhookPayload); } catch(err) { parsed = { text: dshWebhookPayload }; }
      const res = await fetch(`/api/dsh-im/webhook/${dshWebhookChannel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (data.success) {
        fetch('/api/dsh-im/relay-logs').then(r => r.json()).then(setDshRelayLogs).catch(() => {});
        addLog(`⚡ DSH-IM Ingested test webhook payload for channel: [${dshWebhookChannel.toUpperCase()}]`);
        alert(`⚡ Webhook Ingested successfully for [${dshWebhookChannel.toUpperCase()}]!`);
      }
    } catch(e) {
      alert('Webhook error');
    } finally {
      setDshWebhookSending(false);
    }
  };

  // --- WPPConnect & WA-JS Handlers ---
  const startWppSession = async (sessionName, phone) => {
    try {
      const res = await fetch('/api/wppconnect/sessions/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName: sessionName || wppNewSessionName, phone: phone || wppNewSessionPhone })
      });
      const data = await res.json();
      if (data.success) {
        setWppSessions(data.sessions);
        setWppNewSessionName('');
        setWppNewSessionPhone('');
        setWppShowNewSessionModal(false);
        addLog(`📱 WPPConnect session [${data.session.id}] initialized & connected.`);
        alert(`⚡ WPPConnect Session [${data.session.name}] is now ACTIVE!`);
      }
    } catch(e) {
      alert('Start session error');
    }
  };

  const closeWppSession = async (sessionName) => {
    try {
      const res = await fetch('/api/wppconnect/sessions/close-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName })
      });
      const data = await res.json();
      if (data.success) {
        setWppSessions(data.sessions);
        addLog(`📱 WPPConnect session [${sessionName}] stopped.`);
      }
    } catch(e) {
      alert('Close session error');
    }
  };

  const generateWppToken = async (sessionName) => {
    try {
      const res = await fetch('/api/wppconnect/sessions/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName })
      });
      const data = await res.json();
      if (data.success) {
        setWppSessions(data.sessions);
        addLog(`🔑 WPPConnect Bearer Token rotated for [${sessionName}]`);
        alert(`🔑 New Token Generated for [${sessionName}]:\n${data.token}`);
      }
    } catch(e) {
      alert('Generate token error');
    }
  };

  const sendWppTextMessage = async () => {
    if (!wppTargetPhone || !wppMsgText) return alert('Phone and message required');
    setWppSendingAction(true);
    try {
      const res = await fetch(`/api/wppconnect/${wppActiveSession}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: wppTargetPhone, message: wppMsgText })
      });
      const data = await res.json();
      if (data.success) {
        fetch('/api/wppconnect/logs').then(r => r.json()).then(setWppLogs).catch(() => {});
        addLog(`✉️ WPPConnect text dispatched to ${wppTargetPhone} via ${wppActiveSession}`);
        alert(`⚡ WPPConnect Text Message Dispatched to ${wppTargetPhone}!`);
      }
    } catch(e) {
      alert('Send text error');
    } finally {
      setWppSendingAction(false);
    }
  };

  const sendWppButtons = async () => {
    if (!wppTargetPhone || !wppButtonMsg) return alert('Phone and message required');
    setWppSendingAction(true);
    try {
      const buttons = [
        { id: 'btn_1', text: wppButton1 },
        { id: 'btn_2', text: wppButton2 },
        { id: 'btn_3', text: wppButton3 }
      ].filter(b => b.text.trim());

      const res = await fetch(`/api/wppconnect/${wppActiveSession}/send-buttons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: wppTargetPhone, title: wppButtonTitle, message: wppButtonMsg, buttons })
      });
      const data = await res.json();
      if (data.success) {
        fetch('/api/wppconnect/logs').then(r => r.json()).then(setWppLogs).catch(() => {});
        addLog(`🔘 WPPConnect Interactive Buttons dispatched to ${wppTargetPhone}`);
        alert(`⚡ Interactive Buttons Dispatched to ${wppTargetPhone}!`);
      }
    } catch(e) {
      alert('Send buttons error');
    } finally {
      setWppSendingAction(false);
    }
  };

  const sendWppListMenu = async () => {
    if (!wppTargetPhone) return alert('Phone required');
    setWppSendingAction(true);
    try {
      const res = await fetch(`/api/wppconnect/${wppActiveSession}/send-list-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: wppTargetPhone, title: 'ALPHA BOT SERVICE CATALOG', description: 'Explore bot plugins, AI reasoning, and store modules' })
      });
      const data = await res.json();
      if (data.success) {
        fetch('/api/wppconnect/logs').then(r => r.json()).then(setWppLogs).catch(() => {});
        addLog(`📋 WPPConnect List Menu dispatched to ${wppTargetPhone}`);
        alert(`⚡ WhatsApp List Menu Catalog Dispatched!`);
      }
    } catch(e) {
      alert('Send list error');
    } finally {
      setWppSendingAction(false);
    }
  };

  const sendWppPoll = async () => {
    if (!wppTargetPhone || !wppPollTitle) return alert('Phone and poll question required');
    setWppSendingAction(true);
    try {
      const options = [wppPollOpt1, wppPollOpt2, wppPollOpt3, wppPollOpt4].filter(o => o.trim());
      const res = await fetch(`/api/wppconnect/${wppActiveSession}/send-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: wppTargetPhone, name: wppPollTitle, options })
      });
      const data = await res.json();
      if (data.success) {
        fetch('/api/wppconnect/logs').then(r => r.json()).then(setWppLogs).catch(() => {});
        addLog(`📊 WPPConnect Native Poll dispatched to ${wppTargetPhone}`);
        alert(`⚡ Native WhatsApp Poll Created & Dispatched!`);
      }
    } catch(e) {
      alert('Send poll error');
    } finally {
      setWppSendingAction(false);
    }
  };

  const sendWppStatusStory = async () => {
    if (!wppStoryText) return alert('Story content required');
    setWppSendingAction(true);
    try {
      const res = await fetch(`/api/wppconnect/${wppActiveSession}/send-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: wppStoryText, backgroundColor: wppStoryBg })
      });
      const data = await res.json();
      if (data.success) {
        setWppStories(data.stories);
        fetch('/api/wppconnect/logs').then(r => r.json()).then(setWppLogs).catch(() => {});
        addLog(`📲 WhatsApp Status / Story broadcasted via WPPConnect!`);
        alert(`⚡ WhatsApp Status Story Broadcast Published!`);
      }
    } catch(e) {
      alert('Status broadcast error');
    } finally {
      setWppSendingAction(false);
    }
  };

  const executeWppWajs = async () => {
    if (!wppWajsCode) return alert('Enter WA-JS JavaScript code');
    setWppIsExecutingWajs(true);
    setWppWajsResult(null);
    try {
      const res = await fetch('/api/wppconnect/wajs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: wppWajsCode, session: wppActiveSession })
      });
      const data = await res.json();
      if (data.success) {
        setWppWajsResult(data);
        fetch('/api/wppconnect/logs').then(r => r.json()).then(setWppLogs).catch(() => {});
        addLog(`💻 WA-JS evaluated in ${data.durationMs}ms`);
      }
    } catch(e) {
      alert('WA-JS execution failed');
    } finally {
      setWppIsExecutingWajs(false);
    }
  };

  useEffect(() => { 
    fetchData();
    const timer = setInterval(() => {
      fetch('/api/system-stats').then(r => r.json()).then(setSystemStats).catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, [activeTab]);

  // --- Handlers ---
  const sendAdminChat = (e) => {
    e.preventDefault();
    if (!chatInput || !activeChat) return;
    socket.emit('admin_send_msg', { number: activeChat, text: chatInput });
    setChatInput('');
  };

  const toggleMute = (number) => socket.emit('toggle_mute', number);

  const togglePlugin = async (pluginKey) => {
    const updatedPlugins = {
      ...settings.plugins,
      [pluginKey]: !settings.plugins[pluginKey]
    };
    const updated = { ...settings, plugins: updatedPlugins };
    setSettings(updated);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plugins: updatedPlugins })
    });
    addLog(`Levanter Module [${pluginKey.toUpperCase()}] -> ${updatedPlugins[pluginKey] ? 'ENABLED' : 'DISABLED'}`);
  };

  const setWorkType = async (type) => {
    const updated = { ...settings, workType: type };
    setSettings(updated);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workType: type })
    });
    addLog(`Work Mode updated to [${type.toUpperCase()}]`);
  };

  const setBotLanguage = async (lang) => {
    const updated = { ...settings, botLang: lang };
    setSettings(updated);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botLang: lang })
    });
    addLog(`Levanter Bot Language set to [${lang.toUpperCase()}]`);
  };

  const saveSettingsConfig = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    addLog('System settings stored.');
    alert('⚡ Settings synchronized with Levanter Engine.');
  };

  const createCustomPlugin = async (e) => {
    e.preventDefault();
    if (!newPlugName || !newPlugCode) return alert('Enter Plugin Command Name and Code');
    try {
      const res = await fetch('/api/plugins/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlugName, desc: newPlugDesc, code: newPlugCode })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, customPlugins: data.customPlugins }));
        setNewPlugName('');
        setNewPlugDesc('');
        addLog(`Levanter Custom ePlugin [!${newPlugName}] compiled.`);
        alert(`⚡ Plugin !${newPlugName} registered successfully!`);
      }
    } catch(e) { alert('Error registering plugin'); }
  };

  const deleteCustomPlugin = async (pName) => {
    const res = await fetch(`/api/plugins/custom/${pName}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setSettings(prev => ({ ...prev, customPlugins: data.customPlugins }));
      addLog(`Custom ePlugin [${pName}] removed.`);
    }
  };

  const sendApiMessage = async (e) => {
    e.preventDefault();
    if (!apiRecipient || !apiMsgPayload) return alert('Enter Recipient and Message');
    setApiSending(true);
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: apiRecipient, message: apiMsgPayload })
      });
      const data = await res.json();
      if (data.success) {
        setApiMsgPayload('');
        addLog(`Levanter API Mode message dispatched to ${apiRecipient}`);
        fetchData();
        alert('⚡ WhatsApp Message dispatched via Levanter REST API!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch(err) { alert('Failed to send API message'); }
    finally { setApiSending(false); }
  };

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

  const runCommandSim = async () => {
    if (!simCommand) return;
    setSimLoading(true);
    setSimOutput('⚡ Executing command through Levanter Core...');
    
    setTimeout(() => {
      const trimmed = simCommand.trim();
      const cmd = trimmed.replace(/^[!./#]/, '').split(' ')[0].toLowerCase();
      const q = trimmed.split(' ').slice(1).join(' ');

      if (cmd === 'alive') {
        setSimOutput(
`*${settings.botName}* ⚡\n\n` +
`╭───『 *LEVANTER MATRIX* 』───\n` +
`│ 👤 Owner: ${settings.ownerNumber}\n` +
`│ ⏱️ Uptime: ${systemStats?.uptime || 'Active'}\n` +
`│ 💾 RAM: ${systemStats?.memoryMB || '42'} MB\n` +
`│ 🌐 Mode: ${settings.workType.toUpperCase()}\n` +
`│ 🛡️ AntiDelete: ${settings.plugins.antidelete ? 'ACTIVE' : 'OFF'}\n` +
`│ 🛡️ AntiLink: ${settings.plugins.antilink ? 'ACTIVE' : 'OFF'}\n` +
`│ 🌐 Language: ${settings.botLang.toUpperCase()}\n` +
`│ 🚀 Engine: Levanter-MD v3.5 Multi-Session\n` +
`╰─────────────────────────\n\n` +
`${settings.aliveMsg}`
        );
      } else if (cmd === 'ping') {
        setSimOutput(`⚡ *PONG!* Latency: 12ms | Speed: Levanter Hyperdrive`);
      } else if (cmd === 'antidelete' || cmd === 'antidote') {
        setSimOutput(`🛡️ *LEVANTER ANTIDOTE ACTIVE*\n\nCaught Deleted Messages: ${deletedLogs.length}\nAuto-restoring and relaying to owner stream.`);
      } else if (cmd === 'antilink') {
        setSimOutput(`🛡️ *ANTI-LINK SHIELD STATUS: ENABLED*\nGroup invite links will be immediately deleted and violator warned.`);
      } else if (cmd === 'calc') {
        try {
          // eslint-disable-next-line no-eval
          setSimOutput(`🧮 *CALCULATION RESULT:*\nInput: ${q || '2 + 2 * 5'}\nOutput: ${eval(q || '2 + 2 * 5')}`);
        } catch(e) { setSimOutput(`Error: Invalid math expression`); }
      } else if (cmd === 'flip') {
        setSimOutput(`🪙 *COIN FLIP:* ${Math.random() > 0.5 ? 'Heads!' : 'Tails!'}`);
      } else if (cmd === 'menu' || cmd === 'help') {
        setSimOutput(
`⚡ *${settings.botName} COMMAND MATRIX* ⚡
_Levanter Multi-Session Modular Engine_

╭───『 🧠 AI & INTEL 』
│ • !ai <prompt>
│ • !quote
│ • !wiki <topic>
╰───────────────

╭───『 🛡️ LEVANTER SECURITY 』
│ • !antidelete (Antidote)
│ • !antilink (Auto delete links)
│ • !antispam (Flood protection)
│ • !warn @user
╰───────────────

╭───『 🎙️ VOICE & TRANSLATE 』
│ • !tts <text> (Voice Note)
│ • !trt <lang> <text> (Google Translate)
╰───────────────

╭───『 🛠️ CONVERTERS & UTILITIES 』
│ • !sticker / !s (Image to sticker)
│ • !qr <text/url>
│ • !song <name>
│ • !calc <expression>
│ • !flip
╰───────────────`
        );
      } else if (cmd === 'quote' || cmd === 'q') {
        setSimOutput(`💡 *INTEL & WISDOM*\n\n"Knowledge is power, but data is the currency of the modern world."\n\n— _Knight-Levanter Cyber Matrix_`);
      } else if (cmd === 'ttt') {
        setSimOutput(`🎮 *TIC-TAC-TOE MATCH INITIATED*\n\n1 | 2 | 3\n4 | ❌ | 6\n7 | 8 | 9\n\nKnight AI picked slot 5. Your turn: reply with slot number (1-9)!`);
      } else if (cmd === 'trivia' || cmd === 'quiz') {
        setSimOutput(`🧠 *KNIGHT TRIVIA QUIZ*\n\nQuestion: Which protocol does WhatsApp use for end-to-end encryption?\n\n1. Signal Protocol\n2. SSL/TLS\n3. RSA-2048\n4. SHA-256\n\nReply with option number 1-4! (XP Reward: +10 XP)`);
      } else if (cmd === 'truth') {
        setSimOutput(`🛡️ *KNIGHT TRUTH OR DARE [TRUTH]*\n\n"What is the most embarrassing thing saved in your smartphone gallery?"`);
      } else if (cmd === 'dare') {
        setSimOutput(`🔥 *KNIGHT TRUTH OR DARE [DARE]*\n\n"Send the 5th photo in your gallery to the current group without explanation!"`);
      } else if (cmd === '8ball') {
        setSimOutput(`🎱 *MAGIC 8-BALL ORACLE*\n\nQuestion: "${q || 'Will today be successful?'}"\nAnswer: *Without a doubt. The stars are aligned in your favor.*`);
      } else if (cmd === 'joke' || cmd === 'meme') {
        setSimOutput(`😂 *TECH JOKE OF THE DAY*\n\nWhy do programmers prefer dark mode?\n👉 Because light attracts bugs! 🪲`);
      } else if (cmd === 'warn') {
        setSimOutput(`⚠️ *WARNING ISSUED*\n\nTarget: @${q.replace('@', '') || '94781112233'}\nStrikes: [2/3] 🟡🟡⚪\nReason: Group rule violation\nNotice: Reaching 3 strikes results in immediate removal.`);
      } else if (cmd === 'warnings') {
        setSimOutput(`📋 *GROUP WARNING ROSTER*\n\n• @94781112233: 2/3 Strikes 🟡🟡\n• @94712345678: 1/3 Strikes 🟡\n\nUse !resetwarn @user to clear strikes.`);
      } else if (cmd === 'group') {
        setSimOutput(`🛡️ *GROUP ADMINISTRATION ACTION*\n\nGroup setting changed to: *${q.toUpperCase() || 'ANNOUNCEMENTS'}*\nOnly admins can send messages.`);
      } else if (cmd === 'attp') {
        setSimOutput(`✨ *ATTP ANIMATED STICKER GENERATED*\n\nPayload: "${q || 'ALPHA BOT'}"\nRendered: 512x512 Animated Rainbow WebP Stream\nDispatched to chat.`);
      } else if (cmd === 'emojimix') {
        setSimOutput(`✨ *EMOJIMIX FUSION STICKER*\n\nInput: "${q || '🔥+🤖'}"\nGenerated: Google Kitchen Sticker Blend\nDispatched to chat.`);
      } else if (cmd === 'qr') {
        setSimOutput(`⚡ [QR CODE IMAGE DISPATCHED FOR "${q || 'https://github.com/lyfe00011/levanter'}"]\nResolution: 500x500 PNG Stream`);
      } else if (cmd === 'tts') {
        setSimOutput(`🎙️ [AUDIO STREAM GENERATED]\nLanguage: ${q.startsWith('si') ? 'Sinhala (si)' : 'English (en)'}\nFormat: WhatsApp Voice Note (PTT/Opus)`);
      } else if (cmd === 'trt' || cmd === 'translate') {
        setSimOutput(`🌐 *GOOGLE TRANSLATION*\n\nInput: "${q}"\nTranslated: "සාර්ථකව පරිවර්තනය විය (Successfully Translated)"`);
      } else if (cmd === 'wiki') {
        setSimOutput(`📚 *WIKIPEDIA INTEL: ${q.toUpperCase()}*\n\nSummary retrieved from live Wikimedia REST cluster.\nReady to dispatch with thumbnail.`);
      } else {
        setSimOutput(`⚡ Executed: ${simCommand}\nResult: Command dispatched through Knight-Levanter Engine.`);
      }
      setSimLoading(false);
    }, 350);
  };

  const renderAuthUI = () => (
    <div className="bg-gradient-to-b from-cyan-950/20 to-black/40 border border-cyan-800 p-6 flex flex-col items-center justify-center min-h-[300px] relative">
      {botState.status === 'online' ? (
        <div className="text-center flex flex-col items-center gap-4">
          <Activity size={48} className="text-cyan-300 animate-pulse" />
          <p className="text-2xl font-black text-cyan-300 tracking-[0.2em]">LEVANTER NEURAL LINK ACTIVE</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-cyan-500">
            <span className="flex items-center gap-1"><Server size={14} /> Mode: {settings.workType.toUpperCase()}</span>
            <span className="flex items-center gap-1"><Globe size={14} /> Lang: {settings.botLang.toUpperCase()}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> Uptime: {systemStats?.uptime || 'Active'}</span>
            <span className="flex items-center gap-1"><HardDrive size={14} /> RAM: {systemStats?.memoryMB || '42'} MB</span>
            <span className="flex items-center gap-1"><Shield size={14} className="text-emerald-400" /> Antidote Shield: ON</span>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4 md:border-r border-cyan-900/50 md:pr-8">
            <p className="text-cyan-600 text-xs tracking-widest uppercase flex items-center gap-2"><ScanLine size={16} /> Matrix QR Scan</p>
            {botState.qr ? <QRCodeSVG value={botState.qr} size={180} /> : <div className="w-[180px] h-[180px] border border-cyan-900 flex items-center justify-center text-xs text-cyan-800">WAITING FOR PAIR...</div>}
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-fuchsia-500 text-xs tracking-widest uppercase flex items-center gap-2"><Smartphone size={16} /> WhatsApp Pairing Code (8 Digits)</p>
            {botState.pairingCode ? (
              <div className="text-4xl font-black tracking-[0.25em] text-fuchsia-400 bg-fuchsia-950/40 p-4 border border-fuchsia-600">{botState.pairingCode}</div>
            ) : (
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <input type="text" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="Bot Number (947X...)" className="w-full bg-black border border-cyan-800 p-3 text-cyan-400 text-center text-sm font-bold" />
                <button onClick={requestPairingCode} className="w-full bg-fuchsia-900 border-2 border-fuchsia-500 text-fuchsia-300 py-2.5 uppercase tracking-widest font-black text-xs hover:bg-fuchsia-800">Request Pairing Code</button>
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
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400">
              ALPHA_MOBILE_BOT
            </h1>
            <p className="text-cyan-700 text-xs tracking-widest uppercase">Multi-Device WhatsApp Automation • WPPConnect • Levanter-MD • Knightbot Arena</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-cyan-600 bg-cyan-950/40 border border-cyan-900 px-3 py-1.5">
            <Server size={14} className="text-cyan-400" />
            <span>MODE: <strong className="text-fuchsia-400">{settings.workType.toUpperCase()}</strong></span>
          </div>
          <button 
            onClick={cleanKnightSystemCache}
            disabled={isCleaningCache}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 border border-red-800 text-red-400 text-xs font-bold uppercase hover:bg-red-900/50 transition-colors"
          >
            <Trash2 size={13} /> {isCleaningCache ? 'PURGING...' : 'CLEAN CACHE'}
          </button>
          <div className={`px-4 py-1.5 border-2 flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${botState.status === 'online' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/50' : 'border-red-500 text-red-500 bg-red-950/20'}`}>
            <Activity size={16} className={botState.status === 'online' ? 'animate-spin' : ''} /> {botState.status}
          </div>
        </div>
      </header>

      {/* LAYOUT */}
      <div className="relative z-10 flex flex-col md:flex-row gap-6 flex-1 h-[calc(100vh-140px)]">
        
        {/* NAV */}
        <nav className="w-full md:w-64 flex flex-col gap-2 shrink-0 overflow-y-auto">
          {[
            { id: 'overview', icon: Cpu, label: 'SYSTEM CORE' },
            { id: 'wppconnect', icon: Smartphone, label: 'WPPCONNECT (WA-JS)' },
            { id: 'dsh_im', icon: Network, label: 'DSH-IM GATEWAY' },
            { id: 'deepseek_harness', icon: Brain, label: 'DEEPSEEK HARNESS' },
            { id: 'knight_games', icon: Gamepad2, label: 'KNIGHT GAMES' },
            { id: 'knight_admin', icon: Swords, label: 'GROUP & WARNS' },
            { id: 'knight_media', icon: Film, label: 'MEDIA & ATTP' },
            { id: 'plugins', icon: Zap, label: 'PLUGINS & MATRIX' },
            { id: 'antidelete', icon: Shield, label: 'ANTIDOTE & SHIELDS' },
            { id: 'custom_plugins', icon: Code2, label: 'EPLUGINS (CUSTOM)' },
            { id: 'api_mode', icon: Webhook, label: 'API MODE (REST)' },
            { id: 'live_chat', icon: MessageSquare, label: 'LIVE CHAT' },
            { id: 'orders', icon: ShoppingCart, label: 'ORDERS & INVOICES' },
            { id: 'schedules', icon: Calendar, label: 'BROADCAST SCHEDULER' },
            { id: 'contacts', icon: Users, label: 'CRM ENTITIES' },
            { id: 'shop', icon: Database, label: 'NEURAL PAYLOAD' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 p-3 text-left border-l-4 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === t.id ? 'border-fuchsia-500 bg-fuchsia-900/25 text-fuchsia-300 pl-4' : 'border-cyan-900/50 text-cyan-600 hover:text-cyan-300 hover:bg-cyan-950/20'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        {/* CONTENT */}
        <main className="flex-1 border border-cyan-900/50 bg-black/60 p-6 flex flex-col overflow-hidden relative backdrop-blur-sm">
          
          {/* SYSTEM CORE */}
          {activeTab === 'overview' && (
            <div className="overflow-auto flex flex-col gap-6">
              <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest border-b border-cyan-900 pb-2"><ShieldAlert size={18}/> ALPHA MOBILE BOT CORE & TELEMETRY</h2>
              
              {/* REAL-TIME SUMMARY CARDS */}
              <div id="overview-summary-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-black/80 border border-cyan-800/60 p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center text-cyan-500 text-xs font-bold tracking-widest uppercase">
                    <span>Messages</span>
                    <MessageSquare size={16} className="text-cyan-400" />
                  </div>
                  <div className="text-3xl font-black text-cyan-300 mt-2 font-mono">
                    {Object.values(chatHistory).reduce((acc, msgs) => acc + (Array.isArray(msgs) ? msgs.length : 0), 0) + (botState.totalMessages || 0)}
                  </div>
                  <span className="text-[10px] text-cyan-700 uppercase tracking-wider mt-1">Live Ingestion Counter</span>
                </div>

                <div className="bg-black/80 border border-emerald-800/60 p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center text-emerald-400 text-xs font-bold tracking-widest uppercase">
                    <span>Antidote Caught</span>
                    <Shield size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-300 mt-2 font-mono">
                    {deletedLogs.length || botState.deletedMessagesCaught || 0}
                  </div>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider mt-1">Deleted Msgs Recovered</span>
                </div>

                <div className="bg-black/80 border border-fuchsia-800/60 p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center text-fuchsia-400 text-xs font-bold tracking-widest uppercase">
                    <span>Active Orders</span>
                    <ShoppingCart size={16} className="text-fuchsia-400" />
                  </div>
                  <div className="text-3xl font-black text-fuchsia-300 mt-2 font-mono">
                    {orders.filter(o => o.status === 'Pending').length} <span className="text-sm font-normal text-fuchsia-600">/ {orders.length}</span>
                  </div>
                  <span className="text-[10px] text-fuchsia-700 uppercase tracking-wider mt-1">Invoiced & Active</span>
                </div>

                <div className="bg-black/80 border border-purple-800/60 p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center text-purple-400 text-xs font-bold tracking-widest uppercase">
                    <span>CRM Contacts</span>
                    <Users size={16} className="text-purple-400" />
                  </div>
                  <div className="text-3xl font-black text-purple-300 mt-2 font-mono">
                    {contacts.length}
                  </div>
                  <span className="text-[10px] text-purple-700 uppercase tracking-wider mt-1">Registered Entities</span>
                </div>

                <div className="bg-black/80 border border-yellow-800/60 p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center text-yellow-400 text-xs font-bold tracking-widest uppercase">
                    <span>Knight Warns</span>
                    <Swords size={16} className="text-yellow-400" />
                  </div>
                  <div className="text-3xl font-black text-yellow-300 mt-2 font-mono">
                    {Object.keys(knightWarns).length}
                  </div>
                  <span className="text-[10px] text-yellow-700 uppercase tracking-wider mt-1">Active Warn Strikes</span>
                </div>
              </div>

              {renderAuthUI()}
              
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-widest text-cyan-600 flex items-center gap-1.5"><Terminal size={14} /> System Terminal Stream:</span>
                <div className="border border-cyan-900/50 bg-black/80 p-3 h-36 overflow-y-auto font-mono text-xs text-cyan-600">
                  {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
              </div>
            </div>
          )}

          {/* KNIGHT GAMES & ARENA */}
          {activeTab === 'knight_games' && (
            <div className="overflow-auto flex flex-col gap-6 h-full">
              <div className="flex justify-between items-center border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-fuchsia-400 uppercase tracking-widest">
                    <Gamepad2 size={20} /> KNIGHT ARENA & ENTERTAINMENT MATRIX
                  </h2>
                  <p className="text-cyan-600 text-xs mt-0.5">Tic-Tac-Toe vs AI, live Trivia quiz, Truth or Dare generator & 8-Ball Oracle</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-yellow-400 bg-yellow-950/40 border border-yellow-700 px-3 py-1 flex items-center gap-1.5">
                    <Flame size={14} /> TRIVIA XP: {knightTriviaXp}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TIC TAC TOE BOARD */}
                <div className="bg-black/70 border border-fuchsia-900/60 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                      <Swords size={16} /> Tic-Tac-Toe Arena (You: X vs Knight AI: O)
                    </span>
                    <button 
                      onClick={resetTtt}
                      className="text-xs px-2.5 py-1 bg-cyan-950/60 border border-cyan-800 text-cyan-300 hover:border-fuchsia-400 flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Reset
                    </button>
                  </div>

                  <div className="flex justify-between text-xs text-cyan-500 font-mono px-2">
                    <span>Player X Score: <strong className="text-cyan-300">{knightTtt.scoreX}</strong></span>
                    <span>Knight AI (O) Score: <strong className="text-fuchsia-400">{knightTtt.scoreO}</strong></span>
                  </div>

                  {/* 3x3 Grid */}
                  <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto w-full aspect-square p-2 bg-cyan-950/20 border border-cyan-900">
                    {knightTtt.board.map((cell, idx) => (
                      <button
                        key={idx}
                        onClick={() => playTttCell(idx)}
                        disabled={cell === 'X' || cell === 'O' || !!knightTtt.winner}
                        className={`aspect-square flex items-center justify-center text-3xl font-black font-mono transition-all border ${
                          cell === 'X'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : cell === 'O'
                            ? 'bg-fuchsia-950/80 text-fuchsia-400 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
                            : 'bg-black/90 border-cyan-900/60 text-cyan-800 hover:text-cyan-400 hover:border-cyan-600'
                        }`}
                      >
                        {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="text-center text-xs font-bold uppercase tracking-widest min-h-[24px]">
                    {knightTtt.winner === 'X' && <span className="text-emerald-400 font-mono">🏆 VICTORY! YOU DEFEATED KNIGHT AI!</span>}
                    {knightTtt.winner === 'O' && <span className="text-red-400 font-mono">💀 KNIGHT AI WON THIS ROUND!</span>}
                    {knightTtt.winner === 'tie' && <span className="text-yellow-400 font-mono">⚖️ STALEMATE DRAW!</span>}
                    {!knightTtt.winner && <span className="text-cyan-600">Your Turn (Click any number 1-9 or run !ttt [num])</span>}
                  </div>
                </div>

                {/* TRIVIA QUIZ & CHALLENGE */}
                <div className="bg-black/70 border border-cyan-900/80 p-4 flex flex-col gap-4 justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                      <HelpCircle size={16} className="text-cyan-400" /> Live Trivia & Quiz Challenge
                    </span>
                    <button 
                      onClick={fetchKnightTrivia}
                      className="text-xs px-2.5 py-1 bg-fuchsia-950/60 border border-fuchsia-700 text-fuchsia-300 hover:bg-fuchsia-900 flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Next Question
                    </button>
                  </div>

                  {knightTrivia ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-[#02000d] border border-cyan-800/80 p-3">
                        <span className="text-[10px] text-fuchsia-400 uppercase tracking-widest font-bold block mb-1">Question #{knightTrivia.id}:</span>
                        <p className="text-sm font-semibold text-cyan-200">{knightTrivia.question}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {knightTrivia.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => submitKnightTriviaAnswer(i)}
                            disabled={knightTriviaAnswer !== null}
                            className={`p-2.5 text-left text-xs font-mono border transition-all ${
                              knightTriviaAnswer !== null
                                ? i === knightTriviaAnswer.correctIndex
                                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                                  : 'bg-black/60 border-gray-800 text-gray-600'
                                : 'bg-black/80 border-cyan-900/80 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/40'
                            }`}
                          >
                            <span className="text-fuchsia-400 font-bold mr-2">{i + 1}.</span> {opt}
                          </button>
                        ))}
                      </div>

                      {knightTriviaAnswer && (
                        <div className={`p-2.5 text-xs font-bold uppercase tracking-wider text-center border ${knightTriviaAnswer.isCorrect ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-red-950/60 border-red-600 text-red-300'}`}>
                          {knightTriviaAnswer.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-cyan-700">Loading Trivia Stream...</div>
                  )}

                  <div className="text-[11px] text-cyan-700 font-mono">
                    WhatsApp Command: <code>!trivia</code> or <code>!quiz</code> | Answer with option number 1-4.
                  </div>
                </div>

                {/* TRUTH OR DARE */}
                <div className="bg-black/70 border border-purple-900/60 p-4 flex flex-col gap-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={16} /> Truth or Dare Generator (!truth / !dare)
                  </span>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => fetchKnightTruthDare('truth')}
                      className={`flex-1 py-2 text-xs font-bold uppercase border transition-all ${knightTruthDare.type === 'truth' ? 'bg-cyan-900 border-cyan-400 text-cyan-200' : 'bg-black border-cyan-900 text-cyan-600'}`}
                    >
                      🛡️ TRUTH
                    </button>
                    <button 
                      onClick={() => fetchKnightTruthDare('dare')}
                      className={`flex-1 py-2 text-xs font-bold uppercase border transition-all ${knightTruthDare.type === 'dare' ? 'bg-fuchsia-900 border-fuchsia-400 text-fuchsia-200' : 'bg-black border-fuchsia-950 text-fuchsia-700'}`}
                    >
                      🔥 DARE
                    </button>
                  </div>

                  <div className="bg-[#02000c] border border-purple-900/50 p-4 text-xs font-mono text-purple-300 min-h-[70px] flex items-center">
                    "{knightTruthDare.prompt}"
                  </div>
                </div>

                {/* MAGIC 8-BALL & JOKES */}
                <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <HelpCircle size={14} /> Magic 8-Ball Oracle (!8ball)
                    </span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={knight8BallQ} 
                        onChange={e => setKnight8BallQ(e.target.value)}
                        placeholder="Ask the Knight Oracle any question..."
                        className="flex-1 bg-black border border-cyan-800 p-2 text-xs text-cyan-300 font-mono"
                        onKeyDown={e => e.key === 'Enter' && askKnight8Ball()}
                      />
                      <button 
                        onClick={askKnight8Ball}
                        className="bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-500 px-3 text-xs font-bold"
                      >
                        ASK 8-BALL
                      </button>
                    </div>
                    {knight8BallAns && (
                      <p className="text-xs font-mono text-fuchsia-400 mt-2 bg-black/80 p-2 border border-cyan-950">{knight8BallAns}</p>
                    )}
                  </div>

                  <div className="border-t border-cyan-900/50 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <Smile size={14} /> Tech Joke & Meme Generator (!joke / !meme)
                      </span>
                      <button 
                        onClick={fetchKnightJoke}
                        className="text-[11px] px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 hover:text-cyan-200"
                      >
                        New Joke
                      </button>
                    </div>
                    <div className="bg-[#02000c] p-2.5 border border-cyan-900/60 text-xs font-mono">
                      <p className="text-cyan-300 font-bold">{knightJoke.setup}</p>
                      <p className="text-emerald-400 mt-1">👉 {knightJoke.punchline}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KNIGHT GROUP & WARNS */}
          {activeTab === 'knight_admin' && (
            <div className="overflow-auto flex flex-col gap-6 h-full">
              <div className="flex justify-between items-center border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-yellow-400 uppercase tracking-widest">
                    <Swords size={20} /> KNIGHT GROUP DEFENSE & 3-STRIKE WARN ROSTER
                  </h2>
                  <p className="text-cyan-600 text-xs mt-0.5">Automated strike tracking, auto-kick at 3 strikes, and group administration actions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-yellow-400 bg-yellow-950/40 border border-yellow-700 px-3 py-1">
                    MAX STRIKES: 3 (AUTO-KICK)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3-STRIKE WARN ROSTER */}
                <div className="lg:col-span-2 bg-black/70 border border-yellow-900/60 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert size={16} /> Active Warning Strike Registry
                    </span>
                    <span className="text-[11px] text-cyan-600 font-mono">Command: !warn @user / !warnings</span>
                  </div>

                  <div className="overflow-auto border border-cyan-900/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-cyan-950 text-cyan-400">
                        <tr>
                          <th className="p-3 border-b border-cyan-800">Target User JID</th>
                          <th className="p-3 border-b border-cyan-800">Current Strikes</th>
                          <th className="p-3 border-b border-cyan-800">Threat Level</th>
                          <th className="p-3 border-b border-cyan-800 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(knightWarns).map(([user, count]) => (
                          <tr key={user} className="border-b border-cyan-900/30 hover:bg-yellow-950/20">
                            <td className="p-3 font-mono font-bold text-cyan-300">{user}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3].map(n => (
                                  <span 
                                    key={n} 
                                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                      n <= (count as number) 
                                        ? (count as number) >= 3 ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-500 text-black' 
                                        : 'bg-cyan-950 border border-cyan-800 text-cyan-800'
                                    }`}
                                  >
                                    {n}
                                  </span>
                                ))}
                                <span className="ml-1 text-xs text-yellow-400 font-mono">({count}/3)</span>
                              </div>
                            </td>
                            <td className="p-3">
                              {(count as number) >= 3 ? (
                                <span className="px-2 py-0.5 bg-red-950 border border-red-600 text-red-400 font-bold text-[10px] uppercase">
                                  AUTO-KICK TRIGGERED
                                </span>
                              ) : (count as number) === 2 ? (
                                <span className="px-2 py-0.5 bg-orange-950 border border-orange-600 text-orange-400 font-bold text-[10px] uppercase">
                                  CRITICAL WARNING
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-yellow-950 border border-yellow-600 text-yellow-400 font-bold text-[10px] uppercase">
                                  1ST WARNING
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => resetKnightWarns(user)}
                                className="px-2.5 py-1 bg-cyan-950 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 text-[11px] font-bold uppercase"
                              >
                                Clear Warns
                              </button>
                            </td>
                          </tr>
                        ))}
                        {Object.keys(knightWarns).length === 0 && (
                          <tr><td colSpan={4} className="p-6 text-center text-cyan-800">No active warning strikes. Group members are in good standing.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* GROUP MANAGEMENT CONTROLS */}
                <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-4">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} /> Group Management Commands
                  </span>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-cyan-600 uppercase font-bold">Group Announcement Mute/Open:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          setSimCommand('!group open');
                          setActiveTab('plugins');
                        }}
                        className="p-2.5 bg-emerald-950/60 border border-emerald-600 text-emerald-300 font-bold text-xs uppercase hover:bg-emerald-900/80 flex items-center justify-center gap-1.5"
                      >
                        <UserCheck size={14} /> OPEN GROUP
                      </button>
                      <button 
                        onClick={() => {
                          setSimCommand('!group close');
                          setActiveTab('plugins');
                        }}
                        className="p-2.5 bg-red-950/60 border border-red-600 text-red-300 font-bold text-xs uppercase hover:bg-red-900/80 flex items-center justify-center gap-1.5"
                      >
                        <VolumeX size={14} /> CLOSE (MUTE)
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-cyan-900/50 pt-3 flex flex-col gap-2">
                    <label className="text-[11px] text-cyan-600 uppercase font-bold">Participant Management:</label>
                    <div className="flex flex-col gap-1.5 text-xs font-mono">
                      <div className="p-2 bg-black border border-cyan-900 text-cyan-400 flex justify-between items-center">
                        <span>!kick @user</span>
                        <span className="text-[10px] text-cyan-700">Remove participant</span>
                      </div>
                      <div className="p-2 bg-black border border-cyan-900 text-cyan-400 flex justify-between items-center">
                        <span>!promote @user</span>
                        <span className="text-[10px] text-cyan-700">Grant Admin power</span>
                      </div>
                      <div className="p-2 bg-black border border-cyan-900 text-cyan-400 flex justify-between items-center">
                        <span>!demote @user</span>
                        <span className="text-[10px] text-cyan-700">Revoke Admin</span>
                      </div>
                      <div className="p-2 bg-black border border-cyan-900 text-cyan-400 flex justify-between items-center">
                        <span>!hidetag &lt;text&gt;</span>
                        <span className="text-[10px] text-cyan-700">Notify everyone silently</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KNIGHT MEDIA & CONVERTERS */}
          {activeTab === 'knight_media' && (
            <div className="overflow-auto flex flex-col gap-6 h-full">
              <div className="flex justify-between items-center border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest">
                    <Film size={20} /> KNIGHT MEDIA HUB & ATTP CONVERTERS
                  </h2>
                  <p className="text-cyan-600 text-xs mt-0.5">YouTube video/audio extractor, ATTP rainbow text stickers, and EmojiMix merger</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ATTP TEXT TO ANIMATED STICKER */}
                <div className="bg-black/70 border border-cyan-900/80 p-4 flex flex-col gap-4">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={16} /> ATTP Animated Rainbow Text Generator (!attp)
                  </span>

                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Sticker Text Payload:</label>
                    <input 
                      type="text" 
                      value={knightAttpText} 
                      onChange={e => setKnightAttpText(e.target.value)}
                      placeholder="Enter text (e.g. ALPHA BOT, HELLO)..."
                      className="w-full bg-black border border-cyan-800 p-2.5 text-xs text-cyan-300 font-mono"
                    />
                  </div>

                  {/* Animated Preview Box */}
                  <div className="bg-black border-2 border-cyan-700/60 h-44 flex items-center justify-center relative overflow-hidden">
                    <div className="text-3xl font-black font-mono tracking-widest text-center px-4 animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-fuchsia-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">
                      {knightAttpText || 'ALPHA WA BOT'}
                    </div>
                    <span className="absolute bottom-2 right-2 text-[10px] text-cyan-700 font-mono">Animated WebP Output (512x512)</span>
                  </div>

                  <button 
                    onClick={() => {
                      setSimCommand(`!attp ${knightAttpText}`);
                      setActiveTab('plugins');
                    }}
                    className="bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-500 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> DISPATCH ATTP STICKER TO TEST ENGINE
                  </button>
                </div>

                {/* EMOJIMIX STUDIO */}
                <div className="bg-black/70 border border-fuchsia-900/60 p-4 flex flex-col gap-4">
                  <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                    <Smile size={16} /> EmojiMixer Studio (!emojimix)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-cyan-600 uppercase block mb-1">Emoji A:</label>
                      <input 
                        type="text" 
                        value={knightEmoji1} 
                        onChange={e => setKnightEmoji1(e.target.value)}
                        className="w-full bg-black border border-cyan-800 p-2.5 text-xl text-center text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-cyan-600 uppercase block mb-1">Emoji B:</label>
                      <input 
                        type="text" 
                        value={knightEmoji2} 
                        onChange={e => setKnightEmoji2(e.target.value)}
                        className="w-full bg-black border border-cyan-800 p-2.5 text-xl text-center text-cyan-300"
                      />
                    </div>
                  </div>

                  {/* Combined Preview */}
                  <div className="bg-[#02000c] border border-fuchsia-900/50 h-44 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-3 text-5xl">
                      <span>{knightEmoji1}</span>
                      <span className="text-2xl text-fuchsia-500 font-bold">+</span>
                      <span>{knightEmoji2}</span>
                      <span className="text-2xl text-cyan-500 font-bold">=</span>
                      <span className="drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]">{knightEmoji1}{knightEmoji2}</span>
                    </div>
                    <span className="text-[10px] text-cyan-700 font-mono">Google Emoji Kitchen Fusion</span>
                  </div>

                  <button 
                    onClick={() => {
                      setSimCommand(`!emojimix ${knightEmoji1}+${knightEmoji2}`);
                      setActiveTab('plugins');
                    }}
                    className="bg-fuchsia-900 hover:bg-fuchsia-800 text-fuchsia-200 border border-fuchsia-500 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} /> FUSE & DISPATCH EMOJIMIX STICKER
                  </button>
                </div>

                {/* MEDIA DOWNLOADER EXTRACTOR */}
                <div className="lg:col-span-2 bg-black/70 border border-cyan-900/80 p-4 flex flex-col gap-4">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                    <Download size={16} /> Universal Media Extractor (YouTube / Instagram / TikTok / Facebook)
                  </span>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={knightMediaUrl} 
                      onChange={e => setKnightMediaUrl(e.target.value)}
                      placeholder="Paste YouTube, Instagram Reel, TikTok, or FB video URL..."
                      className="flex-1 bg-black border border-cyan-800 p-2.5 text-xs text-cyan-300 font-mono"
                    />
                    <button 
                      onClick={() => {
                        setSimCommand(`!song ${knightMediaUrl}`);
                        setActiveTab('plugins');
                      }}
                      className="bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-500 px-5 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <Download size={14} /> EXTRACT
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 bg-black/90 border border-cyan-900 flex flex-col gap-1">
                      <span className="text-fuchsia-400 font-bold">!song &lt;name&gt;</span>
                      <span className="text-[10px] text-cyan-600">YouTube MP3 (320kbps Audio)</span>
                    </div>
                    <div className="p-3 bg-black/90 border border-cyan-900 flex flex-col gap-1">
                      <span className="text-fuchsia-400 font-bold">!video &lt;url&gt;</span>
                      <span className="text-[10px] text-cyan-600">YouTube 720p HD MP4</span>
                    </div>
                    <div className="p-3 bg-black/90 border border-cyan-900 flex flex-col gap-1">
                      <span className="text-fuchsia-400 font-bold">!ig &lt;reel-link&gt;</span>
                      <span className="text-[10px] text-cyan-600">Instagram Reel Video</span>
                    </div>
                    <div className="p-3 bg-black/90 border border-cyan-900 flex flex-col gap-1">
                      <span className="text-fuchsia-400 font-bold">!tiktok &lt;link&gt;</span>
                      <span className="text-[10px] text-cyan-600">TikTok No-Watermark</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEVANTER PLUGINS & COMMANDS MATRIX */}
          {activeTab === 'plugins' && (
            <div className="overflow-auto flex flex-col gap-6 h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-fuchsia-400 uppercase tracking-widest">
                    <Zap size={18} /> LEVANTER COMMAND & PLUGIN MATRIX
                  </h2>
                  <p className="text-cyan-600 text-xs mt-0.5">Toggle modular Levanter features & test in real-time</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Language Selector */}
                  <div className="flex items-center gap-2 bg-black/60 p-1.5 border border-cyan-800">
                    <span className="text-xs text-cyan-500 font-bold px-2">LANG:</span>
                    {['en', 'si', 'hi', 'id', 'es', 'pt'].map(l => (
                      <button 
                        key={l}
                        onClick={() => setBotLanguage(l)}
                        className={`px-2 py-0.5 text-xs font-bold uppercase ${settings.botLang === l ? 'bg-fuchsia-600 text-white' : 'text-cyan-600 hover:text-cyan-300'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-black/60 p-1.5 border border-cyan-800">
                    <span className="text-xs text-cyan-500 font-bold px-2">WORK MODE:</span>
                    <button 
                      onClick={() => setWorkType('public')}
                      className={`px-3 py-1 text-xs font-bold uppercase ${settings.workType === 'public' ? 'bg-cyan-500 text-black' : 'text-cyan-600 hover:text-cyan-300'}`}
                    >
                      PUBLIC
                    </button>
                    <button 
                      onClick={() => setWorkType('private')}
                      className={`px-3 py-1 text-xs font-bold uppercase ${settings.workType === 'private' ? 'bg-fuchsia-600 text-white' : 'text-cyan-600 hover:text-cyan-300'}`}
                    >
                      PRIVATE
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE COMMAND SIMULATOR */}
              <div className="bg-black/80 border border-fuchsia-900/60 p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs text-fuchsia-400 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Play size={14} /> Levanter Live Command Simulator</span>
                  <span className="text-cyan-600 font-mono">Prefix: ! or .</span>
                </div>
                
                {/* Presets */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {['!alive', '!ping', '!menu', '!ttt 5', '!trivia', '!quiz', '!truth', '!dare', '!8ball will i succeed?', '!joke', '!meme', '!warn @user', '!warnings', '!group open', '!attp ALPHA BOT', '!emojimix 🔥+🤖', '!song Shape of You', '!antidelete', '!antilink', '!tts si ආයුබෝවන්', '!trt si Hello friends', '!wiki Quantum', '!qr https://github.com', '!calc 100 * 25 / 5', '!flip'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setSimCommand(p)}
                      className="bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 text-cyan-300 hover:border-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={simCommand} 
                    onChange={e => setSimCommand(e.target.value)}
                    placeholder="Enter command (e.g. !alive, !tts si Hello, !calc 50*2, !wiki AI)..."
                    className="flex-1 bg-black border border-cyan-800 p-2.5 text-xs text-cyan-300 font-mono focus:border-fuchsia-500 focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && runCommandSim()}
                  />
                  <button 
                    onClick={runCommandSim}
                    disabled={simLoading}
                    className="bg-fuchsia-900 hover:bg-fuchsia-800 text-fuchsia-200 border border-fuchsia-500 px-5 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <Play size={14} /> TEST
                  </button>
                </div>

                <div className="bg-[#02000c] border border-cyan-900/60 p-3 font-mono text-xs text-cyan-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {simOutput}
                </div>
              </div>

              {/* PLUGIN TOGGLES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'antidelete', title: 'Antidote (Anti-Delete)', desc: 'Recover and log all deleted messages in real-time', icon: Shield },
                  { key: 'antilink', title: 'Anti-Link Defense', desc: 'Auto-delete WhatsApp group invite links & warn', icon: ShieldAlert },
                  { key: 'antispam', title: 'Anti-Spam Flood Guard', desc: 'Block message spammers and rate limit offenders', icon: Zap },
                  { key: 'ai', title: 'DeepSeek Neural AI', desc: 'Contextual AI smart responses in Sinhala/English', icon: Cpu },
                  { key: 'tts', title: 'Google Text-To-Speech', desc: 'Converts text to voice note (!tts, !tts si)', icon: Volume2 },
                  { key: 'translate', title: 'Google Translation', desc: 'Instant multi-language translation (!trt si text)', icon: Globe },
                  { key: 'wiki', title: 'Wikipedia Intelligence', desc: 'Quick article lookup with thumbnails (!wiki topic)', icon: BookOpen },
                  { key: 'stickers', title: 'Sticker Transformer', desc: 'Convert image to WhatsApp sticker (!sticker, !s)', icon: Image },
                  { key: 'qr', title: 'Dynamic QR Generator', desc: 'Generate QR code images directly (!qr text)', icon: QrCode },
                  { key: 'songSearch', title: 'YouTube Music Search', desc: 'Search tracks and audio links (!song, !yt)', icon: Music },
                  { key: 'games', title: 'Knight Games & Arena', desc: 'Interactive TicTacToe, Trivia quiz, Truth/Dare (!ttt, !trivia, !truth)', icon: Gamepad2 },
                  { key: 'warnSystem', title: '3-Strike Warn Defense', desc: 'Automated 3-strike warn system with auto-kick (!warn, !warnings)', icon: Swords },
                  { key: 'attp', title: 'ATTP Text Generator', desc: 'Converts words into rainbow animated sticker (!attp text)', icon: Sparkles },
                  { key: 'emojimix', title: 'EmojiMix Studio', desc: 'Fuses two emojis into a WhatsApp sticker (!emojimix 🔥+🤖)', icon: Smile },
                  { key: 'mediaDownloader', title: 'Media Extractor', desc: 'Extracts Instagram reels, TikTok & YouTube videos (!ig, !tiktok)', icon: Film },
                  { key: 'funCommands', title: 'Knight Fun & Oracles', desc: 'Magic 8-ball, tech jokes, coin flipper (!8ball, !joke, !flip)', icon: Flame },
                  { key: 'welcomeGoodbye', title: 'Welcome & Goodbye', desc: 'Auto greet new members when they join/leave groups', icon: Users },
                  { key: 'orders', title: 'Commerce & PDF Invoices', desc: 'Order tracking and instant PDF invoice generator', icon: ShoppingCart },
                  { key: 'groupAdmin', title: 'Group Admin Tools', desc: 'Tag all participants and manage members (!tagall, !kick, !group)', icon: Users },
                  { key: 'quotes', title: 'Hacker Quotes Engine', desc: 'Inspirational tech and wisdom quotes (!quote)', icon: Quote },
                ].map(plug => {
                  const isEnabled = settings.plugins?.[plug.key] ?? true;
                  const Icon = plug.icon;
                  return (
                    <div 
                      key={plug.key} 
                      onClick={() => togglePlugin(plug.key)}
                      className={`p-4 border cursor-pointer transition-all flex flex-col justify-between gap-3 ${isEnabled ? 'bg-cyan-950/25 border-cyan-700/80 hover:border-cyan-400' : 'bg-black/40 border-gray-800 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                          <Icon size={16} className={isEnabled ? 'text-cyan-400' : 'text-gray-600'} />
                          <span>{plug.title}</span>
                        </div>
                        {isEnabled ? <CheckCircle size={16} className="text-emerald-400 shrink-0" /> : <XCircle size={16} className="text-red-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-cyan-700">{plug.desc}</p>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-right">
                        <span className={`px-2 py-0.5 border ${isEnabled ? 'border-emerald-600 text-emerald-400 bg-emerald-950/40' : 'border-red-900 text-red-500 bg-red-950/20'}`}>
                          {isEnabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SETTINGS FORM */}
              <div className="bg-black/60 border border-cyan-900 p-4 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Sliders size={14} /> Bot Identity Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Bot Name:</label>
                    <input 
                      type="text" 
                      value={settings.botName || ''} 
                      onChange={e => setSettings({ ...settings, botName: e.target.value })}
                      className="w-full bg-black border border-cyan-800 p-2 text-xs text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Owner WhatsApp Number:</label>
                    <input 
                      type="text" 
                      value={settings.ownerNumber || ''} 
                      onChange={e => setSettings({ ...settings, ownerNumber: e.target.value })}
                      className="w-full bg-black border border-cyan-800 p-2 text-xs text-cyan-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-cyan-600 uppercase block mb-1">Custom Alive Status Message:</label>
                  <input 
                    type="text" 
                    value={settings.aliveMsg || ''} 
                    onChange={e => setSettings({ ...settings, aliveMsg: e.target.value })}
                    className="w-full bg-black border border-cyan-800 p-2 text-xs text-cyan-300"
                  />
                </div>
                <button 
                  onClick={saveSettingsConfig}
                  className="bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-500 py-2.5 uppercase text-xs font-bold tracking-widest"
                >
                  SAVE IDENTITY PARAMETERS
                </button>
              </div>
            </div>
          )}

          {/* ANTIDOTE & SHIELDS (ANTIDELETE LOGS) */}
          {activeTab === 'antidelete' && (
            <div className="flex flex-col h-full gap-4 overflow-auto">
              <div className="flex justify-between items-center border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-emerald-400 uppercase tracking-widest">
                    <Shield size={18} /> LEVANTER ANTIDOTE (ANTI-DELETE ENGINE)
                  </h2>
                  <p className="text-cyan-600 text-xs mt-0.5">Captures revoked / deleted messages from private chats and groups</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold uppercase border ${settings.plugins.antidelete ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500' : 'bg-red-950/30 text-red-400 border-red-800'}`}>
                    {settings.plugins.antidelete ? 'SHIELD ARMED' : 'SHIELD DISABLED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/60 border border-emerald-900/60 p-4">
                  <span className="text-xs text-emerald-500 uppercase font-bold">Total Intercepts</span>
                  <p className="text-2xl font-black text-emerald-300 mt-1">{deletedLogs.length}</p>
                </div>
                <div className="bg-black/60 border border-cyan-900/60 p-4">
                  <span className="text-xs text-cyan-500 uppercase font-bold">Relay Target</span>
                  <p className="text-sm font-mono text-cyan-300 mt-1">Owner ({settings.ownerNumber})</p>
                </div>
                <div className="bg-black/60 border border-fuchsia-900/60 p-4">
                  <span className="text-xs text-fuchsia-500 uppercase font-bold">Buffer Depth</span>
                  <p className="text-sm font-mono text-fuchsia-300 mt-1">500 In-Memory Messages</p>
                </div>
              </div>

              <div className="flex-1 overflow-auto border border-cyan-900/50 mt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cyan-950 text-cyan-400 sticky top-0">
                    <tr>
                      <th className="p-3 border-b border-cyan-800">Time</th>
                      <th className="p-3 border-b border-cyan-800">Sender</th>
                      <th className="p-3 border-b border-cyan-800">Target Chat</th>
                      <th className="p-3 border-b border-cyan-800">Revoked Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedLogs.map((d, i) => (
                      <tr key={i} className="border-b border-cyan-900/30 hover:bg-emerald-950/10">
                        <td className="p-3 font-mono text-cyan-500">{new Date(d.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 font-bold text-emerald-400">{d.pushName || 'Unknown'} <span className="text-[10px] text-cyan-700">({d.sender})</span></td>
                        <td className="p-3 text-cyan-600 font-mono">{d.from?.includes('@g.us') ? 'Group' : 'Direct PM'}</td>
                        <td className="p-3 text-emerald-300 font-mono bg-emerald-950/20 border-l border-emerald-500/40">{d.text}</td>
                      </tr>
                    ))}
                    {deletedLogs.length === 0 && (
                      <tr><td colSpan="4" className="p-8 text-center text-cyan-800">No deleted messages intercepted yet. Messages deleted by participants will appear here instantly.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUSTOM EPLUGINS */}
          {activeTab === 'custom_plugins' && (
            <div className="flex flex-col h-full gap-4 overflow-auto">
              <div className="border-b border-cyan-900 pb-3">
                <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest">
                  <Code2 size={18} /> LEVANTER EPLUGINS (CUSTOM JAVASCRIPT PLUGINS)
                </h2>
                <p className="text-cyan-600 text-xs mt-0.5">Dynamically inject new bot commands without restarting the server</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plugin Creator */}
                <form onSubmit={createCustomPlugin} className="bg-black/60 border border-cyan-900 p-4 flex flex-col gap-3">
                  <span className="text-xs text-cyan-400 font-bold uppercase flex items-center gap-2">
                    <Plus size={14} /> Register New ePlugin Command
                  </span>
                  
                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Command Name (Without prefix):</label>
                    <input 
                      type="text" 
                      value={newPlugName} 
                      onChange={e => setNewPlugName(e.target.value)} 
                      placeholder="e.g. dice, roll, stats..." 
                      className="w-full bg-black border border-cyan-800 p-2 text-xs text-cyan-300"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Description:</label>
                    <input 
                      type="text" 
                      value={newPlugDesc} 
                      onChange={e => setNewPlugDesc(e.target.value)} 
                      placeholder="e.g. Roll a 6-sided dice" 
                      className="w-full bg-black border border-cyan-800 p-2 text-xs text-cyan-300"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Execution Code (JavaScript body):</label>
                    <textarea 
                      value={newPlugCode} 
                      onChange={e => setNewPlugCode(e.target.value)} 
                      rows={5} 
                      className="w-full bg-black border border-cyan-800 p-2 text-xs text-emerald-400 font-mono focus:border-cyan-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-cyan-700">Available variables: <code>args</code> (array), <code>query</code> (string), <code>sender</code> (number), <code>pushName</code></span>
                  </div>

                  <button type="submit" className="bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-500 py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus size={14} /> INJECT EPLUGIN INTO LEVANTER
                  </button>
                </form>

                {/* Installed Custom Plugins List */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-cyan-400 font-bold uppercase">Active Registered ePlugins ({settings.customPlugins?.length || 0})</span>
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[420px]">
                    {settings.customPlugins?.map((p, i) => (
                      <div key={i} className="bg-black/80 border border-cyan-800 p-3 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                            <span className="text-fuchsia-400">!{p.name}</span>
                            <span className="text-cyan-600 text-[11px]">— {p.desc}</span>
                          </div>
                          <pre className="text-[11px] text-emerald-400 font-mono mt-2 bg-black/90 p-2 border border-cyan-950 overflow-x-auto max-w-md">
                            {p.code}
                          </pre>
                        </div>
                        <button onClick={() => deleteCustomPlugin(p.name)} className="text-red-500 hover:text-red-400 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!settings.customPlugins || settings.customPlugins.length === 0) && (
                      <div className="p-6 border border-cyan-900/40 text-center text-xs text-cyan-800">No custom eplugins installed yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API MODE (REST WEBHOOK) */}
          {activeTab === 'api_mode' && (
            <div className="flex flex-col h-full gap-4 overflow-auto">
              <div className="border-b border-cyan-900 pb-3">
                <h2 className="text-lg font-black flex items-center gap-2 text-fuchsia-400 uppercase tracking-widest">
                  <Webhook size={18} /> LEVANTER REST API MODE & WEBHOOK GATEWAY
                </h2>
                <p className="text-cyan-600 text-xs mt-0.5">Integrate WhatsApp sending capabilities directly with external apps and webhooks</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* REST API Test Dispatcher */}
                <form onSubmit={sendApiMessage} className="bg-black/60 border border-cyan-900 p-4 flex flex-col gap-3">
                  <span className="text-xs text-fuchsia-400 font-bold uppercase flex items-center gap-2">
                    <Send size={14} /> Send WhatsApp Message via HTTP POST
                  </span>

                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Target Number / JID:</label>
                    <input 
                      type="text" 
                      value={apiRecipient} 
                      onChange={e => setApiRecipient(e.target.value)} 
                      placeholder="e.g. 94781234567" 
                      className="w-full bg-black border border-cyan-800 p-2 text-xs text-cyan-300"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-cyan-600 uppercase block mb-1">Message Payload:</label>
                    <textarea 
                      value={apiMsgPayload} 
                      onChange={e => setApiMsgPayload(e.target.value)} 
                      rows={3} 
                      placeholder="Message content dispatched via API..." 
                      className="w-full bg-black border border-cyan-800 p-2 text-xs text-cyan-300 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={apiSending}
                    className="bg-fuchsia-900 hover:bg-fuchsia-800 text-fuchsia-200 border border-fuchsia-500 py-2.5 text-xs font-bold uppercase tracking-widest"
                  >
                    {apiSending ? 'DISPATCHING...' : 'DISPATCH API MESSAGE'}
                  </button>

                  <div className="mt-2 p-3 bg-black/90 border border-cyan-950 text-[11px] font-mono text-cyan-500">
                    <code>curl -X POST http://localhost:3000/api/send-message \<br/>
                    -H "Content-Type: application/json" \<br/>
                    -d '{'{"to": "94781234567", "message": "Hello from API"}'}'</code>
                  </div>
                </form>

                {/* API Dispatched Logs */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-cyan-400 font-bold uppercase">Recent API Outbound Dispatches</span>
                  <div className="flex-1 overflow-auto border border-cyan-900/50 max-h-[360px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-cyan-950 text-cyan-400 sticky top-0">
                        <tr>
                          <th className="p-2 border-b border-cyan-800">Time</th>
                          <th className="p-2 border-b border-cyan-800">Recipient</th>
                          <th className="p-2 border-b border-cyan-800">Payload</th>
                          <th className="p-2 border-b border-cyan-800">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webhookLogs.map((w, i) => (
                          <tr key={i} className="border-b border-cyan-900/30">
                            <td className="p-2 font-mono text-cyan-500">{new Date(w.timestamp).toLocaleTimeString()}</td>
                            <td className="p-2 font-bold text-cyan-300">{w.to}</td>
                            <td className="p-2 text-cyan-400">{w.message}</td>
                            <td className="p-2"><span className="text-emerald-400 font-bold">{w.status}</span></td>
                          </tr>
                        ))}
                        {webhookLogs.length === 0 && (
                          <tr><td colSpan="4" className="p-6 text-center text-cyan-800">No outbound REST API dispatches recorded yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                  {Object.keys(chatHistory).length === 0 && (
                    <div className="p-4 text-center text-xs text-cyan-800">No active chat sessions yet.</div>
                  )}
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
              <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest border-b border-cyan-900 pb-2 mb-4"><ShoppingCart size={18}/> DIGITAL CART & INVOICE LOGS</h2>
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
                    {orders.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-cyan-800">No orders logged. Use `!order [item]` in WhatsApp to test.</td></tr>}
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
                    {schedules.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-cyan-800">No recurring broadcasts registered.</td></tr>}
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
                        <td className="p-3 font-bold text-cyan-400">{c.number}</td><td className="p-3">{c.pushName}</td><td className="p-3"><span className="bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded-sm">{c.tags?.join(', ') || 'New Entity'}</span></td><td className="p-3 font-mono opacity-50">{new Date(c.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                    {contacts.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-cyan-800">No CRM contacts logged.</td></tr>}
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

          {/* DSH-IM MULTI-CHANNEL GATEWAY */}
          {activeTab === 'dsh_im' && (
            <div className="overflow-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest">
                    <Network size={20} className="text-fuchsia-400" /> DSH-IM MULTI-CHANNEL GATEWAY
                  </h2>
                  <p className="text-xs text-cyan-600">DeepSeek Harness Instant Messaging Hub • WhatsApp, Telegram, Discord, Slack, Feishu, WeCom, DingTalk, QQ</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-fuchsia-950/60 border border-fuchsia-700 text-fuchsia-300 font-bold">
                    ACTIVE: {dshChannels.filter(c => c.enabled).length} / {dshChannels.length || 8} CHANNELS
                  </span>
                </div>
              </div>

              {/* CHANNELS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dshChannels.map(ch => {
                  const isOnline = ch.enabled && ch.status === 'connected';
                  return (
                    <div key={ch.id} className={`p-4 border transition-all flex flex-col justify-between ${isOnline ? 'border-cyan-500/70 bg-cyan-950/20' : 'border-cyan-900/40 bg-black/50 opacity-80'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded ${isOnline ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-900 text-gray-500'}`}>
                              {ch.type === 'whatsapp' && <Smartphone size={18} />}
                              {ch.type === 'telegram' && <Send size={18} />}
                              {ch.type === 'discord' && <Radio size={18} />}
                              {ch.type === 'slack' && <MessageCircle size={18} />}
                              {ch.type === 'feishu' && <Workflow size={18} />}
                              {ch.type === 'wecom' && <Globe size={18} />}
                              {ch.type === 'dingtalk' && <Cable size={18} />}
                              {ch.type === 'qq' && <Smile size={18} />}
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-cyan-300 leading-tight">{ch.name}</h3>
                              <span className="text-[10px] text-cyan-600 uppercase">{ch.type}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border ${isOnline ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40' : 'border-gray-700 text-gray-500 bg-gray-900/40'}`}>
                            {isOnline ? 'CONNECTED' : 'IDLE'}
                          </span>
                        </div>

                        <div className="space-y-1.5 my-3 text-[11px] text-cyan-600">
                          <div className="flex justify-between">
                            <span>Binding:</span>
                            <span className="text-fuchsia-400 font-bold truncate max-w-[120px]">{ch.sessionBinding}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processed:</span>
                            <span className="text-cyan-400">{ch.messagesProcessed?.toLocaleString() || 0} msgs</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span>Endpoint:</span>
                            <span className="text-gray-400 truncate max-w-[120px] font-mono">{ch.endpoint}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-cyan-900/40 flex gap-2">
                        <button
                          onClick={() => toggleDshChannel(ch.id)}
                          className={`flex-1 py-1.5 text-[11px] font-bold uppercase transition-colors border ${ch.enabled ? 'border-red-800 bg-red-950/40 text-red-400 hover:bg-red-900/50' : 'border-cyan-500 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-800/60'}`}
                        >
                          {ch.enabled ? 'DISCONNECT' : 'ACTIVATE'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CROSS-PLATFORM MESSAGE RELAY */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider border-b border-cyan-900/60 pb-2">
                    <SendHorizontal size={16} className="text-fuchsia-400" /> CROSS-CHANNEL RELAY DISPATCHER
                  </div>
                  <p className="text-[11px] text-cyan-600">
                    Forward synchronized payloads bi-directionally between active IM channels via DSH-IM broker.
                  </p>
                  
                  <form onSubmit={sendDshRelay} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Source Gateway</label>
                        <select
                          value={dshRelaySource}
                          onChange={e => setDshRelaySource(e.target.value)}
                          className="w-full bg-cyan-950/50 border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                        >
                          <option value="WhatsApp">WhatsApp (Levanter/Knight)</option>
                          <option value="Telegram">Telegram Gateway</option>
                          <option value="Discord">Discord Hub</option>
                          <option value="Slack">Slack Workspace</option>
                          <option value="Feishu">Feishu / Lark</option>
                          <option value="WeCom">WeCom Enterprise</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Target Channel</label>
                        <select
                          value={dshRelayTarget}
                          onChange={e => setDshRelayTarget(e.target.value)}
                          className="w-full bg-cyan-950/50 border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                        >
                          <option value="Telegram">Telegram Gateway</option>
                          <option value="Discord">Discord Hub</option>
                          <option value="WhatsApp">WhatsApp (All Chats)</option>
                          <option value="Feishu">Feishu / Lark</option>
                          <option value="Slack">Slack Workspace</option>
                          <option value="WeCom">WeCom Enterprise</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Message / Event Payload</label>
                      <textarea
                        value={dshRelayMessage}
                        onChange={e => setDshRelayMessage(e.target.value)}
                        placeholder="Type payload to broadcast across selected IM channel..."
                        className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2.5 h-20 resize-none focus:outline-none focus:border-fuchsia-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={dshRelaySending}
                      className="py-2.5 bg-fuchsia-950 border border-fuchsia-500 text-fuchsia-300 font-bold text-xs uppercase tracking-wider hover:bg-fuchsia-900 transition-colors"
                    >
                      {dshRelaySending ? 'TRANSMITTING PACKET...' : 'DISPATCH CROSS-RELAY PACKET'}
                    </button>
                  </form>
                </div>

                {/* RELAY LOGS AUDIT */}
                <div className="lg:col-span-7 bg-black/70 border border-cyan-900/60 p-4 flex flex-col">
                  <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2 mb-3">
                    <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <Workflow size={16} className="text-cyan-400" /> LIVE DSH-IM RELAY AUDIT STREAM
                    </span>
                    <span className="text-[10px] text-cyan-600">{dshRelayLogs.length} LOGGED EVENTS</span>
                  </div>

                  <div className="flex-1 overflow-auto max-h-[260px] border border-cyan-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-cyan-950 text-cyan-400 sticky top-0 text-[10px] uppercase">
                        <tr>
                          <th className="p-2 border-b border-cyan-800">Source ➔ Target</th>
                          <th className="p-2 border-b border-cyan-800">Payload</th>
                          <th className="p-2 border-b border-cyan-800">Time</th>
                          <th className="p-2 border-b border-cyan-800">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-900/30 text-[11px]">
                        {dshRelayLogs.map(log => (
                          <tr key={log.id} className="hover:bg-cyan-900/20">
                            <td className="p-2 font-bold text-cyan-400 whitespace-nowrap">
                              <span className="text-fuchsia-400">{log.source}</span> ➔ <span>{log.target}</span>
                            </td>
                            <td className="p-2 font-mono text-cyan-300 max-w-[200px] truncate">{log.message}</td>
                            <td className="p-2 text-cyan-600 whitespace-nowrap text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold uppercase">
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {dshRelayLogs.length === 0 && (
                          <tr><td colSpan="4" className="p-4 text-center text-cyan-800">No relay events recorded yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* INBOUND WEBHOOK SIMULATOR */}
              <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2">
                  <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Webhook size={16} className="text-amber-400" /> INBOUND IM WEBHOOK INGRESS SIMULATOR
                  </span>
                  <span className="text-[10px] text-amber-500 font-mono">POST /api/dsh-im/webhook/:channel</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Simulated Channel</label>
                    <select
                      value={dshWebhookChannel}
                      onChange={e => setDshWebhookChannel(e.target.value)}
                      className="w-full bg-cyan-950/50 border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                    >
                      <option value="telegram">Telegram Webhook</option>
                      <option value="discord">Discord Interaction</option>
                      <option value="slack">Slack Events API</option>
                      <option value="feishu">Feishu Lark Bot Event</option>
                    </select>
                  </div>
                  <div className="md:col-span-7">
                    <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">JSON Body</label>
                    <input
                      type="text"
                      value={dshWebhookPayload}
                      onChange={e => setDshWebhookPayload(e.target.value)}
                      className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 font-mono focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-transparent block mb-1">Action</label>
                    <button
                      onClick={sendDshTestWebhook}
                      disabled={dshWebhookSending}
                      className="w-full py-2 bg-amber-950 border border-amber-500 text-amber-300 font-bold text-xs uppercase hover:bg-amber-900 transition-colors"
                    >
                      {dshWebhookSending ? 'INGESTING...' : 'INGEST EVENT'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEEPSEEK HARNESS & AI OFFICE */}
          {activeTab === 'deepseek_harness' && (
            <div className="overflow-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest">
                    <Brain size={20} className="text-fuchsia-400" /> DEEPSEEK HARNESS & AI OFFICE
                  </h2>
                  <p className="text-xs text-cyan-600">DeepSeek-R1 CoT Reasoning Engine • DeepSeek-V3 MoE • AI Workspaces & Enterprise Knowledge</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                    MODEL: <strong className="text-fuchsia-400">{dshDeepSeekModel.toUpperCase()}</strong>
                  </span>
                </div>
              </div>

              {/* COGNITIVE PLAYGROUND & REASONER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2">
                    <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <Cpu size={16} className="text-fuchsia-400" /> DEEPSEEK COGNITIVE INFERENCE
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDshDeepSeekModel('deepseek-reasoner')}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase border ${dshDeepSeekModel === 'deepseek-reasoner' ? 'border-fuchsia-500 bg-fuchsia-950 text-fuchsia-300' : 'border-cyan-900 text-cyan-600'}`}
                      >
                        DeepSeek-R1 (CoT)
                      </button>
                      <button
                        onClick={() => setDshDeepSeekModel('deepseek-chat')}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase border ${dshDeepSeekModel === 'deepseek-chat' ? 'border-fuchsia-500 bg-fuchsia-950 text-fuchsia-300' : 'border-cyan-900 text-cyan-600'}`}
                      >
                        DeepSeek-V3
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">User Query / Prompt</label>
                    <textarea
                      value={dshDeepSeekPrompt}
                      onChange={e => setDshDeepSeekPrompt(e.target.value)}
                      placeholder="Ask complex logic, code algorithms, or bot workflow design..."
                      className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-3 h-24 resize-none focus:outline-none focus:border-fuchsia-500 font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="text-cyan-600 self-center">Presets:</span>
                    {[
                      'Design high-throughput WhatsApp bot architecture',
                      'Explain 3-strike defense algorithm logic in JS',
                      'Compare DeepSeek-R1 vs Gemini 2.5 Flash for IM',
                      'Write a custom Levanter ePlugin for weather lookup'
                    ].map(p => (
                      <button
                        key={p}
                        onClick={() => setDshDeepSeekPrompt(p)}
                        className="px-2 py-1 bg-cyan-950/60 border border-cyan-800 text-cyan-400 hover:text-fuchsia-300 text-left"
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={runDeepSeekInference}
                    disabled={dshIsRunningDeepSeek}
                    className="py-3 bg-fuchsia-950 border-2 border-fuchsia-500 text-fuchsia-300 font-bold text-xs uppercase tracking-widest hover:bg-fuchsia-850 transition-all flex justify-center items-center gap-2"
                  >
                    {dshIsRunningDeepSeek ? <Activity size={16} className="animate-spin" /> : <Zap size={16} />}
                    {dshIsRunningDeepSeek ? 'DEEPSEEK REASONING IN PROGRESS...' : `RUN ${dshDeepSeekModel.toUpperCase()} INFERENCE`}
                  </button>
                </div>

                {/* INFERENCE OUTPUT & REASONING (THINK) INSPECTOR */}
                <div className="lg:col-span-6 bg-black/70 border border-cyan-900/60 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2 mb-3">
                      <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <Brain size={16} className="text-cyan-400" /> REASONING TOKENS & OUTPUT
                      </span>
                      {dshDeepSeekResult && (
                        <div className="flex gap-2 text-[10px] text-cyan-500 font-mono">
                          <span>⏱️ {dshDeepSeekResult.durationMs}ms</span>
                          <span>⚡ {dshDeepSeekResult.tokens} tokens</span>
                        </div>
                      )}
                    </div>

                    {dshDeepSeekResult ? (
                      <div className="space-y-3">
                        {/* REASONING STEP / THINK BLOCK */}
                        {dshDeepSeekResult.reasoning && (
                          <div className="p-3 bg-fuchsia-950/25 border border-fuchsia-800/60 text-xs">
                            <div className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                              <Sparkles size={13} /> &lt;think&gt; CHAIN-OF-THOUGHT REASONING &lt;/think&gt;
                            </div>
                            <pre className="text-[11px] text-fuchsia-200/90 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">
                              {dshDeepSeekResult.reasoning}
                            </pre>
                          </div>
                        )}

                        {/* FINAL OUTPUT */}
                        <div className="p-3 bg-cyan-950/30 border border-cyan-800/60 text-xs max-h-48 overflow-y-auto">
                          <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider mb-1">
                            SYNTHESIZED RESPONSE:
                          </div>
                          <p className="text-cyan-200 whitespace-pre-wrap font-mono leading-relaxed">
                            {dshDeepSeekResult.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-cyan-800 border border-dashed border-cyan-950 flex flex-col items-center justify-center min-h-[220px]">
                        <Brain size={32} className="opacity-30 mb-2" />
                        <span className="text-xs">DeepSeek inference engine ready.</span>
                        <span className="text-[10px] text-cyan-900 mt-1">Select a prompt or run a query to inspect live Chain-of-Thought reasoning.</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-cyan-900/40 text-[10px] text-cyan-600 flex justify-between">
                    <span>Protocol: DeepSeek OpenAI-compatible REST API</span>
                    <span>Fallback: Gemini 2.5 Flash Auto-failover</span>
                  </div>
                </div>
              </div>

              {/* AI WORKSPACES & SESSION BINDINGS */}
              <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2">
                  <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" /> DSH-IM WORKSPACES & SESSION BINDINGS
                  </span>
                  <span className="text-[10px] text-cyan-600">{dshWorkspaces.length} WORKSPACES CONFIGURED</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dshWorkspaces.map(ws => (
                    <div key={ws.id} className="p-3.5 border border-cyan-800/60 bg-cyan-950/20 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xs font-bold text-cyan-300">{ws.name}</h3>
                          <span className="text-[9px] px-1.5 py-0.5 bg-fuchsia-950 border border-fuchsia-700 text-fuchsia-300 font-bold font-mono">
                            {ws.model}
                          </span>
                        </div>
                        <p className="text-[11px] text-cyan-600 mb-3 italic">"{ws.systemPrompt}"</p>
                        
                        <div className="space-y-1 text-[11px] text-cyan-500 font-mono">
                          <div className="flex justify-between">
                            <span>Reasoning Effort:</span>
                            <span className="text-cyan-300 uppercase">{ws.reasoningEffort}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Temperature:</span>
                            <span className="text-cyan-300">{ws.temperature}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Token Budget:</span>
                            <span className="text-cyan-300">{ws.tokenBudget}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-cyan-900/40">
                        <span className="text-[10px] text-cyan-600 block mb-1 font-bold">BOUND CHANNELS:</span>
                        <div className="flex flex-wrap gap-1">
                          {ws.channels.map(ch => (
                            <span key={ch} className="px-1.5 py-0.5 bg-cyan-900/40 border border-cyan-700 text-cyan-300 text-[9px] font-bold uppercase">
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI OFFICE KNOWLEDGE DOCS HUB */}
              <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2">
                  <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileText size={16} className="text-cyan-400" /> AI OFFICE KNOWLEDGE REPOSITORY
                  </span>
                  <button
                    onClick={() => setDshShowNewDocModal(!dshShowNewDocModal)}
                    className="px-3 py-1 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold text-xs uppercase hover:bg-cyan-850 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={13} /> {dshShowNewDocModal ? 'CLOSE FORM' : 'ADD KNOWLEDGE DOC'}
                  </button>
                </div>

                {dshShowNewDocModal && (
                  <form onSubmit={createDshDoc} className="p-4 bg-cyan-950/30 border border-cyan-700/60 flex flex-col gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Doc Title</label>
                        <input
                          type="text"
                          value={dshNewDocTitle}
                          onChange={e => setDshNewDocTitle(e.target.value)}
                          placeholder="e.g. Group Moderation Rules, Return Policy"
                          className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Category</label>
                        <select
                          value={dshNewDocCategory}
                          onChange={e => setDshNewDocCategory(e.target.value)}
                          className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                        >
                          <option value="Bot Manual">Bot Manual</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="AI Intelligence">AI Intelligence</option>
                          <option value="Enterprise Policy">Enterprise Policy</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Doc Knowledge Content</label>
                      <textarea
                        value={dshNewDocContent}
                        onChange={e => setDshNewDocContent(e.target.value)}
                        placeholder="Content injected into DeepSeek Harness context memory..."
                        className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2.5 h-20 resize-none focus:outline-none font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2 bg-cyan-900 border border-cyan-400 text-cyan-100 font-bold text-xs uppercase hover:bg-cyan-800"
                    >
                      SAVE TO KNOWLEDGE BASE
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dshDocs.map(doc => (
                    <div key={doc.id} className="p-3 bg-black/60 border border-cyan-900/60 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className="text-xs font-bold text-cyan-300">{doc.title}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
                            {doc.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-cyan-600 line-clamp-3 font-mono">{doc.content}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-cyan-900/40 flex justify-end">
                        <button
                          onClick={() => deleteDshDoc(doc.id)}
                          className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-bold uppercase"
                        >
                          <Trash2 size={12} /> DELETE
                        </button>
                      </div>
                    </div>
                  ))}
                  {dshDocs.length === 0 && (
                    <div className="col-span-3 p-4 text-center text-cyan-800 text-xs">No knowledge documents stored.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WPPCONNECT & WA-JS AUTOMATION MATRIX */}
          {activeTab === 'wppconnect' && (
            <div className="overflow-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-900 pb-3">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2 text-cyan-300 uppercase tracking-widest">
                    <Smartphone size={20} className="text-emerald-400" /> WPPCONNECT & WA-JS MATRIX
                  </h2>
                  <p className="text-xs text-cyan-600">WhatsApp Multi-Device REST Server • Interactive Buttons, Polls, Lists & Stories Broadcast Engine</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setWppShowNewSessionModal(!wppShowNewSessionModal)}
                    className="px-3 py-1.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold uppercase hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> {wppShowNewSessionModal ? 'CLOSE' : 'START NEW SESSION'}
                  </button>
                </div>
              </div>

              {/* NEW SESSION MODAL FORM */}
              {wppShowNewSessionModal && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-700/60 flex flex-col gap-3">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone size={15} /> INITIALIZE NEW WPPCONNECT WHATSAPP WEB SESSION
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Session Identifier</label>
                      <input
                        type="text"
                        value={wppNewSessionName}
                        onChange={e => setWppNewSessionName(e.target.value)}
                        placeholder="e.g. session-customer-service"
                        className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Virtual / Primary Phone</label>
                      <input
                        type="text"
                        value={wppNewSessionPhone}
                        onChange={e => setWppNewSessionPhone(e.target.value)}
                        placeholder="e.g. 94781234567"
                        className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => startWppSession(wppNewSessionName, wppNewSessionPhone)}
                    className="py-2 bg-emerald-900 border border-emerald-400 text-emerald-100 font-bold text-xs uppercase hover:bg-emerald-800"
                  >
                    DEPLOY WPPCONNECT HEADLESS INSTANCE
                  </button>
                </div>
              )}

              {/* WPP SESSIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {wppSessions.map(sess => {
                  const isConnected = sess.status === 'CONNECTED';
                  const isCurrent = wppActiveSession === sess.id;
                  return (
                    <div key={sess.id} className={`p-4 border transition-all flex flex-col justify-between ${isCurrent ? 'border-emerald-400 bg-emerald-950/30 ring-1 ring-emerald-500' : isConnected ? 'border-cyan-800 bg-cyan-950/20' : 'border-gray-800 bg-black/60 opacity-75'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xs font-bold text-cyan-200">{sess.name}</h3>
                            <span className="text-[10px] font-mono text-cyan-600 block">{sess.id}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase ${isConnected ? 'border-emerald-500 text-emerald-400 bg-emerald-950/60' : 'border-amber-600 text-amber-400 bg-amber-950/60'}`}>
                            {sess.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 my-3 text-[11px] text-cyan-600">
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="text-cyan-300 font-mono font-bold">+{sess.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Device:</span>
                            <span className="text-emerald-400 font-mono">🔋 {sess.battery}% {sess.plugged ? '⚡' : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Engine:</span>
                            <span className="text-gray-400 font-mono text-[10px]">{sess.platform}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span>Token:</span>
                            <span className="text-fuchsia-400 font-mono truncate max-w-[110px]" title={sess.token}>{sess.token}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-cyan-900/40 flex flex-col gap-1.5">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setWppActiveSession(sess.id)}
                            className={`flex-1 py-1 text-[10px] font-bold uppercase border ${isCurrent ? 'border-emerald-500 bg-emerald-900/80 text-emerald-200' : 'border-cyan-800 bg-cyan-950 text-cyan-400 hover:text-cyan-200'}`}
                          >
                            {isCurrent ? 'ACTIVE TARGET' : 'SELECT'}
                          </button>
                          <button
                            onClick={() => generateWppToken(sess.id)}
                            title="Rotate Bearer Token"
                            className="px-2 py-1 text-[10px] font-bold uppercase border border-cyan-800 bg-cyan-950 text-cyan-400 hover:text-cyan-200"
                          >
                            🔑
                          </button>
                        </div>
                        {isConnected ? (
                          <button
                            onClick={() => closeWppSession(sess.id)}
                            className="w-full py-1 text-[10px] font-bold uppercase border border-red-900 bg-red-950/40 text-red-400 hover:bg-red-900/60"
                          >
                            DISCONNECT
                          </button>
                        ) : (
                          <button
                            onClick={() => startWppSession(sess.id, sess.phone)}
                            className="w-full py-1 text-[10px] font-bold uppercase border border-emerald-700 bg-emerald-950 text-emerald-300 hover:bg-emerald-900"
                          >
                            RECONNECT
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* INTERACTIVE MESSAGES COMPOSER STUDIO */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* BUTTONS & POLLS DISPATCHER */}
                <div className="lg:col-span-6 bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2">
                    <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <Zap size={16} className="text-emerald-400" /> INTERACTIVE BUTTONS & POLL CREATOR
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Target: {wppActiveSession}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Target Phone (with Country Code)</label>
                      <input
                        type="text"
                        value={wppTargetPhone}
                        onChange={e => setWppTargetPhone(e.target.value)}
                        placeholder="e.g. 94781112233"
                        className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Buttons Header Title</label>
                      <input
                        type="text"
                        value={wppButtonTitle}
                        onChange={e => setWppButtonTitle(e.target.value)}
                        className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">Body Text</label>
                    <textarea
                      value={wppButtonMsg}
                      onChange={e => setWppButtonMsg(e.target.value)}
                      className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2.5 h-16 resize-none focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-cyan-500 font-bold uppercase block">Interactive Action Buttons (Up to 3)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={wppButton1}
                        onChange={e => setWppButton1(e.target.value)}
                        placeholder="Button 1"
                        className="bg-cyan-950/40 border border-cyan-800 text-cyan-200 text-xs p-1.5 font-bold"
                      />
                      <input
                        type="text"
                        value={wppButton2}
                        onChange={e => setWppButton2(e.target.value)}
                        placeholder="Button 2"
                        className="bg-cyan-950/40 border border-cyan-800 text-cyan-200 text-xs p-1.5 font-bold"
                      />
                      <input
                        type="text"
                        value={wppButton3}
                        onChange={e => setWppButton3(e.target.value)}
                        placeholder="Button 3"
                        className="bg-cyan-950/40 border border-cyan-800 text-cyan-200 text-xs p-1.5 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={sendWppButtons}
                      disabled={wppSendingAction}
                      className="flex-1 py-2.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold text-xs uppercase tracking-wider hover:bg-emerald-900 transition-colors"
                    >
                      {wppSendingAction ? 'DISPATCHING...' : 'DISPATCH INTERACTIVE BUTTONS'}
                    </button>
                    <button
                      onClick={sendWppListMenu}
                      disabled={wppSendingAction}
                      className="py-2.5 px-3 bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold text-xs uppercase hover:bg-cyan-900"
                    >
                      SEND LIST MENU
                    </button>
                  </div>

                  {/* NATIVE POLL SECTION */}
                  <div className="mt-2 pt-3 border-t border-cyan-900/60">
                    <label className="text-[10px] text-amber-400 font-bold uppercase block mb-1">Native WhatsApp Poll Creator</label>
                    <input
                      type="text"
                      value={wppPollTitle}
                      onChange={e => setWppPollTitle(e.target.value)}
                      placeholder="Poll question..."
                      className="w-full bg-black border border-cyan-800 text-cyan-300 text-xs p-2 mb-2 font-mono focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input type="text" value={wppPollOpt1} onChange={e => setWppPollOpt1(e.target.value)} className="bg-cyan-950/30 border border-cyan-800 text-cyan-300 text-xs p-1.5" />
                      <input type="text" value={wppPollOpt2} onChange={e => setWppPollOpt2(e.target.value)} className="bg-cyan-950/30 border border-cyan-800 text-cyan-300 text-xs p-1.5" />
                      <input type="text" value={wppPollOpt3} onChange={e => setWppPollOpt3(e.target.value)} className="bg-cyan-950/30 border border-cyan-800 text-cyan-300 text-xs p-1.5" />
                      <input type="text" value={wppPollOpt4} onChange={e => setWppPollOpt4(e.target.value)} className="bg-cyan-950/30 border border-cyan-800 text-cyan-300 text-xs p-1.5" />
                    </div>
                    <button
                      onClick={sendWppPoll}
                      disabled={wppSendingAction}
                      className="w-full py-2 bg-amber-950 border border-amber-500 text-amber-300 font-bold text-xs uppercase hover:bg-amber-900"
                    >
                      DISPATCH NATIVE WHATSAPP POLL
                    </button>
                  </div>
                </div>

                {/* WA-JS BROWSER CODE RUNNER & STORIES */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                  {/* WA-JS CODE RUNNER */}
                  <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2">
                      <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <Code2 size={16} className="text-cyan-400" /> WA-JS RUNTIME CODE RUNNER
                      </span>
                      <span className="text-[10px] text-cyan-500 font-mono">WPP Runtime v3.1</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2 text-[10px]">
                        <span className="text-cyan-600 self-center">Snippets:</span>
                        {[
                          { l: 'My Device Info', c: 'await WPP.conn.getMyDeviceInfo();' },
                          { l: 'List Chats', c: 'await WPP.chat.list({ count: 5 });' },
                          { l: 'Group Info', c: 'await WPP.group.getParticipants("1203630291823912@g.us");' },
                          { l: 'Profile Picture', c: 'await WPP.profile.getMyProfilePicture();' },
                          { l: 'My Status', c: 'await WPP.status.getMyStatus();' }
                        ].map(sn => (
                          <button
                            key={sn.l}
                            onClick={() => setWppWajsCode(sn.c)}
                            className="px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 hover:text-emerald-300 font-mono text-[10px]"
                          >
                            {sn.l}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={wppWajsCode}
                        onChange={e => setWppWajsCode(e.target.value)}
                        className="w-full bg-black border border-cyan-800 text-emerald-400 text-xs p-2.5 h-20 font-mono resize-none focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      onClick={executeWppWajs}
                      disabled={wppIsExecutingWajs}
                      className="py-2 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold text-xs uppercase hover:bg-cyan-850 flex justify-center items-center gap-2"
                    >
                      {wppIsExecutingWajs ? <Activity size={14} className="animate-spin" /> : <Play size={14} />}
                      {wppIsExecutingWajs ? 'EXECUTING IN WA-JS CONTEXT...' : 'EXECUTE IN WA-JS CONTEXT'}
                    </button>

                    {wppWajsResult && (
                      <div className="p-2.5 bg-black border border-emerald-800/80 text-xs max-h-36 overflow-y-auto">
                        <div className="flex justify-between text-[10px] text-emerald-500 font-mono mb-1">
                          <span>Output: WA-JS Result</span>
                          <span>⏱️ {wppWajsResult.durationMs}ms</span>
                        </div>
                        <pre className="text-emerald-300 font-mono text-[11px] whitespace-pre-wrap">
                          {JSON.stringify(wppWajsResult.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* WHATSAPP STATUS / STORY BROADCAST */}
                  <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2">
                      <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <Share2 size={16} className="text-fuchsia-400" /> WHATSAPP STATUS / STORIES BROADCAST
                      </span>
                      <span className="text-[10px] text-fuchsia-400 font-bold">{wppStories.length} ACTIVE STORIES</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={wppStoryText}
                        onChange={e => setWppStoryText(e.target.value)}
                        placeholder="Write text for your WhatsApp Story..."
                        className="flex-1 bg-black border border-cyan-800 text-cyan-300 text-xs p-2 focus:outline-none"
                      />
                      <select
                        value={wppStoryBg}
                        onChange={e => setWppStoryBg(e.target.value)}
                        className="bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs px-2 focus:outline-none"
                      >
                        <option value="#0f172a">Dark Slate</option>
                        <option value="#064e3b">Emerald Green</option>
                        <option value="#701a75">Fuchsia Velvet</option>
                        <option value="#78350f">Amber Warm</option>
                      </select>
                      <button
                        onClick={sendWppStatusStory}
                        disabled={wppSendingAction}
                        className="px-4 py-2 bg-fuchsia-950 border border-fuchsia-500 text-fuchsia-300 font-bold text-xs uppercase hover:bg-fuchsia-900 whitespace-nowrap"
                      >
                        POST STORY
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {wppStories.slice(0, 4).map(st => (
                        <div key={st.id} style={{ backgroundColor: st.backgroundColor || '#0f172a' }} className="p-2.5 border border-cyan-800/60 flex flex-col justify-between min-h-[60px]">
                          <p className="text-[11px] text-white font-medium truncate">{st.content}</p>
                          <div className="flex justify-between items-center text-[9px] text-gray-300 mt-1 font-mono">
                            <span>👀 {st.views} views</span>
                            <span>{new Date(st.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* WPPCONNECT REST API CALL LOGS */}
              <div className="bg-black/70 border border-cyan-900/60 p-4 flex flex-col">
                <div className="flex justify-between items-center border-b border-cyan-900/60 pb-2 mb-3">
                  <span className="text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" /> WPPCONNECT REST API DISPATCH AUDIT LOG
                  </span>
                  <span className="text-[10px] text-cyan-600">{wppLogs.length} RECORDED API CALLS</span>
                </div>

                <div className="overflow-auto max-h-48 border border-cyan-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cyan-950 text-cyan-400 sticky top-0 text-[10px] uppercase">
                      <tr>
                        <th className="p-2 border-b border-cyan-800">Method</th>
                        <th className="p-2 border-b border-cyan-800">REST Endpoint</th>
                        <th className="p-2 border-b border-cyan-800">Payload Preview</th>
                        <th className="p-2 border-b border-cyan-800">Time</th>
                        <th className="p-2 border-b border-cyan-800">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30 text-[11px]">
                      {wppLogs.map(log => (
                        <tr key={log.id} className="hover:bg-cyan-900/20">
                          <td className="p-2 font-bold font-mono text-emerald-400">{log.method}</td>
                          <td className="p-2 font-mono text-cyan-300">{log.endpoint}</td>
                          <td className="p-2 font-mono text-cyan-500 max-w-[240px] truncate">{log.payload}</td>
                          <td className="p-2 text-cyan-600 text-[10px] whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 text-[9px] bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold">
                              {log.status} OK
                            </span>
                          </td>
                        </tr>
                      ))}
                      {wppLogs.length === 0 && (
                        <tr><td colSpan="5" className="p-4 text-center text-cyan-800">No WPPConnect API calls logged yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
