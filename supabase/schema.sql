-- ============================================================
-- ESQUEMA DE BASE DE DATOS - APP DE DOTACIONES Y UNIFORMES
-- Ejecutar en el SQL Editor de Supabase (script completo, de una sola vez)
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. CATEGORÍAS (áreas de trabajo: Medicina, Construcción, etc.)
-- ------------------------------------------------------------
create table categorias (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  slug text not null unique,
  descripcion text,
  icono_url text,
  activo boolean default true,
  creado_en timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. PRODUCTOS BASE (camisas/filipinas y pantalones)
-- ------------------------------------------------------------
create type tipo_prenda as enum ('camisa', 'filipina', 'pantalon');

create table productos (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  nombre text not null,
  tipo_prenda tipo_prenda not null,
  descripcion text,
  precio_base numeric(10,2) not null default 0,
  imagen_url text,
  activo boolean default true,
  creado_en timestamptz default now()
);

create index idx_productos_categoria on productos(categoria_id);

-- ------------------------------------------------------------
-- 3. TALLAS
-- ------------------------------------------------------------
create table tallas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique
);

create table producto_tallas (
  id uuid primary key default uuid_generate_v4(),
  producto_id uuid not null references productos(id) on delete cascade,
  talla_id uuid not null references tallas(id) on delete cascade,
  stock integer default 0,
  unique (producto_id, talla_id)
);

-- ------------------------------------------------------------
-- 4. ACCESORIOS
-- ------------------------------------------------------------
create table accesorios (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null default 0,
  imagen_url text,
  requiere_talla boolean default false,
  activo boolean default true
);

create index idx_accesorios_categoria on accesorios(categoria_id);

-- ------------------------------------------------------------
-- 5. PEDIDOS
-- ------------------------------------------------------------
create type estado_pedido as enum ('pendiente', 'confirmado', 'en_proceso', 'entregado', 'cancelado');

create table pedidos (
  id uuid primary key default uuid_generate_v4(),
  nombre_cliente text not null,
  email_cliente text not null,
  telefono_cliente text,
  empresa text,
  categoria_id uuid references categorias(id),
  estado estado_pedido default 'pendiente',
  total numeric(10,2) not null default 0,
  notas text,
  creado_en timestamptz default now()
);

-- ------------------------------------------------------------
-- 6. DETALLE DEL PEDIDO
-- ------------------------------------------------------------
create type item_tipo as enum ('producto', 'accesorio');

create table pedido_items (
  id uuid primary key default uuid_generate_v4(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  item_tipo item_tipo not null,
  producto_id uuid references productos(id),
  accesorio_id uuid references accesorios(id),
  talla_id uuid references tallas(id),
  cantidad integer not null default 1,
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) generated always as (cantidad * precio_unitario) stored,
  constraint chk_item_referencia check (
    (item_tipo = 'producto' and producto_id is not null and accesorio_id is null) or
    (item_tipo = 'accesorio' and accesorio_id is not null and producto_id is null)
  )
);

create index idx_pedido_items_pedido on pedido_items(pedido_id);

-- ============================================================
-- DATOS DE EJEMPLO (seed)
-- ============================================================
insert into categorias (nombre, slug, descripcion) values
  ('Medicina', 'medicina', 'Dotación para personal de salud'),
  ('Construcción', 'construccion', 'Dotación para obras y construcción'),
  ('Gastronomía', 'gastronomia', 'Dotación para cocina y restaurantes'),
  ('Administrativo', 'administrativo', 'Dotación para personal de oficina');

insert into tallas (nombre) values ('XS'), ('S'), ('M'), ('L'), ('XL'), ('XXL');

insert into accesorios (categoria_id, nombre, precio, requiere_talla)
select id, 'Gorro quirúrgico', 8000, false from categorias where slug = 'medicina'
union all
select id, 'Tapabocas', 3000, false from categorias where slug = 'medicina'
union all
select id, 'Zuecos', 45000, true from categorias where slug = 'medicina'
union all
select id, 'Guantes de carnaza', 15000, false from categorias where slug = 'construccion'
union all
select id, 'Casco', 35000, false from categorias where slug = 'construccion'
union all
select id, 'Botas punta de acero', 90000, true from categorias where slug = 'construccion';

-- Productos de ejemplo (con cast explícito ::tipo_prenda para evitar el error de tipos)
insert into productos (categoria_id, nombre, tipo_prenda, precio_base, descripcion)
select id, 'Filipina Médica Antifluidos', 'filipina'::tipo_prenda, 65000, 'Filipina de manga corta antifluidos' from categorias where slug = 'medicina'
union all
select id, 'Pantalón Médico Antifluidos', 'pantalon'::tipo_prenda, 55000, 'Pantalón resorte en cintura' from categorias where slug = 'medicina'
union all
select id, 'Camisa Jean de Trabajo', 'camisa'::tipo_prenda, 48000, 'Camisa 100% algodón de alta resistencia' from categorias where slug = 'construccion'
union all
select id, 'Pantalón de Dril Industrial', 'pantalon'::tipo_prenda, 52000, 'Pantalón reforzado con 6 bolsillos' from categorias where slug = 'construccion'
union all
select id, 'Filipina Chef Ejecutiva', 'filipina'::tipo_prenda, 70000, 'Filipina con botones cruzados' from categorias where slug = 'gastronomia'
union all
select id, 'Pantalón Cocina Pinstripe', 'pantalon'::tipo_prenda, 48000, 'Pantalón cómodo para cocina' from categorias where slug = 'gastronomia'
union all
select id, 'Camisa Ejecutiva Oxford', 'camisa'::tipo_prenda, 58000, 'Camisa formal manga larga' from categorias where slug = 'administrativo'
union all
select id, 'Pantalón Formal de Vestir', 'pantalon'::tipo_prenda, 68000, 'Pantalón elegante de paño' from categorias where slug = 'administrativo';

insert into producto_tallas (producto_id, talla_id, stock)
select p.id, t.id, 50
from productos p
cross join tallas t
where t.nombre in ('S', 'M', 'L', 'XL');

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table categorias enable row level security;
alter table productos enable row level security;
alter table tallas enable row level security;
alter table producto_tallas enable row level security;
alter table accesorios enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;

create policy "Lectura pública categorias" on categorias for select using (true);
create policy "Lectura pública productos" on productos for select using (true);
create policy "Lectura pública tallas" on tallas for select using (true);
create policy "Lectura pública producto_tallas" on producto_tallas for select using (true);
create policy "Lectura pública accesorios" on accesorios for select using (true);

create policy "Cualquiera puede crear pedidos" on pedidos for insert with check (true);
create policy "Cualquiera puede crear items de pedido" on pedido_items for insert with check (true);