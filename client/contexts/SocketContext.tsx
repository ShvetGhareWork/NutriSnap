"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only connect if the user is authenticated
        if (status === "authenticated" && session?.user?.id) {
            const socketInstance = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`, {
                withCredentials: true,
                autoConnect: true,
            });

            socketInstance.on("connect", () => {
                console.log("Socket connected:", socketInstance.id);
                setIsConnected(true);
            });

            socketInstance.on("disconnect", () => {
                console.log("Socket disconnected");
                setIsConnected(false);
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        }
    }, [status, session]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
