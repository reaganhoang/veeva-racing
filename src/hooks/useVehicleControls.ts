import { useEffect, useRef, useCallback } from 'react'

export interface VehicleControls {
  forward:  boolean
  backward: boolean
  left:     boolean
  right:    boolean
  drift:    boolean
  reset:    boolean
  useItem:  boolean
}

const DEFAULT_CONTROLS: VehicleControls = {
  forward: false, backward: false,
  left: false, right: false,
  drift: false, reset: false,
  useItem: false,
}

export function useVehicleControls() {
  const controlsRef = useRef<VehicleControls>({ ...DEFAULT_CONTROLS })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch (e.code) {
        case 'ArrowUp':    case 'KeyW': controlsRef.current.forward  = true; break
        case 'ArrowDown':  case 'KeyS': controlsRef.current.backward = true; break
        case 'ArrowLeft':  case 'KeyA': controlsRef.current.left     = true; break
        case 'ArrowRight': case 'KeyD': controlsRef.current.right    = true; break
        case 'Space':                                                    controlsRef.current.drift     = true; e.preventDefault(); break
        case 'KeyR':                                                     controlsRef.current.reset     = true; break
        case 'KeyE': case 'ShiftLeft': case 'ShiftRight':               controlsRef.current.useItem   = true; break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':    case 'KeyW': controlsRef.current.forward  = false; break
        case 'ArrowDown':  case 'KeyS': controlsRef.current.backward = false; break
        case 'ArrowLeft':  case 'KeyA': controlsRef.current.left     = false; break
        case 'ArrowRight': case 'KeyD': controlsRef.current.right    = false; break
        case 'Space':                   controlsRef.current.drift     = false; break
        case 'KeyR':                    controlsRef.current.reset     = false; break
        case 'KeyE': case 'ShiftLeft': case 'ShiftRight': controlsRef.current.useItem = false; break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [])

  // Touch control setters (called from ControlsOverlay)
  const setTouchControl = useCallback((key: keyof VehicleControls, value: boolean) => {
    controlsRef.current[key] = value
  }, [])

  return { controlsRef, setTouchControl }
}
