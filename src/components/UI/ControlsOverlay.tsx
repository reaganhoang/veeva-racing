import React, { useRef } from 'react'
import type { VehicleControls } from '../../hooks/useVehicleControls'

interface Props {
  setTouchControl: (key: keyof VehicleControls, value: boolean) => void
}

interface TouchButtonProps {
  label: string
  icon?: string
  controlKey: keyof VehicleControls
  className?: string
  setTouchControl: (key: keyof VehicleControls, value: boolean) => void
}

function TouchButton({ label, icon, controlKey, className = '', setTouchControl }: TouchButtonProps) {
  return (
    <button
      className={`select-none touch-none active:opacity-70 ${className}`}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setTouchControl(controlKey, true) }}
      onPointerUp={() => setTouchControl(controlKey, false)}
      onPointerCancel={() => setTouchControl(controlKey, false)}
      onPointerLeave={() => setTouchControl(controlKey, false)}
    >
      <div className="w-14 h-14 bg-white/10 backdrop-blur border border-white/20 rounded-2xl
                      flex items-center justify-center text-white font-bold text-xl shadow-lg">
        {icon ?? label}
      </div>
    </button>
  )
}

export default function ControlsOverlay({ setTouchControl }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Left: D-pad */}
      <div className="absolute bottom-8 left-6 pointer-events-auto">
        <div className="grid grid-cols-3 gap-1" style={{ gridTemplateRows: 'repeat(3, 1fr)' }}>
          {/* Row 1 */}
          <div />
          <TouchButton label="W" icon="▲" controlKey="forward" setTouchControl={setTouchControl} />
          <div />
          {/* Row 2 */}
          <TouchButton label="A" icon="◀" controlKey="left"    setTouchControl={setTouchControl} />
          <TouchButton label="S" icon="▼" controlKey="backward" setTouchControl={setTouchControl} />
          <TouchButton label="D" icon="▶" controlKey="right"   setTouchControl={setTouchControl} />
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="absolute bottom-8 right-6 pointer-events-auto flex flex-col gap-2 items-end">
        <TouchButton
          label="Drift"
          controlKey="drift"
          setTouchControl={setTouchControl}
          className="[&>div]:bg-veeva-orange/30 [&>div]:border-veeva-orange/50"
        />
        <TouchButton
          label="Item"
          icon="🎁"
          controlKey="useItem"
          setTouchControl={setTouchControl}
          className="[&>div]:bg-veeva-orange/30 [&>div]:border-veeva-orange/50"
        />
        <TouchButton
          label="R"
          controlKey="reset"
          setTouchControl={setTouchControl}
        />
      </div>
    </div>
  )
}
