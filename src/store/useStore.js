import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'caio_vendas_data';

export const useStore = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLocalData = () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const { products, sales, expenses, events } = JSON.parse(data);
      setProducts(products || []);
      setSales(sales || []);
      setExpenses(expenses || []);
      setEvents(events || []);
    }
  };

  const saveLocalData = (p, s, e, ev) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ products: p, sales: s, expenses: e, events: ev }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!supabase) {
      loadLocalData();
      setLoading(false);
      return;
    }

    try {
      const [pRes, sRes, eRes, evRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('events').select('*').order('date', { ascending: true })
      ]);

      if (!pRes.error) setProducts(pRes.data || []);
      if (!sRes.error) setSales(sRes.data || []);
      if (!eRes.error) setExpenses(eRes.data || []);
      if (evRes && !evRes.error) setEvents(evRes.data || []);
      
      saveLocalData(pRes.data, sRes.data, eRes.data, evRes ? evRes.data : []);
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
  const addSale = async (items, note = '', isGatcha = false) => {
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
      isGatcha
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

  return {
    products,
    sales,
    expenses,
    events,
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
    refresh: fetchData
  };
};
