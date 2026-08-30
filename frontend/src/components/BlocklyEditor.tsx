/*
 * Copyright (C) 2024-2025 EDUmind - Los Mundos Edufis
 * Copyright (C) 2026 EduTicTac
 * Author: Luis Vilela Acuña
 *
 * Editor de bloques (Blockly) que genera MicroPython para el simulador.
 * El catálogo de bloques reproduce el subconjunto de la API de micro:bit
 * que el simulador entiende (ver backend/app/simulator/code_executor.py).
 */

import { useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly'
import { pythonGenerator, Order } from 'blockly/python'
import './BlocklyEditor.css'

/* Bloque por defecto al abrir: un corazón parpadeando para siempre. */
const INITIAL_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="controls_whileUntil" x="20" y="20">
    <field name="MODE">WHILE</field>
    <value name="BOOL">
      <shadow type="logic_boolean"><field name="BOOL">TRUE</field></shadow>
    </value>
    <statement name="DO">
      <block type="mb_mostrar_imagen">
        <field name="IMG">HEART</field>
        <next>
          <block type="mb_pausa">
            <field name="MS">500</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>
`

/* Paleta de categorías del menú lateral. */
const TOOLBOX_XML = `
<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
  <category name="Inicio" colour="#4B9CD3">
    <block type="mb_mostrar_imagen"/>
    <block type="mb_mostrar_texto"/>
    <block type="mb_pausa"/>
    <block type="mb_limpiar"/>
  </category>
  <category name="Control" colour="#C70039">
    <block type="controls_whileUntil">
      <field name="MODE">WHILE</field>
      <value name="BOOL">
        <shadow type="logic_boolean"><field name="BOOL">TRUE</field></shadow>
      </value>
    </block>
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number"><field name="NUM">4</field></shadow>
      </value>
    </block>
    <block type="controls_if"/>
  </category>
  <category name="Botones" colour="#008000">
    <block type="mb_button_pressed"/>
  </category>
  <category name="Sensores" colour="#FF9800">
    <block type="mb_temperatura"/>
    <block type="mb_luz"/>
    <block type="mb_acc"/>
    <block type="mb_shake"/>
  </category>
  <category name="Lógica" colour="#2100C7">
    <block type="logic_compare"/>
    <block type="logic_operation"/>
    <block type="logic_boolean"/>
  </category>
  <category name="Matemáticas" colour="#6400C7">
    <block type="math_number"/>
    <block type="math_arithmetic"/>
    <block type="math_random_int">
      <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
      <value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
    </block>
  </category>
</xml>
`

const IMAGENES_MICROBIT = [
  ['corazón', 'HEART'],
  ['corazón pequeño', 'HEART_SMALL'],
  ['feliz', 'HAPPY'],
  ['triste', 'SAD'],
  ['sí', 'YES'],
  ['no', 'NO'],
  ['flecha arriba', 'ARROW_N'],
  ['flecha abajo', 'ARROW_S'],
  ['flecha derecha', 'ARROW_E'],
  ['flecha izquierda', 'ARROW_W'],
  ['diana', 'TARGET'],
  ['cuadrado', 'SQUARE'],
  ['rombo pequeño', 'DIAMOND_SMALL'],
]

const MICROBIT_BLOCKS = [
  {
    type: 'mb_mostrar_imagen',
    message0: 'mostrar imagen %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'IMG',
        options: IMAGENES_MICROBIT,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: 'Muestra una imagen en la matriz de LEDs',
  },
  {
    type: 'mb_mostrar_texto',
    message0: 'mostrar texto %1',
    args0: [{ type: 'field_input', name: 'TXT', text: 'hola' }],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: 'Desplaza un texto por la pantalla',
  },
  {
    type: 'mb_pausa',
    message0: 'pausa %1 milisegundos',
    args0: [{ type: 'field_number', name: 'MS', value: 1000, min: 0 }],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: 'Espera el tiempo indicado',
  },
  {
    type: 'mb_limpiar',
    message0: 'limpiar pantalla',
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: 'Apaga todos los LEDs',
  },
  {
    type: 'mb_button_pressed',
    message0: '¿botón %1 pulsado?',
    args0: [
      {
        type: 'field_dropdown',
        name: 'BTN',
        options: [['A', 'A'], ['B', 'B']],
      },
    ],
    output: 'Boolean',
    colour: 40,
    tooltip: 'Comprueba si se está pulsando un botón',
  },
  {
    type: 'mb_temperatura',
    message0: 'temperatura (°C)',
    output: 'Number',
    colour: 330,
    tooltip: 'Temperatura en grados centígrados',
  },
  {
    type: 'mb_luz',
    message0: 'nivel de luz',
    output: 'Number',
    colour: 330,
    tooltip: 'Luz que recibe la pantalla (0-255)',
  },
  {
    type: 'mb_acc',
    message0: 'acelerómetro eje %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'AXIS',
        options: [['X', 'X'], ['Y', 'Y'], ['Z', 'Z']],
      },
    ],
    output: 'Number',
    colour: 330,
    tooltip: 'Aceleración en un eje (mg)',
  },
  {
    type: 'mb_shake',
    message0: '¿se ha agitado?',
    output: 'Boolean',
    colour: 330,
    tooltip: 'Verdadero si se agita el micro:bit',
  },
] as Blockly.JsonBlockDefinition[]

Blockly.common.defineBlocksWithJsonArray(MICROBIT_BLOCKS)

/* Generadores Python: cada bloque del catálogo se traduce al subconjunto
   de MicroPython que el simulador ejecuta. */
pythonGenerator.forBlock['mb_mostrar_imagen'] = (block: Blockly.Block) => {
  const img = block.getFieldValue('IMG')
  return `display.show(Image.${img})\n`
}

pythonGenerator.forBlock['mb_mostrar_texto'] = (block: Blockly.Block) => {
  const txt = block.getFieldValue('TXT')
  return `display.scroll(${JSON.stringify(txt)})\n`
}

pythonGenerator.forBlock['mb_pausa'] = (block: Blockly.Block) => {
  const ms = block.getFieldValue('MS')
  return `sleep(${ms})\n`
}

pythonGenerator.forBlock['mb_limpiar'] = () => `display.clear()\n`

pythonGenerator.forBlock['mb_button_pressed'] = (block: Blockly.Block) => {
  const btn = String(block.getFieldValue('BTN')).toLowerCase()
  return [`button_${btn}.is_pressed()`, Order.ATOMIC]
}

pythonGenerator.forBlock['mb_temperatura'] = () => ['temperature()', Order.ATOMIC]

pythonGenerator.forBlock['mb_luz'] = () => ['display.read_light_level()', Order.ATOMIC]

pythonGenerator.forBlock['mb_acc'] = (block: Blockly.Block) => {
  const axis = String(block.getFieldValue('AXIS')).toLowerCase()
  return [`accelerometer.get_${axis}()`, Order.ATOMIC]
}

pythonGenerator.forBlock['mb_shake'] = () => [
  'accelerometer.was_gesture("shake")',
  Order.ATOMIC,
]

function buildCode(workspace: Blockly.Workspace): string {
  const body = pythonGenerator.workspaceToCode(workspace).replace(/\s+$/, '')
  return body ? `from microbit import *\n\n${body}\n` : ''
}

interface BlocklyEditorProps {
  onExecute: (code: string) => void
  isExecuting: boolean
  onCodeChange?: (code: string) => void
}

function BlocklyEditor({ onExecute, isExecuting, onCodeChange }: BlocklyEditorProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.Workspace | null>(null)
  const onCodeChangeRef = useRef(onCodeChange)
  onCodeChangeRef.current = onCodeChange

  const [showCode, setShowCode] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

  useEffect(() => {
    const container = divRef.current
    if (!container) return

    const workspace = Blockly.inject(container, {
      toolbox: TOOLBOX_XML,
      renderer: 'zelos',
      trashcan: true,
      grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.25, minScale: 0.5 },
      move: { scrollbars: true, drag: true, wheel: true },
    })
    workspaceRef.current = workspace

    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(INITIAL_XML), workspace)

    const regenerate = () => {
      const code = buildCode(workspace)
      setGeneratedCode(code)
      onCodeChangeRef.current?.(code)
    }
    workspace.addChangeListener(regenerate)
    regenerate()

    return () => workspace.dispose()
  }, [])

  const handleExecute = () => {
    const ws = workspaceRef.current
    if (!ws || isExecuting) return
    const code = buildCode(ws)
    if (code.trim()) {
      onExecute(code)
    }
  }

  const handleClear = () => {
    workspaceRef.current?.clear()
  }

  const handleExample = () => {
    const ws = workspaceRef.current
    if (!ws) return
    ws.clear()
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(INITIAL_XML), ws)
  }

  return (
    <div className="blockly-editor">
      <div className="blockly-editor__header">
        <div className="blockly-editor__badge">Bloques</div>
        <h3>Editor de bloques</h3>
        <div className="blockly-editor__actions">
          <button
            className={`edm-button edm-button--ghost ${showCode ? 'active' : ''}`}
            type="button"
            onClick={() => setShowCode(!showCode)}
          >
            👁 Ver código
          </button>
          <button
            className="edm-button edm-button--ghost"
            type="button"
            onClick={handleExample}
          >
            🔄 Ejemplo
          </button>
          <button
            className="edm-button edm-button--ghost"
            type="button"
            onClick={handleClear}
          >
            🗑️ Vaciar
          </button>
          <button
            className="edm-button edm-button--primary"
            type="button"
            data-testid="execute-code"
            onClick={handleExecute}
            disabled={isExecuting || !generatedCode}
          >
            {isExecuting ? '▶ Ejecutando...' : '▶ Ejecutar código'}
          </button>
        </div>
      </div>

      <div className="blockly-editor__workspace" ref={divRef} />

      {showCode && (
        <pre className="blockly-editor__code" aria-live="polite">
          {generatedCode || '# Construye bloques para ver el código que generan'}
        </pre>
      )}
    </div>
  )
}

export default BlocklyEditor
