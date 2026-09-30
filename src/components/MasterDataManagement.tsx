/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaterialMaster, LabourMaster, EquipmentMaster, AHSPMaster, AHSPResourceItem, LocationIndexProfile } from '../types';
import { 
  Database, 
  Layers, 
  Trash, 
  Plus, 
  Save, 
  Layers3, 
  HardHat, 
  Package, 
  Truck, 
  Coins, 
  PlusCircle, 
  Edit3, 
  X,
  Code,
  MapPin,
  CheckCircle,
  Calendar,
  Lock,
  Compass
} from 'lucide-react';
import { computeAHSPUnitPrice } from '../mockData';

interface MasterDataManagementProps {
  materials: MaterialMaster[];
  setMaterials: (mats: MaterialMaster[]) => void;
  labours: LabourMaster[];
  setLabours: (labs: LabourMaster[]) => void;
  equipments: EquipmentMaster[];
  setEquipments: (equips: EquipmentMaster[]) => void;
  ahspTemplates: AHSPMaster[];
  setAhspTemplates: (ahsp: AHSPMaster[]) => void;
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
  locationProfiles: LocationIndexProfile[];
  setLocationProfiles: (profiles: LocationIndexProfile[]) => void;
}

type ActiveTab = 'material' | 'labour' | 'equipment' | 'ahsp' | 'location';

