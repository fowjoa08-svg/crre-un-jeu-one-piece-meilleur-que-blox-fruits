CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (lower(username));

CREATE TABLE IF NOT EXISTS saves (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
