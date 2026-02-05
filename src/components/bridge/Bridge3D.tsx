"use client"

import { useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Html } from "@react-three/drei"
import type { Group } from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { Maximize, Move, RotateCcw } from "lucide-react"

export type Bridge3DSensor = {
  id: string
  name: string
  position: string
  type: "Frequência" | "Aceleração" | "Comando"
  deviceType: "frequencia" | "aceleracao" | "caixa_comando"
  status: "normal" | "alerta" | "critica" | "inactive" | "warning" | "alert" | "critical"
  frequency1?: number
  magnitude1?: number
  frequency2?: number
  magnitude2?: number
  acceleration?: number
  timestamp?: string
}

export type Bridge3DProps = {
  sensors: Bridge3DSensor[]
  onSensorClick?: (sensor: Bridge3DSensor) => void
  selectedSensor?: Bridge3DSensor | null
  frequencyLimits?: { normalToAlert: number; alertToCritical: number }
  accelerationLimits?: { normalToAlert: number; alertToCritical: number }
}

function BridgeModel({
  sensors = [],
  onSensorClick,
  selectedSensor,
  frequencyLimits,
  accelerationLimits,
}: Bridge3DProps) {
  const bridgeRef = useRef<Group>(null)

  const freqLimits = frequencyLimits ?? { normalToAlert: 3.7, alertToCritical: 7 }
  const accelLimits = accelerationLimits ?? { normalToAlert: 2.5, alertToCritical: 5.0 }

  const getSensorColor = (s: Bridge3DSensor) => {
    if (s.deviceType === "frequencia") {
      const v = s.frequency1
      if (typeof v !== "number") return "#6b7280"
      if (v <= freqLimits.normalToAlert) return "#22c55e"
      if (v <= freqLimits.alertToCritical) return "#eab308"
      return "#ef4444"
    }
    if (s.deviceType === "aceleracao") {
      const v = s.acceleration
      if (typeof v !== "number") return "#6b7280"
      if (v <= accelLimits.normalToAlert) return "#22c55e"
      if (v <= accelLimits.alertToCritical) return "#eab308"
      return "#ef4444"
    }
    return "#6b7280"
  }

  const positions: [number, number, number][] = [
    [0, 0.8, -3.5],
    [0, 0.8, -1.8],
    [0, 0.8, 0],
    [0, 0.8, 1.8],
    [0, 0.8, 3.5],
  ]

  return (
    <group ref={bridgeRef}>
      {/* Main slab */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[22, 0.5, 10]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Longitudinal beams */}
      {[-4, -2, 0, 2, 4].map((z, i) => (
        <mesh key={`beam-${i}`} position={[0, -0.5, z]}>
          <boxGeometry args={[22, 0.6, 0.4]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}

      {/* Main crossbeams */}
      {Array.from({ length: 9 }, (_, i) => {
        const xPos = -10 + i * 2.5
        return (
          <mesh key={`crossbeam-${i}`} position={[xPos, -0.5, 0]}>
            <boxGeometry args={[0.3, 0.6, 10]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        )
      })}

      {/* Secondary crossbeams */}
      {Array.from({ length: 17 }, (_, i) => {
        const xPos = -10 + i * 1.25
        return (
          <mesh key={`secondary-${i}`} position={[xPos, -0.3, 0]}>
            <boxGeometry args={[0.15, 0.3, 10]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        )
      })}

      {/* Edge barriers */}
      <mesh position={[0, 0.5, -4.8]}>
        <boxGeometry args={[22, 0.6, 0.3]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0, 0.5, 4.8]}>
        <boxGeometry args={[22, 0.6, 0.3]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Lane markings */}
      {[-3.5, -1.8, 0, 1.8, 3.5].map((z, i) => (
        <mesh key={`lane-${i}`} position={[0, 0.26, z]}>
          <boxGeometry args={[20, 0.01, 0.1]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}

      {/* Lane dividers */}
      {[-2.65, -0.9, 0.9, 2.65].map((z, i) => (
        <mesh key={`divider-${i}`} position={[0, 0.26, z]}>
          <boxGeometry args={[20, 0.01, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Bridge extensions */}
      <mesh position={[-12, 0, 0]}>
        <boxGeometry args={[2, 0.5, 10]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      <mesh position={[12, 0, 0]}>
        <boxGeometry args={[2, 0.5, 10]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>

      {/* Pillars */}
      {[
        [-8, -3.5, -4],
        [8, -3.5, -4],
        [-8, -3.5, 4],
        [8, -3.5, 4],
      ].map(([x, y, z], i) => (
        <mesh key={`pillar-${i}`} position={[x, y, z]}>
          <boxGeometry args={[1.5, 6, 1.5]} />
          <meshStandardMaterial color="#a8a29e" />
        </mesh>
      ))}

      {/* SPA/INT markers */}
      <Html position={[-11, 1, 0]} center>
        <div className="bg-background/80 px-2 py-1 rounded text-xs font-bold border">
          SP
        </div>
      </Html>
      <Html position={[11, 1, 0]} center>
        <div className="bg-background/80 px-2 py-1 rounded text-xs font-bold border">
          INT
        </div>
      </Html>

      {/* Sensor buttons */}
      {sensors.map((sensor, index) => {
        const [xPos, yPos, zPos] = positions[index] ?? [0, 0.8, 0]
        const tip =
          sensor.deviceType === "frequencia"
            ? typeof sensor.frequency1 === "number"
              ? `${sensor.frequency1.toFixed(2)} Hz`
              : "—"
            : sensor.deviceType === "aceleracao"
            ? typeof sensor.acceleration === "number"
              ? `${sensor.acceleration.toFixed(2)} m/s²`
              : "—"
            : "Comando"
        return (
          <Html key={sensor.id} position={[xPos, yPos, zPos]} center>
            <button
              onClick={() => onSensorClick?.(sensor)}
              className={`w-7 h-7 rounded-full text-white text-xs font-bold hover:scale-110 transition-transform shadow-lg border-2 ${
                selectedSensor?.id === sensor.id ? "border-white ring-2 ring-primary" : "border-gray-800"
              }`}
              style={{ backgroundColor: getSensorColor(sensor) }}
              title={`${sensor.name} — ${tip}`}
            >
              S{index + 1}
            </button>
          </Html>
        )
      })}
    </group>
  )
}

export default function Bridge3D({
  sensors,
  onSensorClick,
  selectedSensor,
  frequencyLimits,
  accelerationLimits,
}: Bridge3DProps) {
  const [activeTool, setActiveTool] = useState<"fit" | "pan" | "orbit">("orbit")
  const orbitControlsRef = useRef<OrbitControlsImpl>(null)

  const handleFitView = () => {
    orbitControlsRef.current?.reset?.()
  }

  const handleToolChange = (tool: "pan" | "orbit") => {
    setActiveTool(tool)
    if (!orbitControlsRef.current) return
    orbitControlsRef.current.enableRotate = tool === "orbit"
    orbitControlsRef.current.enablePan = true
    orbitControlsRef.current.enableZoom = true
  }

  const handleViewPreset = (view: string) => {
    const oc = orbitControlsRef.current
    if (!oc) return
    switch (view) {
      case "top":
        oc.object.position.set(0, 30, 0)
        oc.target.set(0, 0, 0)
        break
      case "front":
        oc.object.position.set(0, 5, 25)
        oc.target.set(0, 0, 0)
        break
      case "back":
        oc.object.position.set(0, 5, -25)
        oc.target.set(0, 0, 0)
        break
      case "left":
        oc.object.position.set(-25, 5, 0)
        oc.target.set(0, 0, 0)
        break
      case "right":
        oc.object.position.set(25, 5, 0)
        oc.target.set(0, 0, 0)
        break
      case "bottom":
        oc.object.position.set(0, -30, 0)
        oc.target.set(0, 0, 0)
        break
      case "iso-ne":
        oc.object.position.set(20, 12, 20)
        oc.target.set(0, 0, 0)
        break
      case "iso-nw":
        oc.object.position.set(-20, 12, 20)
        oc.target.set(0, 0, 0)
        break
      case "iso-se":
        oc.object.position.set(20, 12, -20)
        oc.target.set(0, 0, 0)
        break
      case "iso-sw":
        oc.object.position.set(-20, 12, -20)
        oc.target.set(0, 0, 0)
        break
    }
    oc.update()
  }

  // Limites com fallback para valores padrão
  const freqLimits = frequencyLimits ?? { normalToAlert: 3.7, alertToCritical: 7 }
  const accelLimits = accelerationLimits ?? { normalToAlert: 2.5, alertToCritical: 5.0 }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
      {/* Compass / View presets */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <div className="relative w-20 h-20">
            <button onClick={() => handleViewPreset("front")} className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-bold hover:bg-muted rounded px-1.5 py-0.5" title="Vista Frontal">N</button>
            <button onClick={() => handleViewPreset("right")} className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold hover:bg-muted rounded px-1.5 py-0.5" title="Vista Direita">E</button>
            <button onClick={() => handleViewPreset("back")} className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-bold hover:bg-muted rounded px-1.5 py-0.5" title="Vista Traseira">S</button>
            <button onClick={() => handleViewPreset("left")} className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold hover:bg-muted rounded px-1.5 py-0.5" title="Vista Esquerda">W</button>
            <button onClick={() => handleViewPreset("iso-ne")} className="absolute top-1 right-1 text-[10px] hover:bg-muted rounded px-1" title="Vista Isométrica NE">NE</button>
            <button onClick={() => handleViewPreset("iso-se")} className="absolute bottom-1 right-1 text-[10px] hover:bg-muted rounded px-1" title="Vista Isométrica SE">SE</button>
            <button onClick={() => handleViewPreset("iso-sw")} className="absolute bottom-1 left-1 text-[10px] hover:bg-muted rounded px-1" title="Vista Isométrica SW">SW</button>
            <button onClick={() => handleViewPreset("iso-nw")} className="absolute top-1 left-1 text-[10px] hover:bg-muted rounded px-1" title="Vista Isométrica NW">NW</button>
            <button onClick={() => handleViewPreset("top")} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-muted border rounded text-[10px] p-1.5 hover:bg-muted/80 flex flex-col items-center" title="Vista Superior">
              <span className="font-semibold">SUP</span>
            </button>
          </div>
          <button onClick={() => handleViewPreset("bottom")} className="w-full mt-1 bg-muted border rounded text-[10px] px-2 py-1 hover:bg-muted/80" title="Vista Inferior">
            INFERIOR
          </button>
        </div>
      </div>

      {/* Dynamic legend for selected sensor */}
      {selectedSensor && (
        <div className="absolute top-3 left-3 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-xs space-y-1">
          <p className="font-semibold mb-2">Níveis:</p>
          {selectedSensor.deviceType === "frequencia" ? (
            <>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> Normal (&lt; {freqLimits.normalToAlert} Hz)</p>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Atenção ({freqLimits.normalToAlert}-{freqLimits.alertToCritical} Hz)</p>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Alerta (&gt; {freqLimits.alertToCritical} Hz)</p>
            </>
          ) : selectedSensor.deviceType === "aceleracao" ? (
            <>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> Normal (&lt; {accelLimits.normalToAlert} m/s²)</p>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Atenção ({accelLimits.normalToAlert}-{accelLimits.alertToCritical} m/s²)</p>
              <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Alerta (&gt; {accelLimits.alertToCritical} m/s²)</p>
            </>
          ) : (
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500" /> Caixa de comando</p>
          )}
          <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400" /> Inativo</p>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border flex items-center gap-2">
          <button onClick={handleFitView} className="flex flex-col items-center p-1.5 hover:bg-muted rounded text-xs" title="Ajustar Vista">
            <Maximize className="h-4 w-4" />
            <span className="mt-0.5">Início</span>
          </button>
          <button onClick={() => handleToolChange("pan")} className={`flex flex-col items-center p-1.5 hover:bg-muted rounded text-xs ${activeTool === "pan" ? "bg-primary/20 text-primary" : ""}`} title="Pan">
            <Move className="h-4 w-4" />
            <span className="mt-0.5">Pan</span>
          </button>
          <button onClick={() => handleToolChange("orbit")} className={`flex flex-col items-center p-1.5 hover:bg-muted rounded text-xs ${activeTool === "orbit" ? "bg-primary/20 text-primary" : ""}`} title="Órbita">
            <RotateCcw className="h-4 w-4" />
            <span className="mt-0.5">Órbita</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [20, 12, 20], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.3} />
        
        <BridgeModel
          sensors={sensors}
          onSensorClick={onSensorClick}
          selectedSensor={selectedSensor}
          frequencyLimits={frequencyLimits}
          accelerationLimits={accelerationLimits}
        />

        <OrbitControls
          ref={orbitControlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={activeTool === "orbit"}
          minDistance={10}
          maxDistance={60}
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
