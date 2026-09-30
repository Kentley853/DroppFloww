/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BOQItem, RAPItem, AHSPMaster, MaterialMaster, LabourMaster, EquipmentMaster } from '../types';
import { TableProperties, Calculator, HardHat, PackageOpen, Truck, Landmark, ShieldCheck, Check, Edit3, AlertCircle, X, RotateCcw, HelpCircle } from 'lucide-react';
import { computeAHSPBreakdown } from '../mockData';

interface RAPTableComponentProps {
  boqItems: BOQItem[];
  ahspMaster: AHSPMaster[];
  materials: MaterialMaster[];
  labours: LabourMaster[];
  equipments: EquipmentMaster[];
  rapItems: RAPItem[];
  updateRAPItems: (items: RAPItem[]) => void;
  projectStatus: string;
  onApproveRAP: () => void;
  addAuditLog?: (operator: string, details: string, oldValue: string, newValue: string) => void;
}

export default function RAPTableComponent({
  boqItems,
  ahspMaster,
  materials,
  labours,
  equipments,
  rapItems,
  updateRAPItems,
  projectStatus,
  onApproveRAP,
  addAuditLog
}: RAPTableComponentProps) {

  const [overrideItem, setOverrideItem] = React.useState<RAPItem | null>(null);
  const [overridePrice, setOverridePrice] = React.useState<string>('');
  const [overrideReason, setOverrideReason] = React.useState<string>('');
  const [overrideUser, setOverrideUser] = React.useState<string>('BPM Engineer');

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSaveOverride = () => {
    if (!overrideItem) return;
    const newPrice = Number(overridePrice);
    if (isNaN(newPrice) || newPrice <= 0) return;

    const oldPriceStr = formattedCurrency(overrideItem.unitCost);
    const newPriceStr = formattedCurrency(newPrice);

    const updated = rapItems.map((item) => {
      if (item.id === overrideItem.id) {
        return {
          ...item,
          unitCost: newPrice,
          totalCost: Number((item.quantity * newPrice).toFixed(0)) + (item.vehicleRetributionFee || 0),
          overrideReason: overrideReason,
          overrideUser: overrideUser,
          overrideDate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });

    updateRAPItems(updated);

    if (addAuditLog) {
      addAuditLog(
        overrideUser,
        `Manual cost override for ${overrideItem.rapItemCode} - ${overrideItem.description}. Reason: ${overrideReason}`,
        oldPriceStr,
        newPriceStr
      );
    }

    setOverrideItem(null);
    setOverridePrice('');
    setOverrideReason('');
  };

  const handleRemoveOverride = (item: RAPItem) => {
    const updated = rapItems.map((r) => {
      if (r.id === item.id) {
        const { overrideReason, overrideUser, overrideDate, ...rest } = r;
        return rest as RAPItem;
      }
      return r;
    });

    updateRAPItems(updated);

    if (addAuditLog) {
      addAuditLog(
        'BPM System',
        `Removed manual override for ${item.rapItemCode}. Restored location baseline costing.`,
        formattedCurrency(item.unitCost),
        'Location Index Default'
      );
    }
  };

  // Aggregated totals across all active rows
  let grandTotalLabour = 0;
  let grandTotalMaterial = 0;
  let grandTotalEquipment = 0;
  let grandTotalRetribution = 0;
  let grandTotalCost = 0;

  rapItems.forEach((item) => {
    grandTotalLabour += item.labourCost * item.quantity;
    grandTotalMaterial += item.materialCost * item.quantity;
    grandTotalEquipment += item.equipmentCost * item.quantity;
    grandTotalRetribution += item.vehicleRetributionFee || 0;
    grandTotalCost += item.totalCost;
  });

  return (
    <div className="space-y-6 fade-in">
      
      {/* 5 CARDS: COST CENTER CATEGORIES SUMMARIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* LABOUR SUM */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Labour Cost</span>
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-100 text-teal-600">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-mono">{formattedCurrency(grandTotalLabour)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Masonry teams & pipe fitters</div>
          </div>
        </div>

        {/* MATERIAL SUM */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Material Cost</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <PackageOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-mono">{formattedCurrency(grandTotalMaterial)}</div>
            <div className="text-[10px] text-slate-400 mt-1">HDPE/PVC pipes, gaskets & sand backfill</div>
          </div>
        </div>

        {/* EQUIPMENT SUM */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Equipment Rent</span>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-mono">{formattedCurrency(grandTotalEquipment)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Excavator, jack hammer, water pumps</div>
          </div>
        </div>

        {/* VEHICLE RETRIBUTION SUM */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Vehicle Retribution</span>
            <div className="p-2 rounded-lg bg-violet-50 border border-violet-100 text-violet-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-mono text-violet-700">{formattedCurrency(grandTotalRetribution)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Regional fees, permits & trips</div>
          </div>
        </div>

        {/* GRAND TOTAL SUMMARY */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-white space-y-3 col-span-1 shadow-md">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Grand RAP</span>
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/10">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400 tracking-tight font-mono">{formattedCurrency(grandTotalCost)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Cumulative preliminary costs</div>
          </div>
        </div>

      </div>

      {/* CORE RAP ITEMIZED LEDGER TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableProperties className="w-4.5 h-4.5 text-slate-600 shrink-0" />
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">RAP Unit Cost Breakdown Ledger</h4>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 border border-indigo-200 font-semibold rounded-full">
            {rapItems.length} Costed Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-200 font-bold">
                <th className="py-3 px-3">RAP Code</th>
                <th className="py-3 px-3">Work Item Description</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-3 text-right">Labor (per unit)</th>
                <th className="py-3 px-3 text-right">Material (per unit)</th>
                <th className="py-3 px-3 text-right">Equip (per unit)</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">Calculated Unit Price</th>
                <th className="py-3 px-3 text-right font-bold text-amber-700">Vehicle Retribution</th>
                <th className="py-3 px-3 text-right font-semibold text-indigo-700">Location Index / Profile</th>
                <th className="py-3 px-3 text-right font-extrabold text-blue-900">Total Budget</th>
                <th className="py-3 px-3">AHSP Code</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {rapItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                  {/* RAP Code */}
                  <td className="py-3 px-3 font-semibold font-mono text-slate-850">{item.rapItemCode}</td>
                  
                  {/* Description */}
                  <td className="py-3 px-3 font-medium text-slate-800">
                    <div>{item.description}</div>
                    <div className="text-[8px] font-mono text-slate-400 mt-0.5">BOQ REF: {item.boqRef}</div>
                    {item.overrideUser && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded font-bold">
                          <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                          Manual Override Applied
                        </span>
                        <span className="text-[8px] text-slate-400 italic font-medium ml-1">
                          "{item.overrideReason}" — {item.overrideUser} ({item.overrideDate})
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-900">{item.quantity}</td>
                  
                  {/* Unit */}
                  <td className="py-3 px-3 text-center text-slate-500">{item.unit}</td>

                  {/* Labor Price */}
                  <td className="py-3 px-3 text-right font-mono text-teal-600 font-medium">
                    {formattedCurrency(item.labourCost)}
                  </td>

                  {/* Material Price */}
                  <td className="py-3 px-3 text-right font-mono text-blue-600 font-medium">
                    {formattedCurrency(item.materialCost)}
                    {item.freightAmount && item.freightAmount > 0 ? (
                      <div className="text-[8px] text-indigo-500 font-bold font-sans mt-0.5" title="Location logistics index / direct freight portion">
                        + {formattedCurrency(item.freightAmount)} freight
                      </div>
                    ) : null}
                  </td>

                  {/* Equipment Price */}
                  <td className="py-3 px-3 text-right font-mono text-amber-600 font-medium">
                    {formattedCurrency(item.equipmentCost)}
                  </td>

                  {/* Total Unit Price */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                    {formattedCurrency(item.unitCost)}
                    {item.locationAdjustmentAmount && item.locationAdjustmentAmount !== 0 ? (
                      <div className={`text-[8px] font-sans font-bold mt-0.5 ${item.locationAdjustmentAmount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {item.locationAdjustmentAmount > 0 ? '+' : ''}{formattedCurrency(item.locationAdjustmentAmount)} index diff
                      </div>
                    ) : null}
                  </td>

                  {/* Vehicle Retribution Fee */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/20">
                    {formattedCurrency(item.vehicleRetributionFee || 0)}
                  </td>

                  {/* Location Index Source */}
                  <td className="py-3 px-3 text-right font-mono text-[10px] text-indigo-600 font-semibold">
                    <div>{item.locationIndexSource || 'Universal baseline'}</div>
                    {item.locationMultiplier && item.locationMultiplier !== 1.0 ? (
                      <div className="text-[8px] text-indigo-400 mt-0.5 font-bold">Mult: {item.locationMultiplier.toFixed(3)}x</div>
                    ) : null}
                  </td>

                  {/* Cumulative Total Cost */}
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-700 bg-blue-50/10">
                    {formattedCurrency(item.totalCost)}
                  </td>

                  {/* AHSP Reference */}
                  <td className="py-3 px-3 font-mono font-semibold">
                    {item.ahspReference ? (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {item.ahspReference}
                      </span>
                    ) : (
                      <span className="text-amber-500 italic">None</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setOverrideItem(item);
                          setOverridePrice(item.unitCost.toString());
                          setOverrideReason(item.overrideReason || '');
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          item.overrideUser 
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300/30' 
                            : 'bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/50'
                        }`}
                        title="Set manual engineering override cost"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {item.overrideUser && (
                        <button
                          onClick={() => handleRemoveOverride(item)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-200/30 transition-colors"
                          title="Restore location-based pricing index"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rapItems.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    No approved BOQ elements found. Go to BOQ Table and approve quantities first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECALCULATION INFORMATION ASSURANCE CARD */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3.5 text-xs text-slate-600 shadow-xs">
        <Landmark className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-bold text-slate-805">Automatic cost adjustment cascade rule</h5>
          <p className="opacity-95 leading-relaxed">
            All resource rates (Pekerja wages, raw pipeline costs, Excavator lease multipliers) are governed by the **Master Price Library**. Modifying any base unit rates there automatically re-calculates all AHSP standard formulas and cascades down instantaneously to itemized RAP sums without requiring manual re-inputs.
          </p>
        </div>
      </div>

      {/* FINAL QUANTITY BLOCK & ACTION FLOW */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Lock and approve RAP cost finalizations</h4>
          <p className="text-xs text-slate-400 max-w-xl">
            This secures final item cost weights (Labour / Equipment lease metrics). Once RAP approved status is flagged, PO vs RAP Profit indexes are finalized for compliance.
          </p>
        </div>

        <div>
          <button
            onClick={onApproveRAP}
            disabled={projectStatus === 'RAP Approved' || projectStatus === 'Management Approved'}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Check className="w-4 h-4 shrink-0" /> Approve RAP Costing
          </button>
        </div>
      </div>

      {/* OVERRIDE EDIT DIALOG MODAL */}
      {overrideItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <h3 className="font-bold text-sm tracking-tight">Manual Costing Override Audit</h3>
              </div>
              <button 
                onClick={() => setOverrideItem(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-indigo-200 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">RAP Item Reference</div>
                <div className="text-xs font-bold text-slate-800">{overrideItem.rapItemCode} — {overrideItem.description}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Active Price: <span className="font-bold text-slate-700">{formattedCurrency(overrideItem.unitCost)}</span> / {overrideItem.unit}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Override Unit Price (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    value={overridePrice}
                    onChange={(e) => setOverridePrice(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold text-slate-800"
                    placeholder="e.g. 150000"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Input direct manual engineering estimate rate per unit ({overrideItem.unit}).</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Override Reason / Justification</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                  placeholder="Justification is required for compliance audit trails (e.g. Special local supplier negotiated discount)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Authorizing Engineer / Operator</label>
                <input
                  type="text"
                  value={overrideUser}
                  onChange={(e) => setOverrideUser(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-150 flex justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => setOverrideItem(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                disabled={!overridePrice || !overrideReason.trim() || Number(overridePrice) <= 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Check className="w-4 h-4 shrink-0" /> Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
