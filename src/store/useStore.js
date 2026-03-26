import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'caio_vendas_data';

export const useStore = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLocalData = () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const { products, sales, expenses } = JSON.parse(data);
      setProducts(products || []);
      setSales(sales || []);
      setExpenses(expenses || []);
    }
  };

  const saveLocalData = (p, s, e) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ products: p, sales: s, expenses: e }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!supabase) {
      loadLocalData();
      setLoading(false);
      return;
    }

    try {
      const [pRes, sRes, eRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false })
      ]);

      if (!pRes.error) setProducts(pRes.data || []);
      if (!sRes.error) setSales(sRes.data || []);
      if (!eRes.error) setExpenses(eRes.data || []);
      
      saveLocalData(pRes.data, sRes.data, eRes.data);
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
      saveLocalData(next, sales, expenses);
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
      saveLocalData(next, sales, expenses);
      return next;
    });
  };

  const deleteProduct = async (id) => {
    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
    }
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      saveLocalData(next, sales, expenses);
      return next;
    });
  };

  // Sales
  const addSale = async (items, note = '') => {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
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
      saveLocalData(products, next, expenses);
      return next;
    });

    // Update local stock too
    setProducts(prev => {
      const next = prev.map(p => {
        const item = items.find(i => i.productId === p.id);
        return item ? { ...p, stock: Math.max(0, (p.stock || 0) - item.qty) } : p;
      });
      saveLocalData(next, sales, expenses);
      return next;
    });
  };

  const deleteSale = async (id) => {
    if (supabase) {
      await supabase.from('sales').delete().eq('id', id);
    }
    setSales(prev => {
      const next = prev.filter(s => s.id !== id);
      saveLocalData(products, next, expenses);
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
      saveLocalData(products, sales, next);
      return next;
    });
  };

  const deleteExpense = async (id) => {
    if (supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      saveLocalData(products, sales, next);
      return next;
    });
  };

  return {
    products,
    sales,
    expenses,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    deleteSale,
    addExpense,
    deleteExpense,
    refresh: fetchData
  };
};
