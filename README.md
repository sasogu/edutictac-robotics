# EduTicTac Robotics Lab

Plataforma de robótica educativa: el alumnado programa y simula robots desde el navegador, sin necesidad de hardware. Backend en FastAPI, frontend en React y flujos de aprendizaje asistidos por IA que corre en local.

> Los modelos de IA se ejecutan en el servidor del centro, no en un servicio externo. Nada de lo que escribe el alumnado sale de ahí.

## Arrancar en local

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

Copia `.env.example` a `.env` y rellénalo. Los valores del ejemplo son marcadores: genera secretos nuevos para cualquier despliegue real.

## Pruebas

```bash
cd backend && pytest        # backend
cd frontend && npm run lint # frontend
```

## Colaborar

Se puede colaborar **sin programar**: contar cómo te ha ido en clase, reportar un fallo, revisar los textos o traducir. Todo el proyecto está en español. Empieza por [CONTRIBUTING.md](CONTRIBUTING.md) y el [código de conducta](CODE_OF_CONDUCT.md).

¿Un fallo de seguridad? No abras un issue público: ver [SECURITY.md](SECURITY.md).

Este repositorio es una *release saneada* para revisión y auditoría: no incluye secretos, configuración de despliegue ni datos de aula. Ver [OPEN_SOURCE_RELEASE.md](OPEN_SOURCE_RELEASE.md).

## Origen del proyecto

Este proyecto deriva de **EDUmind Robotics Lab**:
https://github.com/edumind-es/edumind-robotics

El código original se publicó bajo licencia doble **AGPL-3.0-or-later OR EUPL-1.2**. La marca EDUmind, sus logos y su identidad visual no forman parte de la licencia de software; este fork usa identidad propia de EduTicTac.

## Licencia

Licencia doble **AGPL-3.0-or-later** *o* **EUPL-1.2**, a elección de quien la reutilice. Ver [LICENSE](LICENSE) y [NOTICE](NOTICE).

El código es libre; las marcas, logotipos e identidades visuales se tratan por separado. Ver [TRADEMARKS.md](TRADEMARKS.md).
