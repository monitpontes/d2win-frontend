

# Plano: Implementar WebSocket para Atualização em Tempo Real

## Situação Atual

### Backend (d2win-api) - Já Pronto
O backend já possui Socket.IO configurado e funcionando:

```javascript
// src/app.js - Backend
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

globalThis.__io = io;

io.on("connection", (socket) => {
  socket.on("join_bridge", ({ bridge_id }) => {
    socket.join(`bridge:${bridge_id}`);
  });
  
  socket.on("join_company", ({ company_id }) => {
    socket.join(`company:${company_id}`);
  });
});
```

Quando um sensor envia dados, o backend emite via WebSocket:

```javascript
// ingestAccel.js e ingestFreq.js
io.to(`bridge:${bridge_id}`).emit("telemetry", {
  type: "accel" | "freq",
  bridge_id: "...",
  company_id: "...",
  device_id: "...",
  ts: "2026-01-15T10:30:00Z",
  payload: {
    // Para accel:
    axis: "z",
    value: 9.84,
    severity: "normal"
    
    // Para freq:
    peaks: [{ f: 3.55, mag: 758 }],
    severity: "normal"
  }
});
```

### Frontend (Atual) - Precisa Atualizar
O frontend usa apenas polling HTTP que não atualiza automaticamente:
- `useTelemetry` faz 2 requisições HTTP (latest + history)
- `historyQuery` não tem `refetchInterval`
- Não há conexão WebSocket

---

## Solução

Implementar cliente Socket.IO no frontend para receber dados em tempo real e fazer append nos gráficos automaticamente.

---

## Arquitetura

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                     │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │  SocketContext   │───>│  useTelemetry   │───>│  BridgeCard     │      │
│  │  (conexão WS)    │    │  (dados + stream)│    │  BridgeDetail   │      │
│  └────────┬────────┘    └─────────────────┘    │  DataAnalysis   │      │
│           │                                      └─────────────────┘      │
│           │ join_bridge                                                    │
│           │ emit("telemetry")                                             │
└───────────┼──────────────────────────────────────────────────────────────┘
            │ WebSocket
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (d2win-api)                              │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │  Socket.IO       │<───│  ingestAccel    │<───│  IoT Sensor     │      │
│  │  Server          │    │  ingestFreq     │    │  (dispositivo)  │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Operação | Descrição |
|---------|----------|-----------|
| `src/lib/socket.ts` | Criar | Cliente Socket.IO singleton |
| `src/contexts/SocketContext.tsx` | Criar | Context para gerenciar conexão WS |
| `src/hooks/useTelemetrySocket.ts` | Criar | Hook para receber dados em tempo real |
| `src/hooks/useTelemetry.ts` | Modificar | Integrar com WebSocket |
| `src/main.tsx` | Modificar | Adicionar SocketProvider |
| `package.json` | Modificar | Adicionar `socket.io-client` |

---

## Seção Técnica

### 1. Instalar socket.io-client

```bash
npm install socket.io-client
```

### 2. Criar Cliente Socket.IO

```typescript
// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "https://d2win-api.onrender.com";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
```

### 3. Criar SocketContext

```typescript
// src/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinBridge: (bridgeId: string) => void;
  leaveBridge: (bridgeId: string) => void;
  joinCompany: (companyId: string) => void;
  leaveCompany: (companyId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = getSocket();
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketRef.current.on("connect", onConnect);
    socketRef.current.on("disconnect", onDisconnect);

    connectSocket();

    return () => {
      socketRef.current?.off("connect", onConnect);
      socketRef.current?.off("disconnect", onDisconnect);
      disconnectSocket();
    };
  }, []);

  const joinBridge = (bridgeId: string) => {
    socketRef.current?.emit("join_bridge", { bridge_id: bridgeId });
    console.log("[Socket] Joined bridge:", bridgeId);
  };

  const leaveBridge = (bridgeId: string) => {
    socketRef.current?.emit("leave_bridge", { bridge_id: bridgeId });
  };

  const joinCompany = (companyId: string) => {
    socketRef.current?.emit("join_company", { company_id: companyId });
  };

  const leaveCompany = (companyId: string) => {
    socketRef.current?.emit("leave_company", { company_id: companyId });
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      joinBridge,
      leaveBridge,
      joinCompany,
      leaveCompany,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
}
```

### 4. Criar Hook useTelemetrySocket

```typescript
// src/hooks/useTelemetrySocket.ts
import { useEffect, useState, useCallback, useRef } from "react";
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
```

### 5. Atualizar useTelemetry

