import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { InvoiceData } from '../types';

interface DashboardStatsProps {
  invoices: InvoiceData[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ invoices }) => {
  
  // Calculate Totals Helper
  const calculateInvoiceTotal = (inv: InvoiceData) => {
    const subtotal = inv.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = subtotal * (inv.taxRate / 100);
    return subtotal + taxAmount - (inv.discount || 0);
  };

  // 1. Total Revenue (Paid Invoices Only)
  const totalRevenue = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((acc, inv) => acc + calculateInvoiceTotal(inv), 0);
  }, [invoices]);

  // 2. Pending Amount
  const pendingAmount = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'PENDING')
      .reduce((acc, inv) => acc + calculateInvoiceTotal(inv), 0);
  }, [invoices]);

  const pendingCount = invoices.filter(inv => inv.status === 'PENDING').length;

  // 3. Paid Count
  const paidCount = invoices.filter(inv => inv.status === 'PAID').length;

  // 4. Overdue Count
  const overdueCount = invoices.filter(inv => inv.status === 'OVERDUE').length;

  // 5. Chart Data (Monthly Revenue from Paid Invoices)
  const chartData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    invoices.forEach(inv => {
      if (inv.status === 'PAID') {
        const date = new Date(inv.date);
        const monthName = date.toLocaleString('default', { month: 'short' });
        monthlyData[monthName] = (monthlyData[monthName] || 0) + calculateInvoiceTotal(inv);
      }
    });

    return Object.keys(monthlyData).map(key => ({
      name: key,
      amount: monthlyData[key]
    }));
  }, [invoices]);

  // 6. Recent Activity (Last 5 Invoices)
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-white mt-1">Rs. {totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs text-green-400 flex items-center gap-1">
             <span className="text-gray-500">Total collected</span>
          </p>
        </div>

        <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending</p>
              <h3 className="text-2xl font-bold text-white mt-1">Rs. {pendingAmount.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500">{pendingCount} Invoices pending</p>
        </div>

        <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Paid Invoices</p>
              <h3 className="text-2xl font-bold text-white mt-1">{paidCount}</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500">Invoices paid fully</p>
        </div>
        
        <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Overdue</p>
              <h3 className="text-2xl font-bold text-white mt-1">{overdueCount}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500">Action required</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">Revenue Overview (Paid)</h3>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value}`} />
                  <Tooltip 
                    cursor={{fill: '#2a2e36'}}
                    contentStyle={{ backgroundColor: '#181b21', borderColor: '#2a2e36', color: '#fff' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={'#eec643'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No revenue data available yet.
               </div>
            )}
          </div>
        </div>

        <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentInvoices.length > 0 ? recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-brand-dark transition-colors border border-transparent hover:border-brand-border">
                <div className="w-10 h-10 rounded bg-brand-input flex items-center justify-center text-brand-gold font-serif font-bold text-xs">
                  INV
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{inv.client.company || "Unknown Client"}</p>
                  <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                   <span className="block text-sm font-mono text-gray-300">Rs. {calculateInvoiceTotal(inv).toLocaleString()}</span>
                   <span className={`text-[10px] px-1.5 rounded border ${
                      inv.status === 'PAID' ? 'text-green-400 border-green-500/20' : 
                      inv.status === 'PENDING' ? 'text-brand-gold border-brand-gold/20' : 
                      'text-gray-400 border-gray-500/20'
                   }`}>{inv.status}</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 text-sm py-4">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};