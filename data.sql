CREATE TABLE companies (
  handler text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  num_employees integer,
  description text,
  logo_url text
)

