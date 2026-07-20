-- Profils publics, un par utilisateur inscrit (1:1 avec auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  city text,
  province text,
  stripe_account_id text,
  stripe_payouts_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Tout le monde peut lire les profils (nom du vendeur affiché sur les annonces)
create policy "Les profils sont visibles par tous"
  on public.profiles for select
  using (true);

-- Chacun ne peut modifier que son propre profil
create policy "Un utilisateur modifie seulement son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Crée automatiquement une ligne "profiles" à chaque inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
