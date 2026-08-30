# Deployment

Production target assumed for EduTicTac:

- Public URL: `https://robotics.edutictac.es`
- Frontend: static Vite build served by Nginx
- Backend: FastAPI running locally behind `/api`
- AI: local Ollama on `http://localhost:11434`

## Build

Frontend:

```bash
cd frontend
npm install
npm run build
```

Backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

## Backend environment

Create `backend/.env` from `backend/.env.example` and generate fresh secrets.
Do not reuse values from another deployment.

If Authentik is not ready yet, set:

```env
AUTHENTIK_ENABLED=false
APP_BASE_URL=https://robotics.edutictac.es
SESSION_COOKIE_NAME=edutictac_robotics_session
```

When Authentik is ready, configure the issuer and client values for the
EduTicTac application and set `AUTHENTIK_ENABLED=true`.

## Systemd service example

```ini
[Unit]
Description=EduTicTac Robotics API
After=network.target

[Service]
WorkingDirectory=/var/www/edutictac-robotics/backend
EnvironmentFile=/var/www/edutictac-robotics/backend/.env
ExecStart=/var/www/edutictac-robotics/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8002
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Nginx site example

```nginx
server {
    server_name robotics.edutictac.es;

    root /var/www/edutictac-robotics/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8002/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Add TLS with the certificate management already used on the VPS.