export default function MasterDataManagement({
  materials,
  setMaterials,
  labours,
  setLabours,
  equipments,
  setEquipments,
  ahspTemplates,
  setAhspTemplates,
  addAuditLog,
  locationProfiles = [],
  setLocationProfiles
}: MasterDataManagementProps) {

  const [activeTab, setActiveTab] = useState<ActiveTab>('material');

  // Input state for inserting location profiles
  const [newLocationProfile, setNewLocationProfile] = useState<Partial<LocationIndexProfile>>({
    id: '',
    scope: 'Province',
    province: '',
    cityRegency: '',
    projectArea: '',
    materialIndex: 1.000,
    labourIndex: 1.000,
    equipmentIndex: 1.000,
    transportIndex: 1.000,
    effectiveFrom: new Date().toISOString().substring(0, 10),
    effectiveUntil: '2026-12-31',
    sourceReference: '',
    notes: ''
  });

  // Input states for inserting new items
  const [newMaterial, setNewMaterial] = useState<Partial<MaterialMaster>>({
    materialCode: 'M.11',
    description: '',
    unit: 'meter',
    category: 'Pipe Line',
    supplier: '',
    currentPrice: 1000,
    historicalPrice: 1000
  });

  const [newLabout, setNewLabour] = useState<Partial<LabourMaster>>({
    labourCode: 'L.06',
    description: '',
    unit: 'OH (Man-Day)',
    dailyRate: 150000
  });

  const [newEquipment, setNewEquipment] = useState<Partial<EquipmentMaster>>({
    equipmentCode: 'E.06',
    description: '',
    unit: 'Shift (8-Hour)',
    rentalRate: 500000
  });

  const [newAHSP, setNewAHSP] = useState<{
    ahspCode: string;
    description: string;
    unit: string;
    resources: AHSPResourceItem[];
  }>({
    ahspCode: 'AHSP-10',
    description: '',
    unit: 'meter',
    resources: []
  });

  // --- ACTIONS: LOCATION INDEX PROFILES ---
  const handleAddLocationProfile = () => {
    if (!newLocationProfile.province || !newLocationProfile.sourceReference) {
      alert('Province and Source / Reference are required.');
      return;
    }

    const generatedId = newLocationProfile.id || `idx-${newLocationProfile.scope.toLowerCase()}-${(newLocationProfile.cityRegency || newLocationProfile.province).toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().substring(8)}`;
    
    // Check duplicate ID
    if (locationProfiles.some(p => p.id === generatedId)) {
      alert('A location index profile with this ID already exists.');
      return;
    }

    const profile: LocationIndexProfile = {
      id: generatedId,
      scope: newLocationProfile.scope || 'Province',
      province: newLocationProfile.province,
      cityRegency: newLocationProfile.cityRegency || undefined,
      projectArea: newLocationProfile.projectArea || undefined,
      materialIndex: Number(newLocationProfile.materialIndex) || 1.0,
      labourIndex: Number(newLocationProfile.labourIndex) || 1.0,
      equipmentIndex: Number(newLocationProfile.equipmentIndex) || 1.0,
      transportIndex: Number(newLocationProfile.transportIndex) || 1.0,
      effectiveFrom: newLocationProfile.effectiveFrom || new Date().toISOString().substring(0, 10),
      effectiveUntil: newLocationProfile.effectiveUntil || '2026-12-31',
      sourceReference: newLocationProfile.sourceReference,
      status: 'Draft', // Draft by default
      notes: newLocationProfile.notes || '',
      version: 1
    };

    const next = [...locationProfiles, profile];
    setLocationProfiles(next);
    addAuditLog(
      `Created Location Index Profile Draft: ${profile.id}`,
      'N/A',
      `Scope: ${profile.scope}, Province: ${profile.province}, Material Index: ${profile.materialIndex}`
    );

    // Reset input fields
    setNewLocationProfile({
      id: '',
      scope: 'Province',
      province: '',
      cityRegency: '',
      projectArea: '',
      materialIndex: 1.000,
      labourIndex: 1.000,
      equipmentIndex: 1.000,
      transportIndex: 1.000,
      effectiveFrom: new Date().toISOString().substring(0, 10),
      effectiveUntil: '2026-12-31',
      sourceReference: '',
      notes: ''
    });
  };

  const handleApproveLocationProfile = (id: string) => {
    const profile = locationProfiles.find(p => p.id === id);
    if (!profile) return;

    const next = locationProfiles.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'Approved' as const,
          approvedBy: 'BPM Pricing Manager',
          approvalDate: new Date().toISOString().substring(0, 10),
          version: p.version + 1
        };
      }
      return p;
    });

    setLocationProfiles(next);
    addAuditLog(
      `Approved Location Index Profile: ${id}`,
      `Status: Draft (v${profile.version})`,
      `Status: Approved (v${profile.version + 1}) by BPM Pricing Manager`
    );
  };

  const handleExpireLocationProfile = (id: string) => {
    const profile = locationProfiles.find(p => p.id === id);
    if (!profile) return;

    const next = locationProfiles.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'Expired' as const,
          effectiveUntil: new Date().toISOString().substring(0, 10)
        };
      }
      return p;
    });

    setLocationProfiles(next);
    addAuditLog(
      `Archived/Retired Location Index Profile: ${id}`,
      `Status: ${profile.status}`,
      `Status: Expired (Effective Until: ${new Date().toISOString().substring(0, 10)})`
    );
  };

  const handleDeleteLocationProfile = (id: string) => {
    const next = locationProfiles.filter(p => p.id !== id);
    setLocationProfiles(next);
    addAuditLog(
      `Deleted Location Index Profile: ${id}`,
      'Profile exists',
      'N/A'
    );
  };

  // Resource building row inside new AHSP creator
  const [tempResource, setTempResource] = useState<{ code: string; type: 'Labour' | 'Material' | 'Equipment'; coefficient: number }>({
    code: '',
    type: 'Labour',
    coefficient: 1.0
  });

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper trigger to recalculate raw templates
  const triggerRecalculateCascade = (
    nextMats: MaterialMaster[],
    nextLabs: LabourMaster[],
    nextEquips: EquipmentMaster[]
  ) => {
    const updated = ahspTemplates.map((tpl) => {
      return {
        ...tpl,
        calculatedUnitPrice: computeAHSPUnitPrice(tpl, nextMats, nextLabs, nextEquips),
      };
    });
    setAhspTemplates(updated);
  };

  // --- ACTIONS: MATERIAL ---
  const handleAddMaterial = () => {
    if (!newMaterial.materialCode || !newMaterial.description) {
      alert('Code and Description are mandatory.');
      return;
    }
    const mat: MaterialMaster = {
      materialCode: newMaterial.materialCode,
      description: newMaterial.description,
      unit: newMaterial.unit || 'meter',
      category: newMaterial.category || 'Pipe Line',
      supplier: newMaterial.supplier || 'BPM Authorized Vendor',
      currentPrice: Number(newMaterial.currentPrice) || 0,
      historicalPrice: Number(newMaterial.historicalPrice) || 0,
      lastUpdated: new Date().toISOString().substring(0, 10)
    };

    const next = [...materials, mat];
    setMaterials(next);
    addAuditLog(`Added Master Material ${mat.materialCode}`, 'N/A', `${mat.description}: ${formattedCurrency(mat.currentPrice)}`);
    triggerRecalculateCascade(next, labours, equipments);

    setNewMaterial({
      materialCode: `M.${String(next.length + 1).padStart(2, '0')}`,
      description: '',
      unit: 'meter',
      category: 'Pipe Line',
      supplier: '',
      currentPrice: 1000,
      historicalPrice: 1000
    });
  };

  const handleEditMaterialPrice = (code: string, newPrice: number) => {
    const oldMat = materials.find(m => m.materialCode === code);
    const oldPrice = oldMat?.currentPrice || 0;

    const next = materials.map(m => {
      if (m.materialCode === code) {
        return {
          ...m,
          currentPrice: newPrice,
          historicalPrice: m.currentPrice,
          lastUpdated: new Date().toISOString().substring(0, 10)
        };
      }
      return m;
    });

    setMaterials(next);
    addAuditLog(`Updated Master Material ${code} price`, formattedCurrency(oldPrice), formattedCurrency(newPrice));
    triggerRecalculateCascade(next, labours, equipments);
  };

  const handleDeleteMaterial = (code: string) => {
    const next = materials.filter(m => m.materialCode !== code);
    setMaterials(next);
    addAuditLog(`Deleted Master Material ${code}`, 'Standard material entry', 'N/A');
    triggerRecalculateCascade(next, labours, equipments);
  };

  // --- ACTIONS: LABOUR ---
  const handleAddLabour = () => {
    if (!newLabout.labourCode || !newLabout.description) {
      alert('Code and Description are required.');
      return;
    }
    const lab: LabourMaster = {
      labourCode: newLabout.labourCode,
      description: newLabout.description,
      unit: newLabout.unit || 'OH (Man-Day)',
      dailyRate: Number(newLabout.dailyRate) || 0
    };

    const next = [...labours, lab];
    setLabours(next);
    addAuditLog(`Added Master Labourer ${lab.labourCode}`, 'N/A', `${lab.description}: ${formattedCurrency(lab.dailyRate)}`);
    triggerRecalculateCascade(materials, next, equipments);

    setNewLabour({
      labourCode: `L.${String(next.length + 1).padStart(2, '0')}`,
      description: '',
      unit: 'OH (Man-Day)',
      dailyRate: 150000
    });
  };

  const handleEditLabourRate = (code: string, newRate: number) => {
    const oldLab = labours.find(l => l.labourCode === code);
    const oldRate = oldLab?.dailyRate || 0;

    const next = labours.map(l => {
      if (l.labourCode === code) {
        return { ...l, dailyRate: newRate };
      }
      return l;
    });

    setLabours(next);
    addAuditLog(`Updated Master Labourer ${code} daily index wage`, formattedCurrency(oldRate), formattedCurrency(newRate));
    triggerRecalculateCascade(materials, next, equipments);
  };

  const handleDeleteLabour = (code: string) => {
    const next = labours.filter(l => l.labourCode !== code);
    setLabours(next);
    addAuditLog(`Deleted Master Labourer wage code ${code}`, 'Available labour pool', 'N/A');
    triggerRecalculateCascade(materials, next, equipments);
  };

  // --- ACTIONS: EQUIPMENT ---
  const handleAddEquipment = () => {
    if (!newEquipment.equipmentCode || !newEquipment.description) {
      alert('Code and Description are mandatory.');
      return;
    }
    const equip: EquipmentMaster = {
      equipmentCode: newEquipment.equipmentCode,
      description: newEquipment.description,
      unit: newEquipment.unit || 'Shift (8-Hour)',
      rentalRate: Number(newEquipment.rentalRate) || 0
    };

    const next = [...equipments, equip];
    setEquipments(next);
    addAuditLog(`Added Master Equipment Machinery ${equip.equipmentCode}`, 'N/A', `${equip.description}: ${formattedCurrency(equip.rentalRate)}`);
    triggerRecalculateCascade(materials, labours, next);

    setNewEquipment({
      equipmentCode: `E.${String(next.length + 1).padStart(2, '0')}`,
      description: '',
      unit: 'Shift (8-Hour)',
      rentalRate: 500000
    });
  };

  const handleEditEquipmentRate = (code: string, newRate: number) => {
    const oldEqu = equipments.find(e => e.equipmentCode === code);
    const oldPrice = oldEqu?.rentalRate || 0;

    const next = equipments.map(e => {
      if (e.equipmentCode === code) {
        return { ...e, rentalRate: newRate };
      }
      return e;
    });

    setEquipments(next);
    addAuditLog(`Updated Master Equipment Machinery ${code} rental index`, formattedCurrency(oldPrice), formattedCurrency(newRate));
    triggerRecalculateCascade(materials, labours, next);
  };

  const handleDeleteEquipment = (code: string) => {
    const next = equipments.filter(e => e.equipmentCode !== code);
    setEquipments(next);
    addAuditLog(`Deleted Master Equipment fleet code ${code}`, 'Machinery roster', 'N/A');
    triggerRecalculateCascade(materials, labours, next);
  };

  // --- ACTIONS: AHSP ---
  const handleAddTempResource = () => {
    if (!tempResource.code) return;
    
    // Check duplication
    if (newAHSP.resources.some(r => r.code === tempResource.code)) {
      alert('This component model code is already active in raw list.');
      return;
    }

    setNewAHSP({
      ...newAHSP,
      resources: [...newAHSP.resources, { ...tempResource }]
    });

    setTempResource({
      code: '',
      type: 'Labour',
      coefficient: 1.0
    });
  };

  const handleDropTempResourceIdx = (code: string) => {
    setNewAHSP({
      ...newAHSP,
      resources: newAHSP.resources.filter(r => r.code !== code)
    });
  };

  const handleAddAHSPTemplate = () => {
    if (!newAHSP.ahspCode || !newAHSP.description) {
      alert('AHSP Code and Work Item Description are required.');
      return;
    }

    const tpl: Omit<AHSPMaster, 'calculatedUnitPrice'> = {
      ahspCode: newAHSP.ahspCode,
      description: newAHSP.description,
      unit: newAHSP.unit || 'meter',
      resources: newAHSP.resources
    };

    const calculatedPrice = computeAHSPUnitPrice(tpl, materials, labours, equipments);
    const completedAHSP: AHSPMaster = {
      ...tpl,
      calculatedUnitPrice: calculatedPrice
    };

    const next = [...ahspTemplates, completedAHSP];
    setAhspTemplates(next);
    addAuditLog(`Added AHSP Master template equation ${completedAHSP.ahspCode}`, 'N/A', `${completedAHSP.description}`);

    setNewAHSP({
      ahspCode: `AHSP-${String(next.length + 1).padStart(2, '0')}`,
      description: '',
      unit: 'meter',
      resources: []
    });
  };

  const handleDeleteAHSP = (code: string) => {
    const next = ahspTemplates.filter(a => a.ahspCode !== code);
    setAhspTemplates(next);
    addAuditLog(`Deleted Standard AHSP template code ${code}`, 'Active equation list', 'N/A');
  };

  return (
    <div className="space-y-6 fade-in">
      
      {/* HEADER SPECS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Master Price Catalog Library</h2>
          <p className="text-xs text-slate-500 mt-1">Manage global components prices, craftsman day rates, heavy equipment rentals and AHSP equations.</p>
        </div>
        
        {/* Dynamic Cascading Notification Pin */}
        <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-805 text-xs font-semibold flex items-center gap-2">
          <Layers3 className="w-4 h-4 text-indigo-500 animate-spin" />
          <span>Real-time cascading recalculation engines online</span>
        </div>
      </div>

      {/* THREE WAY NAVIGATION CLUSTER TABS */}
      <div className="flex gap-2 border-b border-slate-200 p-1 bg-white rounded-xl border max-w-2xl">
        {[
          { id: 'material', label: 'Material Master', icon: Package },
          { id: 'labour', label: 'Labour Master', icon: HardHat },
          { id: 'equipment', label: 'Equipment Master', icon: Truck },
          { id: 'ahsp', label: 'AHSP Formulas', icon: Database },
          { id: 'location', label: 'Location Index', icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                isSelected 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TABS CONTAINERS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* 1. MATERIAL TAB */}
        {activeTab === 'material' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pipeline Raw Supply Catalog ({materials.length})</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] border-b border-slate-250 font-bold">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Supplier Vendor</th>
                    <th className="py-2.5 px-3 text-right">Current Rate (IDR)</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {materials.map((mat) => (
                    <tr key={mat.materialCode} className="hover:bg-slate-50/55">
                      <td className="py-2.5 px-3 font-semibold font-mono">{mat.materialCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-805">{mat.description}</td>
                      <td className="py-2.5 px-3">{mat.unit}</td>
                      <td className="py-2.5 px-3 text-slate-500">{mat.category}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[150px]">{mat.supplier}</td>
                      
                      {/* Current Rate (Directly Editable) */}
                      <td className="py-2px-3 text-right">
                        <input
                          type="number"
                          value={mat.currentPrice}
                          onChange={(e) => handleEditMaterialPrice(mat.materialCode, Number(e.target.value))}
                          className="w-28 text-right bg-transparent text-xs font-bold font-mono text-indigo-700 px-2 py-1 hover:bg-slate-100 border border-transparent hover:border-slate-300 rounded focus:bg-white focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button onClick={() => handleDeleteMaterial(mat.materialCode)} className="text-slate-400 hover:text-rose-600">
                          <Trash className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inliner Add */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <PlusCircle className="w-4 h-4 text-blue-600" /> Insert Material Master Row
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Code</label>
                  <input
                    type="text"
                    value={newMaterial.materialCode}
                    onChange={(e) => setNewMaterial({ ...newMaterial, materialCode: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. PVC Valve 3 inch"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Unit</label>
                  <input
                    type="text"
                    placeholder="pcs / meter"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Price current</label>
                  <input
                    type="number"
                    value={newMaterial.currentPrice}
                    onChange={(e) => setNewMaterial({ ...newMaterial, currentPrice: Number(e.target.value) })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <button 
                    onClick={handleAddMaterial} 
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition"
                  >
                    Insert Raw Material
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LABOUR TAB */}
        {activeTab === 'labour' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Labour Wages Standards ({labours.length})</h3>
            
            <div className="overflow-x-auto max-w-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3">Labour Wage Code</th>
                    <th className="py-2.5 px-3">Description Role</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Daily Standard Rate (IDR)</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {labours.map((lab) => (
                    <tr key={lab.labourCode} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold font-mono">{lab.labourCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-805">{lab.description}</td>
                      <td className="py-2.5 px-3">{lab.unit}</td>
                      
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          value={lab.dailyRate}
                          onChange={(e) => handleEditLabourRate(lab.labourCode, Number(e.target.value))}
                          className="w-28 text-right bg-transparent text-xs font-bold font-mono text-teal-600 px-2 py-1 hover:bg-slate-100 border border-transparent hover:border-slate-300 rounded focus:bg-white focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button onClick={() => handleDeleteLabour(lab.labourCode)} className="text-slate-400 hover:text-rose-605">
                          <Trash className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inliner Add */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-2xl">
              <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <PlusCircle className="w-4 h-4 text-blue-600" /> Insert Daily Wages Code
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Code</label>
                  <input
                    type="text"
                    value={newLabout.labourCode}
                    onChange={(e) => setNewLabour({ ...newLabout, labourCode: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Role name</label>
                  <input
                    type="text"
                    placeholder="e.g. Penjaga Pompa"
                    value={newLabout.description}
                    onChange={(e) => setNewLabour({ ...newLabout, description: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Daily Wage (IDR)</label>
                  <input
                    type="number"
                    value={newLabout.dailyRate}
                    onChange={(e) => setNewLabour({ ...newLabout, dailyRate: Number(e.target.value) })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <button onClick={handleAddLabour} className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded">
                    Save Wage Standard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. EQUIPMENT TAB */}
        {activeTab === 'equipment' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Heavy Equipment Standard Rental Tiers ({equipments.length})</h3>
            
            <div className="overflow-x-auto max-w-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3">Machine Code</th>
                    <th className="py-2.5 px-3">Equipment / Machinery Description</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Rental Fee (IDR)</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {equipments.map((eq) => (
                    <tr key={eq.equipmentCode} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold font-mono">{eq.equipmentCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-805">{eq.description}</td>
                      <td className="py-2.5 px-3 text-slate-500">{eq.unit}</td>
                      
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          value={eq.rentalRate}
                          onChange={(e) => handleEditEquipmentRate(eq.equipmentCode, Number(e.target.value))}
                          className="w-28 text-right bg-transparent text-xs font-bold font-mono text-amber-600 px-2 py-1 hover:bg-slate-100 border border-transparent hover:border-slate-300 rounded focus:bg-white focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button onClick={() => handleDeleteEquipment(eq.equipmentCode)} className="text-slate-400 hover:text-rose-605">
                          <Trash className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inliner Add */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 max-w-2xl">
              <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <PlusCircle className="w-4 h-4 text-blue-600" /> Insert Fleet Item Code
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Code</label>
                  <input
                    type="text"
                    value={newEquipment.equipmentCode}
                    onChange={(e) => setNewEquipment({ ...newEquipment, equipmentCode: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Crane Truck 10T"
                    value={newEquipment.description}
                    onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Rental Value (IDR)</label>
                  <input
                    type="number"
                    value={newEquipment.rentalRate}
                    onChange={(e) => setNewEquipment({ ...newEquipment, rentalRate: Number(e.target.value) })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <button onClick={handleAddEquipment} className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded">
                    Save Machine Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. AHSP FORMULAS TAB */}
        {activeTab === 'ahsp' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">AHSP Standard Formula Catalog ({ahspTemplates.length})</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Formula List panel */}
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {ahspTemplates.map((tpl) => (
                  <div key={tpl.ahspCode} className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 hover:bg-slate-50/80 transition-all space-y-3 relative group">
                    <button 
                      onClick={() => handleDeleteAHSP(tpl.ahspCode)} 
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-2 items-center">
                      <span className="p-1 px-1.5 bg-slate-900 text-white text-[10px] font-bold font-mono rounded">
                        {tpl.ahspCode}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{tpl.description}</span>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Standard unit of work: <span className="font-semibold text-slate-600 font-mono">{tpl.unit}</span>
                    </div>

                    {/* Resources internal list coefficients */}
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Multipliers / Components:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {tpl.resources.map((res, idx) => {
                          const matMatch = materials.find(m => m.materialCode === res.code);
                          const labMatch = labours.find(l => l.labourCode === res.code);
                          const equMatch = equipments.find(e => e.equipmentCode === res.code);
                          const name = matMatch?.description || labMatch?.description || equMatch?.description || 'Unknown Resource';
                          return (
                            <div key={idx} className="p-1.5 bg-white text-[9px] border border-slate-150 rounded flex justify-between font-mono">
                              <span className="text-slate-500 truncate max-w-[120px]" title={name}>[{res.type.charAt(0)}] {name}</span>
                              <span className="font-bold text-slate-900">x{res.coefficient}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Computed Dynamic Rate display bottom */}
                    <div className="flex justify-between items-center pt-2 border-t border-dotted border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Unit Price:</span>
                      <span className="text-sm font-bold text-indigo-700 font-mono">{formattedCurrency(tpl.calculatedUnitPrice)}</span>
                    </div>

                  </div>
                ))}
              </div>

              {/* Creator Engine Panel */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Code className="w-4.5 h-4.5 text-blue-600" /> Assemble New AHSP Construction Formula
                </h4>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">AHSP Code ID</label>
                      <input
                        type="text"
                        value={newAHSP.ahspCode}
                        onChange={(e) => setNewAHSP({ ...newAHSP, ahspCode: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                      />
                    </div>
                    
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Work Unit</label>
                      <input
                        type="text"
                        placeholder="e.g. meter / m3 / pcs"
                        value={newAHSP.unit}
                        onChange={(e) => setNewAHSP({ ...newAHSP, unit: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Description Uraian Pekerjaan</label>
                    <input
                      type="text"
                      placeholder="e.g. Pipeline excavation hard soil depth 1.5m"
                      value={newAHSP.description}
                      onChange={(e) => setNewAHSP({ ...newAHSP, description: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  {/* Components builders list inside form */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Formula Ingredients:</h5>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {newAHSP.resources.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          [{item.type.substring(0, 3).toUpperCase()}] {item.code} (x{item.coefficient})
                          <button onClick={() => handleDropTempResourceIdx(item.code)} className="text-slate-400 hover:text-rose-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {newAHSP.resources.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">No resources attached to formula yet.</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-100 items-end">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400">Class</label>
                        <select
                          value={tempResource.type}
                          onChange={(e) => setTempResource({ ...tempResource, type: e.target.value as any, code: '' })}
                          className="w-full text-[10px] px-1.5 py-1 border border-slate-300 bg-white rounded"
                        >
                          <option value="Labour">Labour</option>
                          <option value="Material">Material</option>
                          <option value="Equipment">Equipment</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 font-mono">Resource ID</label>
                        <select
                          value={tempResource.code}
                          onChange={(e) => setTempResource({ ...tempResource, code: e.target.value })}
                          className="w-full text-[10px] px-1.5 py-1 border border-slate-300 bg-white rounded truncate"
                        >
                          <option value="">-- Resource code --</option>
                          
                          {tempResource.type === 'Labour' && labours.map(l => (
                            <option key={l.labourCode} value={l.labourCode}>[{l.labourCode}] {l.description.substring(0, 20)}...</option>
                          ))}
                          
                          {tempResource.type === 'Material' && materials.map(m => (
                            <option key={m.materialCode} value={m.materialCode}>[{m.materialCode}] {m.description.substring(0, 20)}...</option>
                          ))}
                          
                          {tempResource.type === 'Equipment' && equipments.map(e => (
                            <option key={e.equipmentCode} value={e.equipmentCode}>[{e.equipmentCode}] {e.description.substring(0, 20)}...</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400">Coeff</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.001"
                            value={tempResource.coefficient}
                            onChange={(e) => setTempResource({ ...tempResource, coefficient: Number(e.target.value) })}
                            className="w-16 text-[10px] px-1.5 py-1 border border-slate-300 rounded font-mono text-center"
                          />
                          <button 
                            type="button" 
                            onClick={handleAddTempResource}
                            className="px-2 py-1 bg-slate-900 text-white rounded font-bold text-[10px]"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleAddAHSPTemplate} 
                    className="w-full py-2 bg-slate-950 text-white text-xs font-bold rounded-lg transition"
                  >
                    Compute & Build AHSP Catalog Item
                  </button>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. LOCATION INDEX TAB */}
        {activeTab === 'location' && (
          <div className="p-6 space-y-6">
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl flex items-start gap-3.5 text-xs text-amber-900 mb-2">
              <Compass className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-bold">BPM Regional Cost Indexing Rules</h5>
                <p className="opacity-95 leading-relaxed">
                  Material, labour, equipment, and transport/logistics index multipliers vary by geographic location. High altitude or remote project sites (such as Papua or regional districts) should utilize audit-approved profiles. Baseline standard index is set to <strong>1.000</strong>. Profiles remain in Draft status until approved by a BPM Pricing Manager. Only active approved profiles can be applied to live projects.
                </p>
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Location Index Master Profiles ({locationProfiles.length})</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3">Index ID</th>
                    <th className="py-2.5 px-3">Scope</th>
                    <th className="py-2.5 px-3">Province</th>
                    <th className="py-2.5 px-3">City / Regency</th>
                    <th className="py-2.5 px-3">Project Area</th>
                    <th className="py-2.5 px-3 text-center text-blue-600 font-bold">Material Mult.</th>
                    <th className="py-2.5 px-3 text-center text-teal-600 font-bold">Labour Mult.</th>
                    <th className="py-2.5 px-3 text-center text-amber-600 font-bold">Equipment Mult.</th>
                    <th className="py-2.5 px-3 text-center text-indigo-600 font-bold">Transport Mult.</th>
                    <th className="py-2.5 px-3">Validity</th>
                    <th className="py-2.5 px-3">Approved By / Ref</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {locationProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold font-mono">{p.id}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          p.scope === 'Project' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : p.scope === 'City'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : p.scope === 'Province'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {p.scope}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{p.province}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.cityRegency || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.projectArea || '-'}</td>
                      
                      {/* Material Mult */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">
                        {p.materialIndex.toFixed(3)}
                      </td>

                      {/* Labour Mult */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-600">
                        {p.labourIndex.toFixed(3)}
                      </td>

                      {/* Equipment Mult */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600">
                        {p.equipmentIndex.toFixed(3)}
                      </td>

                      {/* Transport Mult */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600">
                        {p.transportIndex.toFixed(3)}
                      </td>

                      {/* Validity */}
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                        <div>F: {p.effectiveFrom}</div>
                        <div>T: {p.effectiveUntil}</div>
                      </td>

                      {/* Approved By / Reference */}
                      <td className="py-2.5 px-3 text-[10px] text-slate-500">
                        {p.status === 'Approved' ? (
                          <div>
                            <div className="font-semibold text-slate-700">{p.approvedBy}</div>
                            <div className="text-[9px] font-mono">{p.approvalDate} (v{p.version})</div>
                          </div>
                        ) : (
                          <div className="italic text-slate-400">Ref: {p.sourceReference || 'N/A'}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          p.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'Draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : p.status === 'Expired'
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                        } border`}>
                          {p.status === 'Draft' ? 'Draft — Pending Audit' : p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right space-x-1">
                        {p.status === 'Draft' && (
                          <button
                            onClick={() => handleApproveLocationProfile(p.id)}
                            className="p-1 px-2 text-[10px] uppercase font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition"
                            title="BPM Audit Approval Flow"
                          >
                            Approve
                          </button>
                        )}
                        {p.status === 'Approved' && (
                          <button
                            onClick={() => handleExpireLocationProfile(p.id)}
                            className="p-1 px-2 text-[10px] uppercase font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition"
                            title="Retire/Expire profile"
                          >
                            Expire
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLocationProfile(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-605 transition"
                          title="Delete profile"
                        >
                          <Trash className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {locationProfiles.length === 0 && (
                    <tr>
                      <td colSpan={13} className="py-8 text-center text-slate-400 font-semibold">
                        No Location Index profiles configured yet. Add a new profile below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Inliner Add */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-blue-600" /> Draft New Location Pricing Index
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Index ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. idx-papua"
                    value={newLocationProfile.id}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, id: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Scope Hierarchy</label>
                  <select
                    value={newLocationProfile.scope}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, scope: e.target.value as any })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    <option value="National">National Baseline</option>
                    <option value="Province">Province Index</option>
                    <option value="City">City / Regency Index</option>
                    <option value="Project">Project-Specific Index</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Province Name</label>
                  <input
                    type="text"
                    placeholder="e.g. West Java"
                    value={newLocationProfile.province}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, province: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">City / Regency (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bandung"
                    value={newLocationProfile.cityRegency}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, cityRegency: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Project Area / Site (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. District X"
                    value={newLocationProfile.projectArea}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, projectArea: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Material Index Multiplier</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newLocationProfile.materialIndex}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, materialIndex: Number(e.target.value) })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Labour Index Multiplier</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newLocationProfile.labourIndex}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, labourIndex: Number(e.target.value) })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Equipment Index Multiplier</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newLocationProfile.equipmentIndex}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, equipmentIndex: Number(e.target.value) })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Transport / Logistics Multiplier</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newLocationProfile.transportIndex}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, transportIndex: Number(e.target.value) })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Effective From Date</label>
                  <input
                    type="date"
                    value={newLocationProfile.effectiveFrom}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, effectiveFrom: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Effective Until Date</label>
                  <input
                    type="date"
                    value={newLocationProfile.effectiveUntil}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, effectiveUntil: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Source / Reference Doc</label>
                  <input
                    type="text"
                    placeholder="e.g. West Java Survey"
                    value={newLocationProfile.sourceReference}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, sourceReference: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Explanatory Notes</label>
                  <input
                    type="text"
                    placeholder="Describe regional pricing context..."
                    value={newLocationProfile.notes}
                    onChange={(e) => setNewLocationProfile({ ...newLocationProfile, notes: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <button 
                    onClick={handleAddLocationProfile} 
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
                  >
                    Draft Location Index
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
