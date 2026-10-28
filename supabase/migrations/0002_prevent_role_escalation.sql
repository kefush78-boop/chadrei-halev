-- מונע ממשתמש/ת לשנות את התפקיד (role) של עצמו/ה דרך policy ה-self-update.
create or replace function prevent_role_escalation() returns trigger
language plpgsql security definer as $$
begin
  if new.role <> old.role and app_role() <> 'admin' then
    raise exception 'רק מנהלת המרכז יכולה לשנות תפקידים';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
before update on profiles
for each row execute function prevent_role_escalation();
