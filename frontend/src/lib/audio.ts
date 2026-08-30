/*
 * Copyright (C) 2026 EduTicTac
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Reproducción de audio para los bloques music.play()/music.pitch() del
 * simulador. El backend solo registra un log de texto (no puede tocar
 * sonido en el servidor); aquí lo convertimos en sonido real vía Web Audio.
 */

type Note = readonly [frequency: number, durationMs: number]

const N = {
  C3: 130.81, Eb3: 155.56, G3: 196.0, Ab3: 207.65,
  C4: 261.63, D4: 293.66, E4: 329.63, Eb4: 311.13, F4: 349.23,
  Gb4: 369.99, G4: 392.0, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25,
} as const

const TUNES: Record<string, Note[]> = {
  BADDY: [[N.G3, 180], [N.Ab3, 180], [N.G3, 180], [N.Ab3, 260]],
  BIRTHDAY: [[N.G4, 200], [N.G4, 200], [N.A4, 400], [N.G4, 400], [N.C5, 400], [N.B4, 700]],
  BLUES: [[N.C4, 150], [N.Eb4, 150], [N.F4, 150], [N.Gb4, 150], [N.G4, 150], [N.Bb4, 300]],
  CHASE: [[N.C4, 100], [N.G4, 100], [N.C4, 100], [N.G4, 100], [N.C5, 150], [N.G4, 150]],
  ENTERTAINER: [[N.E4, 150], [N.C4, 150], [N.D4, 150], [N.G3, 150], [N.C4, 300]],
  FUNERAL: [[N.C4, 400], [N.C4, 400], [N.C4, 400], [N.G3, 500], [N.Ab3, 500], [N.G3, 700]],
  FUNK: [[N.C3, 150], [N.C3, 100], [N.Eb3, 150], [N.C3, 300]],
  JUMP_UP: [[N.C4, 100], [N.E4, 100], [N.G4, 100], [N.C5, 200]],
  JUMP_DOWN: [[N.C5, 100], [N.G4, 100], [N.E4, 100], [N.C4, 200]],
  NYAN: [[N.C5, 100], [N.D5, 100], [N.E5, 100], [N.D5, 100], [N.C5, 100], [N.D5, 200]],
  POWER_UP: [[N.C4, 100], [N.E4, 100], [N.G4, 100], [N.C5, 100], [N.E5, 250]],
  POWER_DOWN: [[N.E5, 100], [N.C5, 100], [N.G4, 100], [N.E4, 100], [N.C4, 250]],
  PYTHON: [[N.C4, 120], [N.E4, 120], [N.G4, 120], [N.C5, 120], [N.G4, 120], [N.E4, 200]],
  RINGTONE: [[N.E5, 150], [N.C5, 150], [N.E5, 150], [N.C5, 300]],
  WAWAWAWAA: [[N.G4, 250], [N.Gb4, 250], [N.F4, 250], [N.E4, 450]],
  WEDDING: [[N.C4, 300], [N.F4, 300], [N.F4, 300], [N.F4, 500], [N.C4, 300], [N.F4, 300], [N.G4, 300], [N.F4, 500]],
}

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

let sharedContext: AudioContext | null = null

function getContext(): AudioContext | null {
  const Ctor = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext
  if (!Ctor) return null
  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new Ctor()
  }
  if (sharedContext.state === 'suspended') {
    sharedContext.resume().catch(() => {})
  }
  return sharedContext
}

function scheduleNote(context: AudioContext, frequency: number, startAt: number, durationMs: number): void {
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  oscillator.type = 'square'
  oscillator.frequency.setValueAtTime(Math.max(frequency, 1), startAt)
  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  const durationSec = Math.max(durationMs, 30) / 1000
  gainNode.gain.setValueAtTime(0.2, startAt)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + durationSec)

  oscillator.start(startAt)
  oscillator.stop(startAt + durationSec)
}

export function playTune(name: string): void {
  const context = getContext()
  const notes = TUNES[name]
  if (!context || !notes) return

  let cursor = context.currentTime
  for (const [frequency, durationMs] of notes) {
    scheduleNote(context, frequency, cursor, durationMs)
    cursor += durationMs / 1000
  }
}

export function playPitch(frequency: number, durationMs: number): void {
  const context = getContext()
  if (!context) return
  scheduleNote(context, frequency, context.currentTime, durationMs)
}

/**
 * Recorre el log de ejecución y reproduce las llamadas a music.play()/pitch()
 * encontradas. Limitado a las primeras entradas para no saturar el audio si
 * el código las genera dentro de un bucle largo.
 */
export function playMusicFromLog(outputLog: string[]): void {
  const MAX_EVENTS = 20
  let played = 0

  for (const line of outputLog) {
    if (played >= MAX_EVENTS) break

    // El backend antepone una marca de tiempo a cada entrada del log
    // ("[1735599999.123] music.play(BIRTHDAY)"), así que hay que quitarla
    // antes de comparar con el mensaje exacto.
    const message = line.replace(/^\[[^\]]*\]\s*/, '')

    const playMatch = message.match(/^music\.play\((\w+)\)$/)
    if (playMatch) {
      playTune(playMatch[1])
      played += 1
      continue
    }

    const pitchMatch = message.match(/^music\.pitch\((-?\d+), (-?\d+)\)$/)
    if (pitchMatch) {
      const frequency = Number(pitchMatch[1])
      const duration = Number(pitchMatch[2])
      playPitch(frequency, duration > 0 ? duration : 500)
      played += 1
    }
  }
}
