import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Receipt, PlusCircle, Trash2,
  TrendingUp, TrendingDown, DollarSign, Loader2, History, ShoppingBag, 
  ArrowRight, Menu, Palette, Calendar
} from 'lucide-react';
import { useStore } from './store/useStore';
import { formatCurrency, formatDate, formatTime, getLast6Months, getMonthKey, currentMonthKey, addToast } from './utils/format';
import ToastContainer from './components/ToastContainer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Dashboard View (The Premium Overview) ---
const Dashboard = ({ products, sales, expenses }) => {
  const currentMonth = currentMonthKey();
  
  const stats = useMemo(() => {
    const monthSales = sales.filter(s => getMonthKey(s.date) === currentMonth);
    const monthExpenses = expenses.filter(e => getMonthKey(e.date) === currentMonth);
    
    const revenue = monthSales.reduce((acc, s) => acc + s.total, 0);
    const saleProfits = monthSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const otherExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = saleProfits - otherExpenses;

    // Previous month logic for % (simplistic representation for demo)
    return { revenue, netProfit, otherExpenses };
  }, [sales, expenses, currentMonth]);

  const chartData = useMemo(() => {
    const defaultDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    // Real implementation would group by day of current week. 
    // Here we use mock data to look like the chart in the image for demonstration.
    return defaultDays.map((day, i) => {
      return { 
        name: day, 
        sales: 10 + i + (Math.random() * 5),
        profit: 5 + (Math.random() * 3)
      };
    });
  }, [sales]);

  // Top Collections (Top Selling Products)
  const topProducts = useMemo(() => {
    const monthSales = sales.filter(s => getMonthKey(s.date) === currentMonth);
    const productSales = {};
    monthSales.forEach(s => {
      s.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.qty;
      });
    });
    
    return products
      .map(p => ({ ...p, sold: productSales[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3);
  }, [products, sales, currentMonth]);

  // Recent Activity (Unifying sales and expenses)
  const recentActivity = useMemo(() => {
    const s = sales.map(s => ({ type: 'sale', id: s.id, date: s.date, title: `New sale: ${s.items.map(i=>`${i.qty}x ${i.name}`).join(', ')}`, amount: s.total, meta: 'TODAY, ' + formatTime(s.date) }));
    const e = expenses.map(e => ({ type: 'expense', id: e.id, date: e.date, title: `Expense recorded: ${e.description}`, amount: -e.amount, meta: 'YESTERDAY, ' + formatTime(e.date) })); // Simplification for demo
    
    return [...s, ...e].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  }, [sales, expenses]);

  return (
    <div className="flex flex-col gap-5 animate-slide-up pt-4">
      
      {/* Cards match the image */}
      <div className="card p-0 overflow-hidden flex flex-col gap-[1px] bg-[var(--border)] border-none">
        
        {/* Total Sales */}
        <div className="bg-[var(--bg-card)] p-5 pb-6">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[var(--text-secondary)] uppercase mb-2">Total Sales</div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-[#ffffff]">{formatCurrency(stats.revenue)}</span>
            <span className="text-[12px] font-bold text-[var(--accent-cyan)]">+12.5%</span>
          </div>
          <div className="mt-4 h-1 w-full bg-[var(--border)] rounded-full overflow-hidden flex">
             <div className="h-full bg-[var(--accent-cyan)]" style={{ width: '65%' }}></div>
             <div className="h-full bg-[var(--border-light)]" style={{ width: '15%' }}></div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-[var(--bg-card)] p-5 pb-6">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[var(--text-secondary)] uppercase mb-2">Net Profit</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-[#ffffff]">{formatCurrency(stats.netProfit)}</span>
            <span className="text-[12px] font-bold text-[var(--accent-cyan)]">+8.2%</span>
          </div>
          <div className="mt-4 flex h-8 gap-2">
             <div className="h-full w-4/12 bg-[var(--border)]"></div>
             <div className="h-full w-2/12 bg-[var(--border)]"></div>
             <div className="h-full w-2/12 bg-[var(--border-light)] opacity-70"></div>
             <div className="h-full w-2/12 bg-[var(--accent-cyan)] opacity-100"></div>
             <div className="h-full w-2/12 bg-[var(--accent-cyan)] opacity-70"></div>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-[var(--bg-card)] p-5 pb-6">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[var(--text-secondary)] uppercase mb-2">Operating Expenses</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-[#ffffff]">{formatCurrency(stats.otherExpenses)}</span>
            <span className="text-[12px] font-bold text-[var(--accent-red)]">+2.1%</span>
          </div>
          <div className="mt-6 flex justify-between items-end mb-2">
             <span className="text-[10px] text-[var(--text-secondary)]">Operational</span>
             <span className="text-[10px] text-[var(--text-secondary)]">45%</span>
          </div>
          <div className="h-[2px] w-full bg-[var(--border)] flex">
             <div className="h-full bg-[var(--text-secondary)]" style={{ width: '45%' }}></div>
          </div>
        </div>

      </div>

      {/* Performance Overview Chart */}
      <div className="card mt-2">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold">Performance<br/>Overview</h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">Daily sales vs. profit ratio</p>
          </div>
          <div className="flex bg-[var(--bg-secondary)] rounded-md border border-[var(--border)]">
            <button className="text-[9px] px-3 py-1 font-bold tracking-widest uppercase text-[var(--text-secondary)]">Weekly</button>
            <button className="text-[9px] px-3 py-1 font-bold tracking-widest uppercase bg-[var(--text-secondary)] text-[var(--bg-primary)] rounded-sm">Monthly</button>
          </div>
        </div>
        <div className="h-[200px] w-full mt-4" style={{ marginLeft: '-15px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              {/* Vertical grids only to match image */}
              <CartesianGrid vertical={true} horizontal={false} stroke="var(--border)" opacity={0.5} strokeDasharray="3 3"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 700 }} dy={10} />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip cursor={false} contentStyle={{ background: '#171717', border: '1px solid #404040' }} />
              <Line type="monotone" dataKey="sales" stroke="var(--accent-cyan)" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Collection */}
      <div className="card mt-2 p-0 border-none bg-transparent shadow-none">
        <h2 className="text-lg font-bold px-1">Top Collection</h2>
        <p className="text-[11px] text-[var(--text-secondary)] mt-1 mb-4 px-1">Highest volume this month</p>
        
        <div className="flex flex-col gap-3">
          {topProducts.length === 0 ? (
            <div className="text-[12px] text-[var(--text-muted)] italic px-1">No products sold yet.</div>
          ) : (
            topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] text-2xl">
                    {p.emoji || '📦'}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[13px] font-bold text-[#ffffff]">{p.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-[2px]">{p.sold} UNITS SOLD</span>
                  </div>
                </div>
                <div className="text-[13px] font-bold text-[var(--accent-cyan)]">
                  {formatCurrency((p.price || 0) * (p.sold || 0))}
                </div>
              </div>
            ))
          )}
        </div>
        
        <button className="w-full mt-5 py-3 border border-[var(--border)] rounded-md text-[10px] font-bold tracking-[0.15em] text-[var(--text-secondary)] uppercase hover:text-[#fff] transition-colors">
          View All Products
        </button>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 mb-4">
        <div className="flex justify-between items-end mb-5">
           <h2 className="text-[26px] font-[900] uppercase tracking-tighter leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
              RECENT ACTIVITY
              <div className="text-[9px] font-bold tracking-widest text-[var(--accent-cyan)] mt-2">LIVE STREAM OF STUDIO TRANSACTIONS</div>
           </h2>
           <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--text-secondary)] pb-[2px]">
              Audit Log
           </div>
        </div>

        <div className="flex flex-col gap-4">
          {recentActivity.length === 0 ? (
             <div className="card p-5 text-center text-[12px] text-[var(--text-muted)]">No recent activity</div>
          ) : (
             recentActivity.map((act, i) => (
               <div key={act.id} className="card p-4 flex gap-4 items-center">
                 <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-[var(--bg-card-hover)] ${act.type==='sale' ? 'text-[var(--accent-cyan)]' : 'text-[var(--accent-red)]'}`}>
                   {act.type === 'sale' ? <Receipt size={16} /> : <DollarSign size={16} />}
                 </div>
                 <div className="flex flex-col flex-1 gap-[2px]">
                   <span className="text-[13px] leading-tight font-medium text-[#fff] tracking-tight">{act.title}</span>
                   <div className="flex items-center gap-4 mt-1">
                     <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase">{formatDate(act.date).toUpperCase()}, {formatTime(act.date)}</span>
                     <span className={`text-[10px] font-bold ${act.type==='sale' ? 'text-[var(--accent-cyan)]' : 'text-[var(--accent-red)]'}`}>
                       {act.amount > 0 ? '+' : ''}{formatCurrency(act.amount)}
                     </span>
                   </div>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>

    </div>
  );
};

// --- PDV View (Sales) ---
const PDV = ({ products, addSale }) => {
  const [cart, setCart] = useState({});
  const [note, setNote] = useState('');

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find(prod => prod.id === id);
        return p ? { ...p, qty } : null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const updateQty = (id, delta) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const handleFinish = async () => {
    if (cartItems.length === 0) return;
    const saleItems = cartItems.map(i => ({
      productId: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price
    }));

    try {
      await addSale(saleItems, note);
      setCart({});
      setNote('');
      addToast('Sale completed successfully! 🚀', 'success');
    } catch (err) {
      addToast('Error processing sale.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up pb-32 pt-6">
      <header>
        <h1 className="text-[26px] font-[900] uppercase tracking-tighter leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>Point of Sale</h1>
        <p className="text-[var(--text-secondary)] text-[12px] mt-2">Tap products to add to cart.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.id} className={`card p-4 flex flex-col gap-3 items-center text-center cursor-pointer relative overflow-hidden ${cart[p.id] ? 'border-[var(--accent-cyan)]' : ''}`} 
               onClick={() => updateQty(p.id, 1)}>
            <div className={`absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold text-[10px] transition-transform ${cart[p.id] ? 'translate-x-0' : 'translate-x-full'}`}>
              {cart[p.id]}
            </div>
            <span className="text-4xl p-2">{p.emoji || '📦'}</span>
            <div className="flex flex-col gap-[2px]">
              <span className="text-[13px] font-bold truncate w-full">{p.name}</span>
              <span className="text-[14px] font-extrabold text-[#ffffff]">{formatCurrency(p.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {cartItems.length > 0 && (
        <div className="fixed bottom-[90px] left-4 right-4 z-[110] animate-slide-up max-w-[448px] mx-auto">
          <div className="card bg-[var(--bg-card)]/95 backdrop-blur-md border-[var(--accent-cyan)] p-4 flex items-center justify-between shadow-[var(--shadow-lg)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--accent-cyan)] font-bold uppercase mb-1 tracking-widest">Cart Total</span>
              <span className="text-xl font-extrabold">{formatCurrency(total)}</span>
            </div>
            <button className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] px-5 py-3 rounded-[8px] font-bold text-[13px] flex items-center gap-2" onClick={handleFinish}>
              Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Gallery View (Products) ---
const Products = ({ products, addProduct, updateProduct, deleteProduct }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', cost: '', stock: '', emoji: '📦' });

  const handleSubmit = (e) => {
    e.preventDefault();
    addProduct({ 
      ...formData, 
      price: parseFloat(formData.price), 
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0 
    });
    setIsOpen(false);
    setFormData({ name: '', price: '', cost: '', stock: '', emoji: '📦' });
    addToast('Product added!', 'success');
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up pt-6">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-[26px] font-[900] uppercase tracking-tighter leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>Gallery</h1>
           <p className="text-[var(--text-secondary)] text-[12px] mt-2">Manage your inventory.</p>
        </div>
        <button className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] w-10 h-10 rounded-[8px] flex justify-center items-center font-bold" onClick={() => setIsOpen(true)}>
          <PlusCircle size={20} />
        </button>
      </header>

      <div className="flex flex-col gap-3">
        {products.map(p => (
          <div key={p.id} className="card p-4 flex justify-between items-center bg-[var(--bg-card)]">
            <div className="flex items-center gap-4">
              <span className="text-2xl bg-[var(--bg-primary)] border border-[var(--border)] w-12 h-12 flex items-center justify-center rounded-[10px]">{p.emoji || '📦'}</span>
              <div className="flex flex-col justify-center">
                <span className="font-bold text-[14px]">{p.name}</span>
                <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-[2px]">{formatCurrency(p.price)} • In stock: {p.stock || 0}</span>
              </div>
            </div>
            <button className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors rounded-full" onClick={() => deleteProduct(p.id)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-slide-up" onClick={() => setIsOpen(false)}>
          <div className="card w-full max-w-md p-6 border-[var(--accent-cyan)] shadow-[var(--shadow-lg)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-6">New Product</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Cyber Neon series" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input required type="number" step="0.01" className="form-input" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost</label>
                  <input required type="number" step="0.01" className="form-input" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Stock</label>
                <input required type="number" className="form-input" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" />
              </div>
              <button type="submit" className="w-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold py-3 mt-2 rounded-[8px]">Save Product</button>
              <button type="button" className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[#fff] font-bold py-3 rounded-[8px]" onClick={() => setIsOpen(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Expenses View (Costs) ---
const Expenses = ({ expenses, addExpense, deleteExpense }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const totalMonth = useMemo(() => {
    const cur = currentMonthKey();
    return expenses.filter(e => getMonthKey(e.date) === cur).reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addExpense({ ...formData, amount: parseFloat(formData.amount) });
    setIsOpen(false);
    setFormData({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    addToast('Cost added!', 'success');
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up pt-6">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-[26px] font-[900] uppercase tracking-tighter leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>Costs</h1>
           <p className="text-[var(--text-secondary)] text-[12px] mt-2">Operational expenditures.</p>
        </div>
        <button className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] w-10 h-10 rounded-[8px] flex justify-center items-center font-bold" onClick={() => setIsOpen(true)}>
          <PlusCircle size={20} />
        </button>
      </header>

      <div className="bg-[var(--bg-card)] p-5 pb-6 rounded-[12px] border border-[var(--border)]">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[var(--text-secondary)] uppercase mb-2">Month Total</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-[var(--accent-red)]">{formatCurrency(totalMonth)}</span>
          </div>
      </div>

      <div className="flex flex-col gap-3">
        {expenses.map(e => (
          <div key={e.id} className="card p-4 flex justify-between items-center bg-[var(--bg-card)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex border-[0.5px] border-[var(--border)] items-center justify-center rounded-[8px] bg-[var(--bg-primary)] text-[var(--accent-red)]">
                <DollarSign size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[13px]">{e.description}</span>
                <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-widest mt-1">{formatDate(e.date)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-[13px] text-[#fff]">- {formatCurrency(e.amount)}</span>
              <button className="text-[var(--text-muted)] hover:text-[var(--accent-red)]" onClick={() => deleteExpense(e.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-slide-up" onClick={() => setIsOpen(false)}>
          <div className="card w-full max-w-md p-6 border-[var(--accent-red)] shadow-[var(--shadow-lg)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-6">New Expense</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Description</label>
                <input required className="form-input focus:border-[var(--accent-red)]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Studio Rent..." />
              </div>
              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input required type="number" step="0.01" className="form-input focus:border-[var(--accent-red)]" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input required type="date" className="form-input focus:border-[var(--accent-red)]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-[var(--accent-red)] text-[#fff] font-bold py-3 mt-2 rounded-[8px]">Save Cost</button>
              <button type="button" className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[#fff] font-bold py-3 rounded-[8px]" onClick={() => setIsOpen(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sales History View (Events) ---
const Events = ({ sales, deleteSale }) => {
  return (
    <div className="flex flex-col gap-6 animate-slide-up pt-6">
      <header>
           <h1 className="text-[26px] font-[900] uppercase tracking-tighter leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>Events Log</h1>
           <p className="text-[var(--text-secondary)] text-[12px] mt-2">Complete transaction records.</p>
      </header>

      <div className="flex flex-col gap-4">
        {sales.length === 0 ? (
          <div className="card border border-[var(--border)] border-dashed py-10 flex flex-col items-center gap-4 text-center bg-transparent">
            <History size={32} className="text-[var(--text-muted)]" />
            <span className="text-[12px] text-[var(--text-muted)]">No sales recorded yet.</span>
          </div>
        ) : (
          [...sales].map(s => (
            <div key={s.id} className="card p-4 flex flex-col gap-4 border border-[var(--border)]">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--accent-cyan)] uppercase tracking-widest">
                      {formatDate(s.date)} • {formatTime(s.date)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[2px] mt-2">
                    {s.items.map((item, i) => (
                      <span key={i} className="text-[13px] text-[#fff]">{item.qty}x {item.name}</span>
                    ))}
                  </div>
                </div>
                <button className="text-[var(--text-muted)] hover:text-[var(--accent-red)]" onClick={() => deleteSale(s.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="pt-4 border-t border-[var(--border)] flex justify-between items-end">
                <div className="flex flex-col">
                    <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Profit</span>
                    <span className="text-[12px] font-bold text-[#fff]">{formatCurrency(s.profit)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Total</span>
                    <span className="text-[16px] font-extrabold text-[var(--accent-cyan)]">{formatCurrency(s.total)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  // views: dashboard, gallery, costs, pdv, events
  const [view, setView] = useState('dashboard');
  const store = useStore();

  if (store.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[var(--bg-primary)]">
        <div className="animate-spin text-[var(--accent-cyan)]">
          <Loader2 size={32} strokeWidth={3} />
        </div>
        <p className="text-[var(--text-secondary)] font-bold tracking-widest uppercase text-[10px]">Loading App...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] pb-20">
      
      {/* Top Navbar */}
      <nav className="top-nav">
        <div className="top-nav-logo">
           <Menu size={24} className="text-[#fff]" />
           <div className="top-nav-icon"><Menu size={16} strokeWidth={3} /></div>
           <span style={{color: '#fff'}}>CAIOAD</span>
        </div>
        <img src="https://i.pravatar.cc/150?img=68" alt="Profile" className="top-nav-avatar" />
      </nav>

      {/* Main Content */}
      <main className="container">
        {view === 'dashboard' && <Dashboard products={store.products} sales={store.sales} expenses={store.expenses} />}
        {view === 'gallery' && <Products products={store.products} addProduct={store.addProduct} deleteProduct={store.deleteProduct} />}
        {view === 'costs' && <Expenses expenses={store.expenses} addExpense={store.addExpense} deleteExpense={store.deleteExpense} />}
        {view === 'pdv' && <PDV products={store.products} addSale={store.addSale} />}
        {view === 'events' && <Events sales={store.sales} deleteSale={store.deleteSale} />}
      </main>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className={`bottom-nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
          <LayoutDashboard size={20} strokeWidth={2.5}/>
          <span>Studio</span>
        </button>
        <button className={`bottom-nav-item ${view === 'gallery' ? 'active' : ''}`} onClick={() => setView('gallery')}>
          <Palette size={20} strokeWidth={2.5}/>
          <span>Gallery</span>
        </button>
        <button className={`bottom-nav-item ${view === 'costs' ? 'active' : ''}`} onClick={() => setView('costs')}>
          <Receipt size={20} strokeWidth={2.5}/>
          <span>Costs</span>
        </button>
        <button className={`bottom-nav-item ${view === 'pdv' ? 'active' : ''}`} onClick={() => setView('pdv')}>
          <ShoppingCart size={20} strokeWidth={2.5}/>
          <span>Sales</span>
        </button>
        <button className={`bottom-nav-item ${view === 'events' ? 'active' : ''}`} onClick={() => setView('events')}>
          <Calendar size={20} strokeWidth={2.5}/>
          <span>Events</span>
        </button>
      </div>

      <ToastContainer />
    </div>
  );
}
