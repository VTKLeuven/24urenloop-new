### Installation:
Prerequisits: 
- Next.js
- Node.js
- npm
- postgresql
- psycopg2, dotenv (python packages)

1. Clone the repository
2. Run `npm install` in the root directory
3. Set up postgresql database:
```
psql -d postgres
DROP DATABASE IF EXISTS "24urenloop";
DROP USER IF EXISTS <username>;
CREATE USER <username> WITH PASSWORD '<password>' CREATEDB;
CREATE DATABASE "24urenloop" OWNER <username>;
GRANT ALL ON SCHEMA public TO <username>;
ALTER SCHEMA public OWNER TO <username>;
```
4. Create a .env file with the correct database credentials:
```
DATABASE_URL=postgres://<username>:<password>@localhost:5432/24urenloop
```
5. Run `npx prisma migrate dev --name init` to create the database tables
6. Run `python3 initialize_db.py` to fill the database with the necessary dummy data
7. Run `npm run dev` to start the development server
8. Go to `localhost:3000` in your browser


### To open the database in a visual interface: run `npx prisma studio` in the root directory