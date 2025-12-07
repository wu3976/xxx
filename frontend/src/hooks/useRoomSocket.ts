import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RoomJoinData {
    roomId: string;
    userId: string;
    playerSlot: 'player1' | 'player2';
}

interface RoomState {
    isConnected: boolean;
    isJoined: boolean;
    roomId: string | null;
    userId: string | null;
    playerSlot: 'player1' | 'player2' | null;
    error: string | null;
}

const SOCKET_URL = 'http://localhost:3000'; // Adjust to your backend URL

/**
 * Hook for managing WebSocket connection and room joining
 */
export function useRoomSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [state, setState] = useState<RoomState>({
        isConnected: false,
        isJoined: false,
        roomId: null,
        userId: null,
        playerSlot: null,
        error: null,
    });

    // Initialize socket connection
    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to server');
                setState((prev) => ({
                    ...prev,
                    isConnected: true,
                    error: null,
                }));
            });

            socketRef.current.on('disconnect', () => {
                console.log('Disconnected from server');
                setState((prev) => ({
                    ...prev,
                    isConnected: false,
                    isJoined: false,
                    roomId: null,
                    userId: null,
                    playerSlot: null,
                }));
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Connection error:', error);
                setState((prev) => ({
                    ...prev,
                    error: `Connection error: ${error}`,
                }));
            });

            // Listen for room events
            socketRef.current.on(
                'room:player:joined',
                (data: { success: boolean; data: any }) => {
                    if (data.success) {
                        console.log('Player joined room:', data.data);
                        setState((prev) => ({
                            ...prev,
                            isJoined: true,
                        }));
                    }
                }
            );

            socketRef.current.on(
                'room:player:left',
                (data: { success: boolean; data: any }) => {
                    if (data.success) {
                        console.log('Player left room:', data.data);
                    }
                }
            );

            socketRef.current.on(
                'room:player:disconnected',
                (data: { userId: string; playerSlot: string; room: any }) => {
                    console.log('Player disconnected:', data);
                }
            );
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    /**
     * Join a room
     */
    const joinRoom = useCallback(
        async (data: RoomJoinData): Promise<boolean> => {
            return new Promise((resolve) => {
                if (!socketRef.current?.connected) {
                    setState((prev) => ({
                        ...prev,
                        error: 'Socket not connected',
                    }));
                    resolve(false);
                    return;
                }

                socketRef.current?.emit('room:join', data, (response: any) => {
                    if (response.success) {
                        setState((prev) => ({
                            ...prev,
                            isJoined: true,
                            roomId: data.roomId,
                            userId: data.userId,
                            playerSlot: data.playerSlot,
                            error: null,
                        }));
                        resolve(true);
                    } else {
                        setState((prev) => ({
                            ...prev,
                            error: response.error?.message || 'Failed to join room',
                        }));
                        resolve(false);
                    }
                });
            });
        },
        []
    );

    /**
     * Leave a room
     */
    const leaveRoom = useCallback(
        async (roomId: string, userId: string): Promise<boolean> => {
            return new Promise((resolve) => {
                if (!socketRef.current?.connected) {
                    setState((prev) => ({
                        ...prev,
                        error: 'Socket not connected',
                    }));
                    console.error('[LEAVE_ROOM] Socket not connected');
                    resolve(false);
                    return;
                }

                socketRef.current?.emit(
                    'room:leave',
                    { roomId, userId },
                    (response: any) => {
                        console.log('[LEAVE_ROOM] Response:', response);
                        
                        if (response.success) {
                            console.log('[LEAVE_ROOM] Successfully left room');
                            setState((prev) => ({
                                ...prev,
                                isJoined: false,
                                roomId: null,
                                userId: null,
                                playerSlot: null,
                                error: null,
                            }));
                            resolve(true);
                        } else {
                            const errorMsg = response.error?.message || 'Failed to leave room';
                            console.error('[LEAVE_ROOM] Error:', errorMsg);
                            setState((prev) => ({
                                ...prev,
                                error: errorMsg,
                            }));
                            resolve(false);
                        }
                    }
                );
            });
        },
        []
    );

    /**
     * Get current room state
     */
    const getRoomState = useCallback(async (roomId: string): Promise<any> => {
        return new Promise((resolve) => {
            if (!socketRef.current?.connected) {
                setState((prev) => ({
                    ...prev,
                    error: 'Socket not connected',
                }));
                resolve(null);
                return;
            }

            socketRef.current?.emit(
                'room:state',
                { roomId },
                (response: any) => {
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        setState((prev) => ({
                            ...prev,
                            error: response.error?.message || 'Failed to fetch room state',
                        }));
                        resolve(null);
                    }
                }
            );
        });
    }, []);

    /**
     * Subscribe to room updates
     */
    const subscribeToRoom = useCallback((roomId: string) => {
        if (!socketRef.current?.connected) {
            setState((prev) => ({
                ...prev,
                error: 'Socket not connected',
            }));
            return;
        }

        socketRef.current?.emit('room:subscribe', { roomId });
    }, []);

    /**
     * Unsubscribe from room updates
     */
    const unsubscribeFromRoom = useCallback((roomId: string) => {
        if (!socketRef.current?.connected) {
            return;
        }

        socketRef.current?.emit('room:unsubscribe', { roomId });
    }, []);

    /**
     * Listen for room updates
     */
    const onRoomUpdate = useCallback(
        (callback: (data: any) => void) => {
            if (!socketRef.current) return;

            socketRef.current.on('room:player:joined', callback);
            socketRef.current.on('room:player:left', callback);
            socketRef.current.on('room:player:disconnected', callback);
            socketRef.current.on('room:move:updated', callback);

            return () => {
                socketRef.current?.off('room:player:joined', callback);
                socketRef.current?.off('room:player:left', callback);
                socketRef.current?.off('room:player:disconnected', callback);
                socketRef.current?.off('room:move:updated', callback);
            };
        },
        []
    );

    return {
        socket: socketRef.current,
        state,
        joinRoom,
        leaveRoom,
        getRoomState,
        subscribeToRoom,
        unsubscribeFromRoom,
        onRoomUpdate,
    };
}

export default useRoomSocket;
