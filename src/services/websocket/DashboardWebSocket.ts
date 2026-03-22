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
  
  private tableStatusCallback: TableStatusCallback | null = null;
  private invoiceUpdateCallback: InvoiceUpdateCallback | null = null;
  private statsUpdateCallback: StatsUpdateCallback | null = null;

  constructor(wsUrl: string = 'http://localhost:8080/ws') {
    this.wsUrl = wsUrl;
  }

  connect(token?: string): void {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      console.log('Dashboard WebSocket already connected or connecting');
      return;
    }

    if (!token) {
      console.error('❌ Cannot connect to Dashboard WebSocket: No token provided');
      return;
    }

    this.connectionState = 'connecting';
    console.log('🔌 Connecting to Dashboard WebSocket...', { url: this.wsUrl, hasToken: !!token });

    const socketUrl = `${this.wsUrl}?token=${token}`;
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl) as WebSocket,
      
      onConnect: () => {
        console.log('✅ Dashboard WebSocket connected successfully');
        console.log('📊 Connection state:', this.connectionState, '-> connected');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        
        // Auto-subscribe to all topics if callbacks are set
        console.log('🔔 Checking for pending subscriptions...', {
          hasTableStatusCallback: !!this.tableStatusCallback,
          hasInvoiceUpdateCallback: !!this.invoiceUpdateCallback,
          hasStatsUpdateCallback: !!this.statsUpdateCallback
        });
        
        if (this.tableStatusCallback) {
          console.log('📡 Auto-subscribing to table status updates...');
          this.subscribeTableStatus(this.tableStatusCallback);
        }
        if (this.invoiceUpdateCallback) {
          console.log('📡 Auto-subscribing to invoice updates...');
          this.subscribeInvoiceUpdates(this.invoiceUpdateCallback);
        }
        if (this.statsUpdateCallback) {
          console.log('📡 Auto-subscribing to stats updates...');
          this.subscribeStatsUpdates(this.statsUpdateCallback);
        }
      },
      
      onStompError: (frame) => {
        console.error('❌ Dashboard STOMP error:', frame);
        this.handleConnectionError();
      },
      
      onWebSocketClose: () => {
        console.log('🔌 Dashboard WebSocket connection closed');
        this.connectionState = 'disconnected';
        this.handleConnectionError();
      },
      
      onWebSocketError: (error) => {
        console.error('❌ Dashboard WebSocket error:', error);
        this.handleConnectionError();
      },
      
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 0,
    });

    this.client.activate();
  }

  disconnect(): void {
    console.log('Disconnecting Dashboard WebSocket...');
    
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
  }

  subscribeTableStatus(callback: TableStatusCallback): void {
    console.log('📡 subscribeTableStatus called', {
      hasCallback: !!callback,
      hasClient: !!this.client,
      connectionState: this.connectionState
    });
    
    this.tableStatusCallback = callback;
    
    if (!this.client || this.connectionState !== 'connected') {
      console.warn('⚠️ Cannot subscribe to table status: WebSocket not connected. Will auto-subscribe when connected.');
      return;
    }

    try {
      const subscription = this.client.subscribe('/topic/table-status', (message) => {
        try {
          console.log('📨 Raw message received on /topic/table-status:', message.body);
          const update: TableStatusUpdate = JSON.parse(message.body);
          console.log('✅ Parsed table status update:', update);
          callback(update);
        } catch (error) {
          console.error('❌ Error parsing table status message:', error);
        }
      });
      
      this.subscriptions.set('table-status', subscription);
      console.log('✅ Successfully subscribed to /topic/table-status');
    } catch (error) {
      console.error('❌ Error subscribing to table status:', error);
    }
  }

  subscribeInvoiceUpdates(callback: InvoiceUpdateCallback): void {
    this.invoiceUpdateCallback = callback;
    
    if (!this.client || this.connectionState !== 'connected') {
      console.warn('Cannot subscribe to invoice updates: WebSocket not connected');
      return;
    }

    try {
      const subscription = this.client.subscribe('/topic/invoice-updates', (message) => {
        try {
          const update: InvoiceUpdate = JSON.parse(message.body);
          console.log('Received invoice update:', update);
          callback(update);
        } catch (error) {
          console.error('Error parsing invoice update message:', error);
        }
      });
      
      this.subscriptions.set('invoice-updates', subscription);
      console.log('Subscribed to /topic/invoice-updates');
    } catch (error) {
      console.error('Error subscribing to invoice updates:', error);
    }
  }

  subscribeStatsUpdates(callback: StatsUpdateCallback): void {
    this.statsUpdateCallback = callback;
    
    if (!this.client || this.connectionState !== 'connected') {
      console.warn('Cannot subscribe to stats updates: WebSocket not connected');
      return;
    }

    try {
      const subscription = this.client.subscribe('/topic/dashboard-stats', (message) => {
        try {
          const update: DashboardStatsUpdate = JSON.parse(message.body);
          console.log('Received dashboard stats update:', update);
          callback(update);
        } catch (error) {
          console.error('Error parsing stats update message:', error);
        }
      });
      
      this.subscriptions.set('dashboard-stats', subscription);
      console.log('Subscribed to /topic/dashboard-stats');
    } catch (error) {
      console.error('Error subscribing to stats updates:', error);
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private handleConnectionError(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached for Dashboard WebSocket');
      this.connectionState = 'disconnected';
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;
    
    console.log(`Reconnecting Dashboard WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connectionState = 'disconnected';
      this.connect();
    }, delay);
  }
}
