/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Copy, 
  Archive, 
  FolderOpen, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  X,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Project } from '../types';

interface ProjectsPageProps {
  projects: Project[];
  activeProjectId: string;
  onOpenProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onNewProjectClick: () => void;
}

export default function ProjectsPage({
  projects,
  activeProjectId,
  onOpenProject,
  onDuplicateProject,
  onArchiveProject,
  onDeleteProject,
  onNewProjectClick
}: ProjectsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmProj, setDeleteConfirmProj] = useState<Project | null>(null);
  const [deleteInputName, setDeleteInputName] = useState('');

  // Read project records bundle dynamically to extract real RAP total and profit margins
  const getProjectMetrics = (projectId: string, poValue: number) => {
    const recordsKey = `bpm_project_records_${projectId}`;
    const cached = localStorage.getItem(recordsKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const rapItems = parsed.rapItems || [];
        let rapTotal = 0;
        if (Array.isArray(rapItems)) {
          rapTotal = rapItems.reduce((acc: number, item: any) => acc + (item.totalCost || 0), 0);
        }
        const profit = poValue - rapTotal;
        const margin = poValue > 0 ? (profit / poValue) * 100 : 0;
        const fileCount = Array.isArray(parsed.uploadedFilesMetadata) 
          ? parsed.uploadedFilesMetadata.length 
          : (parsed.projectInfo?.aiDrawingAnalysis?.scanFiles?.length || 0);

        return { rapTotal, profit, margin, fileCount };
      } catch (e) {
        console.error("Error reading project metrics", e);
      }
    }
    return { rapTotal: 0, profit: 0, margin: 0, fileCount: 0 };
  };

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredProjects = projects.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.client || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  });

  const handleDeleteTrigger = (project: Project) => {
    setDeleteConfirmProj(project);
    setDeleteInputName('');
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmProj && deleteInputName === deleteConfirmProj.name) {
      onDeleteProject(deleteConfirmProj.id);
      setDeleteConfirmProj(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Engineering Project Workspace</h2>
          </div>
          <p className="text-xs text-slate-500 leading-normal max-w-xl font-sans">
            Manage all PT Bestindo Putra Mandiri client engineering files, survey checklists, 
            CAD diagrams, pricing schemas, and final RAP unit costs. Switching workspace mounts the sandbox for that project.
          </p>
        </div>
        <button
          onClick={onNewProjectClick}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>
      </div>

      {/* Filters and List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search projects by name, client, ID, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono font-medium">
            Total Workspaces: <span className="font-bold text-slate-700">{projects.length}</span>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Project Name & Info</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">PO Value</th>
                <th className="py-3.5 px-4 text-right">RAP Total</th>
                <th className="py-3.5 px-4 text-right">Profit Margin</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredProjects.map((p) => {
                const metrics = getProjectMetrics(p.id, p.poValue || 0);
                const isActive = p.id === activeProjectId;
                const isArchived = (p as any).isArchived;

                return (
                  <tr 
                    key={p.id} 
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isActive ? 'bg-blue-50/30' : ''
                    } ${isArchived ? 'opacity-60 bg-slate-50/20' : ''}`}
                  >
                    {/* Project Name */}
                    <td className="py-4 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate max-w-[180px] block" title={p.name}>
                          {p.name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                            <CheckCircle className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                        {isArchived && (
                          <span className="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase">
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1 flex items-center gap-3">
                        <span>ID: {p.id}</span>
                        {metrics.fileCount > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5 text-slate-400" /> {metrics.fileCount} files
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-4 px-4 text-slate-700 max-w-[120px] truncate" title={p.client || 'Unknown'}>
                      {p.client || '—'}
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4">
                      <span className="inline-block bg-slate-100 border border-slate-200/50 rounded px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                        {p.projectType || 'Water Main'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-slate-700 max-w-[120px] truncate" title={p.location || 'Unknown'}>
                      {p.location || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-block text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${
                        p.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        p.status === 'Engineer Reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        p.status === 'BOQ Approved' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        p.status === 'RAP Approved' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    {/* PO Value */}
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-700">
                      {p.poValue ? formattedCurrency(p.poValue) : 'Rp 0'}
                    </td>

                    {/* RAP Total */}
                    <td className="py-4 px-4 text-right font-mono font-bold text-indigo-700">
                      {formattedCurrency(metrics.rapTotal)}
                    </td>

                    {/* Profit Margin */}
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      <div className={`flex items-center justify-end gap-1 ${
                        metrics.margin > 15 ? 'text-emerald-600' : 
                        metrics.margin > 0 ? 'text-slate-600' : 'text-rose-600'
                      }`}>
                        {metrics.margin > 15 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : metrics.margin < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : null}
                        <span>{metrics.margin.toFixed(1)}%</span>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="py-4 px-4 text-[10px] font-mono text-slate-400">
                      {p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenProject(p.id)}
                          className={`p-1.5 rounded transition-colors ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 cursor-default' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/20'
                          }`}
                          title="Mount sandbox and open project"
                          disabled={isActive}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDuplicateProject(p.id)}
                          className="p-1.5 bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded border border-slate-200/30 transition-colors"
                          title="Duplicate project sandbox and data"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onArchiveProject(p.id)}
                          className={`p-1.5 rounded border transition-colors ${
                            isArchived 
                              ? 'bg-amber-50 text-amber-600 border-amber-250' 
                              : 'bg-slate-100 text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100 border-slate-200/30'
                          }`}
                          title={isArchived ? "Unarchive Project" : "Archive Project"}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTrigger(p)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-200/30 transition-colors"
                          title="Delete project permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderGit2 className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-xs text-slate-500">No project workspaces found matching your search</p>
                      <button 
                        onClick={onNewProjectClick}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        Create a new project workspace
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmProj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                <h3 className="font-bold text-sm tracking-tight">Delete Project Permanently?</h3>
              </div>
              <button 
                onClick={() => setDeleteConfirmProj(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-rose-200 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs font-medium text-slate-600 leading-normal">
              <div className="bg-rose-50 border border-rose-200/50 p-4 rounded-lg text-rose-900 space-y-1.5">
                <p className="font-bold">Warning: Irreversible action!</p>
                <p className="text-[11px] leading-relaxed text-rose-850">
                  This will permanently delete all metadata, blueprints, layout drawings, 
                  BOQ checklists, BOM records, pricing indices, and AI scans associated with 
                  <strong className="font-bold"> "{deleteConfirmProj.name}"</strong>. 
                  Any physical drawing files stored inside IndexedDB for this project will be removed.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  To confirm, type the project name precisely: 
                  <span className="font-bold text-slate-800 ml-1">"{deleteConfirmProj.name}"</span>
                </p>
                <input
                  type="text"
                  value={deleteInputName}
                  onChange={(e) => setDeleteInputName(e.target.value)}
                  placeholder="Type the exact project name..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-150 flex justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => setDeleteConfirmProj(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteInputName !== deleteConfirmProj.name}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4 shrink-0" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
