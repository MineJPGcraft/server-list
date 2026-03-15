import pg from "pg";
export const db=new pg.Pool({
    user: process.env.DB_USER||'postgres',
    password: process.env.DB_PASSWORD||'password',
    host: process.env.DB_HOST||'localhost',
    port: process.env.DB_PORT||'5432',
    database: process.env.DB_NAME||'serverlist',
    max:20
});
export async function dbinit()
{
    await db.query(`CREATE TABLE IF NOT EXISTS server (
    uuid UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    version text NOT NULL,
    icon text NOT NULL,
    description text NOT NULL,
    link text NOT NULL,
    IP text
);`);
    await db.query(`CREATE TABLE IF NOT EXISTS session (
    uuid UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    userid text NOT NULL,
    perm integer NOT NULL
);`);
    await db.query(`CREATE TABLE IF NOT EXISTS oidc (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    secret text NOT NULL,
    perm integer,
    frontend text,
    redirect_uri text NOT NULL,
    apipoint text NOT NULL,
    auth_url text NOT NULL
);`);
    await db.query(`CREATE TABLE IF NOT EXISTS users (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    perm integer NOT NULL DEFAULT 1,
    nowpd integer NOT NULL DEFAULT 0,
    alpd integer NOT NULL DEFAULT 0
);`);
}