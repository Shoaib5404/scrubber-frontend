import * as React from "react"

export const MOBILE_BREAKPOINT = 768

function getIsMobileViewport() {
  if (typeof window === "undefined") {
    return false
  }
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/** Live viewport check for click handlers (avoids stale isMobile before layout effect). */
export function isMobileViewport() {
  return getIsMobileViewport()
}
