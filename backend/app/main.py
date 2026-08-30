#
# Copyright (C) 2024-2025 EDUmind - Los Mundos Edufis
# Copyright (C) 2026 EduTicTac
# Author: Luis Vilela Acuña
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#

"""
EduTicTac Robotics API
Sistema de aprendizaje de programación para micro:bit y Nezha (simulador, editor y exportación)
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from pathlib import Path

from dotenv import load_dotenv

# The production service runs from backend/, while the private deployment
# environment lives at the repository root and is excluded from Git.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from .routers import chat, lessons, simulator, code, export, system, websocket
from .auth import (
    ANON_COOKIE_MAX_AGE,
    ANON_COOKIE_NAME,
    ensure_anon_id,
    router as auth_router,
    settings as auth_settings,
    user_from_request,
)
from .services import ollama_service, lesson_engine
from .services.metrics_service import metrics
from .simulator import simulator_manager
from .models.schemas import HealthResponse, ModelsListResponse, OllamaModel

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title="EduTicTac Robotics API",
    version="1.0.0",
    description="API para aprendizaje de robótica educativa (simulador, editor y exportación; micro:bit + Nezha)",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS - permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://robotics.edutictac.es"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication is enforced centrally so new API routers are protected by
# default. Operational probes and the transparency policy remain public.
PUBLIC_API_PATHS = {
    "/api/health",
    "/api/ready",
    "/api/system/policy",
}


@app.middleware("http")
async def require_application_session(request: Request, call_next):
    path = request.url.path.rstrip("/") or "/"
    is_public = path in PUBLIC_API_PATHS or path.startswith("/api/auth/")
    is_internal_metrics = (
        path in {"/api/metrics", "/api/metrics/prometheus"}
        and request.client is not None
        and request.client.host in {"127.0.0.1", "::1"}
    )
    if (
        auth_settings.enabled
        and path.startswith("/api/")
        and not is_public
        and not is_internal_metrics
        and user_from_request(request) is None
    ):
        response = JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"},
            headers={"Cache-Control": "no-store"},
        )
        metrics.record_request(path, response.status_code)
        return response

    # Sin Authentik no hay usuario autenticado que distinga a un alumno de
    # otro. Se asigna un id anónimo estable por navegador para que las
    # sesiones del simulador (ver `_owner_id` en routers/simulator.py) no
    # queden todas bajo el mismo id compartido.
    anon_cookie_value: str | None = None
    if not auth_settings.enabled and path.startswith("/api/") and not is_public:
        anon_id, anon_cookie_value = ensure_anon_id(request)
        request.state.anon_id = anon_id

    try:
        response = await call_next(request)
    except Exception:
        metrics.record_request(path, 500)
        raise

    if anon_cookie_value:
        response.set_cookie(
            ANON_COOKIE_NAME,
            anon_cookie_value,
            max_age=ANON_COOKIE_MAX_AGE,
            httponly=True,
            secure=auth_settings.secure_cookies,
            samesite="lax",
            path="/",
        )

    route = request.scope.get("route")
    endpoint = getattr(route, "path", path)
    metrics.record_request(endpoint, response.status_code)
    return response


# Registrar routers
app.include_router(auth_router)
app.include_router(chat.router)
app.include_router(lessons.router)
app.include_router(simulator.router)
app.include_router(code.router)
app.include_router(export.router)
app.include_router(system.router)
app.include_router(websocket.router)


# ==================== HEALTH & STATUS ENDPOINTS ====================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Endpoint de salud del sistema.
    La plataforma funciona sin IA: el simulador, el editor y la exportación
    son autónomos. No se consulta ningún servicio externo.
    """
    return HealthResponse(
        status="ok",
        ollama_available=False,
        models_available=[],
        version="1.0.0"
    )


@app.get("/api/ready")
async def readiness_check():
    """
    Readiness operativo para despliegue.
    El simulador, el editor y la exportación no dependen de ningún motor de IA.
    """
    return {
        "ready": True,
        "status": "ok",
        "capabilities": {
            "frontend_pwa": True,
            "simulator": True,
            "export": True,
            "local_ai": False,
            "privacy_first_policy": True,
        },
        "active_simulator_sessions": len(simulator_manager.sessions),
        "policy": {
            "mode": "local-first",
            "privacy": "privacy-first",
            "ai_enabled": False,
        },
        "version": "1.0.0",
    }


@app.get("/api/models", response_model=ModelsListResponse)
async def list_models():
    """Lista modelos de IA disponibles (sin IA: lista vacía)"""
    return ModelsListResponse(
        models=[],
        total=0
    )


@app.get("/api/metrics")
async def get_metrics():
    """Get application metrics."""
    return metrics.get_metrics()


@app.get("/api/metrics/prometheus")
async def get_prometheus_metrics():
    """Get Prometheus metrics."""
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(metrics.get_prometheus_metrics())



# ==================== STARTUP & SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    """Evento de inicio de la aplicación"""
    logger.info("🚀 Starting EduTicTac Robotics API...")

    # La plataforma funciona sin IA: no se arranca ni se espera ningún motor externo.

    # Cargar lecciones
    lessons_count = len(lesson_engine.get_all_lessons())
    challenges_count = len(lesson_engine.get_challenges())
    logger.info(f"📚 Loaded {lessons_count} lessons and {challenges_count} challenges")

    logger.info("✅ EduTicTac Robotics API is ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Evento de cierre de la aplicación"""
    logger.info("👋 Shutting down EduTicTac Robotics API...")
    logger.info("✅ Cleanup complete")


# Root endpoint
@app.get("/")
async def root():
    """Endpoint raíz con información de la API"""
    return {
        "name": "EduTicTac Robotics API",
        "version": "1.0.0",
        "description": "API para aprendizaje de robótica educativa (simulador, editor y exportación)",
        "docs": "/api/docs",
        "endpoints": {
            "health": "/api/health",
            "lessons": "/api/lessons",
            "simulator": "/api/simulator",
            "export": "/api/export",
            "policy": "/api/system/policy"
        }
    }
