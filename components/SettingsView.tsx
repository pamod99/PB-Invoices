import React, { useRef, useState, useEffect } from 'react';
import { Save, Building, CreditCard, Download, Upload, Database, Image as ImageIcon, Trash2 } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  currentSettings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

// Helper to convert logo to Base64 with simple compression
const processLogoFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Resize logic: Max width 300px for logos (keeps DB size small)
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          
          if (scaleSize >= 1) {
              canvas.width = img.width;
              canvas.height = img.height;
          } else {
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
          }
  
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          // PNG to keep transparency, but keep it small
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

export const SettingsView: React.FC<SettingsViewProps> = ({ currentSettings, onSaveSettings, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>(currentSettings);

  // Sync with props if they change (e.g. after fetch)
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
            const base64 = await processLogoFile(file);
            setSettings({...settings, businessLogo: base64});
          } catch(err) {
              alert("Could not process logo image.");
          }
      }
  };

  const handleRemoveLogo = () => {
      setSettings({...settings, businessLogo: ''});
      if(logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = () => {
    onSaveSettings(settings);
  };

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto overflow-y-auto h-full pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Settings</h2>
          <p className="text-gray-400">Manage your account preferences and data.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-brand-goldHover transition-colors shadow-lg shadow-brand-gold/10"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Navigation Column */}
        <div className="space-y-2">
          <div className="bg-brand-card p-4 rounded-xl border border-brand-border">
             <div className="w-full flex items-center gap-3 px-4 py-3 bg-brand-gold/10 text-brand-gold rounded-lg font-medium border border-brand-gold/20 mb-2">
               <Building size={20} />
               <span>General & Branding</span>
             </div>
             <div className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 rounded-lg transition-colors">
               <Database size={20} />
               <span>Data & Backup</span>
             </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Business Profile */}
          <section className="bg-brand-card rounded-xl border border-brand-border p-8">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-brand-border pb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Logo Upload Section */}
               <div className="md:col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Business Logo</label>
                  <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-brand-input rounded-lg border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden relative group">
                          {settings.businessLogo ? (
                              <img src={settings.businessLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                              <ImageIcon className="text-gray-600" size={32} />
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="px-4 py-2 bg-brand-input text-white text-sm rounded border border-brand-border hover:border-brand-gold hover:text-brand-gold transition-colors"
                          >
                              {settings.businessLogo ? 'Change Logo' : 'Upload Logo'}
                          </button>
                          {settings.businessLogo && (
                              <button 
                                onClick={handleRemoveLogo}
                                className="px-4 py-2 bg-red-500/10 text-red-400 text-sm rounded border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                              >
                                  <Trash2 size={14} /> Remove
                              </button>
                          )}
                          <input 
                              type="file" 
                              ref={logoInputRef} 
                              className="hidden" 
                              accept="image/png, image/jpeg, image/jpg" 
                              onChange={handleLogoUpload}
                          />
                          <p className="text-xs text-gray-500">Rec: 300x300px PNG (Transparent)</p>
                      </div>
                  </div>
               </div>

               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Business Name</label>
                 <input 
                   type="text" 
                   value={settings.businessName}
                   onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                   className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none"
                 />
               </div>

               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
                 <input 
                   type="email" 
                   value={settings.contactEmail}
                   onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                   className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none"
                 />
               </div>

               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Business Address</label>
                 <textarea 
                   rows={3}
                   value={settings.businessAddress}
                   onChange={(e) => setSettings({...settings, businessAddress: e.target.value})}
                   className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none"
                 />
               </div>
            </div>
          </section>

          {/* Bank Defaults */}
          <section className="bg-brand-card rounded-xl border border-brand-border p-8 border-l-4 border-l-brand-gold">
             <h3 className="text-xl font-bold text-white mb-6 border-b border-brand-border pb-4 flex items-center gap-2">
               <CreditCard className="text-brand-gold" size={24} />
               Default Bank Details
             </h3>
             <p className="text-sm text-gray-400 mb-4">These details will automatically appear on new invoices.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Bank Name</label>
                 <input 
                   type="text" 
                   value={settings.defaultBank.bankName}
                   onChange={(e) => setSettings({...settings, defaultBank: {...settings.defaultBank, bankName: e.target.value}})}
                   className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Account Name</label>
                 <input 
                   type="text" 
                   value={settings.defaultBank.accountName}
                   onChange={(e) => setSettings({...settings, defaultBank: {...settings.defaultBank, accountName: e.target.value}})}
                   className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Account Number</label>
                 <input 
                   type="text" 
                   value={settings.defaultBank.accountNumber}
                   onChange={(e) => setSettings({...settings, defaultBank: {...settings.defaultBank, accountNumber: e.target.value}})}
                   className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none font-mono"
                 />
               </div>
                <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Branch</label>
                 <input 
                   type="text" 
                   value={settings.defaultBank.branch}
                   onChange={(e) => setSettings({...settings, defaultBank: {...settings.defaultBank, branch: e.target.value}})}
                   className="w-full bg-brand-input border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-white py-2.5 px-3 outline-none"
                 />
               </div>
             </div>
          </section>

          {/* Data Management Section (Database) */}
           <section className="bg-brand-card rounded-xl border border-brand-border p-8">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Database className="text-gray-400" size={24} />
              Local File Backup
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Download a local copy of your data (JSON format). Useful for moving data between accounts or manual backups.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={onExport}
                className="flex items-center justify-center gap-3 p-4 bg-brand-input border border-brand-border rounded-xl hover:border-green-500 hover:bg-green-500/5 transition-all group"
              >
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500 group-hover:scale-110 transition-transform">
                  <Download size={24} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-white">Export to File</span>
                  <span className="text-xs text-gray-500">Download .json</span>
                </div>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 p-4 bg-brand-input border border-brand-border rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
              >
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-white">Import File</span>
                  <span className="text-xs text-gray-500">Load .json</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileChange}
                />
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};