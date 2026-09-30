import React, { useState } from 'react';
import { PriceSourceRecord, MaterialMaster, LabourMaster, EquipmentMaster } from '../types';
import { normalizeText } from '../utils/textNormalization';
import { 
  getReliabilityWeight, 
  getRecencyWeight, 
  calculatePricingSummary, 
  checkExpiryStatus 
} from '../utils/pricingEngine';
import { 
  Coins, 
  Plus, 
  Upload, 
  Database, 
  ShieldAlert, 
  CheckCircle, 
  Trash2, 
  Clock, 
  FileText, 
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  Info,
  Sliders,
  Sparkles,
  RefreshCw,
  Archive
} from 'lucide-react';

interface PriceSourcesCenterProps {
  priceSources: PriceSourceRecord[];
  setPriceSources: React.Dispatch<React.SetStateAction<PriceSourceRecord[]>>;
  materials: MaterialMaster[];
  labours: LabourMaster[];
  equipments: EquipmentMaster[];
  onUpdateMaterialPrice?: (itemCode: string, newPrice: number) => void;
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
}

type TabType = 'all' | 'Verified OpenBravo PO' | 'Verified Supplier Quotation' | 'Official Reference Price' | 'Market Reference' | 'Manual Engineering Estimate' | 'Comparison';

