import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface TableStatusUpdate {
  tableIds: number[];
  status: string;
  timestamp: string;
}

export type TableStatusCallback = (update: TableStatusUpdate) => void;

export class ReservationWebSocket {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private wsUrl: string;
  private callback: TableStatusCallback | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(wsUrl: string = 'http://localhost:8080/ws') {
    this.wsUrl = wsUrl;
  }

  connect(token: string, callback: TableStatusCallback): void {
    if (!token) {
      console.error('No token provided for WebSocket connection');
      return;
    }

    this.callback = callback;
    const socketUrl = `${this.wsUrl}?token=${token}`;
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl) as WebSocket,
      
      onConnect: () => {
        console.log('Reservation WebSocket connected');
        this.reconnectAttempts = 0;
        this.subscribeTableStatus();
      },
      
      onStompError: (frame) => {
        console.error('Reservation STOMP error:', frame);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('Max reconnect attempts reached, stopping WebSocket');
          this.disconnect();
        }
      },
      
      onWebSocketClose: () => {
        console.log('Reservation WebSocket closed');
      },
      
      onWebSocketError: (error) => {
        console.error('Reservation WebSocket error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('Max reconnect attempts reached, stopping WebSocket');
          this.disconnect();
        }
      },
      
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.client.activate();
  }

  private subscribeTableStatus(): void {
    if (!this.client || !this.callback) return;

    this.subscription = this.client.subscribe('/topic/table-status', (message) => {
      try {
        const update: TableStatusUpdate = JSON.parse(message.body);
        console.log('Received table status update:', update);
        this.callback!(update);
      } catch (error) {
        console.error('Error parsing table status message:', error);
      }
    });
    
    console.log('Subscribed to /topic/table-status');
  }

  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}
