import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
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

  const joinBridge = useCallback((bridgeId: string) => {
    socketRef.current?.emit("join_bridge", { bridge_id: bridgeId });
    console.log("[Socket] Joined bridge:", bridgeId);
  }, []);

  const leaveBridge = useCallback((bridgeId: string) => {
    socketRef.current?.emit("leave_bridge", { bridge_id: bridgeId });
    console.log("[Socket] Left bridge:", bridgeId);
  }, []);

  const joinCompany = useCallback((companyId: string) => {
    socketRef.current?.emit("join_company", { company_id: companyId });
    console.log("[Socket] Joined company:", companyId);
  }, []);

  const leaveCompany = useCallback((companyId: string) => {
    socketRef.current?.emit("leave_company", { company_id: companyId });
    console.log("[Socket] Left company:", companyId);
  }, []);

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
    // Return a safe default instead of throwing - allows usage before provider mounts
    return {
      socket: null,
      isConnected: false,
      joinBridge: () => {},
      leaveBridge: () => {},
      joinCompany: () => {},
      leaveCompany: () => {},
    };
  }
  return context;
}
