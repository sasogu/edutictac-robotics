import { expect, test } from '@playwright/test'
import { mockEdutictacApi } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockEdutictacApi(page)
})

test('PWA: la aplicacion vuelve a cargar offline despues de una primera visita online', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'networkidle' })

  await expect(page.getByRole('heading', { name: 'EduTicTac Robotics Lab' })).toBeVisible()
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service worker no disponible en este navegador')
    }

    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
      })
    }
  })

  await page.reload({ waitUntil: 'networkidle' })
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'EduTicTac Robotics Lab' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Abrir Laboratorio/ })).toBeVisible()

  await context.setOffline(false)
})
