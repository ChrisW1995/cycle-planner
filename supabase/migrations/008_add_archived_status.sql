-- Allow 'Archived' as a valid cycle status
ALTER TABLE cycles DROP CONSTRAINT cycles_status_check;
ALTER TABLE cycles ADD CONSTRAINT cycles_status_check
  CHECK (status IN ('Scheduled', 'Planned', 'Completed', 'Archived'));
