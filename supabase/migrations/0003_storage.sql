insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Photos d'annonces visibles par tous"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "Un utilisateur televerse dans son propre dossier"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Un utilisateur supprime seulement ses propres photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
