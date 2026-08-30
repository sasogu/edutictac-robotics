/*
 * Copyright (C) 2024-2025 EDUmind - Los Mundos Edufis
 * Copyright (C) 2026 EduTicTac
 * Author: Luis Vilela Acuña
 */

import { Suspense, lazy, useEffect, useState } from 'react'
import './App.css'
import MicrobitDisplay from './components/MicrobitDisplay'

import SensorPanel from './components/SensorPanel'
/* Las gráficas existían sin usarse: muestran cómo evoluciona cada sensor en
   el tiempo, que es justo lo que hace falta para entender un sensor. */
import SensorGraphs from './components/SensorGraphs'
import ExamplesPanel from './components/ExamplesPanel'
import ExportPanel from './components/ExportPanel'
import ProjectsPanel from './components/ProjectsPanel'
import EduTicTacFooter from './components/EduTicTacFooter'
import NavBar from './components/NavBar'
import { useEinkMode } from './hooks/useEinkMode'
import { useAppStore } from './store/useAppStore'
import { checkAuth, loginUrl, type AuthState } from './lib/auth'

/*
 * El editor arrastra Monaco: 334 kB que la portada no necesita para nada.
 * Los bloques (Blockly) también se cargan solo dentro del laboratorio.
 */
const CodeEditor = lazy(() => import('./components/CodeEditor'))
const BlocklyEditor = lazy(() => import('./components/BlocklyEditor'))

/* Mensaje mientras llega el trozo de código de la vista. */
const Cargando = () => (
  <main className="edm-app" aria-live="polite">
    <div className="edm-container">
      <p className="edm-kicker">Cargando…</p>
    </div>
  </main>
)


type View = 'home' | 'lab'

