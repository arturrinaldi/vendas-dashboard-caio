import React, { useState, useMemo } from 'react';
import { 
  Menu, LayoutDashboard, Palette, CreditCard, ReceiptText, 
  CalendarDays, TrendingUp, TrendingDown, Wallet, History, 
  ShoppingCart, Package, PlusCircle, Trash2, X, Plus, Minus, Check, ArrowRight, Loader2, AlertTriangle, ShoppingBag
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useStore } from './store/useStore';
import { formatCurrency, formatDate, formatTime, getLast6Months, getMonthKey, currentMonthKey, addToast } from './utils/format';
import ToastContainer from './components/ToastContainer';
import logoUrl from './assets/logo.png';

const Header = ({ view, setView }: any) => (
  <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 pl-2">
        <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
          <span className="font-headline font-black text-surface text-xs">C</span>
        </div>
        <h1 className="font-headline font-black text-2xl tracking-widest uppercase text-primary">CaioAD</h1>
      </div>
    </div>
    
    <nav className="hidden md:flex items-center gap-8">
      {[
        { id: 'dashboard', label: 'Visão Geral' },
        { id: 'pdv', label: 'Vender' },
        { id: 'products', label: 'Estoque' },
        { id: 'expenses', label: 'Custos' },
        { id: 'history', label: 'Histórico' },
        { id: 'calendar', label: 'Agenda' }
      ].map((item) => (
        <button 
          key={item.id} 
          onClick={() => setView(item.id)}
          className={cn(
            "font-label text-[12px] uppercase tracking-widest transition-colors",
            view === item.id ? "text-tertiary font-bold" : "text-primary hover:text-tertiary"
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>

    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20 bg-white shadow-sm flex items-center justify-center">
        <img src={logoUrl} alt="Logo" className="w-[85%] h-[85%] object-contain" />
      </div>
    </div>
  </header>
);

const KPICard = ({ title, value, change, type, progress, barData }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-high p-8 rounded-lg relative overflow-hidden group border border-outline-variant/5">
    <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-tertiary/10 transition-all" />
    <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-4">{title}</p>
    <div className="flex items-end gap-3">
      <h2 className="font-headline text-4xl font-extrabold text-primary">{value}</h2>
      {change && (
        <span className={cn("text-sm font-label mb-1 flex items-center gap-0.5", type === 'error' ? "text-error" : "text-tertiary")}>
          {type === 'error' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
          {change}
        </span>
      )}
    </div>
    
    {progress !== undefined && (
      <div className="mt-6 h-1 w-full bg-surface-container-low rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }} className={cn("h-full", type === 'error' ? "bg-error" : "bg-tertiary")} />
      </div>
    )}

    {barData && (
      <div className="mt-6 flex items-end gap-1 h-20">
        {barData.map((d: any, i: number) => (
          <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${d.value}%` }} transition={{ delay: i * 0.1, duration: 0.5 }}
            className={cn("w-full rounded-t-sm", i === 4 ? "bg-tertiary" : i === 5 ? "bg-tertiary/60" : i === 2 ? "bg-tertiary/40" : "bg-surface-container-low")}
          />
        ))}
      </div>
    )}
  </motion.div>
);

const Dashboard = ({ products, sales, expenses }: any) => {
  const [period, setPeriod] = useState('Mensal');
  const currentMonth = currentMonthKey();
  
  const stats = useMemo(() => {
    const monthSales = sales.filter(s => getMonthKey(s.date) === currentMonth);
    const monthExpenses = expenses.filter(e => getMonthKey(e.date) === currentMonth);
    
    const revenue = monthSales.reduce((acc, s) => acc + s.total, 0);
    const saleProfits = monthSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const otherExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = saleProfits - otherExpenses;

    return { revenue, netProfit, otherExpenses };
  }, [sales, expenses, currentMonth]);

  const chartData = useMemo(() => {
    const months = getLast6Months();
    return months.map(m => {
      const monthSales = sales.filter(s => getMonthKey(s.date) === m.key);
      const monthExpenses = expenses.filter(e => getMonthKey(e.date) === m.key);
      const mRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
      const mProfit = monthSales.reduce((acc, s) => acc + (s.profit || 0), 0);
      const mExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
      return { 
        name: m.label.substring(0, 3).toUpperCase(), 
        sales: mRevenue, 
        profit: mProfit - mExpenses 
      };
    });
  }, [sales, expenses]);

  const topProducts = useMemo(() => {
    const counts = {};
    const monthSales = sales.filter(s => getMonthKey(s.date) === currentMonth);
    monthSales.forEach(s => s.items.forEach(i => counts[i.productId] = (counts[i.productId] || 0) + i.qty));
    return products.map(p => ({ ...p, qty: counts[p.id] || 0 }))
      .sort((a, b) => b.qty - a.qty).slice(0, 4);
  }, [products, sales, currentMonth]);

  const recentActivity = useMemo(() => {
    const s = sales.map((s: any) => ({ type: 'sale', id: s.id, date: s.date, title: `Venda: ${s.items.map((i: any)=>`${i.qty}x ${i.name}`).join(', ')}`, amount: s.total, icon: ShoppingBag, color: 'text-tertiary', bgColor: 'bg-tertiary/10' }));
    const e = expenses.map((e: any) => ({ type: 'expense', id: e.id, date: e.date, title: `Custo: ${e.description}`, amount: Number(e.amount) * -1, icon: Wallet, color: 'text-error', bgColor: 'bg-error/10' }));
    return [...s, ...e].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [sales, expenses]);

  return (
    <div className="space-y-12 pb-24 animate-slide-up">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total em Vendas" value={formatCurrency(stats.revenue)} progress={100} />
        <KPICard title="Lucro Líquido" value={formatCurrency(stats.netProfit)} barData={[{value:20},{value:40},{value:60},{value:30},{value:100},{value:70}]} />
        <KPICard title="Despesas (Custos)" value={formatCurrency(stats.otherExpenses)} type="error" progress={100} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 bg-surface-container-low p-8 rounded-lg border border-outline-variant/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h3 className="font-headline text-xl font-bold text-primary">Resumo de Performance</h3>
              <p className="font-body text-sm text-on-surface-variant">Vendas x Lucro (6 meses)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4c4647" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#b1a9aa', fontSize: 10, fontFamily: 'Space Grotesk' }} dy={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1919', border: '1px solid #4c4647', borderRadius: '4px' }} itemStyle={{ fontFamily: 'Manrope', fontSize: '12px' }} formatter={(val) => formatCurrency(val)} />
                <Line type="monotone" name="Vendas" dataKey="sales" stroke="#81ecff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#81ecff' }} />
                <Line type="monotone" name="Lucro" dataKey="profit" stroke="#c6c6c7" strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={0.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="bg-surface-container-low p-8 rounded-lg space-y-8 border border-outline-variant/5">
          <div>
            <h3 className="font-headline text-xl font-bold text-primary">Mais Vendidos</h3>
            <p className="font-body text-sm text-on-surface-variant">Top volume deste mês</p>
          </div>
          <div className="space-y-6">
            {topProducts.length === 0 ? (
              <p className="text-on-surface-variant text-sm">Nenhum produto vendido.</p>
            ) : topProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-surface-container-high rounded flex items-center justify-center flex-shrink-0 text-2xl border border-outline-variant/10">
                  {p.emoji || '📦'}
                </div>
                <div className="flex-grow">
                  <h4 className="font-body text-sm font-semibold text-primary">{p.name}</h4>
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">{p.qty} UNIDADES</p>
                </div>
                <div className="text-right">
                  <p className="font-headline text-sm font-bold text-tertiary">{formatCurrency(p.price * p.qty)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Atividade Recente</h3>
            <p className="font-label text-xs text-tertiary uppercase tracking-widest mt-2">Transações do estúdio em tempo real</p>
          </div>
          <div className="h-[1px] flex-grow mx-12 bg-outline-variant/15 hidden md:block" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentActivity.length === 0 ? (
            <p className="text-on-surface-variant text-sm">Nenhuma atividade registrada.</p>
          ) : recentActivity.map((activity, i) => (
            <motion.div key={i} className="bg-surface-container-high p-6 flex items-start gap-6 group hover:translate-x-2 transition-transform duration-300 border border-outline-variant/5">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0", activity.bgColor)}>
                <activity.icon className={cn("w-6 h-6", activity.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-on-surface leading-relaxed truncate">{activity.title}</p>
                <div className="flex gap-4 mt-2 items-center">
                  <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{formatDate(activity.date)}, {formatTime(activity.date)}</span>
                  <span className={cn("font-label text-[10px] font-bold", activity.color)}>{formatCurrency(activity.amount)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

const PDV = ({ products, addSale }) => {
  const [cart, setCart] = useState({});
  const [note, setNote] = useState('');

  const cartItems = useMemo(() => Object.entries(cart).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return p ? { ...p, qty } : null;
  }).filter(Boolean), [cart, products]);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const updateQty = (id, delta) => setCart(prev => {
    const newQty = (prev[id] || 0) + delta;
    if (newQty <= 0) { const next = { ...prev }; delete next[id]; return next; }
    return { ...prev, [id]: newQty };
  });

  const handleFinish = async () => {
    if (cartItems.length === 0) return;
    const items = cartItems.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price }));
    try {
      await addSale(items, note);
      setCart({}); setNote('');
      addToast('Venda registrada com sucesso! 🚀', 'success');
    } catch { addToast('Erro ao processar venda.', 'error'); }
  };

  return (
    <div className="pb-32 animate-slide-up space-y-8 mx-auto max-w-4xl">
      <header>
        <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Ponto de Venda</h3>
        <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-2">Toque nos itens para adicionar ao carrinho</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => {
          const inCart = cart[p.id] || 0;
          const noStock = (p.stock || 0) <= 0;
          return (
            <div key={p.id} onClick={() => !noStock && updateQty(p.id, 1)} 
                 className={cn("bg-surface-container-high p-6 rounded-xl flex flex-col items-center gap-4 text-center cursor-pointer transition-all border border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1",
                   inCart ? "border-tertiary bg-surface-container-low shadow-[0_0_20px_rgba(0,212,236,0.1)]" : "",
                   noStock ? "opacity-50 grayscale cursor-not-allowed" : ""
                 )}>
              {inCart > 0 && (
                <div className="absolute top-0 right-0 bg-tertiary text-on-tertiary font-bold text-xs px-3 py-1 rounded-bl-lg font-label">
                  {inCart}
                </div>
              )}
              <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{p.emoji || '📦'}</span>
              <div className="flex flex-col gap-1 w-full mt-2">
                <span className="font-headline font-bold text-sm text-primary leading-tight line-clamp-2">{p.name}</span>
                <span className="font-label font-bold text-tertiary text-sm mt-1">{formatCurrency(p.price)}</span>
                <span className={cn("text-[10px] font-label font-bold uppercase tracking-wider mt-1", (p.stock||0) <= 5 ? "text-error" : "text-on-surface-variant")}>
                  {noStock ? 'ESGOTADO' : `${p.stock||0} unidades`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} 
                      className="fixed bottom-[90px] left-4 right-4 md:left-[50%] md:-translate-x-[50%] md:w-[600px] z-50">
            <div className="bg-surface-container-highest/95 backdrop-blur-xl border border-tertiary/50 p-6 rounded-2xl flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Carrinho atual</p>
                <p className="font-headline text-2xl font-black text-tertiary">{formatCurrency(total)}</p>
              </div>
              <button onClick={handleFinish} className="bg-tertiary text-on-tertiary px-8 py-3 rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-tertiary-dim transition-colors flex items-center gap-2">
                Finalizar Venda <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Products = ({ products, addProduct, updateProduct, deleteProduct }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', cost: '', stock: '', emoji: '📦' });

  const handleSubmit = (e) => {
    e.preventDefault();
    addProduct({ ...formData, price: parseFloat(formData.price), cost: parseFloat(formData.cost) || 0, stock: parseInt(formData.stock) || 0 });
    setIsOpen(false);
    setFormData({ name: '', price: '', cost: '', stock: '', emoji: '📦' });
    addToast('Produto inserido com sucesso!', 'success');
  };

  return (
    <div className="pb-32 animate-slide-up space-y-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Estoque</h3>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-2">Gerencie as unidades e produtos</p>
        </div>
        <button className="bg-primary text-on-primary w-12 h-12 flex items-center justify-center rounded-xl hover:bg-primary-dim transition-colors" onClick={() => setIsOpen(true)}>
          <PlusCircle size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center text-3xl border border-outline-variant/20 shadow-inner">
                {p.emoji || '📦'}
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-sm text-primary mb-1">{p.name}</span>
                <span className="font-label text-xs font-bold text-tertiary">{formatCurrency(p.price)}</span>
                <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">Estoque: {p.stock || 0}</span>
              </div>
            </div>
            <button className="p-3 text-on-surface-variant hover:bg-error/10 hover:text-error rounded-xl transition-colors" onClick={() => deleteProduct(p.id)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {products.length === 0 && <p className="text-on-surface-variant text-sm col-span-full">Nenhum produto cadastrado.</p>}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
                        className="bg-surface-container-high w-full max-w-md p-8 rounded-2xl border border-tertiary/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between items-start mb-8">
                <h2 className="font-headline font-bold text-2xl">Novo Produto</h2>
                <button onClick={() => setIsOpen(false)} type="button" className="text-on-surface-variant hover:text-error transition-colors p-1"><X size={24}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Nome do Item</label>
                  <input required className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors" 
                         value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: T-Shirt Premium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Preço</label>
                    <input required type="number" step="0.01" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors" 
                           value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Custo</label>
                    <input required type="number" step="0.01" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors" 
                           value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="0.00" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Estoque Inicial</label>
                  <input required type="number" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors" 
                         value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" />
                </div>
                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setIsOpen(false)} className="py-4 rounded-xl border border-outline-variant/30 font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-container-low transition-colors">Cancelar</button>
                  <button type="submit" className="py-4 bg-tertiary text-on-tertiary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-tertiary-dim transition-colors shadow">Salvar Item</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Expenses = ({ expenses, addExpense, deleteExpense }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const totalMonth = useMemo(() => {
    const curMonth = currentMonthKey();
    return expenses.filter(e => getMonthKey(e.date) === curMonth).reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addExpense({ ...formData, amount: parseFloat(formData.amount) });
    setIsOpen(false);
    setFormData({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    addToast('Gasto salvo com sucesso!', 'success');
  };

  return (
    <div className="pb-32 animate-slide-up space-y-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Custos</h3>
          <p className="font-label text-xs text-error uppercase tracking-widest mt-2">Registre todas operacionais</p>
        </div>
        <button className="bg-error text-surface w-12 h-12 flex items-center justify-center rounded-xl hover:bg-error-dim transition-colors" onClick={() => setIsOpen(true)}>
          <PlusCircle size={24} />
        </button>
      </header>

      <div className="bg-surface-container-high p-8 rounded-2xl border border-error/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-l-4 border-l-error">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1">Gasto Acumulado Mensal</p>
          <p className="font-headline text-4xl font-black text-error">{formatCurrency(totalMonth)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {expenses.map(e => (
          <div key={e.id} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5 flex justify-between items-center group">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20">
                <Wallet size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-semibold text-primary">{e.description}</span>
                <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">{formatDate(e.date)}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-headline font-extrabold text-error">-{formatCurrency(e.amount)}</span>
              <button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => deleteExpense(e.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
                        className="bg-surface-container-high w-full max-w-md p-8 rounded-2xl border border-error/30 shadow-[0_20px_60px_rgba(236,124,138,0.2)]">
              <div className="flex justify-between items-start mb-8">
                <h2 className="font-headline font-bold text-2xl">Nova Despesa</h2>
                <button onClick={() => setIsOpen(false)} type="button" className="text-on-surface-variant hover:text-error transition-colors p-1"><X size={24}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Descrição do Custo</label>
                  <input required className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-error focus:outline-none transition-colors" 
                         value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Matéria prima, Luz..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Valor Total Custo</label>
                  <input required type="number" step="0.01" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-error focus:outline-none transition-colors" 
                         value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Data do evento</label>
                  <input required type="date" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-error focus:outline-none transition-colors w-full uppercase" style={{ colorScheme: 'dark' }}
                         value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setIsOpen(false)} className="py-4 rounded-xl border border-outline-variant/30 font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-container-low transition-colors">Cancelar</button>
                  <button type="submit" className="py-4 bg-error text-surface rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity shadow">Registrar Custo</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SalesHistory = ({ sales, deleteSale }) => (
  <div className="pb-32 animate-slide-up space-y-8 max-w-4xl mx-auto">
    <header>
      <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Histórico</h3>
      <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-2">Visão geral das transações completadas</p>
    </header>

    <div className="space-y-4">
      {sales.length === 0 ? (
        <p className="text-on-surface-variant text-sm">Nenhuma venda registrada.</p>
      ) : sales.map(s => (
        <div key={s.id} className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/5 hover:border-outline-variant/20 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <ReceiptText size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-label text-[10px] text-tertiary font-bold uppercase tracking-widest">
                  {formatDate(s.date)} • {formatTime(s.date)}
                </span>
                <span className="font-headline text-sm text-on-surface-variant mt-1">Ref: {s.id.substring(0,8)}</span>
              </div>
            </div>
            <button className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-lg" onClick={() => deleteSale(s.id)}>
              <Trash2 size={18} />
            </button>
          </div>
          
          <div className="bg-surface-container-lowest/50 rounded-xl p-4 space-y-2 mb-6 border border-outline-variant/5">
            {s.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                <span className="font-body text-sm text-primary flex items-center gap-3">
                  <span className="font-label font-bold text-tertiary">{item.qty}x</span> {item.name}
                </span>
                <span className="font-label text-sm font-medium text-on-surface-variant">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">Lucro Variável</span>
              <span className="font-label text-sm text-tertiary font-bold mt-1">{formatCurrency(s.profit)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">Valor Arrecadado</span>
              <span className="font-headline text-2xl font-black text-primary mt-1">{formatCurrency(s.total)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CalendarAgenda = ({ events, addEvent, deleteEvent }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', observation: '', date: new Date().toISOString().split('T')[0] });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    addEvent({ ...formData });
    setIsOpen(false);
    setFormData({ title: '', observation: '', date: new Date().toISOString().split('T')[0] });
    addToast('Evento agendado!', 'success');
  };

  return (
    <div className="pb-32 animate-slide-up space-y-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Agenda</h3>
          <p className="font-label text-xs text-tertiary uppercase tracking-widest mt-2">Próximos eventos e tarefas</p>
        </div>
        <button className="bg-tertiary text-on-tertiary w-12 h-12 flex items-center justify-center rounded-xl hover:bg-tertiary-dim transition-colors" onClick={() => setIsOpen(true)}>
          <CalendarDays size={24} />
        </button>
      </header>

      <div className="flex flex-col gap-4">
        {[...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((ev: any) => (
          <div key={ev.id} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5 hover:border-tertiary/20 flex flex-col gap-4 transition-colors">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20">
                  <CalendarDays size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline font-semibold text-primary">{ev.title}</span>
                  <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">{formatDate(ev.date)}</span>
                </div>
              </div>
              <button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => deleteEvent(ev.id)}>
                <Trash2 size={18} />
              </button>
            </div>
            {ev.observation && (
              <div className="bg-surface-container-highest/50 p-4 rounded-lg border border-outline-variant/5 text-sm font-body text-on-surface-variant">
                {ev.observation}
              </div>
            )}
          </div>
        ))}
        {events.length === 0 && <p className="text-on-surface-variant text-sm col-span-full">Nenhum evento registrado.</p>}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e: any) => e.stopPropagation()}
                        className="bg-surface-container-high w-full max-w-md p-8 rounded-2xl border border-tertiary/30 shadow-[0_20px_60px_rgba(0,212,236,0.1)]">
              <div className="flex justify-between items-start mb-8">
                <h2 className="font-headline font-bold text-2xl">Novo Evento</h2>
                <button onClick={() => setIsOpen(false)} type="button" className="text-on-surface-variant hover:text-error transition-colors p-1"><X size={24}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Título do Evento</label>
                  <input required className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors" 
                         value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Feira de Domingo..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Observações</label>
                  <textarea className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors min-h-[100px]" 
                         value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})} placeholder="Endereço, notas..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Data do evento</label>
                  <input required type="date" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors w-full uppercase" style={{ colorScheme: 'dark' }}
                         value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setIsOpen(false)} className="py-4 rounded-xl border border-outline-variant/30 font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-container-low transition-colors">Cancelar</button>
                  <button type="submit" className="py-4 bg-tertiary text-on-tertiary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity shadow">Salvar Evento</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BottomNav = ({ view, setView }: any) => (
  <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-1 pb-6 pt-4 backdrop-blur-3xl bg-surface-container-low/95 border-t border-outline-variant/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] z-[100]">
    {[
      { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      { id: 'pdv', label: 'Vender', icon: ShoppingCart },
      { id: 'products', label: 'Estoque', icon: Palette },
      { id: 'expenses', label: 'Custos', icon: CreditCard },
      { id: 'history', label: 'Histórico', icon: History },
      { id: 'calendar', label: 'Agenda', icon: CalendarDays }
    ].map((item) => (
      <button 
        key={item.id}
        onClick={() => setView(item.id)}
        className={cn(
          "flex flex-col items-center justify-center transition-all duration-300 w-[16%]",
          view === item.id ? "text-tertiary font-bold scale-110 -translate-y-1" : "text-on-surface-variant/70 hover:text-primary"
        )}
      >
        <item.icon className="w-5 h-5 mb-1.5" strokeWidth={view === item.id ? 2.5 : 2} />
        <span className="font-label text-[8px] sm:text-[9px] uppercase tracking-tighter truncate">{item.label}</span>
      </button>
    ))}
  </nav>
);

export default function App() {
  const [view, setView] = useState('dashboard');
  const store = useStore() as any;

  if (store.loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-tertiary animate-spin" />
        <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">Conectando banco de dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-tertiary selection:text-on-tertiary-fixed flex flex-col">
      <Header view={view} setView={setView} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-8">
        {view === 'dashboard' && <Dashboard products={store.products} sales={store.sales} expenses={store.expenses} />}
        {view === 'pdv' && <PDV products={store.products} addSale={store.addSale} />}
        {view === 'products' && <Products products={store.products} addProduct={store.addProduct} updateProduct={store.updateProduct} deleteProduct={store.deleteProduct} />}
        {view === 'expenses' && <Expenses expenses={store.expenses} addExpense={store.addExpense} deleteExpense={store.deleteExpense} />}
        {view === 'history' && <SalesHistory sales={store.sales} deleteSale={store.deleteSale} />}
        {view === 'calendar' && <CalendarAgenda events={store.events || []} addEvent={store.addEvent} deleteEvent={store.deleteEvent} />}
      </main>

      <BottomNav view={view} setView={setView} />
      <ToastContainer />
    </div>
  );
}
