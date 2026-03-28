import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface TableStatusUpdate {
  tableIds: number[];
  status: string;
  timestamp: string;
}

export interface InvoiceUpdate {
  invoiceId: number;
  invoiceCode: string;
  status: string;
  timestamp: string;
}

export interface DashboardStatsUpdate {
  todayRevenue: number;
  todayInvoices: number;
  todayCustomers: number;
  activeTables: { occupied: number; total: number };
  timestamp: string;
}

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

export type TableStatusCallback = (update: TableStatusUpdate) => void;
export type InvoiceUpdateCallback = (update: InvoiceUpdate) => void;
export type StatsUpdateCallback = (update: DashboardStatsUpdate) => void;

export class DashboardWebSocket {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private wsUrl: string;
  private token: string | null = null; // Store token for reconnect
  
  private tableStatusCallback: TableStatusCallback | null = null;
  private invoiceUpdateCallback: InvoiceUpdateCallback | null = null;
  private statsUpdateCallback: StatsUpdateCallback | null = null;

  constructor(wsUrl: string = 'http://localhost:8080/ws') {
    this.wsUrl = wsUrl;
  }

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
        
        // Auto-subscribe to all topics if callbacks are set
        if (this.tableStatusCallback) {
          this.subscribeTableStatus(this.tableStatusCallback);
        }
        if (this.invoiceUpdateCallback) {
          this.subscribeInvoiceUpdates(this.invoiceUpdateCallback);
        }
        if (this.statsUpdateCallback) {
          this.subscribeStatsUpdates(this.statsUpdateCallback);
        }
      },
      
      onStompError: (frame) => {
        console.error('Dashboard STOMP error:', frame);
        this.handleConnectionError();
      },
      
      onWebSocketClose: () => {
        this.connectionState = 'disconnected';
        this.handleConnectionError();
      },
      
      onWebSocketError: (error) => {
        console.error('Dashboard WebSocket error:', error);
        this.handleConnectionError();
      },
      
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
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

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.token = null; // Clear token on disconnect
  }

  subscribeTableStatus(callback: TableStatusCallback): void {
    this.tableStatusCallback = callback;
    
    if (!this.client || this.connectionState !== 'connected') {
      return; // Silent return - will auto-subscribe when connected
    }

    try {
      const subscription = this.client.subscribe('/topic/table-status', (message) => {
        try {
          const update: TableStatusUpdate = JSON.parse(message.body);
          callback(update);
        } catch (error) {
          console.error('Error parsing table status message:', error);
        }
      });
      
      this.subscriptions.set('table-status', subscription);
    } catch (error) {
      console.error('Error subscribing to table status:', error);
    }
  }

  subscribeInvoiceUpdates(callback: InvoiceUpdateCallback): void {
    this.invoiceUpdateCallback = callback;
    
    if (!this.client || this.connectionState !== 'connected') {
      return; // Silent return - will auto-subscribe when connected
    }

    try {
      const subscription = this.client.subscribe('/topic/invoice-updates', (message) => {
        try {
          const update: InvoiceUpdate = JSON.parse(message.body);
          callback(update);
        } catch (error) {
          console.error('Error parsing invoice update message:', error);
        }
      });
      
      this.subscriptions.set('invoice-updates', subscription);
    } catch (error) {
      console.error('Error subscribing to invoice updates:', error);
    }
  }

  subscribeStatsUpdates(callback: StatsUpdateCallback): void {
    this.statsUpdateCallback = callback;
    
    if (!this.client || this.connectionState !== 'connected') {
      return; // Silent return - will auto-subscribe when connected
    }

    try {
      const subscription = this.client.subscribe('/topic/dashboard-stats', (message) => {
        try {
          const update: DashboardStatsUpdate = JSON.parse(message.body);
          callback(update);
        } catch (error) {
          console.error('Error parsing stats update message:', error);
        }
      });
      
      this.subscriptions.set('dashboard-stats', subscription);
    } catch (error) {
      console.error('Error subscribing to stats updates:', error);
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private handleConnectionError(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionState = 'disconnected';
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connectionState = 'disconnected';
      this.connect(this.token || undefined);
    }, delay);
  }
}
