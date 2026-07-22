-- Fils de negociation (un par paire acheteur/vendeur/annonce)
create table if not exists public.negotiation_threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'accepted', 'declined', 'purchased')),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create index if not exists negotiation_threads_buyer_idx on public.negotiation_threads (buyer_id);
create index if not exists negotiation_threads_seller_idx on public.negotiation_threads (seller_id);

alter table public.negotiation_threads enable row level security;

create policy "Acheteur ou vendeur voit ses propres fils"
  on public.negotiation_threads for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Un acheteur ouvre un fil sur une annonce"
  on public.negotiation_threads for insert
  with check (auth.uid() = buyer_id);

create policy "Acheteur ou vendeur met a jour le statut du fil"
  on public.negotiation_threads for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Messages dans un fil de negociation (texte, offre, contre-offre, acceptation, refus)
create table if not exists public.negotiation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.negotiation_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  offer_amount numeric(10,2),
  message_type text not null default 'text' check (message_type in ('text', 'offer', 'counter_offer', 'accept', 'decline')),
  created_at timestamptz not null default now()
);

create index if not exists negotiation_messages_thread_idx on public.negotiation_messages (thread_id, created_at);

alter table public.negotiation_messages enable row level security;

create policy "Participants du fil voient les messages"
  on public.negotiation_messages for select
  using (
    exists (
      select 1 from public.negotiation_threads t
      where t.id = negotiation_messages.thread_id
      and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

create policy "Participants du fil envoient des messages"
  on public.negotiation_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.negotiation_threads t
      where t.id = negotiation_messages.thread_id
      and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

-- Transactions (achat simple ou en lot)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  is_bundle boolean not null default false,
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null default 0,
  interprovincial_surcharge numeric(10,2) not null default 0,
  platform_fee numeric(10,2) not null default 0,
  stripe_fee numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  seller_net numeric(10,2) not null,
  delivery_method text not null check (delivery_method in ('pickup', 'shipping')),
  buyer_province text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  hold_release_at timestamptz,
  payout_status text not null default 'held' check (payout_status in ('held', 'released', 'disputed')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'completed', 'refunded', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_buyer_idx on public.transactions (buyer_id);
create index if not exists transactions_seller_idx on public.transactions (seller_id);

alter table public.transactions enable row level security;

create policy "Acheteur ou vendeur voit ses transactions"
  on public.transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Un acheteur cree sa propre transaction"
  on public.transactions for insert
  with check (auth.uid() = buyer_id);

-- Livres inclus dans une transaction (permet les lots)
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  price_at_purchase numeric(10,2) not null
);

create index if not exists transaction_items_transaction_idx on public.transaction_items (transaction_id);

alter table public.transaction_items enable row level security;

create policy "Participants de la transaction voient ses livres"
  on public.transaction_items for select
  using (
    exists (
      select 1 from public.transactions tx
      where tx.id = transaction_items.transaction_id
      and (tx.buyer_id = auth.uid() or tx.seller_id = auth.uid())
    )
  );

create policy "L'acheteur ajoute les livres de sa transaction"
  on public.transaction_items for insert
  with check (
    exists (
      select 1 from public.transactions tx
      where tx.id = transaction_items.transaction_id
      and tx.buyer_id = auth.uid()
    )
  );

-- Chat post-achat (coordination de rencontre), separe du chat de negociation
create table if not exists public.meetup_messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists meetup_messages_transaction_idx on public.meetup_messages (transaction_id, created_at);

alter table public.meetup_messages enable row level security;

create policy "Participants de la transaction voient les messages de rencontre"
  on public.meetup_messages for select
  using (
    exists (
      select 1 from public.transactions tx
      where tx.id = meetup_messages.transaction_id
      and (tx.buyer_id = auth.uid() or tx.seller_id = auth.uid())
    )
  );

create policy "Participants de la transaction envoient des messages de rencontre"
  on public.meetup_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.transactions tx
      where tx.id = meetup_messages.transaction_id
      and (tx.buyer_id = auth.uid() or tx.seller_id = auth.uid())
    )
  );
