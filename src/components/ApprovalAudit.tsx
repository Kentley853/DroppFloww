/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, AuditLog, BOQItem, RAPItem, BOMItem } from '../types';
import { calculateProjectRatios } from '../utils/ratios';
import { 
  History, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  User, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Award,
  Lock,
  Scale,
  DollarSign,
  TrendingUp,
  Cpu,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApprovalAuditProps {
  project: Project;
  updateProject: (p: Project) => void;
  auditLogs: AuditLog[];
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
  boqItems: BOQItem[];
  rapItems: RAPItem[];
  bomItems?: BOMItem[];
}

export default function ApprovalAudit({ 
  project, 
  updateProject, 
  auditLogs, 
  addAuditLog,
  boqItems,
  rapItems,
  bomItems = []
}: ApprovalAuditProps) {
  
  const [operatorName, setOperatorName] = useState('engineering@bpm.co.id'); // standard user metadata placeholder
  const [selectedRatio, setSelectedRatio] = useState<{
    id: string;
    label: string;
    unitLabel: string;
    valStr: string;
    unit: string;
    cardClass: string;
    explanation: string;
    breakdown?: string;
  } | null>(null);

  const ratios = calculateProjectRatios(project, boqItems, rapItems, bomItems);

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formattedPercent = (val: number) => {
    return `${val.toFixed(2)} %`;
  };

  const isProfitPositive = ratios.estimatedProfit > 0;
  
  const profitMarginClass = ratios.estimatedProfitMargin >= 15 
    ? 'bg-emerald-500/10 border-emerald-300 text-emerald-800' 
    : ratios.estimatedProfitMargin >= 10 
    ? 'bg-amber-50 border-amber-250 text-amber-800' 
    : 'bg-red-50 border-red-250 text-red-800';

  const profitMarginStatus = ratios.estimatedProfitMargin >= 15 
    ? 'Strong' 
    : ratios.estimatedProfitMargin >= 10 
    ? 'Target' 
    : 'Low Margin';

  const scaleMetrics = [
    {
      id: 'pipeline-length',
      label: 'Pipeline Length',
      unitLabel: 'Scale Metric',
      valStr: Math.round(ratios.totalPipelineLength).toLocaleString('id-ID'),
      unit: 'meters (m)',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Total cumulative length of the water pipeline system mapped from active BOQ items.',
      breakdown: 'Calculated by summing quantities of all active pipe-laying BOQ items.'
    },
    {
      id: 'pipe-segments',
      label: 'Pipe Segments',
      unitLabel: 'Infrastructure',
      valStr: ratios.totalPipeSegments.toLocaleString('id-ID'),
      unit: 'segments',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Number of individual pipe sections required to span the entire pipeline length.',
      breakdown: 'Based on standard 6-meter pipe joint increments required for the planned pipe specification.'
    },
    {
      id: 'boq-work-items',
      label: 'BOQ Work Items',
      unitLabel: 'Scope List',
      valStr: ratios.totalBOQWorkItems.toString(),
      unit: 'items',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Total number of engineering work scope lines declared in the Bill of Quantities (BOQ).',
      breakdown: 'Computed from the list of import lines mapped in the central workspace.'
    },
    {
      id: 'total-valves',
      label: 'Total Valves',
      unitLabel: 'Appurtenances',
      valStr: ratios.totalValves.toString(),
      unit: 'valves',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Count of flow control, air vacuum, and isolation valves integrated across the network.',
      breakdown: 'Discovered and compiled from specific valve installation lines in the BOQ.'
    },
    {
      id: 'total-chambers',
      label: 'Total Chambers',
      unitLabel: 'Structures',
      valStr: ratios.totalChambers.toString(),
      unit: 'chambers',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Total concrete chambers constructed to house critical valve and metering installations safely.',
      breakdown: 'Sourced from structural and masonry line items in the BOQ.'
    },
    {
      id: 'service-conn',
      label: 'Service Conn.',
      unitLabel: 'Distribution',
      valStr: ratios.totalServiceConnections.toString(),
      unit: 'connections (conns)',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Number of end-user or residential clean water consumer tap take-offs.',
      breakdown: 'Mapped from connection materials and excavation entries in the BOQ.'
    },
    {
      id: 'planned-duration',
      label: 'Planned Duration',
      unitLabel: 'Timeline',
      valStr: `${ratios.plannedDuration} days`,
      unit: 'days',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Contractual timeline allotted to execute and complete all installation works.',
      breakdown: 'Defined under general conditions of the active project file.'
    },
    {
      id: 'installation-rate',
      label: 'Installation Rate',
      unitLabel: 'Target Velocity',
      valStr: `${ratios.plannedInstallationRate.toFixed(1)} m / day`,
      unit: 'meters / day (m/day)',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Required velocity of pipeline laying work per day to meet scheduled commitments.',
      breakdown: `Total Pipeline Length (${Math.round(ratios.totalPipelineLength).toLocaleString('id-ID')} m) ÷ Planned Duration (${ratios.plannedDuration} days).`
    }
  ];

  const financialMetrics = [
    {
      id: 'po-value',
      label: 'PO Contract Value',
      unitLabel: 'Revenue',
      valStr: formattedCurrency(ratios.poValue),
      unit: 'IDR (Rp)',
      cardClass: 'bg-emerald-50/20 border-emerald-100 text-emerald-800 hover:bg-emerald-50/50 hover:border-emerald-300',
      explanation: 'Total contract value awarded by the project owner (PO) representing total project revenue.',
      breakdown: 'Derived from official project owner quote and contract terms.'
    },
    {
      id: 'total-rap-cost',
      label: 'Total RAP Cost',
      unitLabel: 'Expense',
      valStr: formattedCurrency(ratios.totalRAPCost),
      unit: 'IDR (Rp)',
      cardClass: 'bg-blue-50/20 border-blue-100 text-blue-800 hover:bg-blue-50/45 hover:border-blue-300',
      explanation: 'Total operational cost budget (RAP) targeted to construct the project.',
      breakdown: 'Sum of labor, materials, heavy equipment rent, and logistics/permit fees.'
    },
    {
      id: 'estimated-profit',
      label: 'Estimated Profit',
      unitLabel: isProfitPositive ? 'Pristine Gain' : 'Project Loss',
      valStr: formattedCurrency(ratios.estimatedProfit),
      unit: 'IDR (Rp)',
      cardClass: isProfitPositive 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-950 hover:bg-emerald-100/10 hover:border-emerald-300' 
        : 'bg-red-50 border-red-100 text-red-955 hover:bg-red-100/10 hover:border-red-300',
      explanation: 'Projected net profitability margin calculated prior to project execution.',
      breakdown: `PO Contract Value (${formattedCurrency(ratios.poValue)}) - Total RAP Cost (${formattedCurrency(ratios.totalRAPCost)}).`
    },
    {
      id: 'profit-margin',
      label: 'Profit Margin',
      unitLabel: profitMarginStatus,
      valStr: `${ratios.estimatedProfitMargin.toFixed(2)} %`,
      unit: 'Percentage (%)',
      cardClass: `${profitMarginClass} hover:opacity-95 hover:border-slate-400`,
      explanation: 'Relative rate of return expressing profit as a percentage of overall contract value.',
      breakdown: `(Estimated Net Profit (${formattedCurrency(ratios.estimatedProfit)}) ÷ PO Contract Value (${formattedCurrency(ratios.poValue)})) × 100.`
    },
    {
      id: 'rap-cost-per-meter',
      label: 'RAP Cost / m',
      unitLabel: 'per meter',
      valStr: formattedCurrency(ratios.rapCostPerMeter),
      unit: 'IDR per meter (Rp/m)',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Average unit construction budget allocated per linear meter of pipeline layout.',
      breakdown: `Total RAP Cost (${formattedCurrency(ratios.totalRAPCost)}) ÷ Total Pipeline Length (${Math.round(ratios.totalPipelineLength).toLocaleString('id-ID')} m).`
    },
    {
      id: 'material-cost-per-meter',
      label: 'Material / m',
      unitLabel: 'per meter',
      valStr: formattedCurrency(ratios.materialCostPerMeter),
      unit: 'IDR per meter (Rp/m)',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Average material supply budget (pipes, joints, valves, backfill) per linear meter.',
      breakdown: `Total Material Budget ÷ Total Pipeline Length (${Math.round(ratios.totalPipelineLength).toLocaleString('id-ID')} m).`
    },
    {
      id: 'labour-cost-per-meter',
      label: 'Labour / m',
      unitLabel: 'per meter',
      valStr: formattedCurrency(ratios.labourCostPerMeter),
      unit: 'IDR per meter (Rp/m)',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Average direct workforce/labor expense allocated per linear meter of active lines.',
      breakdown: `Total Labor Budget ÷ Total Pipeline Length (${Math.round(ratios.totalPipelineLength).toLocaleString('id-ID')} m).`
    },
    {
      id: 'equipment-cost-per-meter',
      label: 'Equip. Rent / m',
      unitLabel: 'per meter',
      valStr: formattedCurrency(ratios.equipmentCostPerMeter),
      unit: 'IDR per meter (Rp/m)',
      cardClass: 'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300',
      explanation: 'Average heavy machinery rental and fuel budget allocated per linear meter.',
      breakdown: `Total Equipment Lease Budget ÷ Total Pipeline Length (${Math.round(ratios.totalPipelineLength).toLocaleString('id-ID')} m).`
    },
    {
      id: 'retribution-cost-per-meter',
      label: 'Retribution / m',
      unitLabel: 'regional fee',
      valStr: formattedCurrency(ratios.vehicleRetributionCostPerMeter),
      unit: 'IDR per meter (Rp/m)',
      cardClass: 'bg-amber-50/20 border-amber-200 text-amber-900 hover:bg-amber-100/10 hover:border-amber-300',
      explanation: 'Average regional retribution, transport, road clearance, and permit fees allocated per linear meter.',
      breakdown: `Total Vehicle Retribution Budget ÷ Total Pipeline Length (${Math.round(ratios.totalPipelineLength).toLocaleString('id-ID')} m).`
    }
  ];

  const statuses = [
    { name: 'Draft', desc: 'Active draft parameters, surveying segments, and initial raw pipe measurements configuration.' },
    { name: 'Engineer Reviewed', desc: 'Pipe segments, diameters, appurtenances and civil structures have been checked and verified.' },
    { name: 'BOQ Approved', desc: 'Bill of quantities list has been completely mapped, unmatched components locked and approved.' },
    { name: 'RAP Approved', desc: 'Rencana Anggaran Pelaksanaan pricing calculations are finalized by Engineering Department heads.' },
    { name: 'Management Approved', desc: 'Full preliminary costing and contract profitability verified and signed off for bidding.' }
  ] as const;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-705 border-slate-200';
      case 'Engineer Reviewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BOQ Approved':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RAP Approved':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Management Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-205';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Promotion of Project state
  const handleTransitionStatus = (nextStatus: typeof statuses[number]['name']) => {
    const oldStatus = project.status;
    
    // Validate order slightly to keep business flow realistic
    const currIdx = statuses.findIndex(s => s.name === project.status);
    const nextIdx = statuses.findIndex(s => s.name === nextStatus);
    
    if (nextIdx > currIdx + 1 && nextStatus !== 'Draft') {
      alert(`Engineering protocol requires step-by-step approvals. Please proceed sequentially to [${statuses[currIdx + 1].name}] first.`);
      return;
    }

    const marginSec = ratios.poValue > 0 ? `${ratios.estimatedProfitMargin.toFixed(1)}%` : 'N/A';
    const rapPerMeterSec = ratios.totalPipelineLength > 0 ? `Rp ${Math.round(ratios.rapCostPerMeter).toLocaleString('id-ID')}/m` : 'N/A';
    
    let newValStr = `${nextStatus}`;
    if (['BOQ Approved', 'RAP Approved', 'Management Approved'].includes(nextStatus)) {
      newValStr = `${nextStatus} (Snapshot | Margin: ${marginSec} · RAP/m: ${rapPerMeterSec} · Pipeline: ${ratios.totalPipelineLength}m · PO: Rp ${ratios.poValue.toLocaleString('id-ID')})`;
    }

    updateProject({
      ...project,
      status: nextStatus,
      lastUpdated: new Date().toISOString()
    });

    addAuditLog(
      `Project Approval status transitioned to ${nextStatus}`,
      `${oldStatus}`,
      newValStr
    );
  };

  return (
    <div className="space-y-6 fade-in">
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight text-slate-900 font-sans">Engineering Governance & Audit Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">Review the compliance sign-off sequence and inspect individual data mutations.</p>
        </div>

        {/* Change Operator Name Widget */}
        <div className="space-y-1 block max-w-xs self-stretch md:self-auto">
          <label className="text-[9px] font-bold text-slate-400 uppercase">Change Active Operator</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* PROJECT REVIEW SUMMARY & KEY RATIOS SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Project Review Summary & Key Ratios</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only project efficiency statistics. Checked systematically before confirming BOQ alignment or finalizing RAP budget profitability.
          </p>
        </div>

        {/* Project Scale Grids */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Project Scale Indicators</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {scaleMetrics.map((metric) => (
              <div
                key={metric.id}
                onClick={() => setSelectedRatio(metric)}
                className={`p-3 rounded-xl border flex flex-col justify-between h-[115px] transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer text-left select-none group relative overflow-hidden ${metric.cardClass}`}
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block truncate" title={metric.label}>
                    {metric.label}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600 inline-block font-semibold">
                    {metric.unitLabel}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-600 group-hover:text-blue-850 transition-colors">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>View value</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Ratio Grids */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Cost-Efficiency & Financial Indicators</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
            {financialMetrics.map((metric) => (
              <div
                key={metric.id}
                onClick={() => setSelectedRatio(metric)}
                className={`p-3 rounded-xl border flex flex-col justify-between h-[115px] transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer text-left select-none group relative overflow-hidden ${metric.cardClass}`}
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-tight block truncate animate-none" title={metric.label}>
                    {metric.label}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-400/10 inline-block font-semibold select-none">
                    {metric.unitLabel}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-extrabold text-blue-700 hover:text-blue-900 transition-colors">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>View value</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left approval transitions status list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden col-span-1 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Protocol Approval Workflow</h3>
          
          <div className="space-y-3">
            {statuses.map((item, idx) => {
              const matchesCurrent = project.status === item.name;
              const completedPrior = statuses.findIndex(s => s.name === project.status) >= idx;
              
              return (
                <div 
                  key={item.name} 
                  className={`p-3.5 rounded-lg border text-xs space-y-2 transition-all ${
                    matchesCurrent 
                      ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-50' 
                      : completedPrior
                      ? 'bg-slate-50 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{idx + 1}. {item.name}</span>
                    {matchesCurrent ? (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-extrabold uppercase">Active</span>
                    ) : completedPrior ? (
                      <span className="text-emerald-500 text-[10px] font-bold">Passed √</span>
                    ) : (
                      <span className="text-slate-350 text-[10px] font-semibold">Locked</span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>

                  {!matchesCurrent && !completedPrior && (
                    <button
                      onClick={() => handleTransitionStatus(item.name)}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      Promote to {item.name} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {matchesCurrent && item.name !== 'Draft' && (
                    <button
                      onClick={() => handleTransitionStatus('Draft')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Reset back to Draft state
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Audit Log Tables */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500 shrink-0" /> Approval & Change History
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                {auditLogs.length} Events Logged
              </span>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row justify-between gap-2 hover:bg-slate-50/50 p-2 rounded transition-colors">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          {log.operator}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800">{log.details}</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100 font-mono">
                        <div>
                          <span className="text-slate-400">OLD:</span> <span className="text-slate-600 truncate inline-block max-w-[150px]">{log.oldValue || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">NEW:</span> <span className="text-slate-800 font-semibold truncate inline-block max-w-[150px]">{log.newValue || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    No mutations recorded yet in active session. All variables in prime state.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-150 text-[10px] text-slate-400 flex items-center gap-1.5 leading-snug">
            <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Audit logs are generated and secured in client storage automatically. Unauthorised deletions are restricted.
          </div>
        </div>

      </div>

      {/* RATIO VALUE DETAILS MODAL */}
      <AnimatePresence>
        {selectedRatio && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRatio(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              id="ratio-modal-backdrop"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-full max-w-md relative z-10 p-6 space-y-5"
              id="ratio-modal-content"
            >
              <button
                onClick={() => setSelectedRatio(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block bg-blue-50 px-2 py-0.5 rounded w-max">
                  {selectedRatio.unitLabel}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{selectedRatio.label}</h3>
              </div>

              {/* Display metric raw value prominently */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Full Value</span>
                <div className="text-xl font-extrabold text-blue-800 font-mono tracking-tight break-words">
                  {selectedRatio.valStr}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Unit Class: <span className="text-slate-800 font-bold">{selectedRatio.unit}</span>
                </div>
              </div>

              {/* Explanation section */}
              <div className="space-y-3.5 pt-1 text-xs">
                <div className="space-y-1 text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concept Definition</h4>
                  <p className="text-slate-600 leading-relaxed font-sans">{selectedRatio.explanation}</p>
                </div>

                {selectedRatio.breakdown && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-left">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Computation / Logic Breakdown</h4>
                    <p className="text-slate-600 font-mono text-[10px] bg-slate-50 p-2.5 rounded border border-slate-200/60 leading-normal whitespace-pre-wrap">
                      {selectedRatio.breakdown}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedRatio(null)}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Acknowledge Metric
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
