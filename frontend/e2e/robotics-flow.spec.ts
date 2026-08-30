import { expect, test } from '@playwright/test'
import { mockEdutictacApi } from './fixtures'

test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await mockEdutictacApi(page)
})

test('flujo alumno: carga un ejemplo y lo ejecuta en el simulador', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'EduTicTac Robotics Lab' })).toBeVisible()
  await page.getByRole('button', { name: /Abrir Laboratorio/ }).click()

  await page.getByRole('button', { name: /Ejemplos/ }).click()
  await expect(page.getByText('Corazon E2E')).toBeVisible()
  await page.getByText('Corazon E2E').click()
  await page.getByRole('button', { name: /Usar este código/ }).click()

  await page.getByTestId('execute-code').click()

  await expect(page.getByTestId('led-2-2')).toHaveCSS('background-color', 'rgb(255, 51, 51)')
  await expect(page.getByTestId('led-2-2')).toHaveCSS('opacity', '1')
})

test('flujo bloques: el modo Bloques genera codigo y lo ejecuta en el simulador', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Abrir Laboratorio/ }).click()

  await page.getByRole('button', { name: /🧩 Bloques/ }).click()

  /* El lienzo abre con el ejemplo por defecto (corazón en bucle). */
  await page.getByTestId('execute-code').click()

  await expect(page.getByTestId('led-2-2')).toHaveCSS('background-color', 'rgb(255, 51, 51)')
  await expect(page.getByTestId('led-2-2')).toHaveCSS('opacity', '1')
})

test('flujo docente: carga ejemplo, guarda proyecto local y exporta paquete para hardware real', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Abrir Laboratorio/ }).click()

  await page.getByRole('button', { name: /Ejemplos/ }).click()
  await expect(page.getByText('Corazon E2E')).toBeVisible()
  await page.getByText('Corazon E2E').click()
  await page.getByRole('button', { name: /Usar este código/ }).click()

  await page.getByRole('button', { name: 'Proyectos' }).click()
  await page.getByRole('button', { name: /Guardar proyecto actual/ }).click()
  await page.getByPlaceholder(/Nombre del proyecto/).fill('Sesion microbit Nezha')
  await page.locator('.save-modal').getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Sesion microbit Nezha')).toBeVisible()
  await page.getByRole('button', { name: 'Proyectos' }).click()

  await page.getByRole('button', { name: /Exportar/ }).click()
  await page.getByLabel('Hardware objetivo').selectOption('nezha')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Paquete hardware real/ }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('e2e_hardware_bundle.zip')
})
