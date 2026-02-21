import React, { useRef, useState } from 'react';
import { InvoiceData, InvoiceItem, InvoiceStatus, Client, Project } from '../types';
import { Plus, Trash2, Upload, Calendar, Building, CreditCard, Image as ImageIcon, Save, X, Loader2, User, FolderOpen } from 'lucide-react';

interface InvoiceEditorProps {
  data: InvoiceData;
  setData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  clients: Client[];
  projects: Project[];
  onPreview: () => void;
  onSave: () => void;
}

// Helper to convert file to compressed Base64
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Resize logic: Max width 600px to save DB space
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        
        // If image is smaller than max, keep original size
        if (scaleSize >= 1) {
            canvas.width = img.width;
            canvas.height = img.height;
        } else {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Compress to JPEG at 50% quality
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ data, setData, clients, projects, onPreview, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [defaultImagePrice, setDefaultImagePrice] = useState<number>(1500);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      price: 0,
      images: []
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (id: string) => {
    setData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // Logic for selecting a client from dropdown
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setData(prev => ({
        ...prev,
        client: { ...selectedClient }
      }));
    }
  };

  // Logic for selecting a project
  const handleProjectSelect = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    
    if (selectedProject) {
        // Find associated client for this project
        const associatedClient = clients.find(c => c.id === selectedProject.clientId);
        
        setData(prev => ({
            ...prev,
            projectId: projectId,
            // If we found a client linked to this project, auto-fill client details too
            client: associatedClient ? { ...associatedClient } : prev.client
        }));
    } else {
        // Deselect
         setData(prev => ({ ...prev, projectId: '' }));
    }
  };

  // Bulk Upload (Create new items for images)
  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsProcessingImages(true);
      const newItems: InvoiceItem[] = [];
      
      try {
        const processedImages = await Promise.all(
            Array.from(files).map(async (file) => {
                const base64 = await processImageFile(file);
                return {
                    name: file.name.split('.')[0] || 'Image Deliverable',
                    data: base64
                };
            })
        );

        processedImages.forEach((img) => {
            newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            description: img.name,
            quantity: 1,
            price: defaultImagePrice,
            images: [img.data]
            });
        });

        setData(prev => ({ ...prev, items: [...prev.items, ...newItems] }));
      } catch (error) {
        console.error("Error processing images", error);
        alert("Failed to process some images.");
      } finally {
        setIsProcessingImages(false);
        // Reset input
        if(event.target) event.target.value = '';
      }
    }
  };

  // Add images to a specific item
  const handleAddImageToItem = async (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsProcessingImages(true);
      try {
          const newUrls = await Promise.all(
            Array.from(files).map(file => processImageFile(file))
          );

          setData(prev => ({
            ...prev,
            items: prev.items.map(item => {
              if (item.id === itemId) {
                const newImages = [...item.images, ...newUrls];
                // Auto-update quantity to match image count
                return { ...item, images: newImages, quantity: newImages.length };
              }
              return item;
            })
          }));
      } catch (error) {
          console.error("Error adding images to item", error);
      } finally {
          setIsProcessingImages(false);
          if(event.target) event.target.value = '';
      }
    }
  };

  const handleRemoveImageFromItem = (itemId: string, imageIndex: number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const newImages = item.images.filter((_, i) => i !== imageIndex);
          // Auto-update quantity to match image count (min 1 to avoid 0 qty)
          return { ...item, images: newImages, quantity: Math.max(1, newImages.length) };
        }
        return item;
      })
    }));
  };

  // Calculations
  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount - (data.discount || 0);

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
        
        {/* Main Editor Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Invoice Details Card */}
          <div className="bg-brand-card rounded-xl shadow-lg border border-brand-border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building className="text-brand-gold" size={20} />
                Invoice Details
              </h2>
              <div className="flex items-center gap-2">
                 <label className="text-sm text-gray-400">Status:</label>
                 <select 
                  value={data.status}
                  onChange={(e) => setData({...data, status: e.target.value as InvoiceStatus})}
                  className="bg-brand-input border border-brand-border rounded px-2 py-1 text-xs text-white outline-none focus:border-brand-gold"
                 >
                   <option value="DRAFT">Draft</option>
                   <option value="PENDING">Pending</option>
                   <option value="PAID">Paid</option>
                 </select>
              </div>
            </div>

            {/* Quick Load Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-brand-input/30 rounded-lg border border-brand-border/50">
               <div>
                  <label className="block text-xs font-bold text-brand-gold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <User size={14} /> Load Existing Client
                  </label>
                  <select 
                    onChange={(e) => handleClientSelect(e.target.value)}
                    value={clients.find(c => c.company === data.client.company)?.id || ''}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg text-white text-sm py-2 px-3 outline-none focus:border-brand-gold"
                  >
                    <option value="">Select Client to Auto-fill...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.company} ({client.name})</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-brand-gold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FolderOpen size={14} /> Link to Project
                  </label>
                  <select 
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    value={data.projectId || ''}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg text-white text-sm py-2 px-3 outline-none focus:border-brand-gold"
                  >
                    <option value="">Select Project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Client Name</label>
                <input 
                  type="text"
                  value={data.client.name}
                  onChange={(e) => setData({...data, client: {...data.client, name: e.target.value}})}
                  className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none transition-all"
                  placeholder="Client Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Company</label>
                <input 
                  type="text"
                  value={data.client.company}
                  onChange={(e) => setData({...data, client: {...data.client, company: e.target.value}})}
                  className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none transition-all"
                  placeholder="Company Name"
                />
              </div>
               <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                <input 
                  type="text"
                  value={data.client.address}
                  onChange={(e) => setData({...data, client: {...data.client, address: e.target.value}})}
                  className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none transition-all"
                  placeholder="Client Address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Invoice Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input 
                    type="date"
                    value={data.date}
                    onChange={(e) => setData({...data, date: e.target.value})}
                    className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 pl-10 pr-3 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input 
                    type="date"
                    value={data.dueDate}
                    onChange={(e) => setData({...data, dueDate: e.target.value})}
                    className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 pl-10 pr-3 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-brand-card rounded-xl shadow-lg border border-brand-border p-6">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon className="text-brand-gold" size={20} />
                Deliverables
              </h2>
              
              <div className="flex items-center gap-2 bg-brand-dark p-2 rounded-lg border border-brand-border">
                <span className="text-xs text-gray-500">Default Price (Rs):</span>
                <input 
                  type="number"
                  value={defaultImagePrice}
                  onChange={(e) => setDefaultImagePrice(Number(e.target.value))}
                  className="w-20 bg-transparent border-b border-gray-600 text-white text-sm text-center outline-none focus:border-brand-gold"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImages}
                  className="ml-2 text-xs bg-brand-input hover:bg-white/10 text-brand-gold font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1 border border-brand-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingImages ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Bulk Upload
                </button>
              </div>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleBulkUpload}
              />
            </div>

            <div className="space-y-4">
              {data.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 p-4 rounded-lg bg-brand-input border border-transparent hover:border-brand-gold/30 transition-colors group">
                  
                  {/* Top Row: Description, Qty, Price */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                     {/* Thumbnail / Add Image */}
                    <div className="col-span-12 sm:col-span-2 flex items-center gap-2">
                       <label className={`w-12 h-12 flex-shrink-0 bg-gray-800 rounded overflow-hidden relative ring-1 ring-white/5 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors ${isProcessingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isProcessingImages ? <Loader2 className="text-gray-500 animate-spin" size={20} /> : <Plus className="text-gray-500" size={20} />}
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleAddImageToItem(item.id, e)}
                          />
                       </label>
                       {item.images.length > 0 && (
                         <div className="text-xs text-gray-400">
                           {item.images.length} images
                         </div>
                       )}
                    </div>

                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-xs text-gray-400 mb-1">Description</label>
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-brand-border focus:ring-0 focus:border-brand-gold px-0 py-1 text-sm font-medium text-white placeholder-gray-600"
                        placeholder="Item Description"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <input 
                          type="checkbox"
                          id={`pages-toggle-${item.id}`}
                          checked={(item.pages || 0) > 0}
                          onChange={(e) => handleUpdateItem(item.id, 'pages', e.target.checked ? 1 : 0)}
                          className="w-3 h-3 rounded border-gray-600 text-brand-gold focus:ring-brand-gold bg-transparent"
                        />
                        <label htmlFor={`pages-toggle-${item.id}`} className="text-xs text-gray-500 cursor-pointer select-none">Include Pages</label>
                        
                        {(item.pages || 0) > 0 && (
                          <div className="flex items-center gap-1 ml-2">
                             <span className="text-xs text-gray-500">Count:</span>
                             <input 
                               type="number"
                               value={item.pages}
                               onChange={(e) => handleUpdateItem(item.id, 'pages', parseInt(e.target.value) || 0)}
                               className="w-12 bg-brand-card border border-brand-border rounded px-1 py-0.5 text-xs text-center text-white focus:border-brand-gold outline-none"
                             />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Qty</label>
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full bg-brand-card border border-brand-border rounded px-2 py-1 text-sm text-center text-white focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-xs text-gray-400 mb-1">Price (Rs)</label>
                      <input 
                         type="number" 
                         value={item.price}
                         onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                         className="w-full bg-brand-card border border-brand-border rounded px-2 py-1 text-sm text-right font-mono text-white focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end pt-5">
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/5"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Horizontal Scrollable Images */}
                  {item.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {item.images.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 flex-shrink-0 group/img bg-brand-card rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => handleRemoveImageFromItem(item.id, idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}

              <button 
                onClick={handleAddItem}
                className="w-full py-4 border-2 border-dashed border-brand-border rounded-lg text-gray-400 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/5 transition-all flex items-center justify-center gap-2 group"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                Add New Item
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Summary Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-brand-card rounded-xl shadow-lg border border-brand-border overflow-hidden sticky top-4">
            <div className="h-2 bg-gradient-to-r from-brand-navy via-brand-gold to-brand-navy"></div>
            <div className="p-6">
              <h3 className="font-serif text-lg font-bold text-white mb-6">Payment Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">Rs. {subtotal.toLocaleString()}</span>
                </div>
                 
                 {/* Tax Input */}
                 <div className="flex justify-between items-center text-sm text-gray-400">
                  <span className="flex items-center gap-1">Tax Rate (%)</span>
                  <input 
                    type="number" 
                    value={data.taxRate} 
                    onChange={(e) => setData({...data, taxRate: parseFloat(e.target.value) || 0})}
                    className="w-16 bg-brand-input border border-brand-border rounded px-2 py-0.5 text-right text-white text-xs outline-none focus:border-brand-gold"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Tax Amount</span>
                  <span className="font-mono text-white">Rs. {taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>

                {/* Discount Input */}
                 <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Discount (Rs)</span>
                  <input 
                    type="number" 
                    value={data.discount} 
                    onChange={(e) => setData({...data, discount: parseFloat(e.target.value) || 0})}
                    className="w-24 bg-brand-input border border-brand-border rounded px-2 py-0.5 text-right text-white text-xs outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="border-t border-brand-border pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-white">Total</span>
                    <span className="font-bold text-2xl text-brand-gold font-mono">Rs. {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-brand-input p-4 rounded-lg text-gray-300 text-sm space-y-2 mb-6 border border-brand-border">
                <div className="flex items-start gap-3">
                  <CreditCard className="text-brand-gold mt-1" size={16} />
                  <div>
                    <p className="font-semibold text-brand-gold mb-1">Bank Details</p>
                    <input 
                      className="bg-transparent border-b border-gray-700 w-full mb-1 focus:border-brand-gold outline-none" 
                      value={data.bankDetails.bankName}
                      onChange={(e) => setData({...data, bankDetails: {...data.bankDetails, bankName: e.target.value}})}
                    />
                     <input 
                      className="bg-transparent border-b border-gray-700 w-full mb-1 focus:border-brand-gold outline-none font-mono text-xs" 
                      value={data.bankDetails.accountNumber}
                      onChange={(e) => setData({...data, bankDetails: {...data.bankDetails, accountNumber: e.target.value}})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={onSave}
                  className="w-full bg-brand-navy hover:bg-brand-navy/80 border border-brand-gold/30 text-white font-bold py-3.5 rounded-lg transition-all flex justify-center items-center gap-2 group"
                >
                  <Save size={18} className="text-brand-gold" />
                  Save Draft / Update
                </button>

                <button 
                  onClick={onPreview}
                  className="w-full bg-brand-gold hover:bg-brand-goldHover text-brand-dark font-bold py-3.5 rounded-lg shadow-lg shadow-brand-gold/20 transition-all flex justify-center items-center gap-2 group"
                >
                  Generate Preview
                  <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper icon component since Lucide arrow-right is simple
const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);