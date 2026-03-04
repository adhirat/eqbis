-- Change users table to include is_verified column
ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;
