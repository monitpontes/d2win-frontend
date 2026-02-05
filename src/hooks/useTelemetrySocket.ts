import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import type { TelemetryData } from "@/lib/api";

interface TelemetryEvent {
  type: "accel" | "freq";
  bridge_id: string;
  company_id: string;
  device_id: string;
  ts: string;
  payload: {
    axis?: string;
    value?: number;
    peaks?: Array<{ f: number; mag: number }>;
    severity: string;
    status?: string;
  };
}

// Ponto de série temporal para gráficos (acumula cada leitura)
export interface TimeSeriesHistoryPoint {
  deviceId: string;
  timestamp: string;
  type: 'frequency' | 'acceleration';
  value: number;
  peak2?: number; // Segundo pico de frequência
  severity?: string;
}

export function useTelemetrySocket(bridgeId?: string) {
  const { socket, isConnected, joinBridge, leaveBridge } = useSocket();
  const [realtimeData, setRealtimeData] = useState<TelemetryData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const joinedRef = useRef<string | null>(null);
  
  // Estado acumulativo para séries temporais (gráficos)
  const [timeSeriesHistory, setTimeSeriesHistory] = useState<TimeSeriesHistoryPoint[]>([]);

  // Join/leave bridge room
  useEffect(() => {
    if (!bridgeId || !isConnected) return;

    // Leave previous bridge if different
    if (joinedRef.current && joinedRef.current !== bridgeId) {
      leaveBridge(joinedRef.current);
    }

    joinBridge(bridgeId);
    joinedRef.current = bridgeId;

    return () => {
      if (joinedRef.current) {
        leaveBridge(joinedRef.current);
        joinedRef.current = null;
      }
    };
  }, [bridgeId, isConnected, joinBridge, leaveBridge]);

  // Listen for telemetry events
  useEffect(() => {
    if (!socket || !bridgeId) return;

    const handleTelemetry = (event: TelemetryEvent) => {
      console.log("[Telemetry] Received:", event);

      // Map event to TelemetryData format - extract ALL peak data
      const peaks = event.payload.peaks || [];
      const mapped: TelemetryData = {
        deviceId: event.device_id,
        bridgeId: event.bridge_id,
        timestamp: event.ts,
        modoOperacao: event.type === "freq" ? "frequencia" : "aceleracao",
        status: event.payload.severity,
        // Extract ALL peaks: frequency and magnitude for both peaks
        frequency: event.type === "freq" ? peaks[0]?.f : undefined,
        magnitude1: event.type === "freq" ? peaks[0]?.mag : undefined,
        frequency2: event.type === "freq" ? peaks[1]?.f : undefined,
        magnitude2: event.type === "freq" ? peaks[1]?.mag : undefined,
        // Acceleration
        acceleration: event.type === "accel" && event.payload.value !== undefined
          ? { x: 0, y: 0, z: event.payload.value }
          : undefined,
      };

      // Atualizar realtimeData (substitui último valor para cards)
      setRealtimeData((prev) => {
        const idx = prev.findIndex((d) => d.deviceId === mapped.deviceId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = mapped;
          return updated;
        }
        return [...prev, mapped];
      });

      // Acumular no timeSeriesHistory (para gráficos - sliding window)
      const newPoint: TimeSeriesHistoryPoint = {
        deviceId: event.device_id,
        timestamp: event.ts,
        type: event.type === 'freq' ? 'frequency' : 'acceleration',
        value: event.type === 'freq' ? (peaks[0]?.f ?? 0) : (event.payload.value ?? 0),
        peak2: event.type === 'freq' ? peaks[1]?.f : undefined,
        severity: event.payload.severity,
      };

      setTimeSeriesHistory(prev => {
        // Manter últimos 50 pontos por device para evitar crescimento infinito
        const devicePoints = prev.filter(p => p.deviceId === newPoint.deviceId);
        const otherPoints = prev.filter(p => p.deviceId !== newPoint.deviceId);
        return [...otherPoints, ...devicePoints.slice(-49), newPoint];
      });

      setLastUpdate(new Date());
    };

    socket.on("telemetry", handleTelemetry);

    return () => {
      socket.off("telemetry", handleTelemetry);
    };
  }, [socket, bridgeId]);

  // Clear realtime data when bridge changes
  useEffect(() => {
    setRealtimeData([]);
    setTimeSeriesHistory([]);
    setLastUpdate(null);
  }, [bridgeId]);

  return {
    realtimeData,
    timeSeriesHistory,
    lastUpdate,
    isConnected,
  };
}
