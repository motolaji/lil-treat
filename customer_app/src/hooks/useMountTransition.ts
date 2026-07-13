import { useEffect, useRef, useState } from 'react'

/**
 * Keeps a component mounted long enough to play a CSS exit animation
 * before actually unmounting, given a plain boolean `isOpen` flag.
 *
 * Consumer contract: render nothing when `shouldRender` is false; apply
 * `animationClass` ('entering' | 'exiting') to the outermost animated
 * element, with CSS animation/transition durations <= `duration`.
 */
export function useMountTransition(isOpen: boolean, duration: number) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [animationClass, setAnimationClass] = useState(isOpen ? 'entering' : '')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(timeoutRef.current)

    if (isOpen) {
      setShouldRender(true)
      // Deferred so the "entering" class transition actually fires — applying
      // it in the same tick as mounting would skip the transition entirely.
      timeoutRef.current = setTimeout(() => setAnimationClass('entering'), 10)
    } else if (shouldRender) {
      setAnimationClass('exiting')
      timeoutRef.current = setTimeout(() => setShouldRender(false), duration)
    }

    return () => clearTimeout(timeoutRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, duration])

  return { shouldRender, animationClass }
}
