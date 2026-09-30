import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle, AlertTriangle, Play, Trash2 } from 'lucide-react';

interface SampleDataLoaderProps {
  onLoadSample: () => void;
  onClearSample: () => void;
  isSampleLoaded: boolean;
  className?: string;
}

export default function SampleDataLoader({ onLoadSample, onClearSample, isSampleLoaded, className = "" }: SampleDataLoaderProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirmLoad = () => {
    setShowConfirm(false);
    onLoadSample();
    setShowSuccess(true);
    // Let the user know with automated persistence message disappearing in 8s
    setTimeout(() => {
      setShowSuccess(false);
    }, 8000);
  };

  return (
    <div className={`mt-4 mb-6 ${className}`} id="sample-data-loader-container">
      {/* SUCCESS MESSAGE BANNER */}
      {showSuccess && (
        <div id="sample-success-alert" className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3.5 flex items-start gap-3 shadow-sm transition-all duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-950">Draft Assessment Instantiated Successfully</p>
            <p className="text-xs text-emerald-700 mt-1 font-medium">
              Sample calculation loaded successfully. You can now review the BOQ, RAP, and Profit Summary pages.
            </p>
          </div>
        </div>
      )}

      {/* COMPACT DEMO BANNER WIDGET */}
      <div id="sample-loader-widget" className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-250/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex gap-3">
          <div className="bg-blue-500/10 text-blue-700 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800">Try Demo Project</h4>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isSampleLoaded ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-250 text-slate-500 border border-slate-350'}`}>
                {isSampleLoaded ? 'DEMO MODE ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Test calculated outcomes instantly (Pipe segments, Appurtenances, AHSPs, and real-time profitability charts).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isSampleLoaded ? (
            <button
              onClick={() => setShowConfirm(true)}
              type="button"
              id="btn-load-sample-calculation"
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-150 flex items-center gap-2 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load Sample Calculation</span>
            </button>
          ) : (
            <button
              onClick={onClearSample}
              type="button"
              id="btn-clear-sample-data"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Clear Current Project Data</span>
            </button>
          )}
        </div>
      </div>

      {/* CONFIRMATION CONTEXT DIALOG MODAL */}
      {showConfirm && (
        <div id="sample-confirm-modal" className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 text-amber-700 w-11 h-11 rounded-full flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Load Sample Calculation?</h3>
                <p className="text-xs text-slate-650 mt-2 leading-relaxed">
                  This will populate the system with a demo project, BOQ items, AHSP prices, RAP calculation, and profit summary. Existing draft data may be replaced.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLoad}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow transition-colors"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
