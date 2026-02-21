import React from 'react';
import { LayoutDashboard, FileText, Users, Settings, FolderOpen } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
      isActive
        ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-medium'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <aside className="w-64 flex-shrink-0 bg-brand-sidebar border-r border-brand-border flex flex-col h-full">
      <div className="h-20 flex items-center px-6 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-gold rounded flex items-center justify-center text-brand-dark font-bold font-serif text-lg transform rotate-45 shadow-lg shadow-brand-gold/20">
            <span className="transform -rotate-45">PB</span>
          </div>
          <span className="font-serif font-bold text-xl text-white tracking-wide">CREATIVE</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div
          className={navItemClass(currentView === ViewState.DASHBOARD)}
          onClick={() => setView(ViewState.DASHBOARD)}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
        
        <div
          className={navItemClass(currentView === ViewState.INVOICES_LIST || currentView === ViewState.CREATE_INVOICE || currentView === ViewState.PREVIEW_INVOICE)}
          onClick={() => setView(ViewState.INVOICES_LIST)}
        >
          <FileText size={20} />
          <span>Invoices</span>
        </div>

        <div 
          className={navItemClass(currentView === ViewState.PROJECTS)}
          onClick={() => setView(ViewState.PROJECTS)}
        >
          <FolderOpen size={20} />
          <span>Projects</span>
        </div>

        <div 
          className={navItemClass(currentView === ViewState.CLIENTS)}
          onClick={() => setView(ViewState.CLIENTS)}
        >
          <Users size={20} />
          <span>Clients</span>
        </div>

        <div 
          className={navItemClass(currentView === ViewState.SETTINGS)}
          onClick={() => setView(ViewState.SETTINGS)}
        >
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </nav>
    </aside>
  );
};