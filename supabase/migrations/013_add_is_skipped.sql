-- Allow individual dose cells to be skipped (toggled off)
ALTER TABLE cycle_cells ADD COLUMN is_skipped BOOLEAN NOT NULL DEFAULT FALSE;
