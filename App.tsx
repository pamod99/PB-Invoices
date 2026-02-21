import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoicesListView } from './components/InvoicesListView';
import { ProjectsView } from './components/ProjectsView';
import { ClientsView } from './components/ClientsView';
import { SettingsView } from './components/SettingsView';
import { InvoiceData, ViewState, AppSettings, Client, Project } from './types';
import { db, isConfigured } from './firebaseConfig';
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { WifiOff } from 'lucide-react';

// Default Data Generator
const createEmptyInvoice = (invoiceNumber: string, defaultBank: AppSettings['defaultBank']): InvoiceData => ({
  id: Math.random().toString(36).substr(2, 9), // Temporary ID
  invoiceNumber: invoiceNumber,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 12096e5).toISOString().split('T')[0], // +2 weeks
  projectId: '',
  client: {
    id: '',
    name: '',
    company: '',
    address: '',
    email: '',
    phone: ''
  },
  items: [],
  taxRate: 0,
  discount: 0,
  status: 'DRAFT',
  bankDetails: defaultBank
});

const defaultAppSettings: AppSettings = {
  businessName: 'PB Creative',
  businessAddress: '',
  contactEmail: '',
  businessLogo: '',
  defaultImagePrice: 1500,
  defaultBank: {
    bankName: 'Sampath Bank',
    accountName: '',
    accountNumber: '',
    branch: ''
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // State
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  // const [loadingImages, setLoadingImages] = useState(false); // Unused for now, but good for future UI feedback

  // Helper to sync state to local storage
  const syncToLocalStorage = (newInvoices: InvoiceData[], newClients: Client[], newProjects: Project[], newSettings: AppSettings) => {
    localStorage.setItem('pb_invoices', JSON.stringify(newInvoices));
    localStorage.setItem('pb_clients', JSON.stringify(newClients));
    localStorage.setItem('pb_projects', JSON.stringify(newProjects));
    localStorage.setItem('pb_settings', JSON.stringify(newSettings));
  };

  const loadFromLocalStorage = () => {
    const localInvoices = localStorage.getItem('pb_invoices');
    const localClients = localStorage.getItem('pb_clients');
    const localProjects = localStorage.getItem('pb_projects');
    const localSettings = localStorage.getItem('pb_settings');
    
    if (localInvoices) setInvoices(JSON.parse(localInvoices));
    if (localClients) setClients(JSON.parse(localClients));
    if (localProjects) setProjects(JSON.parse(localProjects));
    if (localSettings) setAppSettings(JSON.parse(localSettings));
  };

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (!isConfigured) {
        console.log("Firebase not configured. Defaulting to Offline Mode.");
        setIsOffline(true);
        loadFromLocalStorage();
        setLoading(false);
        return;
      }

      try {
        // Fetch Invoices (Main Docs only - lightweight)
        const invSnapshot = await getDocs(collection(db, "invoices"));
        const fetchedInvoices: InvoiceData[] = [];
        invSnapshot.forEach((doc) => fetchedInvoices.push(doc.data() as InvoiceData));
        
        // Fetch Clients
        const clientSnapshot = await getDocs(collection(db, "clients"));
        const fetchedClients: Client[] = [];
        clientSnapshot.forEach((doc) => fetchedClients.push(doc.data() as Client));

        // Fetch Projects
        const projectSnapshot = await getDocs(collection(db, "projects"));
        const fetchedProjects: Project[] = [];
        projectSnapshot.forEach((doc) => fetchedProjects.push(doc.data() as Project));

        // Fetch Settings
        let fetchedSettings = defaultAppSettings;
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          fetchedSettings = settingsDoc.data() as AppSettings;
        } else {
          try { await setDoc(doc(db, "settings", "general"), defaultAppSettings); } catch(e) {}
        }

        setInvoices(fetchedInvoices);
        setClients(fetchedClients);
        setProjects(fetchedProjects);
        setAppSettings(fetchedSettings);
        syncToLocalStorage(fetchedInvoices, fetchedClients, fetchedProjects, fetchedSettings);
        setIsOffline(false);

      } catch (error) {
        console.warn("Firebase connection failed. Switching to Offline Mode.", error);
        setIsOffline(true);
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Handlers ---

  const handleCreateNewInvoice = () => {
    const nextNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice = createEmptyInvoice(nextNumber, appSettings.defaultBank);
    setActiveInvoice(newInvoice);
    setCurrentView(ViewState.CREATE_INVOICE);
  };

  // Helper to fetch full images for an invoice
  const fetchInvoiceImages = async (invoice: InvoiceData) => {
    if (isOffline || !isConfigured) return invoice;
    
    // Check if we already have images loaded (local state optimization)
    const hasImages = invoice.items.some(item => item.images.length > 0);
    if (hasImages) return invoice;

    // setLoadingImages(true);
    try {
      const imagesSnapshot = await getDocs(collection(db, "invoices", invoice.id, "invoiceImages"));
      const imageMap: Record<string, string[]> = {};

      imagesSnapshot.forEach(doc => {
        const data = doc.data();
        // Doc ID format: itemId_index
        const [itemId] = doc.id.split('_');
        if (!imageMap[itemId]) imageMap[itemId] = [];
        // We need to sort them correctly, but map order is usually insertion order. 
        // For simplicity, we just push. If order matters strictly, we'd need an index field.
        imageMap[itemId].push(data.data);
      });

      const fullInvoice = {
        ...invoice,
        items: invoice.items.map(item => ({
          ...item,
          images: imageMap[item.id] || item.images || []
        }))
      };
      return fullInvoice;
    } catch (e) {
      console.error("Error fetching images:", e);
      return invoice;
    } finally {
      // setLoadingImages(false);
    }
  };

  const handleEditInvoice = async (invoice: InvoiceData) => {
    // If online, try to fetch the full images
    const fullInvoice = await fetchInvoiceImages(invoice);
    setActiveInvoice(fullInvoice);
    setCurrentView(ViewState.CREATE_INVOICE);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const updatedInvoices = invoices.filter(inv => inv.id !== id);
      setInvoices(updatedInvoices);
      syncToLocalStorage(updatedInvoices, clients, projects, appSettings);

      if (!isOffline && isConfigured) {
        try { await deleteDoc(doc(db, "invoices", id)); } catch (e) { setIsOffline(true); }
      }
    }
  };

  const handleSaveInvoice = async () => {
    if (!activeInvoice) return;
    
    // 1. Prepare "Lightweight" Invoice (No Images) for main collection
    const lightweightInvoice = {
      ...activeInvoice,
      items: activeInvoice.items.map(item => {
        const cleanItem = { ...item };
        if (!cleanItem.pages) delete cleanItem.pages;
        cleanItem.images = []; // Strip images
        return cleanItem;
      })
    };

    // 2. Prepare Image Batches
    const imageWrites: { id: string, data: string }[] = [];
    activeInvoice.items.forEach(item => {
      item.images.forEach((imgData, idx) => {
        imageWrites.push({
          id: `${item.id}_${idx}`,
          data: imgData
        });
      });
    });

    // Update Local State (Keep full data for UI)
    const updatedInvoices = invoices.some(inv => inv.id === activeInvoice.id)
      ? invoices.map(inv => inv.id === activeInvoice.id ? activeInvoice : inv)
      : [...invoices, activeInvoice];
    
    setInvoices(updatedInvoices);
    syncToLocalStorage(updatedInvoices, clients, projects, appSettings);

    if (!isOffline && isConfigured) {
      try {
        const batch = writeBatch(db);
        
        // Set Main Doc
        const invoiceRef = doc(db, "invoices", activeInvoice.id);
        batch.set(invoiceRef, lightweightInvoice);

        // Set Images in Subcollection
        // Note: Firestore batch limit is 500. If > 500 images, this needs chunking.
        // Assuming < 500 for now.
        imageWrites.forEach(img => {
          const imgRef = doc(db, "invoices", activeInvoice.id, "invoiceImages", img.id);
          batch.set(imgRef, { data: img.data });
        });

        await batch.commit();
        alert('Invoice saved to cloud!');
      } catch (e: any) {
        console.error("Save error:", e);
        if (e.message && e.message.includes('exceeds the maximum allowed size')) {
           // Fallback if even a single image is > 1MB (unlikely with our compression)
           alert("One of the images is too large. Please try a smaller image.");
        } else {
           setIsOffline(true);
           alert("Connection lost. Invoice saved locally.");
        }
      }
    } else {
      alert('Invoice saved locally (Offline Mode).');
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    syncToLocalStorage(invoices, clients, projects, newSettings);
    if (!isOffline && isConfigured) {
      try { await setDoc(doc(db, "settings", "general"), newSettings); alert("Settings updated in cloud!"); } 
      catch (e) { setIsOffline(true); alert("Connection lost. Settings saved locally."); }
    } else { alert("Settings saved locally."); }
  };

  const handleSaveClient = async (newClient: Client) => {
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    syncToLocalStorage(invoices, updatedClients, projects, appSettings);
    if (!isOffline && isConfigured) {
       try { await setDoc(doc(db, "clients", newClient.id), newClient); } catch(e) { setIsOffline(true); }
    }
  };

  const handleSaveProject = async (newProject: Project) => {
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    syncToLocalStorage(invoices, clients, updatedProjects, appSettings);
    if (!isOffline && isConfigured) {
       try { await setDoc(doc(db, "projects", newProject.id), newProject); } catch(e) { setIsOffline(true); }
    }
  };

  // --- File Backup ---
  const handleExportData = () => {
    const dataStr = JSON.stringify({ invoices, clients, projects, settings: appSettings }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pb_creative_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('Importing will merge/overwrite data. Continue?')) {
             if(json.invoices) setInvoices(json.invoices);
             if(json.clients) setClients(json.clients);
             if(json.projects) setProjects(json.projects);
             if(json.settings) setAppSettings(json.settings);
             syncToLocalStorage(
                json.invoices || invoices, 
                json.clients || clients, 
                json.projects || projects, 
                json.settings || appSettings
             );
        }
      } catch (e) {
        alert('Error parsing backup file.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="h-screen bg-brand-dark flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p>Loading PB Creative Invoice Manager...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return (
          <>
            <header className="h-20 flex items-center justify-between px-8 bg-brand-sidebar border-b border-brand-border flex-shrink-0 z-10">
              <h1 className="text-2xl font-serif font-bold text-white">Dashboard</h1>
              <div className="px-4 py-2 bg-brand-gold text-brand-dark font-bold rounded-lg cursor-pointer hover:bg-brand-goldHover transition-colors"
                onClick={handleCreateNewInvoice}
              >
                + New Invoice
              </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-brand-dark">
              <DashboardStats invoices={invoices} />
            </div>
          </>
        );
      case ViewState.INVOICES_LIST:
        return (
          <InvoicesListView 
            invoices={invoices} 
            onCreate={handleCreateNewInvoice}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
          />
        );
      case ViewState.CREATE_INVOICE:
        return activeInvoice ? (
          <>
             <header className="h-20 flex items-center justify-between px-8 bg-brand-sidebar border-b border-brand-border flex-shrink-0 z-10">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-serif font-bold text-white">
                   {invoices.find(i => i.id === activeInvoice.id) ? 'Edit Invoice' : 'New Invoice'}
                </h1>
                <span className="px-2 py-1 bg-white/5 text-xs rounded text-gray-400 font-mono border border-white/10">#{activeInvoice.invoiceNumber}</span>
              </div>
            </header>
            <InvoiceEditor 
              data={activeInvoice} 
              setData={setActiveInvoice as React.Dispatch<React.SetStateAction<InvoiceData>>} 
              clients={clients}
              projects={projects}
              onSave={handleSaveInvoice}
              onPreview={() => setCurrentView(ViewState.PREVIEW_INVOICE)} 
            />
          </>
        ) : <div>Loading...</div>;
      case ViewState.PREVIEW_INVOICE:
        return activeInvoice ? (
          <InvoicePreview 
            data={activeInvoice} 
            settings={appSettings}
            onEdit={() => setCurrentView(ViewState.CREATE_INVOICE)} 
          />
        ) : <div>No invoice selected</div>;
      case ViewState.PROJECTS:
        return <ProjectsView projects={projects} clients={clients} onAddProject={handleSaveProject} />;
      case ViewState.CLIENTS:
        return <ClientsView clients={clients} onAddClient={handleSaveClient} invoices={invoices} />;
      case ViewState.SETTINGS:
        return (
          <SettingsView 
            currentSettings={appSettings}
            onSaveSettings={handleSaveSettings}
            onExport={handleExportData} 
            onImport={handleImportData} 
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-brand-dark text-white font-sans selection:bg-brand-gold selection:text-brand-dark">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 flex flex-col h-full relative">
        {isOffline && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 px-4 py-1 text-xs font-medium flex items-center justify-center gap-2">
            <WifiOff size={12} />
            {isConfigured ? 
              "Offline Mode: Using local storage (Firebase disconnected)" :
              "Offline Mode: Firebase not configured"
            }
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;