function App() {
  const [view, setView] = useState<View>('home')
  const [externalCode, setExternalCode] = useState<string>()
  const [currentCode, setCurrentCode] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showSensors, setShowSensors] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [editorMode, setEditorMode] = useState<'bloques' | 'codigo'>('codigo')
  const [blockCode, setBlockCode] = useState('')
  const [blocksNotice, setBlocksNotice] = useState('')
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' })

  /* Inicializar e-ink desde localStorage en el arranque */
  useEinkMode()

  const {
    isSessionReady,
    simulatorState,
    isExecuting,
    initSession,
    executeCode,
    pressButton,
    releaseButton,
    updateSensor,
  } = useAppStore()

  const handleInsertCode = (code: string) => {
    setExternalCode(code)
    setCurrentCode(code)
    setTimeout(() => setExternalCode(undefined), 100)
  }

  const handleCodeChange = (code: string) => {
    setCurrentCode(code)
  }

  useEffect(() => {
    checkAuth().then(setAuth)
  }, [])

  useEffect(() => {
    if (view === 'lab' && !isSessionReady) {
      initSession()
    }
  }, [view, isSessionReady, initSession, auth.status])

  /* Un ejemplo/proyecto es código: si se inserta con el modo Bloques activo,
     no se puede materializar en bloques. Se avisa y se deja listo para el
     modo Código. */
  useEffect(() => {
    if (externalCode && editorMode === 'bloques') {
      setBlocksNotice('Este ejemplo o proyecto es código: cambia a Código para verlo.')
    }
    if (editorMode === 'codigo') {
      setBlocksNotice('')
    }
  }, [externalCode, editorMode])

  if (auth.status === 'checking') {
    return (
      <main className="auth-gate" aria-live="polite">
        <div className="auth-gate__card">
          <p className="edm-kicker">EduTicTac Robotics</p>
          <h1>Comprobando sesión segura</h1>
          <p>Conectando con la identidad EduTicTac.</p>
        </div>
      </main>
    )
  }

  if (auth.status === 'anonymous') {
    return (
      <main className="auth-gate">
        <div className="auth-gate__card">
          <p className="edm-kicker">Laboratorio educativo protegido</p>
          <h1>EduTicTac Robotics Lab</h1>
          <p>
            Inicia sesión directamente con EduTicTac para acceder al simulador,
            al editor y a las herramientas de exportación.
          </p>
          {new URLSearchParams(window.location.search).has('auth_error') && (
            <p className="auth-gate__error">No se pudo completar el acceso. Inténtalo de nuevo.</p>
          )}
          <a className="edm-button auth-gate__button" href={loginUrl()}>
            Entrar con EduTicTac
          </a>
        </div>
      </main>
    )
  }

  return (
    <>
      <NavBar
        currentView={view}
        onNavigate={(v) => setView(v)}
        user={'user' in auth ? auth.user : null}
      />

      {view === 'home' && (
        <main className="edm-app">
          <div className="edm-container">
            <header className="edm-hero">
              <p className="edm-kicker">Laboratorio virtual · NEZHA + micro:bit + Makey Makey</p>
              <h1>EduTicTac Robotics Lab</h1>
              <p className="edm-subtitle">
                Aprende a programar robots desde el navegador, sin necesidad de hardware
              </p>
              <div className="edm-hero-actions">
                <button className="edm-button" type="button" onClick={() => setView('lab')}>
                  🔬 Abrir Laboratorio
                </button>
              </div>
            </header>

            <section className="edm-grid" aria-label="Características">
              <article className="edm-card edm-card--cyan">
                <div className="edm-card__badge">Simulador</div>
                <h3>Laboratorio virtual</h3>
                <p>
                  Experimenta con micro:bit sin hardware físico. Matriz LED interactiva,
                  botones, sensores y control de Nezha en tiempo real.
                </p>
              </article>

              <article className="edm-card edm-card--lime">
                <div className="edm-card__badge">Editor</div>
                <h3>Código MicroPython</h3>
                <p>
                  Escribe y ejecuta código Python instantáneamente. Visualiza resultados
                  en el simulador y experimenta sin límites.
                </p>
              </article>

              <article className="edm-card edm-card--pink">
                <div className="edm-card__badge">Nuevo</div>
                <h3>📚 Biblioteca de ejemplos</h3>
                <p>
                  15+ plantillas de código para micro:bit, Nezha y Makey Makey.
                  Aprende con ejemplos comentados en español.
                </p>
              </article>

              <article className="edm-card edm-card--cyan">
                <div className="edm-card__badge">Nuevo</div>
                <h3>📤 Exportar a hardware</h3>
                <p>
                  Exporta tu código a .py o paquete ZIP listo para cargar en
                  micro:bit, Nezha o Makey Makey real.
                </p>
              </article>
            </section>
          </div>
          <EduTicTacFooter
            appName="EduTicTac Robotics"
            version="1.0.0"
            hideNavigation={true}
          />
        </main>
      )}

      {view === 'lab' && (
        <Suspense fallback={<Cargando />}>
        <main className="edm-app lab-view">
          <div className="lab-container">
            <header className="lab-header">
              <div className="lab-title">
                <h1>EduTicTac Robotics Lab</h1>
                <p className="edm-kicker">Laboratorio Virtual</p>
              </div>
              <div className="lab-header-actions">
                <span className="editor-mode-toggle" role="group" aria-label="Modo de edición">
                  <button
                    className={`edm-button--small ${editorMode === 'bloques' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setEditorMode('bloques')}
                  >
                    🧩 Bloques
                  </button>
                  <button
                    className={`edm-button--small ${editorMode === 'codigo' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setEditorMode('codigo')}
                  >
                    ⌨️ Código
                  </button>
                </span>
                <button
                  className={`edm-button--small ${showProjects ? 'active' : ''}`}
                  type="button"
                  onClick={() => setShowProjects(!showProjects)}
                >
                  📁 Proyectos
                </button>
                <button
                  className={`edm-button--small ${showExamples ? 'active' : ''}`}
                  type="button"
                  onClick={() => setShowExamples(!showExamples)}
                >
                  📚 Ejemplos
                </button>
                <button
                  className={`edm-button--small ${showSensors ? 'active' : ''}`}
                  type="button"
                  onClick={() => setShowSensors(!showSensors)}
                >
                  🎛️ Sensores
                </button>
                <button
                  className={`edm-button--small ${showExport ? 'active' : ''}`}
                  type="button"
                  onClick={() => setShowExport(!showExport)}
                >
                  📤 Exportar
                </button>
              </div>
            </header>

            <div className="lab-layout">
              <div className="lab-main">
                <div className="lab-section">
                  <MicrobitDisplay
                    grid={simulatorState.display.grid}
                    buttons={simulatorState.buttons}
                    onButtonPress={pressButton}
                    onButtonRelease={releaseButton}
                  />
                </div>

                <div className="lab-section">
                  {blocksNotice && (
                    <p className="blocks-notice" role="status">
                      {blocksNotice}
                    </p>
                  )}
                  {editorMode === 'bloques' ? (
                    <BlocklyEditor
                      onExecute={executeCode}
                      isExecuting={isExecuting}
                      onCodeChange={(code) => {
                        setBlockCode(code)
                        setCurrentCode(code)
                      }}
                    />
                  ) : (
                    <CodeEditor
                      onExecute={executeCode}
                      isExecuting={isExecuting}
                      externalCode={externalCode || blockCode || undefined}
                      onCodeChange={handleCodeChange}
                    />
                  )}
                </div>

                {showSensors && (
                  <div className="lab-section">
                    <SensorPanel
                      sensors={simulatorState.sensors}
                      onUpdateSensor={updateSensor}
                    />
                    <SensorGraphs sensors={simulatorState.sensors} />
                  </div>
                )}
              </div>

              <div className="lab-sidebar">
                {showProjects && (
                  <div className="lab-panel-overlay">
                    <ProjectsPanel
                      currentCode={currentCode}
                      onLoadProject={handleInsertCode}
                      onClose={() => setShowProjects(false)}
                    />
                  </div>
                )}

                {showExamples && (
                  <div className="lab-panel-overlay">
                    <ExamplesPanel
                      onSelectExample={handleInsertCode}
                      onClose={() => setShowExamples(false)}
                    />
                  </div>
                )}

                {showExport && (
                  <div className="lab-panel-overlay">
                    <ExportPanel
                      code={currentCode}
                      onClose={() => setShowExport(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        </Suspense>
      )}
    </>
  )
}

export default App
