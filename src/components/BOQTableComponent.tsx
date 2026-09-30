/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BOQItem, AHSPMaster } from '../types';
import { normalizeText } from '../utils/textNormalization';
import { 
  ClipboardList, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  RefreshCcw, 
  Trash, 
  Plus,
  Compass,
  Check
} from 'lucide-react';

interface BOQTableComponentProps {
  boqItems: BOQItem[];
  ahspMaster: AHSPMaster[];
  updateBOQItems: (items: BOQItem[]) => void;
  projectStatus: string;
  onApproveBOQ: () => void;
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
}

export default function BOQTableComponent({ 
  boqItems, 
  ahspMaster, 
  updateBOQItems, 
  projectStatus,
  onApproveBOQ,
  addAuditLog
}: BOQTableComponentProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newRow, setNewRow] = useState<Partial<BOQItem>>({
    itemCode: 'BOQ-M-99',
    description: '',
    quantity: 1,
    unit: 'pcs',
    source: 'Manual',
    ahspStatus: 'Unmatched',
    ahspCode: '',
    notes: '',
  });

  // Edit-in-place state helpers
  const handleCellEdit = (id: string, key: keyof BOQItem, value: any) => {
    const originalItem = boqItems.find(item => item.id === id);
    const updated = boqItems.map(item => {
      if (item.id === id) {
        let updatedItem = { ...item, [key]: value };
        
        // Auto match if we edit a code or description
        if (key === 'ahspCode') {
          const match = ahspMaster.find(ah => ah.ahspCode === value);
          updatedItem.ahspStatus = match ? 'Matched' : 'Unmatched';
        }
        return updatedItem;
      }
      return item;
    });

    updateBOQItems(updated);

    if (originalItem && originalItem[key] !== value) {
      addAuditLog(
        `Edited BOQ item ${originalItem.itemCode} field [${String(key)}]`,
        String(originalItem[key]),
        String(value)
      );
    }
  };

  // Add a manual new item straight into table
  const handleAddNewBOQRow = () => {
    if (!newRow.description || !newRow.itemCode) {
      alert('Description and unique Item Code are required.');
      return;
    }

    const item: BOQItem = {
      id: `boq-man-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      itemCode: newRow.itemCode,
      description: newRow.description,
      quantity: Number(newRow.quantity) || 0,
      unit: newRow.unit || 'm',
      source: 'Manual',
      ahspStatus: newRow.ahspCode ? 'Matched' : 'Unmatched',
      ahspCode: newRow.ahspCode || '',
      notes: newRow.notes || ''
    };

    updateBOQItems([...boqItems, item]);
    addAuditLog(`Added Manual BOQ item ${item.itemCode}`, 'N/A', item.description);

    setNewRow({
      itemCode: `BOQ-M-${String(boqItems.length + 10).padStart(3, '0')}`,
      description: '',
      quantity: 1,
      unit: 'pcs',
      source: 'Manual',
      ahspStatus: 'Unmatched',
      ahspCode: '',
      notes: '',
    });
    setIsAddingNewRow(false);
  };

  // Delete item row
  const handleDeleteRow = (id: string, code: string) => {
    const filtered = boqItems.filter(item => item.id !== id);
    updateBOQItems(filtered);
    addAuditLog(`Deleted BOQ item row ${code}`, 'Active row', 'N/A');
  };

  // Auto fuzzy-matcher by key terms/letters in description
  const handleFuzzyMatch = (id: string, description: string) => {
    // Look for similarity words
    const tokens = normalizeText(description).split(/\s+/);
    let bestMatch: AHSPMaster | null = null;
    let maxMatchCount = 0;

    ahspMaster.forEach((ahsp) => {
       let count = 0;
       const ahspDescWords = normalizeText(ahsp.description).split(/\s+/);
       tokens.forEach((tk) => {
         if (tk.length > 2 && ahspDescWords.some(aw => aw.includes(tk) || tk.includes(aw))) {
           count++;
         }
       });
       if (count > maxMatchCount) {
         maxMatchCount = count;
         bestMatch = ahsp;
       }
    });

    if (bestMatch && maxMatchCount > 0) {
      handleCellEdit(id, 'ahspCode', (bestMatch as AHSPMaster).ahspCode);
      alert(`Auto-matched describing item to: [${(bestMatch as AHSPMaster).ahspCode}] - ${(bestMatch as AHSPMaster).description}`);
    } else {
      alert('Could not find suitable fuzzy match in AHSP catalog. Please use manual selection dropdown.');
    }
  };

  // Search filter
  const filteredItems = boqItems.filter(item => {
    const searchNorm = normalizeText(searchTerm);
    return normalizeText(item.itemCode).includes(searchNorm) ||
           normalizeText(item.description).includes(searchNorm) ||
           normalizeText(item.ahspCode).includes(searchNorm);
  });

  return (
    <div className="space-y-6 fade-in">
      
      {/* Upper controls block */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">BOQ Items</h2>
            <p className="text-xs text-slate-500 mt-0.5">Physical quantities linked with AHSP indices. Ensure all catalog matches are completed.</p>
          </div>
        </div>

        <div className="flex gap-2 self-stretch md:self-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Items/AHSP Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setIsAddingNewRow(prev => !prev)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition"
          >
            <Plus className="w-4 h-4" /> Add Item Row
          </button>
        </div>
      </div>

      {/* Manual row inserter floating block */}
      {isAddingNewRow && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Item Code</label>
            <input
              type="text"
              value={newRow.itemCode}
              onChange={(e) => setNewRow({ ...newRow, itemCode: e.target.value })}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
            />
          </div>
          
          <div className="space-y-1 sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Work Description</label>
            <input
              type="text"
              placeholder="e.g., Supply of fitting bends 90 deg"
              value={newRow.description}
              onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Qty & Unit</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={newRow.quantity}
                onChange={(e) => setNewRow({ ...newRow, quantity: Number(e.target.value) })}
                className="w-16 text-xs px-1.5 py-1.5 border border-slate-300 rounded bg-white text-center font-mono"
              />
              <input
                type="text"
                placeholder="unit"
                value={newRow.unit}
                onChange={(e) => setNewRow({ ...newRow, unit: e.target.value })}
                className="flex-1 text-xs px-1.5 py-1.5 border border-slate-300 rounded bg-white text-center"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">AHSP Map Match</label>
            <select
              value={newRow.ahspCode}
              onChange={(e) => setNewRow({ ...newRow, ahspCode: e.target.value })}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
            >
              <option value="">-- Manual AHSP Match --</option>
              {ahspMaster.map(ah => (
                <option key={ah.ahspCode} value={ah.ahspCode}>{ah.ahspCode} - {ah.description.substring(0, 35)}...</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 lg:col-span-5 justify-end">
            <button
              onClick={() => setIsAddingNewRow(false)}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNewBOQRow}
              className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500"
            >
              Insert Item
            </button>
          </div>
        </div>
      )}

      {/* CORE BOQ DATA GRID TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <th className="py-3 px-3">Item Code</th>
                <th className="py-3 px-3">Work Description</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-3">Source Channel</th>
                <th className="py-3 px-3">AHSP Alignment</th>
                <th className="py-3 px-3">Reference Code</th>
                {/* Retribution Fields */}
                <th className="py-3 px-3">Vehicle Type</th>
                <th className="py-3 px-3 text-center">Trips</th>
                <th className="py-3 px-3 text-right">Cost Per Trip</th>
                <th className="py-3 px-3 text-right">Manual Override</th>
                <th className="py-3 px-3 text-right font-bold text-amber-700">Vehicle Retribution</th>
                <th className="py-3 px-3">Permit Reference</th>
                <th className="py-3 px-3 text-center">Permit Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => {
                const isMatched = item.ahspStatus === 'Matched';
                
                // Retribution calculation
                const retributionCost = item.manualOverrideCost || ((item.trips || 0) * (item.costPerTrip || 0));
                
                // Formatter helper
                const formattedCurrency = (val?: number) => {
                  if (val === undefined || val === null) return 'Rp 0';
                  return 'Rp ' + val.toLocaleString('id-ID');
                };

                // Warnings
                const hasCostErr = item.permitStatus === 'Not Required' && retributionCost > 0;
                const hasMissingRefErr = retributionCost > 0 && (!item.permitRefNum || !item.notes);
                const hasZeroCostErr = (item.permitStatus && item.permitStatus !== 'Not Required') && retributionCost === 0;
                const isExpiredErr = item.permitStatus === 'Expired';
                const hasAnyWarning = hasCostErr || hasMissingRefErr || hasZeroCostErr || isExpiredErr;

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/50 transition-all ${hasAnyWarning ? 'bg-amber-50/20' : ''}`}>
                    {/* Item Code */}
                    <td className="py-3 px-3 font-semibold text-slate-800 font-mono">{item.itemCode}</td>
                    
                    {/* Work Description (Editable) */}
                    <td className="py-3 px-3 max-w-[280px]">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleCellEdit(item.id, 'description', e.target.value)}
                        className="w-full bg-transparent hover:bg-slate-100 hover:border-slate-300 border-transparent border px-1.5 py-1 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        title="Click to edit work text"
                      />
                    </td>

                    {/* Quantity (Editable) */}
                    <td className="py-3 px-3 text-center w-20">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleCellEdit(item.id, 'quantity', Number(e.target.value))}
                        className="w-full text-center bg-transparent font-medium font-mono hover:bg-slate-100 border-transparent border py-1 hover:border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Unit (Editable) */}
                    <td className="py-3 px-3 text-center w-16">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleCellEdit(item.id, 'unit', e.target.value)}
                        className="w-full text-center bg-transparent hover:bg-slate-100 border px-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-transparent py-1 rounded"
                      />
                    </td>

                    {/* Source badging */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        item.source === 'Excel Upload' 
                          ? 'bg-purple-100 text-purple-800' 
                          : item.source === 'AI Extracted' 
                          ? 'bg-blue-100 text-blue-800' 
                          : item.source === 'Auto Generated' 
                          ? 'bg-slate-100 text-slate-700' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.source}
                      </span>
                    </td>

                    {/* AHSP Matching Status selection / action items */}
                    <td className="py-3 px-3">
                      {isMatched ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Aligned
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Unmatched
                          </span>
                          <button
                            onClick={() => handleFuzzyMatch(item.id, item.description)}
                            className="text-[9px] px-1.5 py-0.5 border border-amber-300 hover:bg-amber-100 font-semibold rounded text-amber-700 cursor-pointer"
                            title="Run fuzzy search description matching"
                          >
                            AI Guess
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Reference dropdown mapper */}
                    <td className="py-3 px-3 text-xs">
                      <select
                        value={item.ahspCode || ''}
                        onChange={(e) => handleCellEdit(item.id, 'ahspCode', e.target.value)}
                        className={`text-[11px] font-mono px-2 py-1 rounded bg-slate-50 border focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px] truncate ${
                          isMatched ? 'border-indigo-100 text-indigo-900' : 'border-amber-300 bg-amber-50 text-amber-800'
                        }`}
                      >
                        <option value="">-- No Matching AHSP --</option>
                        {ahspMaster.map((ahsp) => (
                           <option key={ahsp.ahspCode} value={ahsp.ahspCode}>
                             [{ahsp.ahspCode}] {ahsp.description.substring(0, 30)}...
                           </option>
                        ))}
                      </select>
                    </td>

                    {/* Vehicle Type */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.vehicleType || ''}
                        placeholder="e.g. Truck"
                        onChange={(e) => handleCellEdit(item.id, 'vehicleType', e.target.value)}
                        className="w-20 p-1 border border-slate-200 rounded text-xs bg-white text-slate-700"
                      />
                    </td>

                    {/* Number of Trips */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        value={item.trips || 0}
                        min="0"
                        onChange={(e) => handleCellEdit(item.id, 'trips', Number(e.target.value))}
                        className="w-12 text-center p-1 border border-slate-200 rounded text-xs font-mono"
                      />
                    </td>

                    {/* Cost per Trip */}
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        value={item.costPerTrip || 0}
                        min="0"
                        onChange={(e) => handleCellEdit(item.id, 'costPerTrip', Number(e.target.value))}
                        className="w-20 text-right p-1 border border-slate-200 rounded text-xs font-mono"
                      />
                    </td>

                    {/* Manual Override Cost */}
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        value={item.manualOverrideCost || 0}
                        min="0"
                        onChange={(e) => handleCellEdit(item.id, 'manualOverrideCost', Number(e.target.value))}
                        className="w-20 text-right p-1 border border-slate-200 rounded text-xs font-mono"
                      />
                    </td>

                    {/* Calculated Retribution Cost */}
                    <td className="py-3 px-3 text-right font-bold font-mono text-amber-700 bg-amber-50/20">
                      {formattedCurrency(retributionCost)}
                    </td>

                    {/* Permit Reference Number */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.permitRefNum || ''}
                        placeholder="Ref reference"
                        onChange={(e) => handleCellEdit(item.id, 'permitRefNum', e.target.value)}
                        className={`w-24 p-1 border rounded text-xs ${hasMissingRefErr ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}
                      />
                    </td>

                    {/* Permit Status dropdown */}
                    <td className="py-3 px-3 text-center">
                      <select
                        value={item.permitStatus || 'Not Required'}
                        onChange={(e) => handleCellEdit(item.id, 'permitStatus', e.target.value)}
                        className={`text-[10px] font-bold p-1 border rounded cursor-pointer ${
                          isExpiredErr
                            ? 'bg-red-50 text-rose-700 border-rose-300'
                            : item.permitStatus === 'Approved' || item.permitStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.permitStatus === 'Submitted' || item.permitStatus === 'Estimated'
                            ? 'bg-amber-50 text-amber-850 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="Not Required">Not Required</option>
                        <option value="Estimated">Estimated</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                        <option value="Expired">Expired</option>
                      </select>

                      {hasAnyWarning && (
                        <div className="text-[9px] text-rose-600 mt-1 font-bold flex items-center justify-center gap-0.5" title={
                          hasCostErr ? 'Status: Not Required but Cost > Rp0!' :
                          hasMissingRefErr ? 'Cost is non-zero but missing permit or project override notes!' :
                          isExpiredErr ? 'PERMIT EXPIRED!' : 'Permit is required but Cost is Rp0!'
                        }>
                          ⚠️ Warning
                        </div>
                      )}
                    </td>

                    {/* Action Deletion */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteRow(item.id, item.itemCode)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove row item"
                      >
                        <Trash className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No matching BOQ line items found for review. Use upload or input tables.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual unmatched items warnings console */}
      {boqItems.some(it => it.ahspStatus === 'Unmatched') && (
        <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-xl shadow-sm text-amber-900 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <h4 className="text-xs font-extrabold uppercase tracking-wide">Manual AHSP alignment required</h4>
          </div>
          <p className="text-xs opacity-90">
            Some uploaded BOQ rows could not be matched automatically to your master price templates. Use the **Reference Dropdown** on each row in the 
            table above to align them manually. Unmapped items will be valued at **Rp 0** inside the RAP calculator.
          </p>
        </div>
      )}

      {/* FINAL QUANTITY BLOCK & ACTION FLOW */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Lock and finalise BOQ quantities</h4>
          <p className="text-xs text-slate-400 max-w-xl">
            This locks raw quantities and mapping indices. Moving status forward enables automatic generation of cost itemizations inside the RAP.
          </p>
        </div>

        <div>
          <button
            onClick={onApproveBOQ}
            disabled={projectStatus === 'BOQ Approved' || projectStatus === 'RAP Approved' || projectStatus === 'Management Approved'}
            className="px-5 py-2.5 bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Check className="w-4 h-4 shrink-0" /> Approve BOQ Quantities
          </button>
        </div>
      </div>

    </div>
  );
}
