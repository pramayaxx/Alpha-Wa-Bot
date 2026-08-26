const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. New imports for Recharts and extra Icons
const oldImport = `import { ShoppingCart, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle, Shield, Lock, LogOut, MessageSquare, Sparkles, Save, Server, Code } from 'lucide-react';`;
const newImport = `import { ShoppingCart, Bot, Puzzle, RefreshCcw, Check, Terminal, PlayCircle, Shield, Lock, LogOut, MessageSquare, Sparkles, Save, Server, Code, LayoutDashboard, Package, TrendingUp, Users } from 'lucide-react';\nimport { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';`;
code = code.replace(oldImport, newImport);

// 2. Add Analytics and Orders states
const oldStates = `  const [activeTab, setActiveTab] = useState('connection');`;
const newStates = `  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState<any>({ dailyMessages: {}, popularProducts: {}, totalSales: 0 });
  const [orders, setOrders] = useState<any[]>([]);`;
code = code.replace(oldStates, newStates);

// 3. Load Data updates
const oldLoadData = `      const res2 = await fetch('/api/shop/customers');
      setCustomers(await res2.json());`;
const newLoadData = `      const res2 = await fetch('/api/shop/customers');
      setCustomers(await res2.json());
      const res3 = await fetch('/api/analytics');
      setAnalytics(await res3.json());
      const res4 = await fetch('/api/shop/orders');
      setOrders(await res4.json());`;
code = code.replace(oldLoadData, newLoadData);

// 4. Update system prompt injection to include Order instructions
const oldSaveSettings = `    const instruction = "\\n\\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]";`;
const newSaveSettings = `    const instruction = "\\n\\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]\\n\\nTo create an order, output EXACTLY: [CREATE_ORDER: ProductName || CustomerName || CustomerAddress]\\nTo check an order status, output EXACTLY: [CHECK_ORDER: OrderID]";`;
code = code.replace(oldSaveSettings, newSaveSettings);

// 5. Update Sidebar Links
const oldSidebar = `        <nav className="flex-1 py-4 overflow-y-auto">
          <button onClick={() => setActiveTab('connection')} className={\`w-full flex items-center px-6 py-3 \${activeTab === 'connection' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-r-2 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>
            <Terminal size={18} className="mr-3" /> System Status
          </button>`;
const newSidebar = `        <nav className="flex-1 py-4 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={\`w-full flex items-center px-6 py-3 \${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-r-2 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>
            <LayoutDashboard size={18} className="mr-3" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('orders')} className={\`w-full flex items-center px-6 py-3 \${activeTab === 'orders' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-r-2 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>
            <Package size={18} className="mr-3" /> Orders
          </button>
          <button onClick={() => setActiveTab('connection')} className={\`w-full flex items-center px-6 py-3 \${activeTab === 'connection' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-r-2 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}\`}>
            <Terminal size={18} className="mr-3" /> System Status
          </button>`;
code = code.replace(oldSidebar, newSidebar);

// 6. Add Dashboard and Orders Tabs UI
const oldConnectionTab = `{/* CONNECTION STATUS */}`;
const newDashboardUI = `
{/* DASHBOARD */}
{activeTab === 'dashboard' && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Sales</p>
            <h3 className="text-2xl font-bold">{analytics.totalSales || 0}</h3>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center"><MessageSquare size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Messages Today</p>
            <h3 className="text-2xl font-bold">{analytics.dailyMessages[new Date().toISOString().split('T')[0]] || 0}</h3>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center"><Users size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Customers</p>
            <h3 className="text-2xl font-bold">{customers.length}</h3>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm h-80">
        <h3 className="font-bold mb-4">Daily Interactions</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={Object.entries(analytics.dailyMessages || {}).map(([date, count]) => ({ date, count }))}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm h-80">
        <h3 className="font-bold mb-4">Popular Products Inquiry</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={Object.entries(analytics.popularProducts || {}).map(([name, count]) => ({ name, count }))}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}

{/* ORDERS */}
{activeTab === 'orders' && (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Package className="text-indigo-500" /> Order Management</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b dark:border-slate-800 text-sm font-medium text-slate-500">
            <th className="pb-3 px-4">Order ID</th>
            <th className="pb-3 px-4">Date</th>
            <th className="pb-3 px-4">Customer</th>
            <th className="pb-3 px-4">Product</th>
            <th className="pb-3 px-4">Status</th>
            <th className="pb-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {orders.length === 0 && (
            <tr><td colSpan={6} className="py-8 text-center text-slate-500">No orders yet.</td></tr>
          )}
          {orders.map(order => (
            <tr key={order.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-4 px-4 font-mono font-medium text-indigo-600">{order.id}</td>
              <td className="py-4 px-4">{new Date(order.date).toLocaleDateString()}</td>
              <td className="py-4 px-4">
                <div className="font-medium">{order.customerName}</div>
                <div className="text-xs text-slate-500">{order.customerAddress}</div>
              </td>
              <td className="py-4 px-4">{order.productName}</td>
              <td className="py-4 px-4">
                <span className={\`px-2 py-1 rounded-full text-xs font-bold \${order.status === 'Processing' ? 'bg-amber-100 text-amber-700' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}\`}>
                  {order.status}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <select 
                  value={order.status} 
                  onChange={async (e) => {
                    await fetch(\`/api/shop/orders/\${order.id}\`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: e.target.value }) });
                    loadData();
                  }}
                  className="bg-slate-100 dark:bg-slate-800 border-none text-xs rounded-lg px-2 py-1 outline-none"
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* CONNECTION STATUS */}
`;
code = code.replace(oldConnectionTab, newDashboardUI);

fs.writeFileSync('src/App.tsx', code);
