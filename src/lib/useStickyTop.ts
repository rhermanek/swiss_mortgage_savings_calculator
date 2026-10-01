import { useEffect, useState, type RefObject } from 'react'

// Sticky offset for a sidebar that may be taller than the viewport: it pins at
// `preferred` when it fits, otherwise far enough up that its bottom stays
// reachable. Avoids a nested scroll container.
export function useStickyTop(ref: RefObject<HTMLElement | null>, preferred: number, bottomGap = 16) {
  const [top, setTop] = useState(preferred)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setTop(Math.min(preferred, window.innerHeight - el.offsetHeight - bottomGap))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref, preferred, bottomGap])

  return top
}
