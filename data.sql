CREATE TABLE companies (
  handle TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  num_employees INTEGER,
  description TEXT,
  logo_url TEXT
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  salary FLOAT NOT NULL,
  equity FLOAT NOT NULL CONSTRAINT invalid_equity check (equity <= 1 AND equity >= 0),
  company_handle TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
  date_posted TIMESTAMP DEFAUlT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  photo_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
)

{
  username: "john smith",
  password: "password",
  first_name: "john",
  last_name: "smith",
  email: "example@example.com",
  photo_url: "http://www.example.com",
  is_admin: false
}