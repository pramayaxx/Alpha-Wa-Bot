const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update lucide-react imports
const oldImport = "import { ShoppingCart, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle } from 'lucide-react';";
const newImport = "import { ShoppingCart, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle, Shield, Lock, LogOut, MessageSquare, Sparkles, Save, Server, Code } from 'lucide-react';";
if (code.includes(oldImport)) {
    code = code.replace(oldImport, newImport);
} else {
    code = code.replace(/import {.*?} from 'lucide-react';/, newImport);
}

// 2. Add auth states
const oldStates = `  const [activeTab, setActiveTab] = useState('connection');`;
const newStates = `  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('alpha_auth') === 'true');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');`;
code = code.replace(oldStates, newStates);

// 3. Add handleLogin function & UI
const oldReturn = `  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">`;

const loginUI = `  const handleLogin = async () => {
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">`;

code = code.replace(oldReturn, loginUI);

// 4. Add Logout button to the sidebar
const oldSidebarEnd = `        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>`;

const newSidebarEnd = `        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout} className="w-full py-2 px-4 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>`;

code = code.replace(oldSidebarEnd, newSidebarEnd);

fs.writeFileSync('src/App.tsx', code);
