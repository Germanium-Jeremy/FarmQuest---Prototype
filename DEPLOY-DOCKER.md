# Docker Deployment

FarmQuest runs as two containers: the Node.js API/WebSocket server and an Nginx client proxy. SQLite is stored in the `db-data` Docker volume.

## One-time server setup

The `deploy` account must have Docker and the Compose plugin available without `sudo`:

```bash
docker version
docker compose version
```

Clone the repository into a persistent directory, for example `/home/deploy/farmquest`, and create `/home/deploy/farmquest/.env`:

```dotenv
HOST_PORT=80
ALLOWED_ORIGINS=http://168.231.85.220
ADMIN_TOKEN=replace-with-a-long-random-value
EMAIL_PROVIDER=development
EMAIL_FROM=FarmQuest <rewards@example.com>
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
```

Use `EMAIL_PROVIDER=smtp` and real SMTP settings when reward email delivery is enabled. Keep `.env` only on the server; it is ignored by Git.

Start the first deployment:

```bash
cd /home/deploy/farmquest
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1/api/health
curl --fail http://127.0.0.1/admin | grep 'id="start-btn"'
```

If port 80 is already occupied, do not stop the existing service blindly. Set `HOST_PORT=8080` in `.env`, then restart:

```bash
docker compose down
docker compose up -d
curl --fail http://127.0.0.1:8080/api/health
curl --fail http://127.0.0.1:8080/admin | grep 'id="start-btn"'
```

The public reverse proxy on port 80 must then forward `/`, `/api/`, `/admin`, `/vendor`, and `/ws` to `127.0.0.1:8080`. The `/ws` location must preserve the WebSocket `Upgrade` and `Connection` headers. If port 80 is not needed by another service, remove `HOST_PORT` or set it back to `80` instead.

## GitHub Actions

The workflow in `.github/workflows/deploy.yml` builds on every push to `main`, then SSHes to the server, fetches `origin/main`, rebuilds the containers, and runs health checks.

Add these repository or production-environment secrets:

| Secret           | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| `DEPLOY_HOST`    | `168.231.85.220`                                        |
| `DEPLOY_PORT`    | `102`                                                   |
| `DEPLOY_USER`    | `deploy`                                                |
| `DEPLOY_PATH`    | `/home/deploy/farmquest`                                |
| `DEPLOY_SSH_KEY` | Private key whose public key is authorized for `deploy` |

The server checkout must have the repository remote configured and be able to fetch it with its deploy key or another non-interactive Git credential. GitHub Actions never receives `.env` or application credentials.

Before enabling automatic deploys, verify from an authorized machine:

```bash
ssh -p 102 deploy@168.231.85.220 'cd /home/deploy/farmquest && docker compose ps'
```

The current workspace cannot complete that live check until SSH authentication is configured; the host returned `Permission denied (publickey,password)`.
