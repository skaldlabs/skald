  # Dump in custom format
  pg_dump -d old_database --data-only --format=custom -f data.dump

  # Restore with disable-triggers
  pg_restore -d new_database --disable-triggers data.dump



  pg_dump --schema-only --no-owner --no-privileges -d skald2 > old.sql
  pg_dump --schema-only --no-owner --no-privileges -d foobar > new.sql

  claudinho: compare old.sql and new.sql for me and tell me the differences based on the tables in
new.sql. i dont care about tables that dont exist in new.sql but exist in old.sql