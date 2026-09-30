/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Play, 
  Save, 
  Trash2, 
  RefreshCw, 
  Database,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ButtonQAProps {
  onManualSave: () => void;
  onLoadSample: () => void;
  onClearSample: () => void;
  onClearEntire: () => void;
  onApproveBOQ: () => void;
  onApproveRAP: () => void;
  projectStatus: string;
  projectName: string;
  boqCount: number;
  bomCount: number;
  priceCount: number;
  auditCount: number;
}

export default function ButtonQA({
  onManualSave,
  onLoadSample,
  onClearSample,
  onClearEntire,
  onApproveBOQ,
  onApproveRAP,
  projectStatus,
  projectName,
  boqCount,
  bomCount,
  priceCount,
  auditCount
}: ButtonQAProps) {
  const [testLogs, setTestLogs] = useState<{ time: string; msg: string; type: 'info' | 'success' | 'err' }[]>([
    { time: new Date().toLocaleTimeString(), msg: 'QA Test Console Initialized.', type: 'info' }
  ]);

  const addLog = (msg: string, type: 'info' | 'success' | 'err' = 'info') => {
    setTestLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev]);
  };

  const controls = [
    {
      id: 'save-project',
      name: 'Global "Save Project" Button',
      location: 'Top-Right Header Bar',
      action: 'Persists all application state arrays (projects, BOQ, BOM, Materials, Labours, Equipments, AHSP, Audits, Price Sources) to LocalStorage.',
      status: 'Active / Functional',
      isGreen: true,
      trigger: () => {
        onManualSave();
        addLog('Completed test action: Persisted all project lists to LocalStorage.', 'success');
      }
    },
    {
      id: 'load-sample',
      name: 'Load Sample Calculation',
      location: 'Sidebar Bottom & Dashboard',
      action: 'Loads mock project calculations (PRJ-DEMO-2026), hydrations, active pipeline segments, sample cost breakdowns, and adds audit sign-off.',
      status: 'Active / Functional',
      isGreen: true,
      trigger: () => {
        onLoadSample();
        addLog('Completed test action: Injected demo calculation dataset (PRJ-DEMO-2026).', 'success');
      }
    },
    {
      id: 'clear-sample',
      name: 'Clear All Sample Data',
      location: 'Sidebar Footer & Dashboard Settings',
      action: 'Splices out mock project "PRJ-DEMO-2026" and associated BOM/BOQ/RAP records, reverting master-price overrides back to clean defaults, keeping manual user records intact.',
      status: 'Active / Functional',
      isGreen: true,
      trigger: () => {
        onClearSample();
        addLog('Completed test action: Purged sample/demo project state and associated caches.', 'success');
      }
    },
    {
      id: 'clear-entire',
      name: 'Clear Entire Project Database',
      location: 'Dashboard Settings Area',
      action: 'Requires exact confirmation of current active project name. Deletes all project files, cached AI drawings, raps, results, file logs, and entries entirely, bringing application back to clean fresh state.',
      status: 'Active / Functional',
      isGreen: true,
      trigger: () => {
        onClearEntire();
        addLog('Completed test action: Purged all real and mock project stores and histories.', 'success');
      }
    },
    {
      id: 'approve-boq',
      name: 'Approve BOQ Quantities',
      location: 'BOQ Estimates Page',
      action: 'Locks engineering BOQ and advances activeProject.status to "BOQ Approved", triggering downstream Bill of Materials and Procurement pricing phase.',
      status: projectStatus === 'Draft' || projectStatus === 'Engineer Reviewed' ? 'Active' : 'Locked (Requires Draft Status)',
      isGreen: projectStatus === 'Draft' || projectStatus === 'Engineer Reviewed',
      trigger: () => {
        if (projectStatus !== 'Draft' && projectStatus !== 'Engineer Reviewed') {
          addLog('Action blocked: Project status must be "Draft" or "Engineer Reviewed" to sign off BOQ.', 'err');
          return;
        }
        onApproveBOQ();
        addLog('Completed test action: Confirmed and signed off BOQ Quantities.', 'success');
      }
    },
    {
      id: 'approve-rap',
      name: 'Approve RAP Unit Costs',
      location: 'RAP Unit Cost Page',
      action: 'Locks entire procurement quotation sheet, commits pricing, advances activeProject.status to "RAP Approved", and updates cashflow sheets.',
      status: projectStatus === 'BOQ Approved' ? 'Active' : 'Locked (Requires BOQ Approved Status)',
      isGreen: projectStatus === 'BOQ Approved',
      trigger: () => {
        if (projectStatus !== 'BOQ Approved') {
          addLog('Action blocked: Project status must be "BOQ Approved" to release RAP sheet.', 'err');
          return;
        }
        onApproveRAP();
        addLog('Completed test action: Approved and signed off RAP pricing structures.', 'success');
      }
    }
  ];

  return (
    <div className="space-y-6 fade-in text-slate-800">
      
      {/* Header Info */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-lg border border-slate-750 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono">PT BPM Engineering QA Butler Test Console</h2>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Interactive system testing toolkit. Allows live verification of state-dependent triggers, clearing mechanics, and compliance pipelines.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Project</span>
            <span className="font-semibold text-blue-300 truncate max-w-[120px] inline-block">{projectName || 'N/A'}</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Project Status</span>
            <span className="font-semibold text-purple-300">{projectStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Actions grid */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">System Control Indicators & Interactive Mock Triggers</h3>
          
          <div className="space-y-3">
            {controls.map((ctrl) => (
              <div 
                key={ctrl.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ctrl.isGreen ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`}></span>
                    <span className="text-xs font-bold text-slate-850">{ctrl.name}</span>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      {ctrl.location}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-550 leading-relaxed text-slate-500">
                    {ctrl.action}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span className={`text-[10px] font-bold tracking-wide uppercase ${ctrl.isGreen ? 'text-green-600' : 'text-amber-600'}`}>
                    • {ctrl.status}
                  </span>
                  <button
                    onClick={ctrl.trigger}
                    className="flex items-center gap-1 bg-slate-900 border border-slate-900 hover:bg-blue-700 hover:border-blue-700 text-white font-bold font-sans px-3 py-1.5 rounded duration-100 transition-colors shadow-xs cursor-pointer text-[11px]"
                  >
                    <Play className="w-3 h-3 text-current shrink-0 fill-current" />
                    Test Button
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Stats & Diagnostic Logs */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4 text-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              Environment Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-3.5 font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">BOQ Items</span>
                <span className="text-sm font-bold text-slate-750">{boqCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">BOM Items</span>
                <span className="text-sm font-bold text-slate-755">{bomCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Price Sources</span>
                <span className="text-sm font-bold text-slate-750">{priceCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Audit Events</span>
                <span className="text-sm font-bold text-slate-755">{auditCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 text-slate-220 rounded-xl p-4 border border-slate-800 space-y-3 font-mono text-[10px] text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 text-slate-400">
              <span className="text-[9px] uppercase font-bold tracking-wider">Diagnostic Log Window</span>
              <button 
                onClick={() => setTestLogs([{ time: new Date().toLocaleTimeString(), msg: 'Console cleared.', type: 'info' }])}
                className="hover:text-white underline text-[8px] cursor-pointer"
              >
                Clear Console
              </button>
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-1.5 text-left leading-normal pr-1">
              {testLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-500 font-bold shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'err' ? 'text-red-400 font-semibold' :
                    'text-slate-300'
                  }>
                    {log.type === 'success' ? '✓ ' : log.type === 'err' ? '✗ ' : 'i '}
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
