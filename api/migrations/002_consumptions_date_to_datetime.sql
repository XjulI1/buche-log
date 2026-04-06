-- Migration 002: Change consumptions.date from DATE to DATETIME
-- This preserves the time of entry, not just the date

USE buche_log;

ALTER TABLE consumptions
  MODIFY COLUMN date DATETIME NOT NULL;
