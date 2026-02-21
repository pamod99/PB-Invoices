import React, { useState } from 'react';
import { Plus, MoreHorizontal, Clock, X, FolderOpen } from 'lucide-react';
import { Project, Client } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  onAddProject: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, clients, onAddProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    clientId: '',
    status: 'Not Started',
    dueDate: '',
    description: '',
    progress: 0
  });

  const handleSave = () => {
    if (!newProject.title || !newProject.clientId) {
      alert("Project Title and Client are required.");
      return;
    }

    const selectedClient = clients.find(c => c.id === newProject.clientId);
    const projectToAdd: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: newProject.title || '',
      clientId: newProject.clientId || '',
      clientName: selectedClient ? selectedClient.company : 'Unknown',
      status: newProject.status as any,
      dueDate: newProject.dueDate || new Date().toISOString().split('T')[0],
      description: newProject.description || '',
      progress: newProject.progress || 0
    };

    onAddProject(projectToAdd);
    setIsModalOpen(false);
    setNewProject({ title: '', clientId: '', status: 'Not Started', dueDate: '', description: '', progress: 0 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-brand-gold bg-brand-gold/10 border-brand-gold/20';
      case 'Completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Pending Review': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="p-8 animate-fade-in h-full flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Projects</h2>
          <p className="text-gray-400">Manage your creative deliverables and deadlines.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-brand-goldHover transition-colors"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20">
        {projects.map((project) => (
          <div key={project.id} className="bg-brand-card rounded-xl border border-brand-border overflow-hidden hover:border-brand-gold/50 transition-all group flex flex-col h-64">
             {/* Header Section */}
             <div className="p-5 border-b border-white/5 flex-1">
                <div className="flex justify-between items-start mb-2">
                   <div className={`p-2 rounded-lg ${getStatusColor(project.status)} bg-opacity-10 border bg-transparent mb-3 inline-block`}>
                      <FolderOpen size={20} />
                   </div>
                   <button className="text-gray-500 hover:text-white">
                      <MoreHorizontal size={18} />
                   </button>
                </div>
                <h3 className="font-bold text-white text-lg leading-tight mb-1 truncate">{project.title}</h3>
                <p className="text-sm text-gray-500">{project.clientName}</p>
             </div>

            {/* Footer / Stats */}
            <div className="p-5 bg-black/20">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                   <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{project.dueDate}</span>
                   </div>
                   <span className={`px-2 py-0.5 rounded border text-[10px] ${getStatusColor(project.status)}`}>
                      {project.status}
                   </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-brand-dark rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-gold rounded-full transition-all duration-1000" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* New Project Placeholder Card */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-card/30 rounded-xl border-2 border-dashed border-brand-border flex flex-col items-center justify-center h-64 text-gray-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/5 transition-all cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full bg-brand-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
            <Plus size={32} />
          </div>
          <p className="font-medium">Create New Project</p>
        </div>
      </div>

       {/* Add Project Modal */}
       {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-brand-card border border-brand-border p-6 rounded-xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">New Project</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Project Title *</label>
                    <input 
                      type="text" 
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      className="w-full bg-brand-input border border-brand-border rounded-lg px-3 py-2 text-white focus:border-brand-gold outline-none"
                      placeholder="e.g., Summer Campaign"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Client *</label>
                    <select 
                      value={newProject.clientId}
                      onChange={(e) => setNewProject({...newProject, clientId: e.target.value})}
                      className="w-full bg-brand-input border border-brand-border rounded-lg px-3 py-2 text-white focus:border-brand-gold outline-none"
                    >
                      <option value="">Select a Client...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.company} ({client.name})</option>
                      ))}
                    </select>
                    {clients.length === 0 && <p className="text-xs text-red-400 mt-1">Please add clients first.</p>}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                        <input 
                          type="date" 
                          value={newProject.dueDate}
                          onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                          className="w-full bg-brand-input border border-brand-border rounded-lg px-3 py-2 text-white focus:border-brand-gold outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Status</label>
                        <select 
                          value={newProject.status}
                          onChange={(e) => setNewProject({...newProject, status: e.target.value as any})}
                          className="w-full bg-brand-input border border-brand-border rounded-lg px-3 py-2 text-white focus:border-brand-gold outline-none"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending Review">Pending Review</option>
                          <option value="Completed">Completed</option>
                        </select>
                    </div>
                 </div>
                  <div>
                        <label className="block text-sm text-gray-400 mb-1">Initial Progress (%)</label>
                        <input 
                          type="range" 
                          min="0" max="100"
                          value={newProject.progress}
                          onChange={(e) => setNewProject({...newProject, progress: parseInt(e.target.value)})}
                          className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-brand-gold"
                        />
                        <div className="text-right text-xs text-brand-gold font-mono">{newProject.progress}%</div>
                    </div>

                 <button 
                  onClick={handleSave}
                  className="w-full mt-4 bg-brand-gold text-brand-dark font-bold py-3 rounded-lg hover:bg-brand-goldHover transition-colors"
                 >
                   Create Project
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};