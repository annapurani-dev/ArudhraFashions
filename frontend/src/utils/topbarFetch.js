// Lightweight global fetch interceptor to show top progress bar.
(function () {
  if (typeof window === 'undefined') return

  let origFetch = window.fetch
  if (!origFetch) return

  let active = 0
  const start = () => {
    if (active === 0) window.dispatchEvent(new Event('topbar:start'))
    active++
  }
  const done = () => {
    active = Math.max(0, active - 1)
    if (active === 0) window.dispatchEvent(new Event('topbar:done'))
  }

  window.fetch = async function (...args) {
    start()
    try {
      const res = await origFetch.apply(this, args)
      done()
      return res
    } catch (err) {
      done()
      throw err
    }
  }
})()

