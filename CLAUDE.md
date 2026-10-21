# Project rules

## Supabase: grant API access on every new table

Starting October 30, 2026, Supabase no longer auto-grants API access to new tables in the `public` schema. Whenever you write SQL that creates a new table, add these grants immediately after the `CREATE TABLE` statement:

```sql
grant select on public.TABLE to anon;
grant select, insert, update, delete on public.TABLE to authenticated;
grant select, insert, update, delete on public.TABLE to service_role;
```

- Omit the `anon` line if the table should never be reachable by logged-out users.
- RLS still controls row access as before; these grants only expose the table to the API roles.
