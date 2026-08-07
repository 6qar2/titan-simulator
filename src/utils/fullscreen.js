export async function requestFullscreen() {
  const candidates = [
    () => document.documentElement,
    () => document.body,
    () => document.getElementById('root'),
  ]

  for (const getEl of candidates) {
    const el = getEl()
    if (!el) continue

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen()
        return true
      }
      if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen()
        return true
      }
      if (el.msRequestFullscreen) {
        await el.msRequestFullscreen()
        return true
      }
    } catch (err) {
      console.warn('Fullscreen request failed for element:', el, err)
    }
  }

  console.warn('Fullscreen API not supported or all attempts failed')
  return false
}

export function exitFullscreen() {
  const doc = document
  if (doc.exitFullscreen) return doc.exitFullscreen()
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen()
  if (doc.msExitFullscreen) return doc.msExitFullscreen()
}

export function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  )
}

export function hideAddressBar() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (document.documentElement && document.documentElement.scrollHeight > window.innerHeight) {
    window.scrollTo(0, 1)
  }
}
