import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosInstance from '../axiosInstance';

export interface OvertimeAlert {
  id: string;
  tableNames: string[];
  tableIds: number[];
  diningDuration: number;
  nextReservationTime: string;
  invoiceCode: string;
  generatedAt: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

export type AlertCallback = (alert: OvertimeAlert) => void;

export class OvertimeAlertWebSocket {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private alertCallback: AlertCallback | null = null;
  private pollingInterval: number | null = null;
  private wsUrl: string;
  private token: string | null = null; // Store token for reconnect

  constructor(wsUrl: string = 'http://localhost:8080/ws/overtime-alerts') {
    this.wsUrl = wsUrl;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): void {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return; // Silent return - already connected
    }

    if (!token) {
      return; // Silent return - no token
    }

    // Store token for reconnect
    this.token = token;
    this.connectionState = 'connecting';

    // Pass token via query parameter (industry standard for SockJS)
    const socketUrl = `${this.wsUrl}?token=${encodeURIComponent(token)}`;
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl) as WebSocket,
      
      // No headers needed - authentication happens at handshake level
      connectHeaders: {},
      
      onConnect: () => {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        
        // Stop polling fallback if it was active
        this.stopPolling();
        
        // Auto-subscribe if callback is set
        if (this.alertCallback) {
          this.subscribe(this.alertCallback);
        }
      },
      
      onStompError: (frame) => {
        console.error('Overtime Alert STOMP error:', frame);
        this.handleConnectionError();
      },
      
      onWebSocketClose: () => {
        this.connectionState = 'disconnected';
        this.handleConnectionError();
      },
      
      onWebSocketError: (error) => {
        console.error('Overtime Alert WebSocket error:', error);
        this.handleConnectionError();
      },
      
      // Heartbeat configuration
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      
      // Reconnection disabled - we handle it manually
      reconnectDelay: 0,
      
      // Disable debug logging
      debug: (str) => {
        // Only log errors
        if (str.includes('ERROR') || str.includes('error')) {
          console.error('WebSocket:', str);
        }
      }
    });

    this.client.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Stop polling
    this.stopPolling();
    
    // Unsubscribe
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    // Deactivate client
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.token = null; // Clear token on disconnect
  }

  /**
   * Subscribe to overtime alerts topic
   */
  subscribe(callback: AlertCallback): void {
    this.alertCallback = callback;
    
    if (!this.client || this.connectionState !== 'connected') {
      return; // Silent return - will auto-subscribe when connected
    }

    try {
      this.subscription = this.client.subscribe('/topic/overtime-alerts', (message) => {
        try {
          const alert: OvertimeAlert = JSON.parse(message.body);
          callback(alert);
        } catch (error) {
          console.error('Error parsing alert message:', error);
        }
      });
    } catch (error) {
      console.error('Error subscribing to alerts:', error);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Handle connection errors with exponential backoff
   */
  private handleConnectionError(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionState = 'disconnected';
      this.startPolling();
      return;
    }

    // Exponential backoff: 2^attempts * 1000ms (1s, 2s, 4s, 8s, 16s)
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connectionState = 'disconnected';
      this.connect(this.token || undefined);
    }, delay);
  }

  /**
   * Start polling fallback mechanism
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      return; // Already polling
    }
    
    // Poll immediately
    this.pollAlerts();
    
    // Then poll every 30 seconds
    this.pollingInterval = window.setInterval(() => {
      this.pollAlerts();
    }, 30000);
  }

  /**
   * Stop polling fallback mechanism
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll alerts from REST API
   */
  private async pollAlerts(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axiosInstance.get('/api/overtime/alerts', {
        headers,
      });

      const alerts: OvertimeAlert[] = response.data;
      
      // Emit each alert through callback
      if (this.alertCallback && alerts.length > 0) {
        alerts.forEach(alert => {
          this.alertCallback!(alert);
        });
      }
    } catch (error) {
      console.error('Error polling alerts:', error);
    }
  }
}
