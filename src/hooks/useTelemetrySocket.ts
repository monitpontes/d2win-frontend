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

export function useTelemetrySocket(bridgeId?: string) {
  const { socket, isConnected, joinBridge, leaveBridge } = useSocket();
  const [realtimeData, setRealtimeData] = useState<TelemetryData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const joinedRef = useRef<string | null>(null);

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

      // Map event to TelemetryData format
      const mapped: TelemetryData = {
        deviceId: event.device_id,
        bridgeId: event.bridge_id,
        timestamp: event.ts,
        modoOperacao: event.type === "freq" ? "frequencia" : "aceleracao",
        status: event.payload.severity,
        frequency: event.type === "freq" && event.payload.peaks?.[0]
          ? event.payload.peaks[0].f
          : undefined,
        acceleration: event.type === "accel" && event.payload.value !== undefined
          ? { x: 0, y: 0, z: event.payload.value }
          : undefined,
      };

      setRealtimeData((prev) => {
        // Find existing device or append
        const idx = prev.findIndex((d) => d.deviceId === mapped.deviceId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = mapped;
          return updated;
        }
        return [...prev, mapped];
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
    setLastUpdate(null);
  }, [bridgeId]);

  return {
    realtimeData,
    lastUpdate,
    isConnected,
  };
}
