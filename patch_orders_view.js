const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{/* PRODUCT LIST */}`;
const replace = `
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
                
                {target}`;

if(code.includes(target)) {
    code = code.replace(target, replace);
    
    // Also fix the activeTab bug
    code = code.replace("const [activeTab, setActiveTab] = useState('dashboard');", "const [activeTab, setActiveTab] = useState('connection');");
    
    // Fetch orders in loadData
    code = code.replace("fetch('/api/shop/customers').then(r => r.json()).then(setCustomers);", "fetch('/api/shop/customers').then(r => r.json()).then(setCustomers);\n    fetch('/api/shop/orders').then(r => r.json()).then(setOrders);");
    
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched orders view into Shop tab.");
}
