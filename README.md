# 24urenloop App

This project is a Next.js application backed by a PostgreSQL database.  
Everything runs in Docker, so you don’t need to install Postgres manually.

---

## Quick start with Docker

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed

---

### 1. Clone the repository
```bash
git clone <repo-url>
cd <repo-name>
```

### 2. Create your environment file
Copy the example and adjust if needed:

```bash
cp .env.example .env
```

Default content (works out of the box with Docker):

```ini
DATABASE_URL=postgres://app:app@db:5432/24urenloop
```

### 3. Start the containers
```bash
docker compose up -d --build
```

This runs:
- **db** → PostgreSQL 16
- **app** → Next.js dev server (hot reload)

### 4. Run Prisma migrations
```bash
docker compose exec app npx prisma migrate dev --name init
```

### 5. Seed the database (dummy data)
```bash
docker compose run --rm seed
```

### 6. Open the app
- On your machine: [http://localhost:3000](http://localhost:3000)
- On other devices in your LAN: `http://<your-computer-IP>:3000`
    - Find your IP with:
        - macOS/Linux → `ip addr`
        - Windows → `ipconfig`

---

## 🛠 Development Workflow

- **Start containers**
  ```bash
  docker compose up -d
  ```

- **Stop containers**
  ```bash
  docker compose down
  ```

- **View logs**
  ```bash
  docker compose logs -f app
  docker compose logs -f db
  ```

- **Reset the database (⚠ deletes data)**
  ```bash
  docker compose down -v
  docker compose up -d
  docker compose exec app npx prisma migrate dev
  docker compose run --rm seed
  ```

---

## 📊 Prisma Studio (database UI)

**Option A — run inside Docker**
```bash
docker compose exec app npx prisma studio --host 0.0.0.0 --port 5555
```

Expose the port in `docker-compose.yml`:
```yaml
ports:
  - "5555:5555"
```

Then open: [http://localhost:5555](http://localhost:5555)

**Option B — run locally**

Since we map Postgres to `localhost:5432`, you can run:
```bash
npx prisma studio
```

---

## Production (basic)

1. **Build the app:**
   ```bash
   docker compose exec app npm run build
   ```

2. **In `docker-compose.yml`, change the app command to:**
   ```yaml
   command: ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
   ```

3. **Restart:**
   ```bash
   docker compose up -d --build
   ```

---

## 📜 Useful commands

- **Run a one-off command in the app:**
  ```bash
  docker compose exec app <command>
  ```

- **Run Prisma migrations:**
  ```bash
  docker compose exec app npx prisma migrate dev
  ```

- **Run Python seeder:**
  ```bash
  docker compose run --rm seed
  ```
