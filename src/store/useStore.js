import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'caio_vendas_data';

export const useStore = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [lootboxPrizes, setLootboxPrizes] = useState([]);
  const [lootboxRuns, setLootboxRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLocalData = () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const { products, sales, expenses, events, lootboxPrizes, lootboxRuns } = JSON.parse(data);
      setProducts(products || []);
      setSales(sales || []);
      setExpenses(expenses || []);
      setEvents(events || []);
      setLootboxPrizes(lootboxPrizes || []);
      setLootboxRuns(lootboxRuns || []);
    }
  };

  const saveLocalData = (p, s, e, ev, lbp, lbr) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ products: p, sales: s, expenses: e, events: ev, lootboxPrizes: lbp, lootboxRuns: lbr }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!supabase) {
      loadLocalData();
      setLoading(false);
      return;
    }

    try {
      const [pRes, sRes, eRes, evRes, lbpRes, lbrRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('lootbox_prizes').select('*'),
        supabase.from('lootbox_runs').select('*').order('opened_at', { ascending: false }).limit(20)
      ]);

      if (!pRes.error) setProducts(pRes.data || []);
      if (!sRes.error) setSales(sRes.data || []);
      if (!eRes.error) setExpenses(eRes.data || []);
      if (evRes && !evRes.error) setEvents(evRes.data || []);
      if (lbpRes && !lbpRes.error) setLootboxPrizes(lbpRes.data || []);
      if (lbrRes && !lbrRes.error) setLootboxRuns(lbrRes.data || []);
      
      saveLocalData(pRes.data, sRes.data, eRes.data, evRes ? evRes.data : [], lbpRes ? lbpRes.data : [], lbrRes ? lbrRes.data : []);
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Products
  const addProduct = async (product) => {
    let newProduct = { ...product, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    if (supabase) {
      const { data, error } = await supabase.from('products').insert([product]).select();
      if (!error) newProduct = data[0];
    }
    
    setProducts(prev => {
      const next = [...prev, newProduct];
      saveLocalData(next, sales, expenses, events);
      return next;
    });
    return newProduct;
  };

  const updateProduct = async (id, changes) => {
    if (supabase) {
      await supabase.from('products').update(changes).eq('id', id);
    }
    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...changes } : p);
      saveLocalData(next, sales, expenses, events);
      return next;
    });
  };

  const deleteProduct = async (id) => {
    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
    }
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      saveLocalData(next, sales, expenses, events);
      return next;
    });
  };

  // Sales
  const addSale = async (items, note = '', isGatcha = false, eventId = null) => {
    const total = isGatcha ? 5 : items.reduce((s, i) => s + i.price * i.qty, 0);
    const cost = items.reduce((s, i) => {
      const p = products.find(prod => prod.id === i.productId);
      return s + (p ? p.cost || 0 : 0) * i.qty;
    }, 0);
    const profit = total - cost;

    const sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      items,
      total,
      profit,
      note,
      isGatcha,
      event_id: eventId
    };

    if (supabase) {
      await supabase.from('sales').insert([sale]);
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.qty);
          await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
        }
      }
    }

    setSales(prev => {
      const next = [sale, ...prev];
      saveLocalData(products, next, expenses, events);
      return next;
    });

    // Update local stock too
    setProducts(prev => {
      const next = prev.map(p => {
        const item = items.find(i => i.productId === p.id);
        return item ? { ...p, stock: Math.max(0, (p.stock || 0) - item.qty) } : p;
      });
      saveLocalData(next, sales, expenses, events);
      return next;
    });
  };

  const deleteSale = async (id) => {
    if (supabase) {
      await supabase.from('sales').delete().eq('id', id);
    }
    setSales(prev => {
      const next = prev.filter(s => s.id !== id);
      saveLocalData(products, next, expenses, events);
      return next;
    });
  };

  // Expenses
  const addExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: crypto.randomUUID(),
      date: expense.date || new Date().toISOString(),
    };
    if (supabase) {
      await supabase.from('expenses').insert([newExpense]);
    }
    setExpenses(prev => {
      const next = [newExpense, ...prev];
      saveLocalData(products, sales, next, events);
      return next;
    });
  };

  const deleteExpense = async (id) => {
    if (supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      saveLocalData(products, sales, next, events);
      return next;
    });
  };

  // Events
  const addEvent = async (event) => {
    const newEvent = {
      ...event,
      id: crypto.randomUUID(),
      date: event.date || new Date().toISOString(),
    };
    if (supabase) {
      await supabase.from('events').insert([newEvent]);
    }
    setEvents(prev => {
      const next = [...prev, newEvent];
      saveLocalData(products, sales, expenses, next);
      return next;
    });
  };

  const deleteEvent = async (id) => {
    if (supabase) {
      await supabase.from('events').delete().eq('id', id);
    }
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      saveLocalData(products, sales, expenses, next);
      return next;
    });
  };

  // LootBox
  const addLootboxPrize = async (prize) => {
    let newPrize = { ...prize, id: crypto.randomUUID() };
    if (supabase) {
      const { data, error } = await supabase.from('lootbox_prizes').insert([prize]).select();
      if (!error) newPrize = data[0];
    }
    setLootboxPrizes(prev => {
      const next = [...prev, newPrize];
      saveLocalData(products, sales, expenses, events, next);
      return next;
    });
  };

  const updateLootboxPrize = async (id, changes) => {
    if (supabase) await supabase.from('lootbox_prizes').update(changes).eq('id', id);
    setLootboxPrizes(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...changes } : p);
      saveLocalData(products, sales, expenses, events, next);
      return next;
    });
  };

  const deleteLootboxPrize = async (id) => {
    if (supabase) await supabase.from('lootbox_prizes').delete().eq('id', id);
    setLootboxPrizes(prev => {
      const next = prev.filter(p => p.id !== id);
      saveLocalData(products, sales, expenses, events, next);
      return next;
    });
  };

  const generateLootboxRun = async (totalUses = 1) => {
    const run = { id: crypto.randomUUID(), status: 'pending', total_uses: totalUses, used_count: 0, created_at: new Date().toISOString() };
    if (supabase) await supabase.from('lootbox_runs').insert([run]);
    return run;
  };

  const openLootbox = async (runId) => {
    if (!supabase) return null;
    
    // Check if valid
    const { data: runData } = await supabase.from('lootbox_runs').select('*').eq('id', runId).single();
    if (!runData || runData.used_count >= runData.total_uses) return null;

    // Pick random prize
    const activePrizes = lootboxPrizes.filter(p => Number(p.chance) > 0);
    const totalChance = activePrizes.reduce((s, p) => s + Number(p.chance), 0);
    let rand = Math.random() * totalChance;
    let selectedPrize = activePrizes[0];
    for (const p of activePrizes) {
      if (rand < Number(p.chance)) { selectedPrize = p; break; }
      rand -= Number(p.chance);
    }

    // Update run
    const newUsedCount = runData.used_count + 1;
    const newStatus = newUsedCount >= runData.total_uses ? 'opened' : 'pending';
    await supabase.from('lootbox_runs').update({ 
      status: newStatus, 
      used_count: newUsedCount,
      prize_id: selectedPrize.id,
      opened_at: new Date().toISOString() 
    }).eq('id', runId);
    
    // Register as a sale of 5.00
    await addSale([{ productId: selectedPrize.product_id || '', name: `Lootbox: ${selectedPrize.name}`, qty: 1, price: 5 }], 'Lootbox Win', true);

    return { ...selectedPrize, remaining: runData.total_uses - newUsedCount };
  };

  return {
    products,
    sales,
    expenses,
    events,
    lootboxPrizes,
    lootboxRuns,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    deleteSale,
    addExpense,
    deleteExpense,
    addEvent,
    deleteEvent,
    addLootboxPrize,
    updateLootboxPrize,
    deleteLootboxPrize,
    generateLootboxRun,
    openLootbox,
    refresh: fetchData
  };
};
