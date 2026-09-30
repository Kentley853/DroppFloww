/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Project, RAPItem } from '../types';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  FileWarning, 
  ShieldAlert, 
  Award, 
  HelpCircle,
  Briefcase,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import SampleDataLoader from './SampleDataLoader';

interface ProfitSummaryProps {
  project: Project;
  rapItems: RAPItem[];
  calculateOverallRAP: () => number;
  setActivePage: (page: string) => void;
  onLoadSample?: () => void;
  onClearSample?: () => void;
  isSampleLoaded?: boolean;
}

export default function ProfitSummary({ 
  project, 
  rapItems, 
  calculateOverallRAP, 
  setActivePage,
  onLoadSample,
  onClearSample,
  isSampleLoaded
}: ProfitSummaryProps) {
  
  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalRAP = calculateOverallRAP();
  const poValue = project.poValue || 0;
  const grossProfit = poValue - totalRAP;
  const marginPercentage = poValue > 0 ? (grossProfit / poValue) * 100 : 0;

  // Breakdown of categories for cost summary charting
  let totalLabour = 0;
  let totalMaterial = 0;
  let totalEquipment = 0;
  let totalVehicleRetribution = 0;
  rapItems.forEach((item) => {
    totalLabour += item.labourCost * item.quantity;
    totalMaterial += item.materialCost * item.quantity;
    totalEquipment += item.equipmentCost * item.quantity;
    totalVehicleRetribution += item.vehicleRetributionFee || 0;
  });

  const isAlarming = marginPercentage < 10;
  const isLoss = marginPercentage < 0;

  return (
    <div className="space-y-6 fade-in">
      {onLoadSample && onClearSample && (
        <SampleDataLoader 
          onLoadSample={onLoadSample}
          onClearSample={onClearSample}
          isSampleLoaded={!!isSampleLoaded}
        />
      )}
      
      {/* HEADER SPECS RANGE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">PO vs RAP Profitability Audit</h2>
        <p className="text-xs text-slate-500 mt-1">
          Compare the contract valuation from Client against estimated Rencana Anggaran Pelaksanaan (RAP) costs.
        </p>
      </div>

      {/* THREE MAIN COMPARATIVE KPI METERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CONTRACT VALUE */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex gap-2.5 items-center">
            <div className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contract Value (PO)</span>
              <h4 className="text-xs font-semibold text-slate-500 mt-0.5">Raw Client Allocation</h4>
            </div>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-800">{formattedCurrency(poValue)}</div>
            <p className="text-[10px] text-slate-400 mt-1">Binding value specified in service order agreements.</p>
          </div>
        </div>

        {/* ESTIMATED RAP COST */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex gap-2.5 items-center">
            <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated RAP Cost</span>
              <h4 className="text-xs font-semibold text-slate-500 mt-0.5">RAP Cost Breakdown</h4>
            </div>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold font-mono tracking-tight text-indigo-700">{formattedCurrency(totalRAP)}</div>
            <p className="text-[10px] text-slate-400 mt-1">Labour, Pipeline Supply and Compactor allocations.</p>
          </div>
        </div>

        {/* ESTIMATED PROJECT PROFIT */}
        <div className={`rounded-xl border p-6 shadow-sm space-y-4 ${
          isLoss 
            ? 'bg-rose-50/50 border-rose-200 text-rose-900' 
            : isAlarming 
            ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
            : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex gap-2.5 items-center">
            <div className={`p-2 rounded-lg shrink-0 border ${
              isLoss 
                ? 'bg-rose-100 border-rose-200 text-rose-600' 
                : isAlarming 
                ? 'bg-amber-100 border-amber-200 text-amber-600' 
                : 'bg-emerald-100 border-emerald-200 text-emerald-600'
            }`}>
              {isLoss ? <TrendingDown className="w-5 h-5 animate-bounce" /> : <TrendingUp className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Profit Margin</span>
              <h4 className="text-xs font-semibold text-slate-500 mt-0.5">PO value minus RAP cost</h4>
            </div>
          </div>
          <div className="pt-2">
            <div className={`text-2xl font-bold font-mono tracking-tight ${
              isLoss ? 'text-rose-600' : isAlarming ? 'text-amber-500' : 'text-emerald-600'
            }`}>
              {formattedCurrency(grossProfit)} ({marginPercentage.toFixed(2)}%)
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isLoss 
                ? 'Negative gross return. Sourcing revision required.' 
                : isAlarming 
                ? 'Close to cost floor. Risk warning active.' 
                : 'Healthy financial return scope.'}
            </p>
          </div>
        </div>

      </div>

      {/* DANGERS / WARNINGS PANELS ALIENATED */}
      {isLoss && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-5 text-rose-950 shadow-sm flex items-start gap-4">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold tracking-tight uppercase">CRITICAL DEFICIT RED ZONE BANNER</h4>
            <p className="text-xs opacity-90 leading-relaxed">
              Cost of preliminaries exceed binding Contract PO Value by <span className="font-bold underline">{formattedCurrency(Math.abs(grossProfit))}</span>. 
              Sourcing pipe materials at these rates or installing with current HDD/Open Cut methods will result in financial loss for PT Bestindo Putra Mandiri. 
              The Director requires immediate re-negotiation of unit coefficients or material supplier current pricing tiers.
            </p>
            <div className="pt-2 flex gap-3 text-xs font-semibold">
              <button onClick={() => setActivePage('master-data')} className="underline hover:opacity-85">Adjust Material Masters</button>
              <button onClick={() => setActivePage('project')} className="underline hover:opacity-85">Modify Survey Segment Lengths</button>
            </div>
          </div>
        </div>
      )}

      {!isLoss && isAlarming && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-amber-950 shadow-sm flex items-start gap-4">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
            <FileWarning className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold tracking-tight uppercase">MARGIN WARNING: SAFETY BOUNDARY VIOLATION (<span className="font-extrabold">10%</span>)</h4>
            <p className="text-xs opacity-90 leading-relaxed">
              Estimated margin is running on <span className="font-bold">{marginPercentage.toFixed(2)}%</span> which sits below BPM standard safety thresholds of 10%. 
              Unforeseen site variations (hard soil, rock depth excavation, asphalt thickness increases) could easily sweep the profit into deficits. 
              Engineering review and manual corrections of AHSP coefficients are heavily recommended before director sign-off is initiated.
            </p>
            <div className="pt-2 flex gap-3 text-xs font-semibold">
              <button onClick={() => setActivePage('master-data')} className="underline hover:opacity-85">Review AHSP Coefficient Weights</button>
            </div>
          </div>
        </div>
      )}

      {/* COST ANALYSIS VISUAL BAR GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost vs Income comparison panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm col-span-2 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">PO vs Estimated Cost bar chart</h3>
            <p className="text-xs text-slate-500 mt-1">Graphical ratio representation of cost categories compared to active contract value.</p>
          </div>

          <div className="space-y-6">
            
            {/* Horizontal Bar Visualizer */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Contract Income (100%)</span>
                <span>{formattedCurrency(poValue)}</span>
              </div>
              <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* RAP COST Proportion overlay */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Total Budget RAP ({poValue > 0 ? ((totalRAP / poValue) * 100).toFixed(1) : 0}%)</span>
                <span className="text-indigo-700 font-semibold">{formattedCurrency(totalRAP)}</span>
              </div>
              <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isLoss ? 'bg-rose-500' : isAlarming ? 'bg-amber-400' : 'bg-indigo-600'}`} 
                  style={{ width: `${Math.min(poValue > 0 ? (totalRAP / poValue) * 100 : 0, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-150 grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Materials Budget</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-1">{formattedCurrency(totalMaterial)}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Labor Budget</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-1">{formattedCurrency(totalLabour)}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Equipment lease</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-1">{formattedCurrency(totalEquipment)}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Retrib.</div>
                <div className="text-xs font-bold text-amber-700 font-mono mt-1">{formattedCurrency(totalVehicleRetribution)}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Project Compliance Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">BPM Cost Audit Score</h3>
            <p className="text-xs text-slate-500 mt-1">Engineering safety and compliance rating analysis.</p>
          </div>

          <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            {isLoss ? (
              <div className="text-rose-600 font-extrabold text-lg flex justify-center items-center gap-1.5 uppercase">
                <ShieldAlert className="w-6 h-6 shrink-0 text-rose-500" /> Lost Margin
              </div>
            ) : isAlarming ? (
              <div className="text-amber-500 font-extrabold text-lg flex justify-center items-center gap-1.5 uppercase">
                <FileWarning className="w-6 h-6 shrink-0 text-amber-500 animate-pulse" /> Safety Alert
              </div>
            ) : (
              <div className="text-emerald-600 font-extrabold text-lg flex justify-center items-center gap-1.5 uppercase">
                <Award className="w-6 h-6 shrink-0 text-emerald-500" /> BPM Compliant
              </div>
            )}
            
            <p className="text-[10px] text-slate-400">
              {isLoss 
                ? 'Immediate revision of construction segments are requested before submitting documentation to Project Directors.'
                : isAlarming
                ? 'Marginally safety clearance. Advise on alternate pipe replacement methods.'
                : 'Project meets PT Bestindo minimum 10% preliminary profit target. Safe for submission.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setActivePage('audit')}
              className="w-full text-xs font-bold py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors inline-flex justify-center items-center gap-1.5"
            >
              Sign-off & Audit Logging <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
