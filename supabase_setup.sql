-- Este script deve ser executado no SQL Editor do Supabase para o projeto Caio-Vendas / vendas-dashboard

-- 1. Criar a tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  emoji text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar a tabela de Vendas
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  items jsonb NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  note text
);

-- 3. Criar a tabela de Despesas (Custos)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar segurança a nível de linha (Row Level Security - RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas para permitir operações CRUD via chave pública (Anon Key)
-- Nota: Caso queira limitar quem pode alterar as coisas, o ideal é plugar o sistema de login (Supabase Auth) no futuro.
CREATE POLICY "Allow public all access on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow public all access on sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Allow public all access on expenses" ON public.expenses FOR ALL USING (true);
