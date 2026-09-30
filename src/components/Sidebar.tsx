/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderGit2, 
  FileSpreadsheet, 
  Upload,
  Wand2, 
  ClipboardList, 
  TableProperties, 
  Coins, 
  Database, 
  History,
  Droplet,
  Boxes,
  Workflow,
  Terminal,
  Trash2,
  ChevronDown,
  Plus,
  Save,
  MapPin,
  User,
  Clock
} from 'lucide-react';
import { Project } from '../types';

export type PageId = 
  | 'dashboard' 
  | 'projects'
  | 'project' 
  | 'import-center'
  | 'upload' 
  | 'ai-extract' 
  | 'boq' 
  | 'bom'
  | 'price-sources'
  | 'rap' 
  | 'profit' 
  | 'master-data' 
  | 'audit'
  | 'flowchart'
  | 'button-qa';

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  projectName: string;
  projectStatus: string;
  onClearCurrentProject?: () => void;
  // Extended fields for Project Management
  projects: Project[];
  activeProjectId: string;
  onSwitchProject: (projectId: string) => void;
  onNewProjectClick: () => void;
  onSaveProjectClick: () => void;
  saveStatus: 'Saving' | 'Saved' | 'Save Failed' | 'Unsaved Changes';
  lastSavedTime?: string;
}

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  projectName, 
  projectStatus, 
  onClearCurrentProject,
  projects,
  activeProjectId,
  onSwitchProject,
  onNewProjectClick,
  onSaveProjectClick,
  saveStatus,
  lastSavedTime
}: SidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main Menu' },
    { id: 'projects', label: 'Projects', icon: FolderGit2, category: 'Main Menu' },
    { id: 'project', label: 'Project Info & Survey', icon: ClipboardList, category: 'Main Menu' },
    { id: 'import-center', label: 'Data Import Center', icon: FileSpreadsheet, category: 'Data Ingestion' },
    { id: 'upload', label: 'Project BOQ Upload', icon: Upload, category: 'Data Ingestion' },
    { id: 'ai-extract', label: 'AI Sketch Scan', icon: Wand2, category: 'Data Ingestion' },
    { id: 'boq', label: 'BOQ Estimates', icon: ClipboardList, category: 'Costing Engine' },
    { id: 'bom', label: 'Bill of Materials', icon: Boxes, category: 'Costing Engine' },
    { id: 'price-sources', label: 'Price Sources Center', icon: Droplet, category: 'Costing Engine' },
    { id: 'rap', label: 'RAP Unit Cost', icon: TableProperties, category: 'Costing Engine' },
    { id: 'profit', label: 'Profit Summary', icon: Coins, category: 'Review' },
    { id: 'master-data', label: 'Master Price Library', icon: Database, category: 'System Data' },
    { id: 'audit', label: 'Approval & Change History', icon: History, category: 'System Data' },
    { id: 'flowchart', label: 'Process Flowchart', icon: Workflow, category: 'System Data' },
    { id: 'button-qa', label: 'Button QA Console', icon: Terminal, category: 'System Data' },
  ] as const;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Engineer Reviewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BOQ Approved':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RAP Approved':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Management Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const activeProjectObj = projects.find(p => p.id === activeProjectId);

  const formatLastUpdated = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      return `Today, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };


  return (
    <aside className="w-56 border-r border-slate-200 bg-white p-4 flex flex-col gap-1 shrink-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-1 py-2 mb-2 shrink-0">
        <div className="w-8 h-8 bg-blue-700 flex items-center justify-center rounded text-white font-bold text-xs uppercase shrink-0">
          <span>BPM</span>
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-tight text-slate-800 leading-tight">RAP Automation</h1>
          <p className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">System v1.1</p>
        </div>
      </div>

      {/* Project Switcher Panel */}
      <div className="relative mb-4 shrink-0 px-1" ref={dropdownRef}>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Project:</span>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
        >
          <span className="truncate max-w-[120px]">{projectName || 'Select Project...'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Dropdown Container */}
        {isDropdownOpen && (
          <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50 flex justify-between">
              <span>Workspaces ({projects.length})</span>
              <span className="text-[8px] lowercase font-normal">Switching mounts sandbox</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {projects.map((p) => {
                const isActive = p.id === activeProjectId;
                const isArchived = (p as any).isArchived;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchProject(p.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 flex flex-col gap-1 transition-colors hover:bg-slate-50 cursor-pointer ${
                      isActive ? 'bg-blue-50/50 hover:bg-blue-50' : ''
                    } ${isArchived ? 'opacity-60 bg-slate-50/20' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold text-xs truncate max-w-[145px] ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                        {p.name}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        p.status === 'Draft' ? 'bg-slate-100 text-slate-500' :
                        p.status === 'Engineer Reviewed' ? 'bg-blue-50 text-blue-600' :
                        p.status === 'BOQ Approved' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-medium text-slate-400">
                      <span className="truncate flex items-center gap-0.5"><User className="w-2.5 h-2.5 shrink-0" /> {p.client || '—'}</span>
                      <span className="truncate flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 shrink-0" /> {p.location || '—'}</span>
                      <span className="col-span-2 mt-0.5 text-[8px] font-mono text-slate-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" /> Last updated: {formatLastUpdated(p.lastUpdated)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* New & Save Project buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px]">
          <button
            onClick={onNewProjectClick}
            className="flex items-center justify-center gap-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold uppercase rounded-lg tracking-wider border border-blue-200/40 transition-all active:scale-95 cursor-pointer"
            title="Create a new engineering project workspace"
          >
            <Plus className="w-3 h-3 shrink-0" /> New
          </button>
          
          <button
            onClick={onSaveProjectClick}
            className={`flex items-center justify-center gap-1 py-1.5 font-bold uppercase rounded-lg tracking-wider border transition-all active:scale-95 cursor-pointer ${
              saveStatus === 'Unsaved Changes'
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-250 border-amber-200 animate-pulse'
                : saveStatus === 'Saving'
                ? 'bg-slate-50 text-slate-500 border-slate-200 animate-pulse cursor-wait'
                : saveStatus === 'Save Failed'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}
            title="Save all changes manually"
            disabled={saveStatus === 'Saving'}
          >
            <Save className="w-3 h-3 shrink-0" /> Save
          </button>
        </div>

        {/* Real-time Save Status Indicators */}
        <div className="flex items-center justify-between text-[8px] font-mono font-medium text-slate-400 px-1 mt-1.5">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === 'Saved' ? 'bg-emerald-500 animate-none' :
              saveStatus === 'Saving' ? 'bg-slate-400 animate-ping' :
              saveStatus === 'Unsaved Changes' ? 'bg-amber-500 animate-pulse' :
              'bg-rose-500'
            }`} />
            {saveStatus}
          </span>
          {lastSavedTime && <span>Saved: {lastSavedTime}</span>}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-1">
            <p className="px-2 text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">{category}</p>
            <nav className="flex flex-col gap-0.5">
              {menuItems
                .filter((item) => item.category === category)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded cursor-pointer transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-700 font-bold' : 'text-slate-405 text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
        ))}
      </div>

      {onClearCurrentProject && (
        <div className="px-2 py-2 border-t border-slate-105 shrink-0">
          <button
            onClick={onClearCurrentProject}
            id="sidebar-btn-clear-project"
            className="w-full py-2 px-3 bg-red-650 bg-red-650 bg-red-600 hover:bg-red-700 text-white border border-red-700 text-[10px] font-bold uppercase rounded-lg tracking-wider flex items-center justify-center gap-1.5 cursor-pointer duration-100 transition-colors shadow-sm select-none"
          >
            <Trash2 className="w-4 h-4 text-white shrink-0" />
            Clear Current Project Data
          </button>
        </div>
      )}

      {/* Corporate Footprint */}
      <div className="mt-auto pt-3 border-t border-slate-100 text-center shrink-0">
        <p className="text-[9px] text-slate-400 font-bold">PT BPM Engineering</p>
        <p className="text-[8px] text-slate-450 text-slate-400 mt-0.5">Workforce Dashboard</p>
      </div>
    </aside>
  );
}
