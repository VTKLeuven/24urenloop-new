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
git clone https://github.com/VTKLeuven/24urenloop-new.git
cd 24urenloop-new
```

### 2. Build the containers
```bash
docker compose up -d --build
```

This runs:
- **db** → PostgreSQL 16
- **app** → Next.js dev server (hot reload)

### 3. Open the app
- On your machine: [http://localhost:3000](http://localhost:3000)
- On other devices in your LAN: `http://<your-computer-IP>:3000`
    - Find your IP with:
        - macOS/Linux → `ip addr`
        - Windows → `ipconfig`

### 4. Open Prisma Studio
```
http://localhost:5555
```

---

## Development Workflow

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

## Useful commands

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
