-- The owner/admin field guard only applies to requests made through the API
-- (signed-out visitors and signed-in users). Edits from the Supabase dashboard,
-- SQL editor or a server using the service role key carry no such role and
-- aren't blocked.
create or replace function private.guard_gym_update()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') in ('anon', 'authenticated') and not public.is_admin() then
    if (new.id, new.name, new.area, new.address, new.type, new.tier, new.goals_primary, new.goals_secondary,
        new.access, new.coached, new.recovery, new.community, new.source, new.verified, new.published, new.owner_id)
       is distinct from
       (old.id, old.name, old.area, old.address, old.type, old.tier, old.goals_primary, old.goals_secondary,
        old.access, old.coached, old.recovery, old.community, old.source, old.verified, old.published, old.owner_id)
    then
      raise exception 'Only admins can change this field' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
