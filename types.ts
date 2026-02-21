export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  images: string[];
  pages?: number;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  address: string;
  email: string;
  phone: string;
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string; // Store name for easier display
  status: 'Not Started' | 'In Progress' | 'Pending Review' | 'Completed';
  dueDate: string;
  description: string;
  progress: number;
}

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE';

export interface InvoiceData {
  id: string; 
  invoiceNumber: string;
  date: string;
  dueDate: string;
  projectId?: string; // Linked Project ID
  client: Client;
  items: InvoiceItem[];
  taxRate: number; 
  discount: number; 
  status: InvoiceStatus;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
}

export interface AppSettings {
  businessName: string;
  businessAddress: string;
  contactEmail: string;
  businessLogo?: string;
  defaultBank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  defaultImagePrice: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVOICES_LIST = 'INVOICES_LIST',
  CREATE_INVOICE = 'CREATE_INVOICE',
  PREVIEW_INVOICE = 'PREVIEW_INVOICE',
  PROJECTS = 'PROJECTS',
  CLIENTS = 'CLIENTS',
  SETTINGS = 'SETTINGS',
}