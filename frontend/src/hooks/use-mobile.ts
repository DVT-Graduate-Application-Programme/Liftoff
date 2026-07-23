import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Start `false` on both the server and the first client render so hydration
  // matches, then read the real viewport width after mount. Reading
  // `window.innerWidth` in the initializer would diverge from the server's
  // `false` on narrow viewports and cause a hydration mismatch.
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    onChange()
    mql.addEventListener("change", onChange)
    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [])
  return isMobile
}
