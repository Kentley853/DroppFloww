/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, PipeSegment, Appurtenance, Structure, CostingIssue, LocationIndexProfile } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Layers, 
  Settings, 
  Anchor, 
  Package, 
  AlertCircle,
  TrendingUp, 
  Calendar, 
  User, 
  MapPin, 
  Briefcase,
  Compass,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import SampleDataLoader from './SampleDataLoader';

interface ProjectDetailsProps {
  project: Project;
  updateProject: (updated: Project) => void;
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
  onLoadSample?: () => void;
  onClearSample?: () => void;
  isSampleLoaded?: boolean;
  locationProfiles?: LocationIndexProfile[];
}

export default function ProjectDetails({ 
  project, 
  updateProject, 
  addAuditLog,
  onLoadSample,
  onClearSample,
  isSampleLoaded,
  locationProfiles = []
}: ProjectDetailsProps) {
  // Costing Issues Resolution State
  const [editingIssue, setEditingIssue] = useState<CostingIssue | null>(null);
  const [editFields, setEditFields] = useState<any>({});

  const handleStartResolveIssue = (issue: CostingIssue) => {
    setEditingIssue(issue);
    setEditFields({ ...(issue.rawObject || {}) });
  };

  const handleSaveResolvedIssue = () => {
    if (!editingIssue) return;

    let updatedPipes = [...(project.pipeSegments || [])];
    let updatedApps = [...(project.appurtenances || [])];
    let updatedStrs = [...(project.structures || [])];

    // Mark as resolved/confirmed
    const correctedItem = {
      ...editingIssue.rawObject,
      ...editFields,
      requiresConfirmation: false
    };

    if (editingIssue.itemType === 'Pipe Segment') {
      updatedPipes = updatedPipes.map(p => p.id === editingIssue.sourceEntityId ? correctedItem : p);
    } else if (editingIssue.itemType === 'Appurtenance') {
      updatedApps = updatedApps.map(a => a.id === editingIssue.sourceEntityId ? correctedItem : a);
    } else if (editingIssue.itemType === 'Civil Structure') {
      updatedStrs = updatedStrs.map(s => s.id === editingIssue.sourceEntityId ? correctedItem : s);
    }

    const updatedIssues = (project.costingIssues || []).filter(issue => issue.id !== editingIssue.id);

    const updatedProj: Project = {
      ...project,
      pipeSegments: updatedPipes,
      appurtenances: updatedApps,
      structures: updatedStrs,
      costingIssues: updatedIssues,
      lastUpdated: new Date().toISOString()
    };

    updateProject(updatedProj);
    addAuditLog(
      `Resolved costing block issue for ${editingIssue.itemLabel}`,
      `Missing required fields`,
      `Verified and supplied valid engineering bounds`
    );

    setEditingIssue(null);
    setEditFields({});
  };

  // Local forms state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [projectForm, setProjectForm] = useState<any>({
    id: project.id,
    name: project.name,
    client: project.client,
    location: project.location,
    projectType: project.projectType,
    surveyDate: project.surveyDate,
    surveyEngineer: project.surveyEngineer,
    poValue: project.poValue,
    status: project.status,
    unclearItems: project.unclearItems || [],
    lastUpdated: project.lastUpdated,
    country: project.country || 'Indonesia',
    province: project.province || '',
    cityRegency: project.cityRegency || '',
    district: project.district || '',
    projectAreaSiteName: project.projectAreaSiteName || '',
    remoteAreaFlag: project.remoteAreaFlag || 'No',
    defaultCostingLocation: project.defaultCostingLocation || '',
    effectiveCostingDate: project.effectiveCostingDate || ''
  });

  React.useEffect(() => {
    setProjectForm({
      id: project.id,
      name: project.name,
      client: project.client,
      location: project.location,
      projectType: project.projectType,
      surveyDate: project.surveyDate,
      surveyEngineer: project.surveyEngineer,
      poValue: project.poValue,
      status: project.status,
      unclearItems: project.unclearItems || [],
      lastUpdated: project.lastUpdated,
      country: project.country || 'Indonesia',
      province: project.province || '',
      cityRegency: project.cityRegency || '',
      district: project.district || '',
      projectAreaSiteName: project.projectAreaSiteName || '',
      remoteAreaFlag: project.remoteAreaFlag || 'No',
      defaultCostingLocation: project.defaultCostingLocation || '',
      effectiveCostingDate: project.effectiveCostingDate || ''
    });
  }, [project]);

  // State arrays for inline additions
  const [newSegment, setNewSegment] = useState<Partial<PipeSegment>>({
    segmentId: 'S-0X',
    pipeMaterial: 'HDPE',
    diameter: '3 inch',
    lengthM: 100,
    installationMethod: 'Open Cut',
    groundCondition: 'Normal Soil',
    surfaceType: 'Asphalt',
    notes: ''
  });

  const [newAppurtenance, setNewAppurtenance] = useState<Partial<Appurtenance>>({
    type: 'Gate Valve',
    diameter: '3 inch',
    quantity: 1,
    linkedSegment: '',
    notes: ''
  });

  const [newStructure, setNewStructure] = useState<Partial<Structure>>({
    type: 'Valve Chamber',
    quantity: 1,
    linkedSegment: '',
    notes: ''
  });

  const [newUnclear, setNewUnclear] = useState('');

  // Dropdown constant arrays
  const PROJECT_TYPES = [
    'New Connection',
    'Cyclical Pipe Replacement',
    'Infill Network',
    'Trunk Main Pipeline',
    'Valve Works',
    'DMA Improvement Works',
    'Other Water Distribution Project'
  ];

  const PIPE_MATERIALS = ['HDPE', 'PVC', 'Steel', 'Ductile Iron'] as const;
  const DIAMETERS = [
    '1/2 inch',
    '3/4 inch',
    '1 inch',
    '2 inch',
    '3 inch',
    '4 inch',
    '6 inch',
    '8 inch',
    '10 inch',
    '12 inch'
  ] as const;

  const INSTALLATION_METHODS = ['Open Cut', 'Bore', 'HDD', 'Existing Duct'] as const;
  const GROUND_CONDITIONS = ['Normal Soil', 'Hard Soil', 'Rock', 'Groundwater'] as const;
  const SURFACE_TYPES = ['Asphalt', 'Concrete', 'Paving Block', 'Unpaved'] as const;

  const APPURTENANCE_TYPES = [
    'Gate Valve',
    'Air Valve',
    'Washout',
    'Reducer',
    'Tee',
    'Bend',
    'Coupling',
    'Water Meter',
    'Service Connection'
  ] as const;

  const STRUCTURE_TYPES = [
    'Valve Chamber',
    'Meter Chamber',
    'Manhole',
    'Thrust Block',
    'Other Civil Structure'
  ] as const;

  // Metadata save
  const handleSaveProjectInfo = () => {
    addAuditLog(
      'Updated primary project information metadata',
      `${project.name} (${project.client})`,
      `${projectForm.name} (${projectForm.client})`
    );

    updateProject({
      ...project,
      ...projectForm,
      lastUpdated: new Date().toISOString()
    });
    setIsEditingInfo(false);
  };

  // Add Pipe Segment
  const handleAddSegment = () => {
    if (!newSegment.segmentId) return;
    const item: PipeSegment = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      segmentId: newSegment.segmentId,
      pipeMaterial: (newSegment.pipeMaterial || 'HDPE') as any,
      diameter: (newSegment.diameter || '3 inch') as any,
      lengthM: Number(newSegment.lengthM) || 0,
      installationMethod: (newSegment.installationMethod || 'Open Cut') as any,
      groundCondition: (newSegment.groundCondition || 'Normal Soil') as any,
      surfaceType: (newSegment.surfaceType || 'Asphalt') as any,
      notes: newSegment.notes || ''
    };

    const updatedSegments = [...project.pipeSegments, item];
    updateProject({
      ...project,
      pipeSegments: updatedSegments,
      lastUpdated: new Date().toISOString()
    });

    addAuditLog(
      `Added Pipe Segment ${item.segmentId}`,
      'N/A',
      `${item.pipeMaterial} ${item.diameter}, ${item.lengthM}m`
    );

    // Reset Form
    setNewSegment({
      segmentId: `S-${String(updatedSegments.length + 1).padStart(2, '0')}`,
      pipeMaterial: 'HDPE',
      diameter: '3 inch',
      lengthM: 100,
      installationMethod: 'Open Cut',
      groundCondition: 'Normal Soil',
      surfaceType: 'Asphalt',
      notes: ''
    });
  };

  // Delete Pipe Segment
  const handleDeleteSegment = (id: string, segmentId: string) => {
    const filtered = project.pipeSegments.filter((s) => s.id !== id);
    updateProject({
      ...project,
      pipeSegments: filtered,
      lastUpdated: new Date().toISOString()
    });
    addAuditLog(`Deleted Pipe Segment ${segmentId}`, `Segment present`, 'N/A');
  };

  // Add Appurtenance
  const handleAddAppurtenance = () => {
    const item: Appurtenance = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: (newAppurtenance.type || 'Gate Valve') as any,
      diameter: newAppurtenance.diameter || '3 inch',
      quantity: Number(newAppurtenance.quantity) || 1,
      linkedSegment: newAppurtenance.linkedSegment || '',
      notes: newAppurtenance.notes || ''
    };

    updateProject({
      ...project,
      appurtenances: [...project.appurtenances, item],
      lastUpdated: new Date().toISOString()
    });

    addAuditLog(
      `Added Appurtenance ${item.type}`,
      'N/A',
      `${item.quantity} units, link: ${item.linkedSegment}`
    );

    setNewAppurtenance({
      type: 'Gate Valve',
      diameter: '3 inch',
      quantity: 1,
      linkedSegment: project.pipeSegments[0]?.segmentId || '',
      notes: ''
    });
  };

  // Delete Appurtenance
  const handleDeleteAppurtenance = (id: string, type: string) => {
    const filtered = project.appurtenances.filter((a) => a.id !== id);
    updateProject({
      ...project,
      appurtenances: filtered,
      lastUpdated: new Date().toISOString()
    });
    addAuditLog(`Deleted Appurtenance ${type}`, `Appurtenance records`, 'N/A');
  };

  // Add Structure
  const handleAddStructure = () => {
    const item: Structure = {
      id: `str-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: (newStructure.type || 'Valve Chamber') as any,
      quantity: Number(newStructure.quantity) || 1,
      linkedSegment: newStructure.linkedSegment || '',
      notes: newStructure.notes || ''
    };

    updateProject({
      ...project,
      structures: [...project.structures, item],
      lastUpdated: new Date().toISOString()
    });

    addAuditLog(
      `Added Structure ${item.type}`,
      'N/A',
      `${item.quantity} units, link: ${item.linkedSegment}`
    );

    setNewStructure({
      type: 'Valve Chamber',
      quantity: 1,
      linkedSegment: project.pipeSegments[0]?.segmentId || '',
      notes: ''
    });
  };

  // Delete Structure
  const handleDeleteStructure = (id: string, type: string) => {
    const filtered = project.structures.filter((s) => s.id !== id);
    updateProject({
      ...project,
      structures: filtered,
      lastUpdated: new Date().toISOString()
    });
    addAuditLog(`Deleted Structure ${type}`, `Structure present`, 'N/A');
  };

  // Unclear notes control
  const handleAddUnclear = () => {
    if (!newUnclear.trim()) return;
    const items = [...(project.unclearItems || []), newUnclear.trim()];
    updateProject({
      ...project,
      unclearItems: items,
      lastUpdated: new Date().toISOString()
    });
    addAuditLog(`Added Unclear Item annotation`, 'N/A', newUnclear.trim());
    setNewUnclear('');
  };

  const handleDeleteUnclear = (idx: number) => {
    const filtered = (project.unclearItems || []).filter((_, i) => i !== idx);
    updateProject({
      ...project,
      unclearItems: filtered,
      lastUpdated: new Date().toISOString()
    });
    addAuditLog(`Deleted Unclear Item annotation`, 'Unclear annotation index', 'N/A');
  };

  return (
    <div className="space-y-8 fade-in">
      {onLoadSample && onClearSample && (
        <SampleDataLoader 
          onLoadSample={onLoadSample}
          onClearSample={onClearSample}
          isSampleLoaded={!!isSampleLoaded}
        />
      )}

      {/* SECTION 1: HEADER & PRIMARY SPECS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/20">
              <Compass className="w-5 h-5 shrink-0" />
            </span>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Project Information Parameters</h3>
              <p className="text-[10px] text-slate-400">Core parameters defining PT BPM contract pricing and survey records</p>
            </div>
          </div>
          {!isEditingInfo ? (
            <button
              onClick={() => setIsEditingInfo(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Parameters
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingInfo(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProjectInfo}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="p-6">
          {isEditingInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Project Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Client / Owner</label>
                <input
                  type="text"
                  value={projectForm.client}
                  onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Project Type</label>
                <select
                  value={projectForm.projectType}
                  onChange={(e) => setProjectForm({ ...projectForm, projectType: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Location Address</label>
                <input
                  type="text"
                  value={projectForm.location}
                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Survey Date</label>
                <input
                  type="date"
                  value={projectForm.surveyDate}
                  onChange={(e) => setProjectForm({ ...projectForm, surveyDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Lead Surveyor Engineer</label>
                <input
                  type="text"
                  value={projectForm.surveyEngineer}
                  onChange={(e) => setProjectForm({ ...projectForm, surveyEngineer: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">PO / Contract Value (IDR)</label>
                <input
                  type="number"
                  value={projectForm.poValue}
                  onChange={(e) => setProjectForm({ ...projectForm, poValue: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Country</label>
                <input
                  type="text"
                  value={projectForm.country}
                  onChange={(e) => setProjectForm({ ...projectForm, country: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Province</label>
                <input
                  type="text"
                  value={projectForm.province}
                  placeholder="e.g. West Java"
                  onChange={(e) => setProjectForm({ ...projectForm, province: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">City / Regency</label>
                <input
                  type="text"
                  value={projectForm.cityRegency}
                  placeholder="e.g. Bandung"
                  onChange={(e) => setProjectForm({ ...projectForm, cityRegency: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">District</label>
                <input
                  type="text"
                  value={projectForm.district}
                  placeholder="e.g. Coblong"
                  onChange={(e) => setProjectForm({ ...projectForm, district: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Project Area / Site Name</label>
                <input
                  type="text"
                  value={projectForm.projectAreaSiteName}
                  placeholder="e.g. Site A"
                  onChange={(e) => setProjectForm({ ...projectForm, projectAreaSiteName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Remote Area Flag</label>
                <select
                  value={projectForm.remoteAreaFlag}
                  onChange={(e) => setProjectForm({ ...projectForm, remoteAreaFlag: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="No">No — Standard Logistics Access</option>
                  <option value="Yes">Yes — High Logistics Premium</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Default Costing Location</label>
                <input
                  type="text"
                  value={projectForm.defaultCostingLocation}
                  placeholder="e.g. Bandung baseline"
                  onChange={(e) => setProjectForm({ ...projectForm, defaultCostingLocation: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Effective Costing Date</label>
                <input
                  type="date"
                  value={projectForm.effectiveCostingDate}
                  onChange={(e) => setProjectForm({ ...projectForm, effectiveCostingDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Type</div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">{project.projectType}</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location</div>
                    <div className="text-xs font-semibold text-slate-800 mt-1 truncate max-w-[180px]" title={project.location}>{project.location}</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Survey Date</div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">{project.surveyDate}</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Surveyor</div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">{project.surveyEngineer}</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PO Value</div>
                    <div className="text-xs font-bold text-emerald-600 mt-1 font-mono">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(project.poValue)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Geographic Details Subgrid */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Geographic Costing Attributes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Hierarchy Context</div>
                    <div className="font-semibold text-slate-800 mt-1">
                      {project.country || 'Indonesia'} / {project.province || '-'} / {project.cityRegency || '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">District & Site</div>
                    <div className="font-semibold text-slate-800 mt-1">
                      {project.district || '-'} / {project.projectAreaSiteName || '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Remote Area Flag</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      project.remoteAreaFlag === 'Yes' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {project.remoteAreaFlag === 'Yes' ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Default Costing & Date</div>
                    <div className="font-semibold text-slate-800 mt-1">
                      {project.defaultCostingLocation || 'Not Set'} {project.effectiveCostingDate ? `(${project.effectiveCostingDate})` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1.5: PROJECT LOCATION COSTING PROFILE PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="project-location-costing-profile-panel">
        <div className="bg-indigo-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/20">
              <Compass className="w-5 h-5 shrink-0" />
            </span>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Project Location Costing Profile (Indeks Lokasi)</h3>
              <p className="text-[10px] text-indigo-200">Adjust standard prices based on regional index multipliers approved by BPM</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider ${
            project.appliedLocationIndexId 
              ? 'bg-emerald-500 text-white shadow-sm' 
              : 'bg-indigo-900 text-indigo-300'
          }`}>
            {project.appliedLocationIndexId ? 'Index Active' : 'Universal baseline'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left selector */}
            <div className="space-y-3.5 lg:border-r lg:border-slate-150 lg:pr-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Select Approved Location Profile</label>
                <select
                  value={project.appliedLocationIndexId || ''}
                  onChange={(e) => {
                    const nextId = e.target.value || undefined;
                    const oldId = project.appliedLocationIndexId || 'Universal baseline';
                    const newId = nextId || 'Universal baseline';
                    
                    updateProject({
                      ...project,
                      appliedLocationIndexId: nextId,
                      lastUpdated: new Date().toISOString()
                    });
                    
                    addAuditLog(
                      `Changed Project Location Index Profile`,
                      oldId,
                      newId
                    );
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- No regional index (standard baseline 1.000) --</option>
                  {locationProfiles
                    .filter((p) => p.status === 'Approved')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.scope}] {p.province} {p.cityRegency ? `- ${p.cityRegency}` : ''} ({p.id})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Only "Approved" profiles audited by BPM Pricing Manager are visible in this selector.
                </p>
              </div>

              {project.appliedLocationIndexId && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const oldId = project.appliedLocationIndexId || 'Universal baseline';
                      updateProject({
                        ...project,
                        appliedLocationIndexId: undefined,
                        lastUpdated: new Date().toISOString()
                      });
                      addAuditLog(
                        `Disabled Project Location Index Profile`,
                        oldId,
                        'Universal baseline'
                      );
                    }}
                    className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors"
                  >
                    Remove Index (Reset to Baseline)
                  </button>
                </div>
              )}
            </div>

            {/* Right Display details */}
            <div className="lg:col-span-2 space-y-4">
              {(() => {
                const activeProfile = locationProfiles.find(p => p.id === project.appliedLocationIndexId);
                if (!activeProfile) {
                  return (
                    <div className="h-full flex flex-col justify-center items-center text-center p-4 bg-slate-50 border border-slate-150 rounded-xl">
                      <Compass className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-500">Universal Baseline Pricing Mode Active</p>
                      <p className="text-[10px] text-slate-400 max-w-sm mt-1">
                        All materials, labour, and machinery rental are currently calculated using standard universal rates without regional modifiers.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Active Profile: <span className="font-mono text-indigo-700">{activeProfile.id}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Approved by {activeProfile.approvedBy} on {activeProfile.approvalDate} (Version {activeProfile.version})
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">
                        Active & Audited
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-center">
                        <div className="text-[9px] text-blue-500 uppercase font-bold">Material Index</div>
                        <div className="text-lg font-mono font-black text-blue-700 mt-1">{activeProfile.materialIndex.toFixed(3)}</div>
                        <div className="text-[9px] text-blue-400 mt-0.5">Price modifier</div>
                      </div>

                      <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100 text-center">
                        <div className="text-[9px] text-teal-500 uppercase font-bold">Labour Index</div>
                        <div className="text-lg font-mono font-black text-teal-700 mt-1">{activeProfile.labourIndex.toFixed(3)}</div>
                        <div className="text-[9px] text-teal-400 mt-0.5">Wages modifier</div>
                      </div>

                      <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-center">
                        <div className="text-[9px] text-amber-500 uppercase font-bold">Equipment Index</div>
                        <div className="text-lg font-mono font-black text-amber-700 mt-1">{activeProfile.equipmentIndex.toFixed(3)}</div>
                        <div className="text-[9px] text-amber-400 mt-0.5">Machinery modifier</div>
                      </div>

                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-center">
                        <div className="text-[9px] text-indigo-500 uppercase font-bold">Transport / Freight</div>
                        <div className="text-lg font-mono font-black text-indigo-700 mt-1">{activeProfile.transportIndex.toFixed(3)}</div>
                        <div className="text-[9px] text-indigo-400 mt-0.5">Logistics margin</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg text-[10px] text-slate-500 border border-slate-100 space-y-1">
                      <div><strong className="text-slate-700">Source Reference:</strong> {activeProfile.sourceReference}</div>
                      {activeProfile.notes && <div><strong className="text-slate-700">Explanatory Notes:</strong> {activeProfile.notes}</div>}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      </div>

      {/* DED Costing Data Issues Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 rounded bg-amber-100 text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
            </span>
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">DED Costing Data Issues</h4>
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 ${
            (project.costingIssues || []).length > 0 
              ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
          } rounded-full`}>
            {(project.costingIssues || []).length} Blocked Record{(project.costingIssues || []).length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="p-6">
          {(project.costingIssues || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3 border border-emerald-100">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">All Engi DED Data Valid</h5>
              <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">
                Confirmed survey pipe segments, fittings, and chambers complied with full structure costing boundaries. Material AHSP build-overs mapped 100% successfully!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                The Costing Engine parsed confirmed engineering data from AI Sketch Scan records. The following confirmed items are missing mandatory variables, which blocks accurate BOQ/BOM/AHSP calculation. Use edit action options to fill in parameters.
              </p>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3">Source Item</th>
                      <th className="py-2.5 px-3">Item Type</th>
                      <th className="py-2.5 px-3">Missing Information</th>
                      <th className="py-2.5 px-3 text-red-600">Why Costing Is Blocked</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(project.costingIssues || []).map((issue, idx) => (
                      <tr 
                        key={issue.id || `issue-${idx}`} 
                        className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/50 transition"
                      >
                        <td className="py-3 px-3 font-semibold text-slate-800 font-mono">
                          {issue.itemLabel || "Unnamed DED Item"}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            issue.itemType === 'Pipe Segment' 
                              ? 'bg-blue-50 text-blue-700' 
                              : issue.itemType === 'Appurtenance' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-purple-50 text-purple-700'
                          }`}>
                            {issue.itemType}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {issue.missingFields.map((field, fIdx) => (
                              <span key={fIdx} className="bg-red-50 text-red-700 text-[10px] border border-red-150 px-1 py-0.5 rounded uppercase font-medium">
                                {field}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-650 italic">
                          {issue.issueType || "Mandatory parameters are empty in confirmed AI records."}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button 
                            onClick={() => handleStartResolveIssue(issue)}
                            title="Edit and correct missing technical properties"
                            className="p-1 px-2.5 text-[10px] uppercase font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-250 rounded-lg transition"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleStartResolveIssue(issue)}
                            title="Provide missing attributes and re-run costing pipeline"
                            className="p-1 px-2.5 text-[10px] font-bold uppercase text-emerald-700 hover:bg-emerald-5 w-auto hover:text-emerald-800 border border-emerald-200 rounded-lg transition"
                          >
                            Reconfirm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COSTING ISSUE RESOLUTION MODAL */}
      {editingIssue && (
        <div id="costing-issue-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Resolve Costing Block: {editingIssue.itemLabel}</h3>
              </div>
              <button 
                onClick={() => setEditingIssue(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide correct parameters below to unlock costing computations. Corrected parameters will update the live grid and immediately match regional AHSP template coefficients.
              </p>

              {editingIssue.itemType === 'Pipe Segment' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Segment Identification</label>
                    <input 
                      type="text" 
                      value={editFields.segmentId || ''} 
                      onChange={e => setEditFields({ ...editFields, segmentId: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pipe Material</label>
                      <select 
                        value={editFields.pipeMaterial || 'HDPE'} 
                        onChange={e => setEditFields({ ...editFields, pipeMaterial: e.target.value as any })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="HDPE">HDPE</option>
                        <option value="PVC">PVC</option>
                        <option value="Steel">Steel</option>
                        <option value="Ductile Iron">Ductile Iron</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Diameter Size</label>
                      <select 
                        value={editFields.diameter || '3 inch'} 
                        onChange={e => setEditFields({ ...editFields, diameter: e.target.value as any })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1/2 inch">1/2 inch</option>
                        <option value="3/4 inch">3/4 inch</option>
                        <option value="1 inch">1 inch</option>
                        <option value="2 inch">2 inch</option>
                        <option value="3 inch">3 inch</option>
                        <option value="4 inch">4 inch</option>
                        <option value="6 inch">6 inch</option>
                        <option value="8 inch">8 inch</option>
                        <option value="10 inch">10 inch</option>
                        <option value="12 inch">12 inch</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Length (meters)</label>
                      <input 
                        type="number" 
                        value={editFields.lengthM || 0} 
                        onChange={e => setEditFields({ ...editFields, lengthM: Number(e.target.value) })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Installation Method</label>
                      <select 
                        value={editFields.installationMethod || 'Open Cut'} 
                        onChange={e => setEditFields({ ...editFields, installationMethod: e.target.value as any })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Open Cut">Open Cut</option>
                        <option value="Bore">Bore</option>
                        <option value="HDD">HDD</option>
                        <option value="Existing Duct">Existing Duct</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ground Condition</label>
                      <select 
                        value={editFields.groundCondition || 'Normal Soil'} 
                        onChange={e => setEditFields({ ...editFields, groundCondition: e.target.value as any })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Normal Soil">Normal Soil</option>
                        <option value="Hard Soil">Hard Soil</option>
                        <option value="Rock">Rock</option>
                        <option value="Groundwater">Groundwater</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Surface Restoration Type</label>
                      <select 
                        value={editFields.surfaceType || 'Asphalt'} 
                        onChange={e => setEditFields({ ...editFields, surfaceType: e.target.value as any })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Asphalt">Asphalt</option>
                        <option value="Concrete">Concrete</option>
                        <option value="Paving Block">Paving Block</option>
                        <option value="Unpaved">Unpaved</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {editingIssue.itemType === 'Appurtenance' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fittings & Appurtenance Type</label>
                    <select 
                      value={editFields.type || 'Gate Valve'} 
                      onChange={e => setEditFields({ ...editFields, type: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Gate Valve">Gate Valve</option>
                      <option value="Air Valve">Air Valve</option>
                      <option value="Washout">Washout</option>
                      <option value="Reducer">Reducer</option>
                      <option value="Tee">Tee</option>
                      <option value="Bend">Bend</option>
                      <option value="Coupling">Coupling</option>
                      <option value="Water Meter">Water Meter</option>
                      <option value="Service Connection">Service Connection</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Diameter</label>
                      <input 
                        type="text" 
                        value={editFields.diameter || ''} 
                        onChange={e => setEditFields({ ...editFields, diameter: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 3 inch or 8 inch"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantity (pcs)</label>
                      <input 
                        type="number" 
                        value={editFields.quantity || 1} 
                        onChange={e => setEditFields({ ...editFields, quantity: Number(e.target.value) })}
                        className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingIssue.itemType === 'Civil Structure' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chamber / Civil Structure Type</label>
                    <select 
                      value={editFields.type || 'Valve Chamber'} 
                      onChange={e => setEditFields({ ...editFields, type: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Valve Chamber">Valve Chamber</option>
                      <option value="Meter Chamber">Meter Chamber</option>
                      <option value="Manhole">Manhole</option>
                      <option value="Thrust Block">Thrust Block</option>
                      <option value="Other Civil Structure">Other Civil Structure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantity (units)</label>
                    <input 
                      type="number" 
                      value={editFields.quantity || 1} 
                      onChange={e => setEditFields({ ...editFields, quantity: Number(e.target.value) })}
                      className="w-full text-xs px-3 py-2 border border-slate-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button 
                onClick={() => setEditingIssue(null)}
                className="px-4 py-2 border border-slate-205 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveResolvedIssue}
                className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Reconfirm & Unlock Costing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PHYSICAL PIPE SEGMENT LIST */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 rounded bg-blue-100 text-blue-700">
              <Layers className="w-4 h-4 shrink-0" />
            </span>
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">1. Pipe Segments Survey Grid</h4>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
            {project.pipeSegments.length} Segments Listed
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Segment ID</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Diameter</th>
                  <th className="py-2.5 px-3">Length (m)</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Ground</th>
                  <th className="py-2.5 px-3">Surface</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {project.pipeSegments.map((seg) => (
                  <tr key={seg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{seg.segmentId}</td>
                    <td className="py-2.5 px-3">
                      <span className="p-1 px-2 rounded bg-slate-100 text-slate-700 font-medium">
                        {seg.pipeMaterial}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{seg.diameter}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{seg.lengthM} m</td>
                    <td className="py-2.5 px-3 text-slate-600">{seg.installationMethod}</td>
                    <td className="py-2.5 px-3 text-slate-600">{seg.groundCondition}</td>
                    <td className="py-2.5 px-3 text-slate-600">{seg.surfaceType}</td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-[150px]" title={seg.notes}>{seg.notes || '-'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteSegment(seg.id, seg.segmentId)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Segment"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {project.pipeSegments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No pipe segments surveyed yet. Add inline below or upload via Excel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inline Adder form panel */}
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> Add Pipe Segment Record
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Segment ID</label>
                <input
                  type="text"
                  value={newSegment.segmentId}
                  onChange={(e) => setNewSegment({ ...newSegment, segmentId: e.target.value })}
                  placeholder="S-01"
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Material</label>
                <select
                  value={newSegment.pipeMaterial}
                  onChange={(e) => setNewSegment({ ...newSegment, pipeMaterial: e.target.value as any })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PIPE_MATERIALS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Diameter</label>
                <select
                  value={newSegment.diameter}
                  onChange={(e) => setNewSegment({ ...newSegment, diameter: e.target.value as any })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {DIAMETERS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Length (m)</label>
                <input
                  type="number"
                  value={newSegment.lengthM}
                  onChange={(e) => setNewSegment({ ...newSegment, lengthM: Number(e.target.value) })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Installation Method</label>
                <select
                  value={newSegment.installationMethod}
                  onChange={(e) => setNewSegment({ ...newSegment, installationMethod: e.target.value as any })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {INSTALLATION_METHODS.map((im) => (
                    <option key={im} value={im}>{im}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Ground Condition</label>
                <select
                  value={newSegment.groundCondition}
                  onChange={(e) => setNewSegment({ ...newSegment, groundCondition: e.target.value as any })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {GROUND_CONDITIONS.map((gc) => (
                    <option key={gc} value={gc}>{gc}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Surface Type</label>
                <select
                  value={newSegment.surfaceType}
                  onChange={(e) => setNewSegment({ ...newSegment, surfaceType: e.target.value as any })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SURFACE_TYPES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddSegment}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors"
                >
                  Confirm Segment
                </button>
              </div>
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Additional notes for this pipe segment (e.g., Near water body, bypass routing required...)"
                value={newSegment.notes}
                onChange={(e) => setNewSegment({ ...newSegment, notes: e.target.value })}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: APPURTENANCES & STRUCTURES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* APPURTENANCES LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 rounded bg-emerald-100 text-emerald-800">
                <Package className="w-4 h-4 shrink-0" />
              </span>
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">2. Appurtenances (Valves / Meters)</h4>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Diameter</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Segment Link</th>
                    <th className="py-2 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {project.appurtenances.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{app.type}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{app.diameter}</td>
                      <td className="py-2 px-3 font-mono font-semibold">{app.quantity} pcs</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-700">
                          {app.linkedSegment || 'All'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteAppurtenance(app.id, app.type)}
                          className="hover:text-rose-600 text-slate-400 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {project.appurtenances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No auxiliary items surveyed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Form inline */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Appurtenance Type</label>
                <select
                  value={newAppurtenance.type}
                  onChange={(e) => setNewAppurtenance({ ...newAppurtenance, type: e.target.value as any })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                >
                  {APPURTENANCE_TYPES.map((at) => (
                    <option key={at} value={at}>{at}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Diameter</label>
                <select
                  value={newAppurtenance.diameter}
                  onChange={(e) => setNewAppurtenance({ ...newAppurtenance, diameter: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 bg-white rounded"
                >
                  {DIAMETERS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity (pcs)</label>
                <input
                  type="number"
                  value={newAppurtenance.quantity}
                  onChange={(e) => setNewAppurtenance({ ...newAppurtenance, quantity: Number(e.target.value) })}
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Linked Segment</label>
                <select
                  value={newAppurtenance.linkedSegment}
                  onChange={(e) => setNewAppurtenance({ ...newAppurtenance, linkedSegment: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 bg-white rounded truncate"
                >
                  <option value="">-- Choose Segment --</option>
                  {project.pipeSegments.map((s) => (
                    <option key={s.id} value={s.segmentId}>{s.segmentId} ({s.pipeMaterial})</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddAppurtenance}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded"
                >
                  Add Auxiliary
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STRUCTURAL CIVIL OBJECTS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 rounded bg-purple-100 text-purple-800">
                <Anchor className="w-4 h-4 shrink-0" />
              </span>
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">3. Masonry Structures & Chambers</h4>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Segment Link</th>
                    <th className="py-2 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {project.structures.map((str) => (
                    <tr key={str.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{str.type}</td>
                      <td className="py-2 px-3 font-mono font-semibold">{str.quantity} units</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-700">
                          {str.linkedSegment || 'All'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteStructure(str.id, str.type)}
                          className="hover:text-rose-600 text-slate-400 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {project.structures.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No structural brickwork/concrete bodies registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Form inline */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Structure Type</label>
                <select
                  value={newStructure.type}
                  onChange={(e) => setNewStructure({ ...newStructure, type: e.target.value as any })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                >
                  {STRUCTURE_TYPES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity (units)</label>
                <input
                  type="number"
                  value={newStructure.quantity}
                  onChange={(e) => setNewStructure({ ...newStructure, quantity: Number(e.target.value) })}
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Linked Segment</label>
                <select
                  value={newStructure.linkedSegment}
                  onChange={(e) => setNewStructure({ ...newStructure, linkedSegment: e.target.value })}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 bg-white rounded truncate"
                >
                  <option value="">-- Choose Segment --</option>
                  {project.pipeSegments.map((s) => (
                    <option key={s.id} value={s.segmentId}>{s.segmentId}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddStructure}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded"
                >
                  Add Structure
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 4: UNCLEAR SURVEY DETAILS/NOTES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">4. Unclear Engineering Details requiring Manual Audit</h4>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <ul className="space-y-2">
            {(project.unclearItems || []).map((note, idx) => (
              <li key={idx} className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 flex justify-between items-center gap-4">
                <span>{note}</span>
                <button
                  onClick={() => handleDeleteUnclear(idx)}
                  className="p-1 hover:text-amber-600 text-amber-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
            {(project.unclearItems || []).length === 0 && (
              <p className="text-xs text-slate-400 italic">No notes or issues currently flagged. Everything clear.</p>
            )}
          </ul>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Underground electric wiring offset height is unknown at chainage 200m..."
              value={newUnclear}
              onChange={(e) => setNewUnclear(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleAddUnclear}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition-colors shrink-0"
            >
              Add Detail Flag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
