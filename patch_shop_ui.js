const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add new states
const oldStates = `  const [sessionId] = useState(() => {`;
const newStates = `  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDetails, setPDetails] = useState('');
  const [pImage, setPImage] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastImg, setBroadcastImg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [sessionId] = useState(() => {`;
code = code.replace(oldStates, newStates);

// 2. Add loading fetching
const oldLoadData = `    fetch('/api/plugins').then(r => r.json()).then(setPlugins);`;
const newLoadData = `    fetch('/api/plugins').then(r => r.json()).then(setPlugins);
    fetch('/api/shop/products').then(r => r.json()).then(setProducts);
    fetch('/api/shop/customers').then(r => r.json()).then(setCustomers);`;
code = code.replace(oldLoadData, newLoadData);

// 3. Add shop functions
const oldNavButton = `  const NavButton = ({ id, icon: Icon, label }: any) => (`;
const newShopFuncs = `  const handleImageUpload = (e: any, setter: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result);
      reader.readAsDataURL(file);
    }
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
    await fetch(\`/api/shop/products/\${id}\`, { method: 'DELETE' });
    loadData();
  };

  const sendBroadcast = async () => {
    if(!broadcastMsg) return alert('Enter a message');
    if(!confirm(\`Send broadcast to \${customers.length} saved contacts? (This uses an anti-ban delay of 1.5s per message)\`)) return;
    setIsBroadcasting(true);
    const res = await fetch('/api/shop/broadcast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: broadcastMsg, image: broadcastImg })
    });
    const data = await res.json();
    setIsBroadcasting(false);
    if(data.success) alert(\`Successfully sent broadcast to \${data.count} contacts!\`);
    else alert(data.error);
  };

  const NavButton = ({ id, icon: Icon, label }: any) => (`;
code = code.replace(oldNavButton, newShopFuncs);

// 4. Update the Shop UI Tab
const oldShopUI = `{activeTab === 'shop' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border shadow-sm text-center py-20">
                <ShoppingCart size={48} className="mx-auto text-indigo-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Shop Manager</h3>
                <p className="text-slate-500 max-w-md mx-auto">Shop configurations are active. DeepSeek AI handles product queries automatically based on your prompt setup in the AI tab.</p>
              </div>
            )}`;
            
const newShopUI = `{activeTab === 'shop' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            )}`;
code = code.replace(oldShopUI, newShopUI);

fs.writeFileSync('src/App.tsx', code);
