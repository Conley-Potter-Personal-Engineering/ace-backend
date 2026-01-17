# Supabase migrations naming conventions

* Use today's date as the first 8 numerical digits in the filename: YYYYMMDD
* If you can't tell today's date for certain, try incrementing the date from the previously most recent file by one
* The following two numerical digits in the filename should start at 01 and increment by 1, up to 99
* Then use a descriptive title for the migration filename with snake_case

## Example
`2026011701_add_artifacts_table.sql`
`2026011702_create_publisher_enum.sql`

## Why this matters

Supabase applies migrations in lexicographic order. The date prefix ensures chronological ordering, and the sequence number handles multiple migrations on the same day.