import React, { useState, useMemo } from 'react';
import { 
  Menu, LayoutDashboard, Palette, CreditCard, ReceiptText, 
  CalendarDays, TrendingUp, TrendingDown, Wallet, History, 
  ShoppingCart, Package, PlusCircle, Trash2, X, Plus, Minus, Check, ArrowRight, Loader2, AlertTriangle, ShoppingBag, Edit3, Sparkles, CheckCircle2, QrCode
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useStore } from './store/useStore';
import { formatCurrency, formatDate, formatTime, getLast6Months, getMonthKey, currentMonthKey, addToast } from './utils/format';
import ToastContainer from './components/ToastContainer';
import logoUrl from './assets/logo.png';
import chest3Gif from './assets/chest3.gif';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

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
        { id: 'calendar', label: 'Agenda' },
        { id: 'lootbox', label: 'Loot Box' }
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

const Dashboard = ({ products, sales, expenses, events }: any) => {
  const [period, setPeriod] = useState('Mensal');
  const [filterEvent, setFilterEvent] = useState('all');
  const currentMonth = currentMonthKey();
  
  const filteredSales = useMemo(() => {
    if (filterEvent === 'all') return sales;
    return sales.filter((s: any) => s.event_id === filterEvent);
  }, [sales, filterEvent]);

  const stats = useMemo(() => {
    const monthSales = filteredSales.filter(s => getMonthKey(s.date) === currentMonth);
    const monthExpenses = expenses.filter(e => getMonthKey(e.date) === currentMonth);
    
    const revenue = monthSales.reduce((acc, s) => acc + s.total, 0);
    const saleProfits = monthSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const otherExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = saleProfits - otherExpenses;

    return { revenue, netProfit, otherExpenses };
  }, [filteredSales, expenses, currentMonth]);

  const chartData = useMemo(() => {
    const months = getLast6Months();
    return months.map(m => {
      const monthSales = filteredSales.filter(s => getMonthKey(s.date) === m.key);
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
  }, [filteredSales, expenses]);

  const topProducts = useMemo(() => {
    const counts = {};
    const baseSales = filterEvent === 'all' 
      ? filteredSales.filter(s => getMonthKey(s.date) === currentMonth)
      : filteredSales;
      
    baseSales.forEach(s => s.items.forEach(i => counts[i.productId] = (counts[i.productId] || 0) + i.qty));
    return products.map(p => ({ ...p, qty: counts[p.id] || 0 }))
      .sort((a, b) => b.qty - a.qty).slice(0, 4);
  }, [products, filteredSales, currentMonth, filterEvent]);

  const recentActivity = useMemo(() => {
    const s = filteredSales.map((s: any) => ({ type: 'sale', id: s.id, date: s.date, title: s.isGatcha ? `Gatcha: ${s.items.map((i: any)=>`${i.qty}x ${i.name}`).join(', ')}` : `Venda: ${s.items.map((i: any)=>`${i.qty}x ${i.name}`).join(', ')}`, amount: s.total, icon: s.isGatcha ? Sparkles : ShoppingBag, color: 'text-tertiary', bgColor: 'bg-tertiary/10' }));
    const e = expenses.map((e: any) => ({ type: 'expense', id: e.id, date: e.date, title: `Custo: ${e.description}`, amount: Number(e.amount) * -1, icon: Wallet, color: 'text-error', bgColor: 'bg-error/10' }));
    return [...s, ...e].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [filteredSales, expenses]);

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
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-headline text-xl font-bold text-primary">Mais Vendidos</h3>
              <p className="font-body text-sm text-on-surface-variant">{filterEvent === 'all' ? 'Top volume deste mês' : 'Top volume do evento'}</p>
            </div>
            <select className="bg-surface-container-high border border-outline-variant/20 rounded-lg p-2 text-[10px] font-label uppercase tracking-widest text-primary focus:outline-none" value={filterEvent} onChange={e=>setFilterEvent(e.target.value)}>
              <option value="all">Geral / Mês</option>
              {events.map((ev: any) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
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

const PDV = ({ products, events, addSale }: any) => {
  const [cart, setCart] = useState<any>({});
  const [note, setNote] = useState('');
  const [isGatcha, setIsGatcha] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const cartItems = useMemo(() => Object.entries(cart).map(([id, qty]) => {
      const p = products.find((prod: any) => prod.id === id);
      return p ? { ...p, qty } : null;
  }).filter(Boolean), [cart, products]);

  const total = isGatcha ? 5 : cartItems.reduce((acc, item) => acc + item.price * (item.qty as number), 0);

  const updateQty = (id: string, delta: number) => {
    const p = products.find((prod: any) => prod.id === id);
    if (!p) return;
    
    setCart((prev: any) => {
      const currentQty = prev[id] || 0;
      const newQty = currentQty + delta;
      
      if (newQty > (p.stock || 0)) {
        addToast(`Estoque insuficiente! (${p.stock || 0} disponíveis)`, 'error');
        return prev;
      }
      
      if (newQty <= 0) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: newQty };
    });
  };

  const handleFinish = async () => {
    if (cartItems.length === 0) return;
    const items = cartItems.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price }));
    
    try {
      await addSale(items, note, isGatcha, selectedEventId || null);
      setCart({}); setNote('');
      addToast('Venda registrada! 🚀', 'success');
    } catch { addToast('Erro ao processar venda.', 'error'); }
  };

  const groupedProducts = useMemo(() => {
    const groups: any = {};
    const sorted = [...products].sort((a: any, b: any) => a.name.localeCompare(b.name));
    sorted.forEach((p: any) => {
      const cat = p.category || 'Geral';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  return (
    <div className="pb-32 animate-slide-up space-y-8 mx-auto max-w-4xl px-2 sm:px-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Ponto de Venda</h3>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-2 font-bold opacity-60">Toque nos itens para adicionar</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select className="bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-2 text-[10px] font-label uppercase tracking-widest text-primary focus:outline-none min-w-[150px]" value={selectedEventId} onChange={e=>setSelectedEventId(e.target.value)}>
            <option value="">Sem Evento</option>
            {events.map((ev: any) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <div className="flex bg-surface-container-high rounded-xl p-1 border border-outline-variant/10">
            <button onClick={() => setIsGatcha(false)} className={cn("px-4 py-2 rounded-lg font-label text-[10px] uppercase tracking-widest flex-1 transition-all", !isGatcha ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-primary")}>Normal</button>
            <button onClick={() => setIsGatcha(true)} className={cn("px-4 py-2 rounded-lg font-label text-[10px] uppercase tracking-widest flex-1 transition-all flex items-center justify-center gap-2", isGatcha ? "bg-tertiary text-on-tertiary shadow-lg" : "text-on-surface-variant hover:text-tertiary")}>
              <Sparkles size={12}/> Gatcha
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-10">
        {groupedProducts.map(([cat, items]: any) => (
          <div key={cat} className="space-y-4">
            <h4 className="font-headline text-sm font-bold text-primary/60 uppercase tracking-widest px-1 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary/30 rounded-full"/>
              {cat}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {items.map((p: any) => {
                const inCart = cart[p.id] || 0;
                const noStock = (p.stock || 0) <= 0;
                return (
                  <div key={p.id} onClick={() => !noStock && updateQty(p.id, 1)} 
                       className={cn("bg-surface-container-high p-4 sm:p-6 rounded-2xl flex flex-col items-center gap-4 text-center cursor-pointer transition-all border border-outline-variant/10 relative overflow-hidden group hover:border-primary/30",
                         inCart ? "border-primary bg-surface-container-low" : "",
                         noStock ? "opacity-40 grayscale cursor-not-allowed" : ""
                       )}>
                    {inCart > 0 && (
                      <div className="absolute top-2 right-2 bg-primary text-on-primary font-bold text-xs w-6 h-6 flex items-center justify-center rounded-full font-label shadow-lg animate-scale-in">
                        {inCart}
                      </div>
                    )}
                    <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">{p.emoji || '📦'}</span>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-headline font-bold text-xs text-primary leading-tight line-clamp-1">{p.name}</span>
                      <span className="font-label font-bold text-on-surface-variant text-[10px]">{noStock ? 'ESGOTADO' : `${p.stock||0} em estoque`}</span>
                      <span className="font-label font-black text-tertiary text-sm mt-1">{formatCurrency(p.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} 
                      className="fixed bottom-[95px] left-2 right-2 md:left-[50%] md:-translate-x-[50%] md:w-[650px] z-50">
            <div className="bg-surface-container-highest/95 backdrop-blur-2xl border-2 border-primary/30 p-4 sm:p-6 rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex flex-col gap-4">
              <div className="max-h-[120px] overflow-y-auto px-2 space-y-2 thin-scrollbar">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="font-body text-xs font-bold text-primary">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }} className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary border border-outline-variant/10 hover:bg-error/20 transition-colors"><Minus size={14}/></button>
                      <span className="font-label font-black text-sm text-primary w-4 text-center">{item.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }} className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary border border-outline-variant/10 hover:bg-primary/20 transition-colors"><Plus size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="h-[1px] w-full bg-outline-variant/10 px-2"/>
              
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                    {isGatcha ? <><Sparkles size={8} className="text-tertiary" /> Total Gatcha</> : 'Total Normal'}
                  </p>
                  <p className="font-headline text-3xl font-black text-primary">{formatCurrency(total)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCart({})} className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center border border-error/20 hover:bg-error hover:text-white transition-all">
                    <Trash2 size={20} />
                  </button>
                  <button onClick={handleFinish} className="bg-primary text-on-primary px-8 py-3 rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20">
                    Registrar Venda <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Products = ({ products, addProduct, updateProduct, deleteProduct }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', cost: '', stock: '', emoji: '📦', category: 'Geral' });

  const groupedProducts = useMemo(() => {
    const groups: any = {};
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(p => {
      const cat = p.category || 'Geral';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setFormData({ 
      name: p.name, 
      price: p.price.toString(), 
      cost: p.cost?.toString() || '', 
      stock: p.stock?.toString() || '', 
      emoji: p.emoji || '📦',
      category: p.category || 'Geral'
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const data = { 
      ...formData, 
      price: parseFloat(formData.price), 
      cost: parseFloat(formData.cost) || 0, 
      stock: parseInt(formData.stock) || 0 
    };
    
    if (editId) {
      updateProduct(editId, data);
      addToast('Produto atualizado!', 'success');
    } else {
      addProduct(data);
      addToast('Produto inserido!', 'success');
    }
    
    setIsOpen(false);
    setEditId(null);
    setFormData({ name: '', price: '', cost: '', stock: '', emoji: '📦', category: 'Geral' });
  };

  return (
    <div className="pb-32 animate-slide-up space-y-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h3 className="font-headline text-3xl font-black text-primary uppercase tracking-tighter">Estoque</h3>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-2">Gerencie as unidades e produtos</p>
        </div>
        <button className="bg-primary text-on-primary w-12 h-12 flex items-center justify-center rounded-xl hover:bg-primary-dim transition-colors" onClick={() => { setEditId(null); setFormData({ name: '', price: '', cost: '', stock: '', emoji: '📦' }); setIsOpen(true); }}>
          <PlusCircle size={24} />
        </button>
      </header>

      <div className="flex flex-col gap-10">
        {groupedProducts.map(([cat, items]: any) => (
          <div key={cat} className="space-y-4">
            <h4 className="font-headline text-lg font-bold text-tertiary flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_10px_rgba(0,212,236,1)]"/>
              {cat}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p: any) => (
                <div key={p.id} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 flex justify-between items-center group transition-all hover:bg-surface-container-high">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center text-3xl border border-outline-variant/20 shadow-inner group-hover:bg-surface animate-scale-in">
                      {p.emoji || '📦'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline font-bold text-sm text-primary mb-1">{p.name}</span>
                      <span className="font-label text-xs font-bold text-tertiary">{formatCurrency(p.price)}</span>
                      <span className={cn("font-label text-[10px] uppercase tracking-wider mt-1 font-black", (p.stock || 0) <= 5 ? "text-error" : "text-on-surface-variant")}>Estoque: {p.stock || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-3 text-on-surface-variant hover:bg-primary/10 hover:text-primary rounded-xl transition-colors" onClick={() => handleEdit(p)}>
                      <Edit3 size={18} />
                    </button>
                    <button className="p-3 text-on-surface-variant hover:bg-error/10 hover:text-error rounded-xl transition-colors" onClick={() => deleteProduct(p.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {products.length === 0 && <div className="text-on-surface-variant text-sm col-span-full border-2 border-dashed border-outline-variant/20 py-20 rounded-3xl flex items-center justify-center italic opacity-40">Nenhum produto cadastrado.</div>}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
                        className="bg-surface-container-high w-full max-w-md p-8 rounded-2xl border border-tertiary/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between items-start mb-8">
                <h2 className="font-headline font-bold text-2xl">{editId ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={() => { setIsOpen(false); setEditId(null); }} type="button" className="text-on-surface-variant hover:text-error transition-colors p-1"><X size={24}/></button>
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
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Categoria / Unidade</label>
                  <input required className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors" 
                         value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Camisetas, Canecas, Geral..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Estoque</label>
                  <input required type="number" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm focus:border-tertiary focus:outline-none transition-colors" 
                         value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" />
                </div>
                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => { setIsOpen(false); setEditId(null); }} className="py-4 rounded-xl border border-outline-variant/30 font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-container-low transition-colors">Cancelar</button>
                  <button type="submit" className="py-4 bg-tertiary text-on-tertiary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-tertiary-dim transition-colors shadow">{editId ? 'Salvar Edição' : 'Salvar Item'}</button>
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
                {s.isGatcha ? <Sparkles size={18} /> : <ReceiptText size={18} />}
              </div>
              <div className="flex flex-col">
                <span className="font-label text-[10px] text-tertiary font-bold uppercase tracking-widest flex items-center gap-2">
                  {s.isGatcha && <span className="bg-tertiary/20 text-tertiary px-2 py-0.5 rounded text-[8px]">GATCHA</span>}
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
      { id: 'lootbox', label: 'Loot Box', icon: Sparkles, special: true }
    ].map((item) => (
      <button 
        key={item.id}
        onClick={() => setView(item.id)}
        className={cn(
          "flex flex-col items-center justify-center transition-all duration-300 w-[16%]",
          view === item.id ? "text-tertiary font-bold scale-110 -translate-y-1" : "text-on-surface-variant/70 hover:text-primary",
          item.special && view !== item.id ? "text-tertiary/60 animate-pulse" : ""
        )}
      >
        <div className={cn("relative p-1 rounded-full", item.special && "bg-tertiary/5 shadow-[0_0_15px_rgba(0,212,236,0.1)]")}>
          <item.icon className="w-5 h-5 mb-0.5" strokeWidth={view === item.id ? 2.5 : 2} />
        </div>
        <span className="font-label text-[8px] sm:text-[9px] uppercase tracking-tighter truncate">{item.label}</span>
      </button>
    ))}
  </nav>
);

const LootBoxAdmin = ({ prizes, runs, products, addPrize, updatePrize, deletePrize, generateRun }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', emoji: '🎁', rarity: 'Comum', chance: '', product_id: '' });
  const [qrRun, setQrRun] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);

  const totalChance = prizes.reduce((acc, p) => acc + Number(p.chance), 0);
  const rarityColors = { 'Comum': 'text-green-400', 'Incomum': 'text-yellow-400', 'Raro': 'text-red-400', 'Lendário': 'text-purple-400' };

  const handleGenerate = async () => {
    const run = await generateRun(attempts);
    const url = `${window.location.origin}${window.location.pathname}?run=${run.id}`;
    setQrRun(url);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (totalChance + Number(formData.chance) - (editId ? Number(prizes.find(p=>p.id===editId).chance) : 0) > 100) {
      return addToast('A probabilidade total não pode exceder 100%!', 'error');
    }
    const data = { ...formData, chance: parseFloat(formData.chance) };
    if (editId) updatePrize(editId, data); else addPrize(data);
    setIsOpen(false); setEditId(null); setFormData({ name: '', emoji: '🎁', rarity: 'Comum', chance: '', product_id: '' });
  };

  return (
    <div className="pb-32 animate-slide-up space-y-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h3 className="font-headline text-3xl font-black text-tertiary uppercase tracking-tighter">Loot Box Admin</h3>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-2">{totalChance}% de chances configuradas</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] uppercase font-black text-tertiary opacity-60">Giros</label>
            <input type="number" min="1" max="10" className="w-16 bg-surface-container-high border border-outline-variant/30 rounded-xl p-3 text-xs text-white text-center focus:outline-none focus:border-tertiary transition-colors" value={attempts} onChange={e=>setAttempts(parseInt(e.target.value)||1)} />
          </div>
          <button 
            className="group relative h-14 px-8 rounded-2xl overflow-hidden transition-all active:scale-95 shadow-2xl mt-4" 
            onClick={handleGenerate}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-tertiary to-primary bg-size-200 animate-gradient-x opacity-90" />
            <div className="relative flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white">
              <QrCode size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Gerar QR Code</span>
            </div>
            {/* Inner glow */}
            <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
          </button>
          <button className="bg-surface-container-highest text-white w-14 h-14 flex items-center justify-center rounded-2xl border border-outline-variant/10 hover:border-tertiary/50 transition-all mt-4 group shadow-lg" onClick={() => setIsOpen(true)}>
            <Plus className="group-hover:rotate-90 transition-transform" size={24} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prizes.map((p: any) => (
          <div key={p.id} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center text-3xl border border-outline-variant/20 shadow-inner">
                {p.emoji || '🎁'}
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-sm text-primary mb-1">{p.name}</span>
                <span className={cn("font-label text-[10px] uppercase font-black", rarityColors[p.rarity])}>{p.rarity}</span>
                <span className="font-label text-[10px] text-on-surface-variant mt-1">{p.chance}% de chance</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="p-3 text-on-surface-variant hover:text-primary rounded-xl" onClick={() => { setEditId(p.id); setFormData({ name: p.name, emoji: p.emoji, rarity: p.rarity, chance: p.chance.toString(), product_id: p.product_id || '' }); setIsOpen(true); }}><Edit3 size={18}/></button>
              <button className="p-3 text-on-surface-variant hover:text-error rounded-xl" onClick={() => deletePrize(p.id)}><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="font-headline text-lg font-bold text-primary px-1">Ganhos Recentes</h4>
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 divide-y divide-outline-variant/10 overflow-hidden">
          {runs.filter((r:any) => r.status === 'opened').map((r: any) => {
            const prize = prizes.find((p:any) => p.id === r.prize_id);
            return (
              <div key={r.id} className="p-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{prize?.emoji || '🎁'}</span>
                  <div>
                    <p className="font-bold text-primary">{prize?.name || 'Item Desconhecido'}</p>
                    <p className="text-on-surface-variant font-label text-[10px]">{formatTime(r.opened_at)}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-1 rounded-md font-black uppercase text-[8px] border", rarityColors[prize?.rarity || 'Comum'])}>{prize?.rarity || 'Comum'}</span>
              </div>
            );
          })}
          {runs.filter((r:any) => r.status === 'opened').length === 0 && <p className="p-10 text-center text-on-surface-variant italic opacity-40">Nenhum ganho registrado ainda.</p>}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-container-high w-full max-w-md p-8 rounded-2xl border border-tertiary/30">
              <h2 className="font-headline font-bold text-2xl mb-8">{editId ? 'Editar Prêmio' : 'Novo Prêmio'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4 font-body">
                <input required className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Nome do Prêmio" />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm text-white" value={formData.rarity} onChange={e=>setFormData({...formData, rarity: e.target.value})}>
                    <option value="Comum">Comum</option><option value="Incomum">Incomum</option><option value="Raro">Raro</option><option value="Lendário">Lendário</option>
                  </select>
                  <input required type="number" step="0.1" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm font-white" value={formData.chance} onChange={e=>setFormData({...formData, chance: e.target.value})} placeholder="Chance %" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Vincular Produto (Opcional)</label>
                  <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 text-sm text-white" value={formData.product_id} onChange={e=>setFormData({...formData, product_id: e.target.value})}>
                    <option value="">Nenhum (Apenas nome)</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.stock} em estoque)</option>
                    ))}
                  </select>
                </div>
                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button type="button" onClick={()=>setIsOpen(false)} className="py-4 rounded-xl border border-outline-variant/30 font-label text-xs uppercase font-bold">Cancelar</button>
                  <button type="submit" className="py-4 bg-tertiary text-on-tertiary rounded-xl font-label text-xs uppercase font-bold">Salvar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {qrRun && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4">
            <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_100px_rgba(255,255,255,0.2)]">
              <p className="text-black font-headline font-black text-xl uppercase tracking-tighter">Sua Chance</p>
              <div className="p-4 bg-white rounded-2xl shadow-inner border-4 border-black/5">
                <QRCodeSVG value={qrRun} size={256} level="H" includeMargin />
              </div>
              <p className="text-black/60 font-label text-[10px] uppercase tracking-widest text-center max-w-[200px]">Mostre este código para o cliente escanear e abrir o prêmio</p>
              <button onClick={()=>setQrRun(null)} className="mt-4 bg-black text-white px-8 py-4 rounded-2xl font-label text-xs uppercase font-black w-full">Fechar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MedievalChest = ({ state, className = '' }: { state: 'closed' | 'opening' | 'opened'; className?: string }) => {
  const isOpening = state === 'opening';
  const isOpened = state === 'opened';

  return (
    <div className={cn("relative", className)}>
      {/* Light Rays behind when opened */}
      <AnimatePresence>
        {(isOpening || isOpened) && (
          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1.5 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center -z-10 blur-xl">
            <div className="w-1 bg-[#fbbf24] h-60 rotate-0 absolute opacity-40 shadow-[0_0_20px_#fbbf24]" />
            <div className="w-1 bg-[#fbbf24] h-60 rotate-45 absolute opacity-40 shadow-[0_0_20px_#fbbf24]" />
            <div className="w-1 bg-[#fbbf24] h-60 rotate-90 absolute opacity-40 shadow-[0_0_20px_#fbbf24]" />
            <div className="w-1 bg-[#fbbf24] h-60 rotate-[135deg] absolute opacity-40 shadow-[0_0_20px_#fbbf24]" />
          </motion.div>
        )}
      </AnimatePresence>

      <svg viewBox="0 0 100 80" className="w-56 h-48 drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] overflow-visible">
        <defs>
          <linearGradient id="wood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a2c1d" />
            <stop offset="100%" stopColor="#2d1a11" />
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Shadow floor */}
        <ellipse cx="50" cy="72" rx="35" ry="8" fill="rgba(0,0,0,0.5)" />

        {/* Chest Body */}
        <motion.g animate={isOpening ? { x: [-1, 1, -1, 1, 0] } : {}} transition={{ repeat: Infinity, duration: 0.1 }}>
          <rect x="10" y="35" width="80" height="35" fill="url(#wood)" rx="3" />
          <rect x="10" y="35" width="80" height="3" fill="rgba(0,0,0,0.3)" />
          
          {/* Iron Bands Body */}
          <rect x="25" y="35" width="8" height="35" fill="#2d2d2d" />
          <rect x="67" y="35" width="8" height="35" fill="#2d2d2d" />
          
          {/* Gold Studs */}
          <circle cx="29" cy="45" r="1.5" fill="url(#gold)" /><circle cx="29" cy="55" r="1.5" fill="url(#gold)" /><circle cx="29" cy="65" r="1.5" fill="url(#gold)" />
          <circle cx="71" cy="45" r="1.5" fill="url(#gold)" /><circle cx="71" cy="55" r="1.5" fill="url(#gold)" /><circle cx="71" cy="65" r="1.5" fill="url(#gold)" />
        </motion.g>

        {/* Lid (Top portion) */}
        <motion.g animate={{ rotateX: (isOpening || isOpened) ? -120 : 0, y: isOpened ? -2 : 0 }} 
                  style={{ originY: '35px', perspective: '1000px' }} 
                  transition={{ type: 'spring', stiffness: 200, damping: isOpening ? 5 : 15 }}>
          <path d="M10 35 C 10 15, 90 15, 90 35 L 90 35 L 10 35 Z" fill="url(#wood)" />
          <path d="M10 35 C 10 20, 90 20, 90 35 L 90 33 C 90 18, 10 18, 10 33 Z" fill="rgba(255,255,255,0.05)" />
          
          {/* Iron Bands Lid */}
          <rect x="25" y="18" width="8" height="17" fill="#2d2d2d" />
          <rect x="67" y="18" width="8" height="17" fill="#2d2d2d" />
          <circle cx="29" cy="22" r="1.5" fill="url(#gold)" />
          <circle cx="71" cy="22" r="1.5" fill="url(#gold)" />

          {/* Golden Lock */}
          <g transform="translate(42, 30)">
            <rect width="16" height="12" fill="url(#gold)" rx="2" stroke="#4a2c1d" strokeWidth="0.5" />
            <circle cx="8" cy="6" r="2.5" fill="#2d1a11" />
            <rect x="7" y="6" width="2" height="4" fill="#2d1a11" />
          </g>
        </motion.g>

        {/* Prize Glow rising from inside */}
        {isOpened && (
          <motion.g initial={{ y: 20, opacity: 0 }} animate={{ y: -30, opacity: 1 }} transition={{ delay: 0.3, duration: 1, type: 'spring' }}>
            <circle cx="50" cy="35" r="15" fill="rgba(251, 191, 36, 0.4)" filter="blur(8px)" />
            <motion.text x="50" y="42" textAnchor="middle" fontSize="18" initial={{ scale: 0 }} animate={{ scale: 1.5 }} transition={{ delay: 0.5 }}>✨</motion.text>
          </motion.g>
        )}
      </svg>
    </div>
  );
};

const LootBoxPublic = ({ runId, openLootbox }: any) => {
  const [chestState, setChestState] = useState<'closed' | 'opening' | 'opened' | 'error'>('closed');
  const [prize, setPrize] = useState<any>(null);
  const [looted, setLooted] = useState<any[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);

  const handleOpen = async () => {
    if (chestState !== 'closed') return;
    setChestState('opening');
    
    // RPG Shake effect
    setTimeout(async () => {
      try {
        const result = await openLootbox(runId);
        if (result) {
          setPrize(result);
          setRemaining(result.remaining);
          setLooted(prev => [result, ...prev]);
          if (result.remaining === 0) {
            setTimeout(() => setChestState('opened'), 2500); // Wait for user to see the last prize
          } else {
            setChestState('opened');
          }
          
          if (result.rarity === 'Lendário') {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#c084fc', '#ffd700'] });
          } else {
            confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
          }
        } else { setChestState('error'); }
      } catch { setChestState('error'); }
    }, 1200);
  };

  const rarityStyles = {
    'Comum': 'text-green-400 border-green-400/20 bg-green-950/20 shadow-[0_0_40px_rgba(74,222,128,0.1)]',
    'Incomum': 'text-yellow-400 border-yellow-400/20 bg-yellow-950/20 shadow-[0_0_40px_rgba(250,204,21,0.1)]',
    'Raro': 'text-red-400 border-red-400/20 bg-red-950/20 shadow-[0_0_40px_rgba(248,113,113,0.1)]',
    'Lendário': 'text-purple-400 border-purple-400/40 bg-purple-950/30 shadow-[0_0_60px_rgba(192,132,252,0.3)] animate-pulse'
  };

  if (chestState === 'error') return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center gap-6">
      <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30">
        <AlertTriangle className="text-red-500 w-10 h-10" />
      </div>
      <h1 className="text-white font-headline text-3xl font-black uppercase tracking-tighter">Baú Vazio</h1>
      <p className="text-white/40 font-body text-sm max-w-xs">Não há mais chances restantes ou o baú desapareceu nas sombras.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050506] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent)]" />
      
      {/* RPG Header */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-12 flex flex-col items-center gap-1 z-10">
        <h2 className="font-headline text-[10px] uppercase tracking-[0.5em] text-tertiary/60 font-black">Masmorra do Caio</h2>
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-tertiary/40 to-transparent" />
      </motion.div>

      <div className="relative w-full max-w-lg flex flex-col items-center gap-12 pt-20">
        <AnimatePresence mode="wait">
          {chestState !== 'opened' ? (
            <motion.div key="chest" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }} className="flex flex-col items-center gap-8">
              <motion.div animate={chestState === 'opening' ? { rotate: [0, -2, 2, -2, 2, 0], scale: 1.1 } : { y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: chestState === 'opening' ? 0.1 : 4 }}
                          onClick={handleOpen} className="cursor-pointer relative group">
                <div className="absolute inset-x-0 top-1/2 h-4 w-full bg-tertiary/10 blur-3xl group-hover:bg-tertiary/30 transition-all scale-[3]" />
                
                {chestState === 'closed' ? (
                  <div className="flex flex-col items-center gap-8">
                    <MedievalChest state="closed" />
                  </div>
                ) : (
                  <div className="fixed inset-0 z-0 bg-black animate-fade-in">
                    <img src={`${chest3Gif}?t=${Date.now()}`} alt="Opening Chest" className="w-full h-full object-cover opacity-80" />
                    {/* Dark gradient overlay to keep UI readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                  </div>
                )}
              </motion.div>
              
              <div className="flex flex-col items-center gap-6">
                <div className="px-6 py-2 rounded-full border-2 border-tertiary/20 bg-tertiary/5 backdrop-blur-md">
                  <p className="font-label text-sm font-black uppercase tracking-[0.2em] text-tertiary">
                    {remaining !== null ? `Cargas: ${remaining}` : 'Contém Tesouros'}
                  </p>
                </div>
                {chestState === 'closed' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                            className="font-headline font-black text-xs uppercase tracking-[0.3em] text-white/50">Toque para Saquear</motion.p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="prize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-10 w-full">
              {remaining && remaining > 0 ? (
                <>
                  <div className="relative flex flex-col items-center">
                    <motion.div initial={{ scale: 0, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} 
                                className={cn("w-72 h-96 rounded-[3rem] border-2 flex flex-col items-center justify-between p-10 relative overflow-hidden z-20 backdrop-blur-md shadow-[0_40px_100px_rgba(0,0,0,0.8)]", rarityStyles[prize.rarity])}>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
                      
                      <div className="space-y-1 text-center z-10 pt-4">
                        <p className="text-[8px] uppercase tracking-[0.4em] font-black opacity-60">Saque Épico</p>
                        <h2 className="font-headline text-3xl font-black uppercase tracking-tighter leading-none">{prize.name}</h2>
                      </div>

                      <span className="text-[140px] drop-shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-10 animate-bounce-slow">{prize.emoji || '🎁'}</span>
                      
                      <div className="font-label text-[11px] font-black uppercase tracking-[0.3em] z-10 px-6 py-2 rounded-full border border-current/20 bg-black/20 mb-4">{prize.rarity}</div>
                    </motion.div>
                  </div>
                  <button onClick={() => setChestState('closed')} className="bg-white text-black px-12 py-5 rounded-2xl font-label text-[12px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all active:scale-95 shadow-2xl z-30">Abrir Próximo</button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-6 animate-slide-up w-full max-w-sm">
                  <div className="w-full flex flex-col items-center gap-2 mb-4">
                    <p className="font-headline font-black text-xs uppercase tracking-[0.5em] text-tertiary">Saque Concluído</p>
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-tertiary/30 to-transparent" />
                  </div>
                  
                  <div className="bg-[#0f0f11] backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 w-full space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center opacity-40 relative z-10">Inventário do Saque</p>
                    
                    <div className="space-y-3 relative z-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {looted.map((l, i) => (
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                   key={i} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl drop-shadow-md">{l.emoji}</span>
                            <div className="flex flex-col">
                              <span className="font-headline font-bold text-xs uppercase tracking-tight text-white">{l.name}</span>
                              <span className={cn("text-[6px] font-black uppercase tracking-widest", rarityStyles[l.rarity].split(' ')[0])}>{l.rarity}</span>
                            </div>
                          </div>
                          <Check size={14} className="text-tertiary opacity-40" />
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="pt-4 space-y-4 relative z-10">
                      <div className="bg-tertiary/10 border border-tertiary/20 p-5 rounded-2xl flex flex-col items-center gap-2 animate-scale-in">
                        <CheckCircle2 className="text-tertiary w-8 h-8" />
                        <p className="text-tertiary font-headline font-black text-[10px] uppercase tracking-widest">Sua tentativa de saque terminou</p>
                      </div>
                      <p className="text-[9px] text-center opacity-40 uppercase font-black leading-relaxed px-6">Valide os itens acima com o vendedor para coletar seu tesouro</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loot History (Small icons at bottom) */}
      {looted.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-10 flex gap-3 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
          {looted.map((l, i) => (
            <div key={i} className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border", rarityStyles[l.rarity])}>
              {l.emoji}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('dashboard');
  const store = useStore() as any;

  // Handle Public LootBox View
  const runId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('run');
  }, []);

  if (runId) {
    return <LootBoxPublic runId={runId} openLootbox={store.openLootbox} />;
  }

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
        {view === 'dashboard' && <Dashboard products={store.products} sales={store.sales} expenses={store.expenses} events={store.events} />}
        {view === 'pdv' && <PDV products={store.products} events={store.events} addSale={store.addSale} />}
        {view === 'products' && <Products products={store.products} addProduct={store.addProduct} updateProduct={store.updateProduct} deleteProduct={store.deleteProduct} />}
        {view === 'expenses' && <Expenses expenses={store.expenses} addExpense={store.addExpense} deleteExpense={store.deleteExpense} />}
        {view === 'history' && <SalesHistory sales={store.sales} deleteSale={store.deleteSale} />}
        {view === 'calendar' && <CalendarAgenda events={store.events || []} addEvent={store.addEvent} deleteEvent={store.deleteEvent} />}
        {view === 'lootbox' && <LootBoxAdmin prizes={store.lootboxPrizes} runs={store.lootboxRuns} products={store.products} addPrize={store.addLootboxPrize} updatePrize={store.updateLootboxPrize} deletePrize={store.deleteLootboxPrize} generateRun={store.generateLootboxRun} />}
      </main>

      <BottomNav view={view} setView={setView} />
      <ToastContainer />
    </div>
  );
}

