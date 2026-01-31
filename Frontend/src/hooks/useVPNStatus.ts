import { useState, useEffect, useRef, useCallback } from 'react';

export interface VPNStatus {
  isConnected: boolean;
  isConnecting: boolean;
  ipAddress: string | null;
}

export function useVPNStatus() {
  const [status, setStatus] = useState<VPNStatus>({
    isConnected: false,
    isConnecting: false,
    ipAddress: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket('ws://localhost:8787');
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = event.data;
        
        // Check for VPN connection indicators
        if (data.includes('Initialization Sequence Completed')) {
          setStatus(prev => ({ ...prev, isConnected: true, isConnecting: false }));
        }
        
        // Extract IP address from tun interface
        // Look for patterns like: "inet 10.10.14.5/23"
        const ipMatch = data.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) {
          setStatus(prev => ({ ...prev, ipAddress: ipMatch[1] }));
        }

        // Check for VPN IP status messages
        const vpnIpMatch = data.match(/VPN_IP:(\d+\.\d+\.\d+\.\d+)/);
        if (vpnIpMatch) {
          setStatus(prev => ({ 
            ...prev, 
            ipAddress: vpnIpMatch[1],
            isConnected: true,
            isConnecting: false 
          }));
        }

        // Check for disconnection
        if (data.includes('Connection reset') || data.includes('SIGTERM') || data.includes('process exited')) {
          setStatus({ isConnected: false, isConnecting: false, ipAddress: null });
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Try to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        // Silent error handling
      };
    } catch {
      // Silent error handling
    }
  }, []);

  const setConnecting = useCallback((connecting: boolean) => {
    setStatus(prev => ({ ...prev, isConnecting: connecting }));
  }, []);

  const setConnected = useCallback((connected: boolean, ip?: string) => {
    setStatus(prev => ({ 
      ...prev, 
      isConnected: connected, 
      isConnecting: false,
      ipAddress: ip || prev.ipAddress 
    }));
  }, []);

  const setDisconnected = useCallback(() => {
    setStatus({ isConnected: false, isConnecting: false, ipAddress: null });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return { 
    status, 
    setConnecting, 
    setConnected, 
    setDisconnected 
  };
}
