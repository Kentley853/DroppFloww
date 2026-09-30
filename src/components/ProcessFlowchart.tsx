import React from 'react';
import { 
  ArrowRight, 
  ArrowDown, 
  Workflow, 
  HelpCircle,
  Database,
  Upload,
  ClipboardList,
  BaggageClaim,
  Coins,
  History,
  TrendingDown,
  Wand2
} from 'lucide-react';
import { PageId } from './Sidebar';

// CUSTOM REUSABLE HIGH-CONTRAST PROCESS FLOW CONNECTORS WITH PROFESSIONAL ANIMATION
const HorizontalConnector = ({ direction = 'right', staggerDelay = '0s' }: { direction?: 'right' | 'left'; staggerDelay?: string }) => {
  const isRight = direction === 'right';
  const strokeColor = "#64748b";
  const strokeWidth = "2.8";
  const glowId = `glow-h-${direction}-${staggerDelay.replace('.', '-')}`;

  return (
    <div className="flex items-center justify-center w-full min-w-[32px] px-1 select-none">
      <svg className="w-full h-8 overflow-visible" viewBox="0 0 60 20" preserveAspectRatio="none">
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <marker
            id={`arrowhead-h-${direction}`}
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 2 3 L 10 6 L 2 9 Z" fill={strokeColor} />
          </marker>
        </defs>
        <line
          x1={isRight ? "2" : "58"}
          y1="10"
          x2={isRight ? "54" : "6"}
          y2="10"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd={`url(#arrowhead-h-${direction})`}
        />
        <circle r="4" fill={`url(#${glowId})`}>
          <animateMotion
            path={isRight ? "M 2 10 L 46 10" : "M 58 10 L 14 10"}
            dur="2.4s"
            begin={staggerDelay}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.4s"
            begin={staggerDelay}
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};

const VerticalConnector = ({ height = 36, staggerDelay = '0s' }: { height?: number; staggerDelay?: string }) => {
  const strokeColor = "#64748b";
  const strokeWidth = "2.8";
  const isID = staggerDelay.replace('.', '-');

  return (
    <div className="flex items-center justify-center w-full select-none" style={{ height }}>
      <svg className="h-full overflow-visible" viewBox={`0 0 20 ${height}`} preserveAspectRatio="none" style={{ width: '40px' }}>
        <defs>
          <radialGradient id={`glow-v-${isID}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <marker
            id={`arrowhead-v-${isID}`}
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 2 3 L 10 6 L 2 9 Z" fill={strokeColor} />
          </marker>
        </defs>
        <line
          x1="10"
          y1="2"
          x2="10"
          y2={height - 8}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd={`url(#arrowhead-v-${isID})`}
        />
        <circle r="4" fill={`url(#glow-v-${isID})`}>
          <animateMotion
            path={`M 10 2 L 10 ${height - 14}`}
            dur="2.4s"
            begin={staggerDelay}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.4s"
            begin={staggerDelay}
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};

const Step1ToStep2Connector = () => {
  const strokeColor = "#64748b";
  const strokeWidth = "2.8";
  
  return (
    <div className="w-full select-none hover:opacity-105 transition-opacity" style={{ height: '36px' }}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 36" preserveAspectRatio="none">
        <defs>
          <radialGradient id="glow-s1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <marker
            id="arrow-down-s1"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 2 3 L 10 6 L 2 9 Z" fill={strokeColor} />
          </marker>
        </defs>

        {/* Path 1: aligned on left column */}
        <line x1="100" y1="2" x2="100" y2="28" stroke={strokeColor} strokeWidth={strokeWidth} markerEnd="url(#arrow-down-s1)" />
        <circle r="4" fill="url(#glow-s1)">
          <animateMotion dur="2.2s" begin="0.1s" repeatCount="indefinite" path="M 100 2 L 100 22" />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.2s"
            begin="0.1s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Path 2: center column */}
        <line x1="500" y1="2" x2="500" y2="28" stroke={strokeColor} strokeWidth={strokeWidth} markerEnd="url(#arrow-down-s1)" />
        <circle r="4" fill="url(#glow-s1)">
          <animateMotion dur="2.4s" begin="0.4s" repeatCount="indefinite" path="M 500 2 L 500 22" />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.4s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Path 3: right column */}
        <line x1="900" y1="2" x2="900" y2="28" stroke={strokeColor} strokeWidth={strokeWidth} markerEnd="url(#arrow-down-s1)" />
        <circle r="4" fill="url(#glow-s1)">
          <animateMotion dur="2.6s" begin="0.7s" repeatCount="indefinite" path="M 900 2 L 900 22" />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.6s"
            begin="0.7s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};

const Step2ToStep3Connector = () => {
  const strokeColor = "#64748b";
  const strokeWidth = "2.8";

  return (
    <div className="w-full select-none hover:opacity-105 transition-opacity" style={{ height: '36px' }}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 36" preserveAspectRatio="none">
        <defs>
          <radialGradient id="glow-s2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <marker
            id="arrow-down-s2"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 2 3 L 10 6 L 2 9 Z" fill={strokeColor} />
          </marker>
        </defs>

        {/* Path 1: straight down from 100 to 100 */}
        <line x1="100" y1="2" x2="100" y2="28" stroke={strokeColor} strokeWidth={strokeWidth} markerEnd="url(#arrow-down-s2)" />
        <circle r="4" fill="url(#glow-s2)">
          <animateMotion dur="2.2s" begin="0.2s" repeatCount="indefinite" path="M 100 2 L 100 24" />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.2s"
            begin="0.2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Path 2: Elbow right & down from 500 to 650 */}
        <path
          d="M 500,2 L 500,12 Q 500,18 518,18 L 632,18 Q 650,18 650,22 L 650,28"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#arrow-down-s2)"
        />
        <circle r="4" fill="url(#glow-s2)">
          <animateMotion 
            dur="2.5s" 
            begin="0.5s"
            repeatCount="indefinite" 
            path="M 500,2 L 500,12 Q 500,18 518,18 L 632,18 Q 650,18 650,24" 
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.5s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Path 3: Elbow left & down from 900 to 750 */}
        <path
          d="M 900,2 L 900,12 Q 900,18 882,18 L 768,18 Q 750,18 750,22 L 750,28"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#arrow-down-s2)"
        />
        <circle r="4" fill="url(#glow-s2)">
          <animateMotion 
            dur="2.3s" 
            begin="0.8s"
            repeatCount="indefinite" 
            path="M 900,2 L 900,12 Q 900,18 882,18 L 768,18 Q 750,18 750,24" 
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.3s"
            begin="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};

const Step3ToStep4Connector = () => {
  const strokeColor = "#64748b";
  const strokeWidth = "2.8";

  return (
    <div className="w-full select-none hover:opacity-105 transition-opacity" style={{ height: '36px' }}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 36" preserveAspectRatio="none">
        <defs>
          <radialGradient id="glow-s3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <marker
            id="arrow-down-s3"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 2 3 L 10 6 L 2 9 Z" fill={strokeColor} />
          </marker>
        </defs>

        {/* Path 1: straight down from 100 to 100 */}
        <line x1="100" y1="2" x2="100" y2="28" stroke={strokeColor} strokeWidth={strokeWidth} markerEnd="url(#arrow-down-s3)" />
        <circle r="4" fill="url(#glow-s3)">
          <animateMotion dur="2.1s" begin="0.2s" repeatCount="indefinite" path="M 100 2 L 100 24" />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.1s"
            begin="0.2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Path 2: Elbow left from 650 to 500 */}
        <path
          d="M 650,2 L 650,12 Q 650,18 632,18 L 518,18 Q 500,18 500,22 L 500,28"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#arrow-down-s3)"
        />
        <circle r="4" fill="url(#glow-s3)">
          <animateMotion 
            dur="2.6s" 
            begin="0.4s"
            repeatCount="indefinite" 
            path="M 650,2 L 650,12 Q 650,18 632,18 L 518,18 Q 500,18 500,24" 
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.6s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Path 3: Elbow right from 750 to 900 */}
        <path
          d="M 750,2 L 750,12 Q 750,18 768,18 L 882,18 Q 900,18 900,22 L 900,28"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#arrow-down-s3)"
        />
        <circle r="4" fill="url(#glow-s3)">
          <animateMotion 
            dur="2.3s" 
            begin="0.7s"
            repeatCount="indefinite" 
            path="M 750,2 L 750,12 Q 750,18 768,18 L 882,18 Q 900,18 900,24" 
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.3s"
            begin="0.7s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};

const Phase2BranchConnector = () => {
  const strokeColor = "#64748b";
  const strokeWidth = "2.8";

  return (
    <div className="w-full select-none hover:opacity-105 transition-opacity" style={{ height: '36px' }}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 36" preserveAspectRatio="none">
        <defs>
          <radialGradient id="glow-p2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <marker
            id="arrow-down-p2"
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 2 3 L 10 6 L 2 9 Z" fill={strokeColor} />
          </marker>
        </defs>

        {/* Branch 1: to Step 4 Build */}
        <path
          d="M 770,2 L 770,12 Q 770,18 752,18 L 318,18 Q 300,18 300,22 L 300,28"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#arrow-down-p2)"
        />
        <circle r="4" fill="url(#glow-p2)">
          <animateMotion 
            dur="2.5s" 
            begin="0.2s"
            repeatCount="indefinite" 
            path="M 770,2 L 770,12 Q 770,18 752,18 L 318,18 Q 300,18 300,24" 
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.5s"
            begin="0.2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Branch 2: to Step 5 Cost */}
        <path
          d="M 770,2 L 770,12 Q 770,18 752,18 L 718,18 Q 700,18 700,22 L 700,28"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd="url(#arrow-down-p2)"
        />
        <circle r="4" fill="url(#glow-p2)">
          <animateMotion 
            dur="2.2s" 
            begin="0.6s"
            repeatCount="indefinite" 
            path="M 770,2 L 770,12 Q 770,18 752,18 L 718,18 Q 700,18 700,24" 
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.1;0.8;0.95;1"
            dur="2.2s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};

interface ProcessFlowchartProps {
  setActivePage: (page: PageId) => void;
}

export default function ProcessFlowchart({ setActivePage }: ProcessFlowchartProps) {
  return (
    <div className="space-y-8 bg-slate-50 min-h-full pb-12">
      {/* Concise Compact Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-700" /> BPM System Process Flowchart
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual map of system operations and sequencing directives. Click any box to navigate directly to that active layout.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">Flowchart Legend</div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200 inline-block"></span>
            <span className="text-slate-600 font-medium">Blue: Data Input</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-purple-50 border border-purple-200 inline-block"></span>
            <span className="text-slate-600 font-medium">Purple: Engineer Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-200 inline-block"></span>
            <span className="text-slate-600 font-medium">Orange: Cost Calculation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-green-50 border border-green-200 inline-block"></span>
            <span className="text-slate-600 font-medium">Green: Profitability & Approval</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-250 inline-block"></span>
            <span className="text-slate-600 font-medium">Grey: AI Automated/Future Phase</span>
          </div>
        </div>
      </div>

      {/* PHASE 1: CORE SAC/BPM WORKFLOW */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-wider text-blue-800">
            Phase 1: Estimations & Cost Engineering Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            The sequential flow from initial master libraries up to formal management sign-off and audit retention.
          </p>
        </div>

        {/* The flowchart grid/sequence representation */}
        <div className="relative space-y-6">
          {/* Master Data Row */}
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Step 1: Resource Catalog & Formulation Library</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              
              <button 
                onClick={() => setActivePage('import-center')}
                className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100/60 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-blue-700 uppercase leading-none mb-1">Upload Source</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  Master Data Upload <ArrowRight className="w-3 h-3 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Import excels of materials & resources.</p>
              </button>

              <div className="flex justify-center md:hidden py-1">
                <VerticalConnector height={28} staggerDelay="0.1s" />
              </div>
              <div className="hidden md:flex justify-center items-center">
                <HorizontalConnector direction="right" staggerDelay="0.1s" />
              </div>

              <button 
                onClick={() => setActivePage('master-data')}
                className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100/60 transition text-left group cursor-pointer shadow-sm md:col-span-3 grid grid-cols-3 gap-2"
              >
                <div className="p-2 bg-white/70 border border-blue-100 rounded text-center">
                  <div className="text-[9px] font-semibold text-slate-800">Material Master</div>
                  <p className="text-[8px] text-slate-500">Unit Prices</p>
                </div>
                <div className="p-2 bg-white/70 border border-blue-100 rounded text-center">
                  <div className="text-[9px] font-semibold text-slate-800">Labour Master</div>
                  <p className="text-[8px] text-slate-500">Man-Day wage</p>
                </div>
                <div className="p-2 bg-white/70 border border-blue-100 rounded text-center">
                  <div className="text-[9px] font-semibold text-slate-800">Equipment Master</div>
                  <p className="text-[8px] text-slate-500">Rental rates</p>
                </div>
              </button>

              <div className="flex justify-center md:hidden py-1">
                <VerticalConnector height={28} staggerDelay="0.4s" />
              </div>
              <div className="hidden md:flex justify-center items-center">
                <HorizontalConnector direction="left" staggerDelay="0.4s" />
              </div>

              <button 
                onClick={() => setActivePage('master-data')}
                className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg hover:border-amber-400 hover:bg-amber-100/60 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-amber-700 uppercase leading-none mb-1">Standard AHSP</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  AHSP Formulas <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Coefficients for analysis calculation.</p>
              </button>

            </div>
          </div>

          <div className="hidden md:block py-1">
            <Step1ToStep2Connector />
          </div>
          <div className="md:hidden flex justify-center py-2">
            <VerticalConnector height={35} staggerDelay="0.5s" />
          </div>

          {/* Project quantities ingestion row */}
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Step 2: Project Specifications & Survey Ingestion</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              
              <button 
                onClick={() => setActivePage('upload')}
                className="p-3 bg-blue-50/85 border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100/60 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-blue-700 uppercase leading-none mb-1">Ingestion</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  Project BOQ Upload <ArrowRight className="w-3 h-3 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Load client PO excel sheet directly.</p>
              </button>

              <div className="flex justify-center md:hidden py-1">
                <VerticalConnector height={28} staggerDelay="0.2s" />
              </div>
              <div className="hidden md:flex justify-center items-center">
                <HorizontalConnector direction="right" staggerDelay="0.2s" />
              </div>

              <button 
                onClick={() => setActivePage('boq')}
                className="p-3 bg-purple-50/85 border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-100/60 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-purple-700 uppercase leading-none mb-1">Quantity Audits</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  BOQ Review <ArrowRight className="w-3 h-3 text-purple-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Validate items with price library codes.</p>
              </button>

              <div className="flex justify-center md:hidden py-1">
                <VerticalConnector height={28} staggerDelay="0.6s" />
              </div>
              <div className="hidden md:flex justify-center items-center">
                <HorizontalConnector direction="right" staggerDelay="0.6s" />
              </div>

              <button 
                onClick={() => setActivePage('project')}
                className="p-3 bg-purple-50/85 border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-100/60 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-purple-700 uppercase leading-none mb-1">Adjustment</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  Survey Quantity Revisions <ArrowRight className="w-3 h-3 text-purple-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Update length/diameters of layout segment.</p>
              </button>

            </div>
          </div>

          <div className="hidden md:block py-1">
            <Step2ToStep3Connector />
          </div>
          <div className="md:hidden flex justify-center py-2">
            <VerticalConnector height={35} staggerDelay="0.6s" />
          </div>

          {/* BOM and Retribution row */}
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Step 3: Materials Procurement & Regional Levies</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              
              <button 
                onClick={() => setActivePage('bom')}
                className="p-3 bg-amber-50/85 border border-amber-200 rounded-lg hover:border-amber-400 hover:bg-amber-100/60 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-amber-700 uppercase leading-none mb-1">Materials Breakdowns</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  Preliminary Bill of Materials <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Lump sum material requirement calculation.</p>
              </button>

              <div className="flex justify-center md:hidden py-1">
                <VerticalConnector height={28} staggerDelay="0.3s" />
              </div>
              <div className="hidden md:flex justify-center items-center">
                <HorizontalConnector direction="right" staggerDelay="0.3s" />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left shadow-sm md:col-span-3">
                <div className="text-[10px] font-bold text-amber-700 uppercase leading-none mb-1">Transport & Legal Costs</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  Vehicle Retribution / Permit Cost Input
                </div>
                <p className="text-[9px] text-slate-500 mt-1.5 font-sans">
                  Editable estimates for local heavy trucks, regional clearance levies, site trips, and legal permit reference status indicators calculated dynamically per line item.
                </p>
              </div>

            </div>
          </div>

          <div className="hidden md:block py-1">
            <Step3ToStep4Connector />
          </div>
          <div className="md:hidden flex justify-center py-2">
            <VerticalConnector height={35} staggerDelay="0.7s" />
          </div>

          {/* Profitability and Audits row */}
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Step 4: Cost Authorization & Sign-Off History</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              
              <button 
                onClick={() => setActivePage('rap')}
                className="p-3 bg-amber-50/85 border border-amber-200 rounded-lg hover:border-amber-400 hover:bg-amber-100/65 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-amber-700 uppercase leading-none mb-1">Budget Allocation</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  RAP Calculation <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Sum of labour, materials, equipment, and retribution.</p>
              </button>

              <div className="flex justify-center md:hidden py-1">
                <VerticalConnector height={28} staggerDelay="0.4s" />
              </div>
              <div className="hidden md:flex justify-center items-center">
                <HorizontalConnector direction="right" staggerDelay="0.4s" />
              </div>

              <button 
                onClick={() => setActivePage('profit')}
                className="p-3 bg-green-50/85 border border-green-200 rounded-lg hover:border-green-400 hover:bg-green-100/65 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-green-700 uppercase leading-none mb-1">Feasibility</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  PO vs RAP Profit Summary <ArrowRight className="w-3 h-3 text-green-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-sans">Visual charts of project gross surplus percentage.</p>
              </button>

              <div className="flex justify-center md:hidden py-1">
                <VerticalConnector height={28} staggerDelay="0.7s" />
              </div>
              <div className="hidden md:flex justify-center items-center">
                <HorizontalConnector direction="right" staggerDelay="0.7s" />
              </div>

              <button 
                onClick={() => setActivePage('audit')}
                className="p-3 bg-green-50/85 border border-green-200 rounded-lg hover:border-green-400 hover:bg-green-100/65 transition text-left group cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-green-700 uppercase leading-none mb-1">Verification Logs</div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  Approval & Change History <ArrowRight className="w-3 h-3 text-green-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Audit trail mapping, timeline status lock logs.</p>
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* PHASE 2: AI COGNITIVE ROADMAP (Grey future & automation highlights) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
            Phase 2: CAD sketch scan & AI automation
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated draft calculations from geometric hand-drawn drafts and digital blueprints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-9 gap-2 items-center">
          
          <button 
            onClick={() => setActivePage('ai-extract')}
            className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100/60 transition text-left col-span-2 shadow-sm cursor-pointer"
          >
            <div className="text-[10px] font-bold text-blue-700 uppercase leading-none mb-1">Step 1: Input</div>
            <div className="text-xs font-bold text-slate-800">Sketch / Survey Drawing Upload</div>
            <p className="text-[9px] text-slate-400 mt-1">Scan camera photos of layout draft logs.</p>
          </button>

          <div className="flex justify-center md:col-span-1">
            <div className="md:hidden py-1 w-full">
              <VerticalConnector height={28} staggerDelay="0.1s" />
            </div>
            <div className="hidden md:flex justify-center items-center w-full">
              <HorizontalConnector direction="right" staggerDelay="0.1s" />
            </div>
          </div>

          <button 
            onClick={() => setActivePage('ai-extract')}
            className="p-3 bg-slate-100 border border-slate-250 rounded-lg hover:border-slate-350 hover:bg-slate-150 transition text-left col-span-2 shadow-sm cursor-pointer"
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Step 2: AI OCR Agent</div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              AI Draft Extraction <Wand2 className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Multimodal vision digitizes raw notations.</p>
          </button>

          <div className="flex justify-center md:col-span-1">
            <div className="md:hidden py-1 w-full">
              <VerticalConnector height={28} staggerDelay="0.4s" />
            </div>
            <div className="hidden md:flex justify-center items-center w-full">
              <HorizontalConnector direction="right" staggerDelay="0.4s" />
            </div>
          </div>

          <button 
            onClick={() => setActivePage('project')}
            className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-100/60 transition text-left col-span-2 shadow-sm cursor-pointer"
          >
            <div className="text-[10px] font-bold text-purple-700 uppercase leading-none mb-1">Step 3: Validate</div>
            <div className="text-xs font-bold text-slate-800">Engineer Review</div>
            <p className="text-[9px] text-slate-400 mt-1">Audit generated diameters, method types.</p>
          </button>

        </div>

        <div className="hidden md:block py-1">
          <Phase2BranchConnector />
        </div>
        <div className="md:hidden flex justify-center py-2">
          <VerticalConnector height={35} staggerDelay="0.5s" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
          <div className="hidden md:block col-span-1"></div>
          
          <button 
            onClick={() => setActivePage('boq')}
            className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:border-amber-300 hover:bg-amber-100/50 transition text-left col-span-1 shadow-sm cursor-pointer"
          >
            <div className="text-[10px] font-bold text-amber-700 mb-0.5 uppercase leading-none">Step 4: Build</div>
            <div className="text-xs font-bold text-slate-800">Draft BOQ Generation</div>
            <p className="text-[9px] text-slate-400 mt-1">Matched BOQ lines are exported dynamically.</p>
          </button>

          <div className="flex justify-center col-span-1">
            <div className="md:hidden py-1">
              <VerticalConnector height={28} staggerDelay="0.7s" />
            </div>
            <div className="hidden md:flex justify-center items-center w-full">
              <HorizontalConnector direction="right" staggerDelay="0.7s" />
            </div>
          </div>

          <button 
            onClick={() => setActivePage('rap')}
            className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:border-amber-300 hover:bg-amber-100/50 transition text-left col-span-1 shadow-sm cursor-pointer"
          >
            <div className="text-[10px] font-bold text-amber-700 mb-0.5 uppercase leading-none">Step 5: Cost</div>
            <div className="text-xs font-bold text-slate-800">RAP Calculation</div>
            <p className="text-[9px] text-slate-400 mt-1">Landed budget calculations match standard libs.</p>
          </button>

          <div className="hidden md:block col-span-1"></div>
        </div>
      </div>
    </div>
  );
}
