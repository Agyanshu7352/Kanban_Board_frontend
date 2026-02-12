import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Update this URL to match your backend server
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Create socket connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        // Connection event handlers
        socketRef.current.on('connect', () => {
            console.log('✅ WebSocket connected with ID:', socketRef.current.id);
            setIsConnected(true);
            setError(null);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected. Reason:', reason);
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
            setIsConnected(false);
            setError(err.message);
        });

        socketRef.current.on('error', (err) => {
            console.error('Socket error:', err);
            setError(err.message || 'Socket error occurred');
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                console.log('🔌 Disconnecting socket...');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        error,
    };
};