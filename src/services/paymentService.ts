import axiosInstance from './axiosInstance';

export interface TableSummary {
  id: number;
  tableName: string;
  seatingCapacity: number;
}

export interface InvoiceItem {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface InvoiceSummary {
  invoiceId: number;
  invoiceCode: string;
  invoiceStatus: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  tables: TableSummary[];
  items: InvoiceItem[];
  subtotal: number;
  checkedInAt: string;
}

export const paymentService = {
  async getAllInProgressInvoices(): Promise<InvoiceSummary[]> {
    const response = await axiosInstance.get('/api/reception/payment/all-in-progress');
    return response.data.data;
  },

  async getInvoiceByTable(tableId: number): Promise<InvoiceSummary> {
    const response = await axiosInstance.get(`/api/reception/payment/by-table/${tableId}`);
    return response.data.data;
  }
};
