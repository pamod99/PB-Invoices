import React from 'react';
import { InvoiceData, InvoiceStatus } from '../types';
import { Plus, FileText, Edit2, Trash2 } from 'lucide-react';

interface InvoicesListViewProps {
  invoices: InvoiceData[];
  onEdit: (invoice: InvoiceData) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({ invoices, onEdit, onDelete, onCreate }) => {
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'PENDING': return 'text-brand-gold bg-brand-gold/10 border-brand-gold/20';
      case 'OVERDUE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const calculateTotal = (inv: InvoiceData) => {
    const subtotal = inv.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = subtotal * (inv.taxRate / 100);
    return subtotal + taxAmount - (inv.discount || 0);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Invoices</h2>
          <p className="text-gray-400">History of all generated invoices.</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-brand-goldHover transition-colors shadow-lg shadow-brand-gold/10"
        >
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No invoices found</p>
            <p className="text-sm">Create your first invoice to see it here.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-brand-dark text-gray-400 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Invoice #</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-white font-mono text-sm">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{invoice.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{invoice.client.company}</div>
                    <div className="text-xs text-gray-500">{invoice.client.name}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-white">Rs. {calculateTotal(invoice).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(invoice)}
                        className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-brand-gold transition-colors"
                        title="Edit / View"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(invoice.id)}
                        className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};