```typescript
// src/hooks/useTelemetry.ts
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { telemetryService, type TelemetryData } from "@/lib/api";
import { useTelemetrySocket } from "./useTelemetrySocket";

export function useTelemetry(bridgeId?: string) {
  // Socket para dados em tempo real
  const { realtimeData, lastUpdate, isConnected } = useTelemetrySocket(bridgeId);

  // HTTP para dados iniciais (modo_operacao)
  const latestQuery = useQuery({
    queryKey: ["telemetry", "latest", bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    staleTime: 60000, // Menos frequente - socket atualiza
  });

  // HTTP para histórico inicial
  const historyQuery = useQuery({
    queryKey: ["telemetry", "history", bridgeId],
    queryFn: () => telemetryService.getHistoryByBridge(bridgeId!, { limit: 500 }),
    enabled: !!bridgeId,
    staleTime: 60000,
  });

  // Combinar: HTTP inicial + WebSocket realtime
  const combinedData = useMemo(() => {
    const httpData = historyQuery.data || [];
    const latestModes = latestQuery.data || [];

    // Criar mapa de modo_operacao do latest
    const modeByDevice = new Map<string, string>();
    latestModes.forEach((d) => {
      if (d.modoOperacao) modeByDevice.set(d.deviceId, d.modoOperacao);
    });

    // Merge HTTP data com modo correto
    let merged = httpData.map((h) => ({
      ...h,
      modoOperacao: modeByDevice.get(h.deviceId) || h.modoOperacao,
    }));

    // Sobrescrever com dados realtime (mais recentes)
    realtimeData.forEach((rt) => {
      const idx = merged.findIndex((m) => m.deviceId === rt.deviceId);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...rt };
      } else {
        merged.push(rt);
      }
    });

    return merged;
  }, [latestQuery.data, historyQuery.data, realtimeData]);

  return {
    latestData: combinedData,
    historyData: historyQuery.data || [],
    realtimeData,
    isLoadingLatest: latestQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    isLoading: latestQuery.isLoading || historyQuery.isLoading,
    isConnected,
    lastUpdate,
    refetchLatest: latestQuery.refetch,
    refetchHistory: historyQuery.refetch,
  };
}
```

### 6. Atualizar main.tsx

```typescript
// src/main.tsx
import { SocketProvider } from "@/contexts/SocketContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

### 7. Adicionar Indicador de Conexão (Opcional)

No `BridgeCard.tsx` ou `BridgeDetail.tsx`:

```typescript
const { isConnected, lastUpdate } = useTelemetry(bridge.id);

// Mostrar status da conexão
<div className="flex items-center gap-2">
  <span className={cn(
    "h-2 w-2 rounded-full",
    isConnected ? "bg-green-500" : "bg-red-500"
  )} />
  <span className="text-xs text-muted-foreground">
    {isConnected ? "Tempo real" : "Offline"}
  </span>
  {lastUpdate && (
    <span className="text-xs text-muted-foreground">
      Última: {format(lastUpdate, "HH:mm:ss")}
    </span>
  )}
</div>
```

---

## Fluxo de Dados

```text
1. Página carrega
   ├── useTelemetry busca dados iniciais via HTTP
   └── SocketProvider conecta ao WebSocket

2. Usuário acessa BridgeDetail
   ├── useTelemetrySocket emite "join_bridge"
   └── Backend adiciona cliente à sala "bridge:{id}"

3. Sensor envia dados (IoT → Backend)
   ├── ingestAccel/ingestFreq salva no MongoDB
   └── Emite io.to("bridge:{id}").emit("telemetry", {...})

4. Frontend recebe evento
   ├── useTelemetrySocket atualiza realtimeData
   ├── useTelemetry combina com dados existentes
   └── Componentes re-renderizam com valor novo
```

---

## Formato do Evento WebSocket

```typescript
// Evento recebido do backend
interface TelemetryEvent {
  type: "accel" | "freq";
  bridge_id: string;
  company_id: string;
  device_id: string;
  ts: string;
  payload: {
    // Para type === "accel":
    axis: "x" | "y" | "z";
    value: number;      // Ex: 9.84 m/s²
    severity: "normal" | "warning" | "critical";

    // Para type === "freq":
    status: "atividade_detectada" | "sem_atividade";
    peaks: Array<{ f: number; mag: number }>;  // Ex: [{ f: 3.55, mag: 758 }]
    severity: "normal" | "warning" | "critical";
  }
}
```

---

## Benefícios

| Aspecto | Antes (Polling) | Depois (WebSocket) |
|---------|-----------------|---------------------|
| Latência | 30-60 segundos | Instantâneo (~50ms) |
| Requisições HTTP | ~120/hora por cliente | 2 (apenas inicial) |
| Custo servidor | Alto | Baixo |
| Dados no gráfico | Estáticos | Append automático |
| Experiência | Precisa refresh | Tempo real |

---

## Estimativa

- **Tempo:** ~45 minutos
- **Arquivos novos:** 3
- **Arquivos modificados:** 3
- **Dependência:** socket.io-client
- **Complexidade:** Média

