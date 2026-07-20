create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  isbn text,
  title text not null,
  authors text,
  description text,
  cover_url text,
  language text,
  condition text not null default 'Bon état',
  format text not null default 'Format standard / broché',
  price numeric(10,2) not null check (price >= 3),
  first_edition boolean not null default false,
  edition_source text,
  series_name text,
  series_number int,
  city text,
  province text,
  shipping_fee numeric(10,2) not null default 0,
  allows_pickup boolean not null default true,
  allows_shipping boolean not null default true,
  status text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_seller_idx on public.listings (seller_id);

alter table public.listings enable row level security;

create policy "Les annonces actives sont visibles par tous, les autres par leur vendeur"
  on public.listings for select
  using (status = 'active' or auth.uid() = seller_id);

create policy "Un utilisateur connecte cree ses propres annonces"
  on public.listings for insert
  with check (auth.uid() = seller_id);

create policy "Un vendeur modifie seulement ses propres annonces"
  on public.listings for update
  using (auth.uid() = seller_id);

create policy "Un vendeur supprime seulement ses propres annonces"
  on public.listings for delete
  using (auth.uid() = seller_id);

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  position int not null default 0
);

create index if not exists listing_photos_listing_idx on public.listing_photos (listing_id);

alter table public.listing_photos enable row level security;

create policy "Les photos sont visibles par tous"
  on public.listing_photos for select
  using (true);

create policy "Le vendeur gere les photos de ses propres annonces"
  on public.listing_photos for all
  using (
    exists (
      select 1 from public.listings
      where listings.id = listing_photos.listing_id
      and listings.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings
      where listings.id = listing_photos.listing_id
      and listings.seller_id = auth.uid()
    )
  );