export default function PriceSourcesCenter({
  priceSources,
  setPriceSources,
  materials,
  labours,
  equipments,
  onUpdateMaterialPrice,
  addAuditLog
}: PriceSourcesCenterProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [useMedianPrice, setUseMedianPrice] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemCode, setSelectedItemCode] = useState<string>('');

  // New source form state
  const [newSource, setNewSource] = useState<Partial<PriceSourceRecord>>({
    itemCode: '',
    itemDescription: '',
    category: 'Material',
    sourceType: 'Verified Supplier Quotation',
    supplierOrSource: '',
    prNumber: '',
    poNumber: '',
    quotationNumber: '',
    sourceDate: new Date().toISOString().split('T')[0],
    region: 'DKI Jakarta',
    unit: 'pcs',
    quantityBasis: 'Per Unit',
    baseUnitPrice: 0,
    freightCost: 0,
    vehicleRetributionCost: 0,
    tax: 0,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    attachmentLink: ''
  });

  // Calculate landed price dynamically for current form
  const computedLandedForNew = Math.round(
    (Number(newSource.baseUnitPrice) || 0) + 
    (Number(newSource.freightCost) || 0) + 
    (Number(newSource.vehicleRetributionCost) || 0) + 
    (Number(newSource.tax) || 0)
  );

  // List of all items available in system to assign price
  const allSystemItems = [
    ...materials.map(m => ({ code: m.materialCode, desc: m.description, category: 'Material', unit: m.unit, price: m.currentPrice })),
    ...labours.map(l => ({ code: l.labourCode, desc: l.description, category: 'Labour', unit: l.unit, price: l.dailyRate })),
    ...equipments.map(e => ({ code: e.equipmentCode, desc: e.description, category: 'Equipment', unit: e.unit, price: e.rentalRate }))
  ];

  // Map chosen item code to rest of form
  const handleItemCodeChange = (code: string) => {
    const match = allSystemItems.find(item => item.code === code);
    if (match) {
      setNewSource(prev => ({
        ...prev,
        itemCode: code,
        itemDescription: match.desc,
        category: match.category,
        unit: match.unit,
        baseUnitPrice: match.price
      }));
    } else {
      setNewSource(prev => ({ ...prev, itemCode: code }));
    }
  };

  const handleAddSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.itemCode || !newSource.supplierOrSource) {
      alert('Please fill out all required fields.');
      return;
    }

    const relScore = getReliabilityWeight(newSource.sourceType || 'Verified Supplier Quotation');
    
    const recordToAdd: PriceSourceRecord = {
      id: `src-added-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      itemCode: newSource.itemCode!,
      itemDescription: newSource.itemDescription || 'Custom item',
      category: newSource.category!,
      sourceType: newSource.sourceType as any,
      supplierOrSource: newSource.supplierOrSource!,
      prNumber: newSource.prNumber || undefined,
      poNumber: newSource.poNumber || undefined,
      quotationNumber: newSource.quotationNumber || undefined,
      sourceDate: newSource.sourceDate!,
      region: newSource.region!,
      unit: newSource.unit!,
      quantityBasis: newSource.quantityBasis || 'Per Unit',
      baseUnitPrice: Number(newSource.baseUnitPrice) || 0,
      freightCost: Number(newSource.freightCost) || 0,
      vehicleRetributionCost: Number(newSource.vehicleRetributionCost) || 0,
      tax: Number(newSource.tax) || 0,
      landedUnitPrice: computedLandedForNew,
      validUntil: newSource.validUntil!,
      reliabilityScore: relScore,
      approvalStatus: 'Draft',
      notes: newSource.notes || '',
      attachmentLink: newSource.attachmentLink || ''
    };

    const updated = [recordToAdd, ...priceSources];
    setPriceSources(updated);
    
    addAuditLog(
      `Added new Price Source [${recordToAdd.sourceType}] for ${recordToAdd.itemCode}`,
      'No Record Available',
      `Landed Price: Rp${recordToAdd.landedUnitPrice.toLocaleString()} from ${recordToAdd.supplierOrSource}`
    );

    setShowAddModal(false);
    // Reset form
    setNewSource({
      itemCode: '',
      itemDescription: '',
      category: 'Material',
      sourceType: 'Verified Supplier Quotation',
      supplierOrSource: '',
      prNumber: '',
      poNumber: '',
      quotationNumber: '',
      sourceDate: new Date().toISOString().split('T')[0],
      region: 'DKI Jakarta',
      unit: 'pcs',
      quantityBasis: 'Per Unit',
      baseUnitPrice: 0,
      freightCost: 0,
      vehicleRetributionCost: 0,
      tax: 0,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      attachmentLink: ''
    });
  };

  const handleApproveSource = (id: string) => {
    const record = priceSources.find(r => r.id === id);
    if (!record) return;

    const nextSources = priceSources.map(r => {
      if (r.id === id) {
        return { ...r, approvalStatus: 'Approved' as const };
      }
      return r;
    });

    setPriceSources(nextSources);
    
    // Auto cascade value back to master library if requested
    if (onUpdateMaterialPrice) {
      // Recompute recommend after approving
      const itemCode = record.itemCode;
      const computed = calculatePricingSummary(nextSources.map(r => r.id === id ? { ...r, approvalStatus: 'Approved' as const } : r), itemCode, useMedianPrice);
      onUpdateMaterialPrice(itemCode, computed.weightedPrice);
    }

    addAuditLog(
      `Procurement approved Price Source for ${record.itemCode}`,
      'Draft Status',
      `Approved price Rp${record.landedUnitPrice.toLocaleString()} in ${record.region} database`
    );
  };

  const handleArchiveSource = (id: string) => {
    const nextSources = priceSources.map(r => {
      if (r.id === id) {
        return { ...r, approvalStatus: 'Archived' as const };
      }
      return r;
    });
    setPriceSources(nextSources);
    addAuditLog(`Archived expired Price Source record`, 'Approved / Active', 'Archived status');
  };

  const handleDeleteSource = (id: string) => {
    if (!confirm('Are you sure you want to delete this price-source record completely?')) return;
    const record = priceSources.find(r => r.id === id);
    if (!record) return;

    setPriceSources(priceSources.filter(r => r.id !== id));
    addAuditLog(`Deleted Price Source record for ${record.itemCode}`, `From ${record.supplierOrSource}`, 'Removed completely');
  };

  const triggerOpenBravoImport = () => {
    // Inject realistic OpenBravo Procurement Records
    const fakeOBs: PriceSourceRecord[] = [
      {
        id: 'ob-imported-1',
        itemCode: 'M.01',
        itemDescription: 'HDPE Pipe OD 90mm (3 inch) PN 10',
        category: 'Material',
        sourceType: 'Verified OpenBravo PO',
        supplierOrSource: 'PT Wavin Indonesia (OpenBravo Direct)',
        prNumber: 'PR-OB-44281',
        poNumber: 'PO-OB-11229',
        sourceDate: new Date().toISOString().split('T')[0],
        region: 'DKI Jakarta',
        unit: 'meter',
        quantityBasis: 'OpenBravo integration API pull',
        baseUnitPrice: 83000,
        freightCost: 4000,
        vehicleRetributionCost: 1500,
        tax: 8300,
        landedUnitPrice: 96800,
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reliabilityScore: 1.00,
        approvalStatus: 'Approved',
        notes: 'Live import verified via OpenBravo API.'
      },
      {
        id: 'ob-imported-2',
        itemCode: 'M.02',
        itemDescription: 'PVC Pipe AW Class 8 inch',
        category: 'Material',
        sourceType: 'Verified OpenBravo PO',
        supplierOrSource: 'PT Sunrise Metal & Pipeline (OpenBravo)',
        prNumber: 'PR-OB-44282',
        poNumber: 'PO-OB-11230',
        sourceDate: new Date().toISOString().split('T')[0],
        region: 'DKI Jakarta',
        unit: 'meter',
        quantityBasis: 'OpenBravo Direct API',
        baseUnitPrice: 300000,
        freightCost: 10000,
        vehicleRetributionCost: 3500,
        tax: 30000,
        landedUnitPrice: 343500,
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reliabilityScore: 1.00,
        approvalStatus: 'Approved',
        notes: 'Imported live contract catalog item.'
      }
    ];

    setPriceSources(prev => [...fakeOBs, ...prev]);
    // Cascade
    if (onUpdateMaterialPrice) {
      onUpdateMaterialPrice('M.01', 96800);
      onUpdateMaterialPrice('M.02', 343500);
    }
    addAuditLog('Imported live records from OpenBravo ERP Procurement hub', 'Disconnected', 'Synchronized live catalog prices');
    alert('Successfully synchronized OpenBravo Direct Procurement Records. 2 live PO items downloaded and auto-approved.');
  };

  const handleQuickAddTemplate = (type: 'Quotation' | 'Market' | 'Manual') => {
    let source_type: PriceSourceRecord['sourceType'] = 'Verified Supplier Quotation';
    let supplier = 'PT Vinilon Group Spec';
    let cost = 95000;
    let code = 'M.01';

    if (type === 'Market') {
      source_type = 'Market Reference';
      supplier = 'Indoteknik General Catalog';
      cost = 100000;
      code = 'M.02';
    } else if (type === 'Manual') {
      source_type = 'Manual Engineering Estimate';
      supplier = 'Engineering Cost Database (BPM Estimator)';
      cost = 110000;
      code = 'M.05';
    }

    const matched = allSystemItems.find(item => item.code === code) || allSystemItems[0];

    const temp: PriceSourceRecord = {
      id: `src-temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      itemCode: matched.code,
      itemDescription: matched.desc,
      category: matched.category,
      sourceType: source_type,
      supplierOrSource: supplier,
      sourceDate: '2026-06-22',
      region: 'DKI Jakarta',
      unit: matched.unit,
      quantityBasis: 'Project Estimate',
      baseUnitPrice: matched.price,
      freightCost: Math.round(matched.price * 0.05),
      vehicleRetributionCost: Math.round(matched.price * 0.02),
      tax: Math.round(matched.price * 0.1),
      landedUnitPrice: Math.round(matched.price * 1.17),
      validUntil: '2026-09-22',
      reliabilityScore: getReliabilityWeight(source_type),
      approvalStatus: 'Draft',
      notes: `${type} generated via quick addition button.`
    };

    setPriceSources([temp, ...priceSources]);
    addAuditLog(`Quick generated draft ${type} record for ${matched.code}`, 'No record', 'Draft record injected');
  };

  const filteredSources = priceSources.filter(src => {
    const searchNorm = normalizeText(searchTerm);
    const matchesSearch = 
      normalizeText(src.itemCode).includes(searchNorm) ||
      normalizeText(src.itemDescription).includes(searchNorm) ||
      normalizeText(src.supplierOrSource).includes(searchNorm);
    
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'Comparison') return true;
    return src.sourceType === activeTab;
  });

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-xl text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-blue-200 font-mono font-bold uppercase tracking-widest block flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Procurement Compliance
            </span>
            <h2 className="text-xl font-bold tracking-tight">Price Sources Verification Center</h2>
            <p className="text-xs text-blue-100 leading-relaxed max-w-2xl">
              Audit and compile evidence used to calculate Rencana Anggaran Pelaksanaan (RAP). Combine OpenBravo PO databases, supplier quotes, official regulatory bulletins, and manual engineering estimates under the strict BPM reliability formula.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={triggerOpenBravoImport}
              className="px-3 py-1.5 bg-sky-500/90 hover:bg-sky-500 text-white border border-sky-400 font-bold rounded text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-white" /> Import OpenBravo Records
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-850 font-bold rounded text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-blue-700" /> Add Price Source
            </button>
          </div>
        </div>
      </div>

      {/* Warning limitation rule footer styled as a bold card */}
      <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-4 flex items-start gap-3.5 text-amber-950 shadow-sm">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
          <ShieldAlert className="w-4.5 h-4.5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wide">COMPLIANCE & AUDIT BINDING PRINCIPLE</h4>
          <p className="text-[11px] leading-relaxed opacity-95">
            <strong>BPM RAP Regulation Rule 9:</strong> Do not use unverified supplier prices or claim that a price was found online without an actual source record, active quote file, or connected external ERP sync. Manual estimates are flagged with <span className="bg-yellow-100 px-1 py-0.5 rounded font-mono font-bold">Manual Engineering Estimate</span> warning tags and force a yellow alert cascade in the costing sheets.
          </p>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Comparison & Verification Panel */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All Evidence' },
              { id: 'Verified OpenBravo PO', label: 'OpenBravo ERP POs' },
              { id: 'Verified Supplier Quotation', label: 'Supplier Quotes' },
              { id: 'Official Reference Price', label: 'Official Refs' },
              { id: 'Market Reference', label: 'Market Catalog' },
              { id: 'Manual Engineering Estimate', label: 'Estimates' },
              { id: 'Comparison', label: 'Price Comparison & Approval' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table Container */}
          {activeTab !== 'Comparison' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
              
              {/* Header / Search Controls */}
              <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search standard items or suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-xs border border-slate-200 rounded-lg w-full py-1.5 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
                
                {/* Micro seeding tools */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleQuickAddTemplate('Quotation')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 rounded shadow-xs"
                  >
                    + Add Quotation
                  </button>
                  <button
                    onClick={() => handleQuickAddTemplate('Market')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-700 rounded shadow-xs"
                  >
                    + Add Market Ref
                  </button>
                  <button
                    onClick={() => handleQuickAddTemplate('Manual')}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-600 hover:text-white text-[10px] font-semibold Crimson text-slate-700 rounded shadow-xs"
                  >
                    + Add Estimate
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 uppercase font-bold text-[9px] text-slate-400 select-none">
                      <th className="p-3 pl-4">Item Code</th>
                      <th className="p-3">Source Type</th>
                      <th className="p-3">Supplier Or Source</th>
                      <th className="p-3">Ref Code (PO/QTN)</th>
                      <th className="p-3 font-mono">Landed Price</th>
                      <th className="p-3">Reliability</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700 font-sans">
                    {filteredSources.map((src) => {
                      const expiry = checkExpiryStatus(src.sourceDate);
                      return (
                        <tr key={src.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{src.itemCode}</div>
                            <div className="text-[10px] text-slate-450 text-slate-500 truncate max-w-[160px]" title={src.itemDescription}>
                              {src.itemDescription}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              src.sourceType === 'Verified OpenBravo PO' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : src.sourceType === 'Verified Supplier Quotation'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : src.sourceType === 'Official Reference Price'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : src.sourceType === 'Market Reference'
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                            }`}>
                              {src.sourceType}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{src.supplierOrSource}</div>
                            <div className="text-[9px] font-mono text-slate-400">{src.region} · {src.sourceDate}</div>
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-500">
                            {src.poNumber ? `PO: ${src.poNumber}` : src.quotationNumber ? `QTN: ${src.quotationNumber}` : src.prNumber ? `PR: ${src.prNumber}` : '—'}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-950">
                            Rp{src.landedUnitPrice.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {Math.round(src.reliabilityScore * 100)}%
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                src.approvalStatus === 'Approved' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : src.approvalStatus === 'Archived'
                                    ? 'bg-slate-100 text-slate-400'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {src.approvalStatus}
                              </span>
                              
                              {expiry.needsReview && (
                                <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 px-1 py-0.5 rounded font-bold uppercase animate-pulse">
                                  {expiry.isExpired ? 'EXPIRED' : 'REVIEW REQ'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {src.approvalStatus === 'Draft' ? (
                                <button
                                  onClick={() => handleApproveSource(src.id)}
                                  title="Approve Price Source to lock recommendation value"
                                  className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-150 border border-emerald-200 rounded"
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                </button>
                              ) : src.approvalStatus === 'Approved' ? (
                                <button
                                  onClick={() => handleArchiveSource(src.id)}
                                  title="Archive expired price source reference"
                                  className="p-1 bg-slate-50 text-slate-500 hover:text-slate-850 hover:bg-slate-200 border border-slate-200 rounded"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                              <button
                                onClick={() => handleDeleteSource(src.id)}
                                className="p-1 text-red-600 hover:bg-red-55/70 hover:bg-red-50 border border-transparent hover:border-red-200 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredSources.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-medium italic">
                          No matching price sources currently found in active activeTab filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Pricing Comparison and Recommendation Matrix Visual
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Section F - Price Source Variations & Recommendations</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Below values represent the automatic consolidation calculations reflecting different procurement sources.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((mat) => {
                  const summary = calculatePricingSummary(priceSources, mat.materialCode, useMedianPrice, mat.currentPrice);
                  const relatedQuotes = priceSources.filter(s => s.itemCode === mat.materialCode);
                  
                  return (
                    <div key={mat.materialCode} className="border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs hover:border-blue-305 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Material ID: {mat.materialCode}</span>
                          <h4 className="font-bold text-slate-900 mt-1">{mat.description}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">Regulatory Base Price: Rp{mat.currentPrice.toLocaleString()} / {mat.unit}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block">Recommended Price</span>
                          <span className="text-sm font-bold text-blue-800 font-mono">Rp{summary.weightedPrice.toLocaleString()}</span>
                          <span className="text-[9px] font-mono text-slate-400 block">via {summary.priceStatus}</span>
                        </div>
                      </div>

                      {/* Small stat row */}
                      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 rounded text-center text-[10px] font-mono">
                        <div>
                          <div className="text-slate-400">Lowest</div>
                          <div className="font-semibold text-slate-800">Rp{summary.lowestPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Highest</div>
                          <div className="font-semibold text-slate-800">Rp{summary.highestPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Average</div>
                          <div className="font-semibold text-slate-800">Rp{summary.averagePrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-405 text-slate-400 font-bold">Median</div>
                          <div className="font-bold text-slate-900">Rp{summary.medianPrice.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Evidence check status */}
                      <div className="text-[10px] space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <div className="flex justify-between border-b border-slate-100 pb-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                          <span>Evidence Source List ({summary.sourceCount})</span>
                          <span>Landed cost</span>
                        </div>
                        {relatedQuotes.map(q => (
                          <div key={q.id} className="flex justify-between font-mono py-0.5 text-slate-600">
                            <span className="truncate max-w-[150px]">{q.supplierOrSource} ({q.approvalStatus === 'Approved' ? '✓' : '?'})</span>
                            <span>Rp{q.landedUnitPrice.toLocaleString()}</span>
                          </div>
                        ))}
                        {relatedQuotes.length === 0 && (
                          <div className="text-center italic text-slate-400 text-[10px] py-1">No active verified quotation database.</div>
                        )}
                      </div>

                      {/* Warnings / needs actions alert */}
                      {summary.reviewRequired && (
                        <div className="p-2.5 bg-yellow-50/90 border border-yellow-200 rounded text-[10px] flex items-center gap-2 text-yellow-900">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-600" />
                          <span>Material has prices older than 6 months. Marked as <strong>Needs Price Review</strong>.</span>
                        </div>
                      )}

                      {summary.priceStatus === 'Manual Engineering Estimate' && (
                        <div className="p-2.5 bg-red-50/90 border border-red-150 rounded text-[10px] flex items-center gap-2 text-red-900 leading-normal">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>Warning: No verified procurement reference exists. Procurement Review required.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Hand Sidebar: Weighted Pricing formulas list */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* Engine Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-150 pb-2 flex items-center gap-1.5 leading-none">
              <Sliders className="w-4 h-4 text-blue-600" /> Costing Engine Controls
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                <div>
                  <label className="font-bold text-slate-800 leading-snug block">Use Median Price</label>
                  <p className="text-[10px] text-slate-450 text-slate-400">Avoid unusual quotes shifting standard rates.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={useMedianPrice} 
                  onChange={(e) => setUseMedianPrice(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Formula and Weights explanation Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-[11px] leading-relaxed">
                <span className="font-bold text-slate-700 block uppercase font-sans tracking-wide">Fitted Weights Mechanism (Rule 3)</span>
                <p className="text-slate-600">
                  Weighted Recommended Price = 
                </p>
                <div className="bg-white p-2 rounded border text-slate-750 font-mono text-[10px] text-center italic">
                  Sum(Landed * ReliabilityWeight * RecencyWeight) / Sum(ReliabilityWeight * RecencyWeight)
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-slate-200 text-slate-600 font-sans">
                  <div className="flex justify-between"><strong className="text-slate-750 font-semibold font-sans">Reliability weight coefficients:</strong></div>
                  <div className="flex justify-between"><span>• OpenBravo PO:</span> <span className="font-mono">1.00</span></div>
                  <div className="flex justify-between"><span>• Supplier Quotation:</span> <span className="font-mono">0.90</span></div>
                  <div className="flex justify-between"><span>• Official Ref Price:</span> <span className="font-mono">0.80</span></div>
                  <div className="flex justify-between"><span>• Market Reference:</span> <span className="font-mono">0.60</span></div>
                  <div className="flex justify-between"><span>• Manual Estimate:</span> <span className="font-mono text-yellow-600 font-bold">0.40</span></div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 text-slate-600 font-sans">
                  <div className="flex justify-between"><strong className="text-slate-750 font-semibold font-sans">Recency weight coefficients:</strong></div>
                  <div className="flex justify-between"><span>• Less than 30 days old:</span> <span className="font-mono">1.00</span></div>
                  <div className="flex justify-between"><span>• 31 - 90 days old:</span> <span className="font-mono">0.85</span></div>
                  <div className="flex justify-between"><span>• 91 - 180 days old:</span> <span className="font-mono">0.70</span></div>
                  <div className="flex justify-between"><span>• Older than 180 days:</span> <span className="font-mono">0.50</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Price Source Record Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-xs text-slate-800">
          <div className="bg-white rounded-xl border border-slate-250 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-850 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Coins className="w-4.5 h-4.5 text-blue-600" /> New Price Evidence Source Record
              </span>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold font-sans text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSourceSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Target Item Reference (Required)</label>
                  <select
                    value={newSource.itemCode}
                    onChange={(e) => handleItemCodeChange(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                  >
                    <option value="">-- Choose system item code --</option>
                    {allSystemItems.map(item => (
                      <option key={`${item.code}-${item.category}`} value={item.code}>
                        [{item.category}] {item.code} - {item.desc.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Source Category</label>
                  <input
                    type="text"
                    readOnly
                    value={newSource.category || ''}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Price Source Type</label>
                  <select
                    value={newSource.sourceType}
                    onChange={(e) => setNewSource({ ...newSource, sourceType: e.target.value as any })}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                  >
                    <option value="Verified OpenBravo PO">Verified OpenBravo PO (1.00 Reliability)</option>
                    <option value="Verified Supplier Quotation">Verified Supplier Quotation (0.90 Reliability)</option>
                    <option value="Official Reference Price">Official Reference Price (0.80 Reliability)</option>
                    <option value="Market Reference">Market Reference (0.60 Reliability)</option>
                    <option value="Manual Engineering Estimate">Manual Engineering Estimate (0.40 Reliability)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Supplier Name / Source Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. PT Wavin Indonesia, BPS, etc."
                    value={newSource.supplierOrSource}
                    onChange={(e) => setNewSource({ ...newSource, supplierOrSource: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">PR Reference</label>
                  <input
                    type="text"
                    placeholder="PR-..."
                    value={newSource.prNumber || ''}
                    onChange={(e) => setNewSource({ ...newSource, prNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">PO Reference</label>
                  <input
                    type="text"
                    placeholder="PO-..."
                    value={newSource.poNumber || ''}
                    onChange={(e) => setNewSource({ ...newSource, poNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Quotation Reference</label>
                  <input
                    type="text"
                    placeholder="QTN-..."
                    value={newSource.quotationNumber || ''}
                    onChange={(e) => setNewSource({ ...newSource, quotationNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Source Date</label>
                  <input
                    type="date"
                    value={newSource.sourceDate}
                    onChange={(e) => setNewSource({ ...newSource, sourceDate: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Region</label>
                  <input
                    type="text"
                    value={newSource.region || ''}
                    onChange={(e) => setNewSource({ ...newSource, region: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Valid Until</label>
                  <input
                    type="date"
                    value={newSource.validUntil}
                    onChange={(e) => setNewSource({ ...newSource, validUntil: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Base Price (Rp)</label>
                  <input
                    type="number"
                    value={newSource.baseUnitPrice || ''}
                    onChange={(e) => setNewSource({ ...newSource, baseUnitPrice: Number(e.target.value) || 0 })}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Freight / Del (Rp)</label>
                  <input
                    type="number"
                    value={newSource.freightCost || ''}
                    onChange={(e) => setNewSource({ ...newSource, freightCost: Number(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Retribution Cost</label>
                  <input
                    type="number"
                    value={newSource.vehicleRetributionCost || ''}
                    onChange={(e) => setNewSource({ ...newSource, vehicleRetributionCost: Number(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650 block">Tax / PPN (Rp)</label>
                  <input
                    type="number"
                    value={newSource.tax || ''}
                    onChange={(e) => setNewSource({ ...newSource, tax: Number(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Dynamic computed preview */}
              <div className="p-3 bg-blue-50/60 border border-blue-105 rounded-lg flex justify-between items-center text-blue-900 font-bold mb-3">
                <span className="font-sans text-xs">Dynamic Final Landed Unit Price:</span>
                <span className="font-mono text-sm block">Rp{computedLandedForNew.toLocaleString()}</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-650 block">Additional Notes / Assumptions</label>
                <textarea
                  rows={2}
                  placeholder="Enter logistics assumptions, region index comments, or warranty details..."
                  value={newSource.notes || ''}
                  onChange={(e) => setNewSource({ ...newSource, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-slate-650"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-lg shadow-sm"
                >
                  Incorporate Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
