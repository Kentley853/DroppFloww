import React, { useState, useMemo } from 'react';
import { 
  Project, 
  BOQItem, 
  RAPItem,
  BOMItem
} from '../types';
import { calculateProjectRatios } from '../utils/ratios';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Compass, 
  Layers, 
  Settings, 
  FileWarning, 
  Droplet,
  ArrowRight,
  Printer,
  ChevronDown,
  ChevronUp,
  HardHat,
  FileText,
  Truck,
  CheckCircle2,
  Info,
  Layers3,
  Scale,
  Calendar,
  AlertTriangle,
  Award,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import SampleDataLoader from './SampleDataLoader';

interface DashboardProps {
  project: Project;
  boqItems: BOQItem[];
  rapItems: RAPItem[];
  bomItems: BOMItem[];
  calculateOverallRAP: () => number;
  setActivePage: (page: string) => void;
  onLoadSample?: () => void;
  onClearSample?: () => void;
  isSampleLoaded?: boolean;
  onSyncCosting?: () => void;
}

export default function Dashboard({ 
  project, 
  boqItems, 
  rapItems, 
  bomItems,
  calculateOverallRAP, 
  setActivePage,
  onLoadSample,
  onClearSample,
  isSampleLoaded,
  onSyncCosting
}: DashboardProps) {

  // State to toggle table collapses
  const [showBOQTable, setShowBOQTable] = useState(true);
  const [showMaterialSummary, setShowMaterialSummary] = useState(true);

  // Compute exact ratio metrics using our ratios calculator
  const ratios = useMemo(() => {
    return calculateProjectRatios(project, boqItems, rapItems, bomItems);
  }, [project, boqItems, rapItems, bomItems]);

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const calcPercent = (val: number, total: number) => {
    if (!total) return '0%';
    return `${Math.round((val / total) * 105) / 1.05}%`; // accurate representation
  };

  // Status timeline markers
  const statuses = ['Draft', 'Engineer Reviewed', 'BOQ Approved', 'RAP Approved', 'Management Approved'];
  const currentStatusIdx = statuses.indexOf(project.status);

  // Filter project-specific BOM
  const projectBOM = useMemo(() => {
    return bomItems.filter((i) => i.projectId === project.id);
  }, [bomItems, project.id]);

  // Simulate report print function
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      
      {/* SAMPLE DATA BANNER LOAD/CLEAR */}
      {onLoadSample && onClearSample && (
        <div className="print:hidden">
          <SampleDataLoader 
            onLoadSample={onLoadSample}
            onClearSample={onClearSample}
            isSampleLoaded={!!isSampleLoaded}
          />
        </div>
      )}

      {/* SECTION 1: HEADER & ACTION PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-none print:shadow-none print:p-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest font-mono">
              EXECUTIVE PROJECT REPORT
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: {project.id}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1.5">{project.name}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Client: <span className="font-semibold text-slate-700">{project.client}</span> · Location: <span className="font-semibold text-slate-750 text-slate-705">{project.location}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={handlePrintReport}
            className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-blue-800" /> Print Summary Report
          </button>
          
          <button
            onClick={() => setActivePage('audit')}
            className="text-xs font-semibold bg-blue-700 text-white px-3.5 py-2 rounded-lg hover:bg-blue-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-100"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Open Approvals Panel
          </button>
        </div>
      </div>

      {/* TIMELINE PROGRESS ROADMAP BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm print:hidden">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" /> Stage Approval Status Roadmap
        </h3>
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="absolute left-3 sm:left-4 top-2 sm:top-[15px] sm:w-[94%] h-[2px] bg-slate-100 -z-0 hidden sm:block"></div>
          {statuses.map((st, idx) => {
            const isCompleted = idx <= currentStatusIdx;
            const isCurrent = idx === currentStatusIdx;
            return (
              <div key={st} className="flex sm:flex-col items-center gap-3 sm:text-center z-1 w-full sm:w-auto">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-50' 
                    : isCompleted 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-white text-slate-400 border-slate-200'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                    {st}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">
                    {idx === 0 && 'Initial Survey'}
                    {idx === 1 && 'Engineer Audit'}
                    {idx === 2 && 'Quantity Matched'}
                    {idx === 3 && 'RAP Pricing Lock'}
                    {idx === 4 && 'Procurement Released'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COSTING READINESS PIPELINE STATUS CARD */}
      {(() => {
        const pipesCount = project.pipeSegments.length;
        const confirmedPipes = project.pipeSegments.filter((p) => !p.requiresConfirmation).length;

        const appsCount = project.appurtenances.length;
        const confirmedApps = project.appurtenances.filter((a) => !a.requiresConfirmation).length;

        const strsCount = project.structures.length;
        const confirmedStrs = project.structures.filter((s) => !s.requiresConfirmation).length;

        const totalPipesImported = boqItems.filter(b => b.segmentId && !b.segmentId.includes('asphalt') && !b.segmentId.startsWith('app-') && !b.segmentId.startsWith('str-')).length;
        const totalAppsImported = boqItems.filter(b => b.segmentId && b.segmentId.startsWith('app-')).length;
        const totalStrsImported = boqItems.filter(b => b.segmentId && b.segmentId.startsWith('str-')).length;

        const pipelineSteps = [
          { label: 'Project Survey Mapped', isChecked: project.pipeSegments.length > 0 || project.appurtenances.length > 0, subtext: `${confirmedPipes}/${pipesCount} segments verified` },
          { label: 'BOQ Work Breakdown Formed', isChecked: boqItems.length > 0, subtext: `${boqItems.length} lines matched` },
          { label: 'BOM Materials Sourced', isChecked: bomItems.length > 0, subtext: `${bomItems.length} spec lines generated` },
          { label: 'Price Source Matching Verified', isChecked: bomItems.length > 0 && !bomItems.some(bm => bm.procurementStatus === 'Procurement Review Required'), subtext: bomItems.some(bm => bm.procurementStatus === 'Procurement Review Required') ? 'Needs Price Review' : 'All materials matched' },
          { label: 'AHSP Cost Build-Up Complete', isChecked: boqItems.length > 0 && !boqItems.some(bi => bi.ahspStatus === 'Unmatched'), subtext: 'Rates componentized' },
          { label: 'RAP Approved & Profit Margin Checked', isChecked: project.status === 'RAP Approved' || project.status === 'Management Approved', subtext: `Status: ${project.status}` }
        ];

        const checkCount = pipelineSteps.filter(s => s.isChecked).length;
        const syncReadinessPct = Math.round((checkCount / pipelineSteps.length) * 100);

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center print:hidden">
            <div className="space-y-4 lg:border-r lg:border-slate-150 lg:pr-6">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2 text-[10px] bg-slate-900 text-slate-100 font-bold font-mono rounded uppercase">Sync Engine</span>
                <h4 className="text-sm font-bold text-slate-800">BPM Costing Integration Ready</h4>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Costing Readiness Gauge:</span>
                  <span className={`font-mono font-extrabold ${syncReadinessPct === 100 ? 'text-emerald-600 font-bold' : 'text-blue-700'}`}>{syncReadinessPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${syncReadinessPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                    style={{ width: `${syncReadinessPct}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <div>• Imported Pipes: {totalPipesImported}/{confirmedPipes} ({confirmedPipes} confirmed)</div>
                  <div>• Imported Appurtenances: {totalAppsImported}/{confirmedApps} ({confirmedApps} confirmed)</div>
                  <div>• Imported Civil Chambers: {totalStrsImported}/{confirmedStrs} ({confirmedStrs} confirmed)</div>
                </div>
              </div>

              {onSyncCosting && (
                <button
                  onClick={() => {
                    onSyncCosting();
                    alert('Synchronizing engineering survey assets to BOQ and pricing models... Refreshed Cascade RAP costs.');
                  }}
                  className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 rounded-lg text-xs font-bold transition-all inline-flex justify-center items-center gap-1.5 cursor-pointer hover:shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  Regenerate Cost Data (Sync)
                </button>
              )}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h5 className="text-[10px] font-extrabold font-mono text-slate-400 uppercase tracking-widest">Pipeline Checklist</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pipelineSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className={`p-1 rounded-full text-white ${step.isChecked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {step.isChecked ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-400" />}
                    </div>
                    <div>
                      <div className={`text-[11px] font-bold leading-tight ${step.isChecked ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</div>
                      <div className="text-[9px] text-slate-400 max-w-full truncate">{step.subtext}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* SECTION 2: EXECUTIVE FINANCIAL SUMMARIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Contract / PO Value</span>
            <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">{formattedCurrency(ratios.poValue)}</span>
          </div>
          <div className="pt-2 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Billed client value</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-semibold font-mono">LOCKED</span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Estimated Total RAP</span>
            <span className="text-xl font-bold font-mono text-blue-700 tracking-tight">{formattedCurrency(ratios.totalRAPCost)}</span>
          </div>
          <div className="pt-2 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Aggregated Cost</span>
            <button onClick={() => setActivePage('rap')} className="text-blue-600 hover:underline font-semibold cursor-pointer text-[10px]">
              View Unit Cost &rarr;
            </button>
          </div>
        </div>

        <div className={`bg-white p-5 border border-slate-200 rounded-xl shadow-sm border-l-4 ${
          ratios.estimatedProfit >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'
        } flex flex-col justify-between`}>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Projected Gross Profit</span>
            <span className={`text-xl font-bold font-mono tracking-tight ${
              ratios.estimatedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {ratios.estimatedProfit >= 0 ? '+' : ''} {formattedCurrency(ratios.estimatedProfit)}
            </span>
          </div>
          <div className="pt-2 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Profit Margin</span>
            <span className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
              ratios.estimatedProfit >= 0 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-rose-50 text-rose-700 font-bold'
            }`}>
              {ratios.estimatedProfit >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Gross Margin (%)</span>
            <span className={`text-xl font-bold font-mono tracking-tight ${
              ratios.estimatedProfitMargin >= 10 ? 'text-emerald-600' : 'text-amber-600'
            }`}>{ratios.estimatedProfitMargin.toFixed(2)}%</span>
          </div>
          <div className="pt-2 mt-4 border-t border-slate-100 flex items-center gap-1">
            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${ratios.estimatedProfitMargin < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(Math.max(ratios.estimatedProfitMargin, 0), 100)}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono text-slate-500 shrink-0 font-bold">
              {ratios.estimatedProfitMargin < 10 ? 'ATTN' : 'SAFE'}
            </span>
          </div>
        </div>

      </div>

      {/* DEFICIT OR LOW MARGIN NOTICE BAR */}
      {ratios.estimatedProfitMargin < 10 && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 print:hidden ${
          ratios.estimatedProfit < 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50/60 border-amber-200 text-amber-900'
        }`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${ratios.estimatedProfit < 0 ? 'text-rose-600' : 'text-amber-600'}`} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">
              {ratios.estimatedProfit < 0 
                ? 'CRITICAL DEFICIT REPORT DETECTED' 
                : 'RISK / LOW MARGIN REVIEW REQUIRED (< 10%)'}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed max-w-4xl">
              {ratios.estimatedProfit < 0
                ? 'The assembled costing model exceeds the total budget. Please check the Master prices, optimize the pipeline diameters, minimize waste factors, or renegotiate transport retribution charges.'
                : 'Project margin does not satisfy our standard benchmark. Seek permission from management or utilize HDD crossing machinery to reduce asphalt cutting reinstatement costs.'}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 3: KEY PROJECT SCALE AND EFFICIENCY RATIOS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-700" /> Project Review Summary & Key Ratios
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Project Scale */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Project Scale & Layout
            </div>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Total Pipe Length</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{ratios.totalPipelineLength} m</div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Pipe Segments</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{ratios.totalPipeSegments} segments</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">BOQ Work Items</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{ratios.totalBOQWorkItems} lines</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Total Valves</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{ratios.totalValves} pcs</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Valve Chambers</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{ratios.totalChambers} units</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Connections</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{ratios.totalServiceConnections} meters</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Planned Duration</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{ratios.plannedDuration} days</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Intallation pace</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                  {ratios.plannedInstallationRate.toFixed(1)} m/day
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Cost Efficiency per Meter of Pipeline */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-slate-400" /> Cost-Efficiency & Meter Rates
            </div>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-blue-50/75 px-3.5 py-2.5 rounded-lg border border-blue-200 shadow-sm">
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">RAP Cost / Meter</span>
                <span className="text-xs font-bold text-blue-900 font-mono">{formattedCurrency(ratios.rapCostPerMeter)}</span>
              </div>
              
              <div className="flex justify-between items-center bg-teal-50/75 px-3.5 py-2.5 rounded-lg border border-teal-200 shadow-sm">
                <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">Material Supply / Meter</span>
                <span className="text-xs font-bold text-teal-900 font-mono">{formattedCurrency(ratios.materialCostPerMeter)}</span>
              </div>

              <div className="flex justify-between items-center bg-amber-50/75 px-3.5 py-2.5 rounded-lg border border-amber-200 shadow-sm">
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Labour / Meter</span>
                <span className="text-xs font-bold text-amber-900 font-mono">{formattedCurrency(ratios.labourCostPerMeter)}</span>
              </div>

              <div className="flex justify-between items-center bg-purple-50/75 px-3.5 py-2.5 rounded-lg border border-purple-200 shadow-sm">
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Machinery rent / Meter</span>
                <span className="text-xs font-bold text-purple-900 font-mono">{formattedCurrency(ratios.equipmentCostPerMeter)}</span>
              </div>

              <div className="flex justify-between items-center bg-rose-50/75 px-3.5 py-2.5 rounded-lg border border-rose-200 shadow-sm">
                <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Planned Cost per Day</span>
                <span className="text-xs font-bold text-rose-900 font-mono">{formattedCurrency(ratios.plannedDailyCost)}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Civil Work & Reinstatements metrics */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-2">
              <Layers3 className="w-3.5 h-3.5 text-slate-400" /> Civil Works & Restore Ratios
            </div>
            
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-105 rounded-lg space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Excavation Cost</span>
                  <span className="font-bold font-mono text-slate-700">{ratios.excavationVolume.toFixed(1)} m³</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1 py-0.2 rounded bg-white">Unit Price</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {ratios.excavationVolume > 0 ? `${formattedCurrency(ratios.excavationCostPerM3)}/m³` : 'Data Required'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-105 rounded-lg space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Backfill & Sand</span>
                  <span className="font-bold font-mono text-slate-700">{ratios.backfillVolume.toFixed(1)} m³</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1 py-0.2 rounded bg-white">Unit Price</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {ratios.backfillVolume > 0 ? `${formattedCurrency(ratios.backfillCostPerM3)}/m³` : 'Data Required'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-105 rounded-lg space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Asphalt Reinstatement</span>
                  <span className="font-bold font-mono text-slate-700">{ratios.asphaltArea.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1 py-0.2 rounded bg-white">Unit Price</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {ratios.asphaltArea > 0 ? `${formattedCurrency(ratios.asphaltCostPerM2)}/m²` : 'Data Required'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-105 rounded-lg space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Concrete Core Restore</span>
                  <span className="font-bold font-mono text-slate-700">{ratios.concreteArea.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1 py-0.2 rounded bg-white">Unit Price</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {ratios.concreteArea > 0 ? `${formattedCurrency(ratios.concreteCostPerM2)}/m²` : 'Data Required'}
                  </span>
                </div>
              </div>
            </div>
            
          </div>

        </div>

      </div>

      {/* SECTION 4: RAP COST RESOURCE распределение & BREAKDOWN BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
        
        {/* Cost Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 lg:col-span-2">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">RAP Cost Component Slicing</h3>
            <p className="text-xs text-slate-500 mt-1">Cost distribution analysis across physical components of materials, labor and machinery.</p>
          </div>
          
          <div className="space-y-4">
            {/* Materials Cost */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-650 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600 block"></span>
                  Materials Supply Cost
                </span>
                <span className="text-slate-900 font-bold font-mono">{formattedCurrency(ratios.totalMaterialCost)} ({ratios.materialCostPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${ratios.materialCostPercentage}%` }}></div>
              </div>
            </div>

            {/* Labour Cost */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-650 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-teal-500 block"></span>
                  Labour Force Allocation 
                </span>
                <span className="text-slate-900 font-bold font-mono">{formattedCurrency(ratios.totalLabourCost)} ({ratios.labourCostPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${ratios.labourCostPercentage}%` }}></div>
              </div>
            </div>

            {/* Equipment Cost */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-650 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span>
                  Machinery & Heavy Excavators
                </span>
                <span className="text-slate-900 font-bold font-mono">{formattedCurrency(ratios.totalEquipmentCost)} ({ratios.equipmentCostPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${ratios.equipmentCostPercentage}%` }}></div>
              </div>
            </div>

            {/* Transport Retribution Cost */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-650 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-violet-500 block"></span>
                  Permits & Vehicle Retributions
                </span>
                <span className="text-slate-900 font-bold font-mono text-amber-700">{formattedCurrency(ratios.totalVehicleRetributionCost)} ({ratios.vehicleRetributionCostPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full" style={{ width: `${ratios.vehicleRetributionCostPercentage}%` }}></div>
              </div>
            </div>

            {/* Unified Stacked Bar */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex h-3 rounded-full overflow-hidden w-full bg-slate-50 border border-slate-100">
                <div className="bg-blue-600" style={{ width: `${ratios.materialCostPercentage}%` }}></div>
                <div className="bg-teal-500" style={{ width: `${ratios.labourCostPercentage}%` }}></div>
                <div className="bg-amber-500" style={{ width: `${ratios.equipmentCostPercentage}%` }}></div>
                <div className="bg-violet-500" style={{ width: `${ratios.vehicleRetributionCostPercentage}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                <span>Materials ({ratios.materialCostPercentage.toFixed(0)}%)</span>
                <span>Labour ({ratios.labourCostPercentage.toFixed(0)}%)</span>
                <span>Machines ({ratios.equipmentCostPercentage.toFixed(0)}%)</span>
                <span>Freight ({ratios.vehicleRetributionCostPercentage.toFixed(0)}%)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Physical Scale Card lists */}
        <div className="bg-slate-900 text-slate-350 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4 text-slate-300">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <HardHat className="w-4 h-4 text-blue-400" /> Site Layout Quantities
            </h4>
            <p className="text-[11px] text-slate-400">Pipeline layout variables compiled from active site engineering files.</p>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Total pipeline length</span>
              <span className="font-mono text-white font-bold">{ratios.totalPipelineLength} m</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Total valves mapped</span>
              <span className="font-mono text-white font-bold">{ratios.totalValves} units</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Masonry flow chambers</span>
              <span className="font-mono text-white font-bold">{ratios.totalChambers} chambers</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Active design estimate cards</span>
              <span className="font-mono text-white font-bold">{boqItems.length} lines</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Estimated Project duration</span>
              <span className="font-mono text-white font-bold">{ratios.plannedDuration} days</span>
            </div>
          </div>

          <button
            onClick={() => setActivePage('project')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg transition-all cursor-pointer inline-flex justify-center items-center gap-1.5"
          >
            Edit Pipeline Survey Metrics &rarr;
          </button>
        </div>

      </div>

      {/* SECTION 5: COLLAPSIBLE BOQ ESTIMATES RESULTS SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div 
          onClick={() => setShowBOQTable(!showBOQTable)}
          className="px-5 py-4 bg-slate-50 flex justify-between items-center cursor-pointer border-b border-slate-150"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Active BOQ Work Estimates ({boqItems.length} records)
            </h3>
          </div>
          {showBOQTable ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>

        {showBOQTable && (
          <div className="overflow-x-auto max-h-[280px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Item Code</th>
                  <th className="px-4 py-2.5">Work Description</th>
                  <th className="px-4 py-2.5 text-center">Standard Quantity</th>
                  <th className="px-4 py-2.5 text-center">Unit</th>
                  <th className="px-4 py-2.5">AHSP Temp Ref</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boqItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono font-semibold text-slate-700">{item.itemCode}</td>
                    <td className="px-4 py-2 text-slate-800">{item.description}</td>
                    <td className="px-4 py-2 text-center font-mono">{item.quantity.toFixed(1)}</td>
                    <td className="px-4 py-2 text-center text-slate-400">{item.unit}</td>
                    <td className="px-4 py-2 font-mono text-slate-500 text-[11px]">{item.ahspCode || 'NONE'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        item.ahspStatus === 'Matched'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.ahspStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 6: BILL OF MATERIALS LANDED SUMMARY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div 
          onClick={() => setShowMaterialSummary(!showMaterialSummary)}
          className="px-5 py-4 bg-slate-50 flex justify-between items-center cursor-pointer border-b border-slate-150"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-violet-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Project Bill of Materials Summary ({projectBOM.length} registered types)
            </h3>
          </div>
          {showMaterialSummary ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>

        {showMaterialSummary && (
          <div className="p-4 space-y-4">
            {projectBOM.length === 0 ? (
              <div className="text-center p-6 space-y-1.5">
                <p className="text-xs text-slate-400">No active materials have been compiled in the Bill of Materials tab yet.</p>
                <button
                  onClick={() => setActivePage('bom')}
                  className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                >
                  Generate materials from BOQ now &rarr;
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Raw Materials Total</span>
                    <span className="text-xs font-bold font-mono text-slate-800">{formattedCurrency(ratios.totalMaterialCost)}</span>
                  </div>
                  
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Logistics Retribution</span>
                    <span className="text-xs font-bold font-mono text-amber-700">{formattedCurrency(ratios.totalVehicleRetributionCost)}</span>
                  </div>

                  <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-700 uppercase font-bold tracking-wider block">Committed Landed cost</span>
                    <span className="text-xs font-extrabold font-mono text-blue-900">
                      {formattedCurrency(ratios.totalMaterialCost + ratios.totalVehicleRetributionCost)}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">BOM Statuses Lock</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {projectBOM.filter((i) => i.procurementStatus === 'Draft').length} Draft · {projectBOM.filter((i) => i.procurementStatus === 'Sourced').length} Sourced
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">Material Code</th>
                        <th className="px-4 py-2">Material Specification</th>
                        <th className="px-4 py-2 text-center">Final Qty</th>
                        <th className="px-4 py-2 text-right">Landed Cost (Rp)</th>
                        <th className="px-4 py-2">Primary Sourced Vendor</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectBOM.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-mono text-[11px] text-slate-500">{item.materialCode}</td>
                          <td className="px-4 py-2 font-medium text-slate-800">{item.description}</td>
                          <td className="px-4 py-2 text-center font-mono">
                            {item.finalRequiredQuantity.toFixed(2)} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-bold text-blue-900 bg-blue-50/30">
                            {formattedCurrency(item.finalLandedCost)}
                          </td>
                          <td className="px-4 py-2 text-slate-600">{item.supplier}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              item.procurementStatus === 'Purchased'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : item.procurementStatus === 'Sourced'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {item.procurementStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {projectBOM.length > 5 && (
                        <tr>
                          <td colSpan={6} className="text-center py-2.5 bg-slate-50">
                            <button
                              onClick={() => setActivePage('bom')}
                              className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                            >
                              Show remaining {projectBOM.length - 5} materials in detail Billing view &rarr;
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* SECTION 7: APPROVAL SIGN OFF FOOTER & COMPLIANCE STITCH */}
      <div className="bg-slate-950 text-slate-400 rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row gap-6 items-center">
        <div className="w-12 h-12 bg-blue-950 rounded-xl flex items-center justify-center text-blue-400 border border-blue-800 shrink-0">
          <Award className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 space-y-1 text-slate-300">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            PT Bestindo Putra Mandiri Engineering Directive G-06
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            This analytical executive project report aggregates layout metrics, cost indices, and bill of materials. All calculations are locked under active standard revision logs. Any modifications to the materials pricing registry or sand backfill compaction coefficient will automatically cascadingly trigger a recalculation of the RAP model.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <button 
            onClick={() => setActivePage('project')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Review Layout Surveys
          </button>
          <button 
            onClick={() => setActivePage('audit')}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm shadow-blue-105"
          >
            Sign-Off Approval
          </button>
        </div>
      </div>

    </div>
  );
}
