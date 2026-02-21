import React, { useState } from 'react';
import { Search, MoreVertical, Mail, Phone, Plus, User, Building, MapPin, X } from 'lucide-react';
import { Client, InvoiceData } from '../types';

interface ClientsViewProps {
  clients: Client[];
  invoices: InvoiceData[];
  onAddClient: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ clients, invoices, onAddClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSave = () => {
    if (!newClient.name || !newClient.company) {
      alert("Name and Company are required.");
      return;
    }
    const clientToAdd: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClient.name || '',
      company: newClient.company || '',
      email: newClient.email || '',
      phone: newClient.phone || '',
      address: newClient.address || ''
    };
    onAddClient(clientToAdd);
    setIsModalOpen(false);
    setNewClient({ name: '', company: '', email: '', phone: '', address: '' });
  };

  // Filter clients
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in h-full flex flex-col relative">
       {/* Header */}
       <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Clients</h2>
          <p className="text-gray-400">Manage your client relationships and contact details.</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
             <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-brand-card border border-brand-border rounded-lg pl-10 pr-4 py-2 text-white focus:border-brand-gold outline-none w-64"
             />
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-brand-goldHover transition-colors"
            >
            <Plus size={18} />
            Add Client
          </button>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden flex-1 overflow-y-auto">
        {clients.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <User size={48} className="opacity-20" />
              <p>No clients found. Add a new client to get started.</p>
           </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-brand-dark text-gray-400 text-sm uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Client Details</th>
                <th className="px-6 py-4 font-medium">Contact Info</th>
                <th className="px-6 py-4 font-medium">Address</th>
                <th className="px-6 py-4 font-medium text-right">Invoices</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filteredClients.map((client) => {
                // Basic calculation of invoiced count for this client (matched by name as simple logic)
                const invoiceCount = invoices.filter(inv => inv.client.company === client.company).length;
                return (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold text-lg">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{client.name}</p>
                          <p className="text-gray-500 text-sm">{client.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm text-gray-400">
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} /> {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {client.address}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-sm text-brand-gold font-mono">{invoiceCount} Inv</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-500 hover:text-white p-2 rounded hover:bg-white/10">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-brand-card border border-brand-border p-6 rounded-xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Add New Client</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Contact Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 text-gray-600" size={16} />
                      <input 
                        type="text" 
                        value={newClient.name}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                        className="w-full bg-brand-input border border-brand-border rounded-lg pl-10 pr-3 py-2 text-white focus:border-brand-gold outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Company Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 text-gray-600" size={16} />
                      <input 
                        type="text" 
                        value={newClient.company}
                        onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                        className="w-full bg-brand-input border border-brand-border rounded-lg pl-10 pr-3 py-2 text-white focus:border-brand-gold outline-none"
                        placeholder="Acme Corp"
                      />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input 
                          type="email" 
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          className="w-full bg-brand-input border border-brand-border rounded-lg px-3 py-2 text-white focus:border-brand-gold outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone</label>
                        <input 
                          type="text" 
                          value={newClient.phone}
                          onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                          className="w-full bg-brand-input border border-brand-border rounded-lg px-3 py-2 text-white focus:border-brand-gold outline-none"
                        />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 text-gray-600" size={16} />
                      <input 
                        type="text" 
                        value={newClient.address}
                        onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                        className="w-full bg-brand-input border border-brand-border rounded-lg pl-10 pr-3 py-2 text-white focus:border-brand-gold outline-none"
                        placeholder="123 Street, City"
                      />
                    </div>
                 </div>

                 <button 
                  onClick={handleSave}
                  className="w-full mt-4 bg-brand-gold text-brand-dark font-bold py-3 rounded-lg hover:bg-brand-goldHover transition-colors"
                 >
                   Save Client
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};