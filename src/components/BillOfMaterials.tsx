import React, { useState, useMemo } from 'react';
import { Project, BOQItem, BOMItem, MaterialMaster } from '../types';
import { normalizeText, safeIncludes } from '../utils/textNormalization';
import { calculateProjectRatios } from '../utils/ratios';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Send,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  Truck,
  HelpCircle,
  Layers,
  Banknote,
  Boxes,
  Users,
  Clock,
  ClipboardList
} from 'lucide-react';

interface BillOfMaterialsProps {
  project: Project;
  boqItems: BOQItem[];
  bomItems: BOMItem[];
  setBOMItems: (items: BOMItem[]) => void;
  materialMaster: MaterialMaster[];
  ahspTemplates: any[];
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
}

export default function BillOfMaterials({
  project,
  boqItems,
  bomItems,
  setBOMItems,
  materialMaster,
  ahspTemplates,
  addAuditLog
}: BillOfMaterialsProps) {
  
  const projectBOM = useMemo(() => {
    return bomItems.filter((item) => item.projectId === project.id);
  }, [bomItems, project.id]);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states for manual material
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    code: '',
    description: '',
    category: 'Pipe Line',
    requiredQuantity: 1,
    wasteAllowance: 5,
    unit: 'm',
    unitPrice: 0,
    vehicleRetributionCost: 0,
    supplier: '',
    notes: ''
  });

  // Calculate waste allowance formula
  const computedFinalQty = (req: number, waste: number) => req * (1 + waste / 100);
  const computedLandedCost = (qtyPrice: number, retribution: number) => qtyPrice + retribution;

  // Compile materials from BOQ
  const handleGenerateFromBOQ = () => {
    const approvedBOQs = boqItems.filter((boq) => boq.ahspStatus === 'Matched');
    
    if (boqItems.length === 0) {
      alert("No BOQ estimate items found. Please generate or load BOQ estimates first.");
      return;
    }

    if (approvedBOQs.length === 0) {
      if (!confirm("No BOQ work items have been explicitly approved/matched yet. Do you want to compile materials from ALL current estimate lines regardless of match status?")) {
        return;
      }
    }

    const targetBOQs = approvedBOQs.length > 0 ? approvedBOQs : boqItems;
    const compiledList: BOMItem[] = [];

    targetBOQs.forEach((boq) => {
      // Find the matched AHSP Code
      const matchedAHSP = ahspTemplates.find((ahsp) => ahsp.ahspCode === boq.ahspCode);
      if (!matchedAHSP) return;

      // Extract materials
      const materialsNeeded = matchedAHSP.resources.filter((res: any) => res.type === 'Material');

      materialsNeeded.forEach((res: any) => {
        const originalMat = materialMaster.find((m) => m.materialCode === res.code);
        
        const reqQty = boq.quantity * res.coefficient;
        
        // Custom default waste factor based on bulk categories
        const catLower = normalizeText(originalMat?.category || 'Pipe Line');
        const isBulk = catLower.includes('earth') || catLower.includes('pavement') || catLower.includes('concrete') || catLower.includes('structure');
        const defaultWaste = isBulk ? 10 : 5;

        const finalQty = reqQty * (1 + defaultWaste / 100);
        const unitPrice = originalMat ? originalMat.currentPrice : 0;
        const totalMatCost = finalQty * unitPrice;

        // Dynamic Default Retribution Permitting weights
        let defaultRetribution = 0;
        if (catLower.includes('pipe line') || catLower.includes('earth') || catLower.includes('pavement')) {
          defaultRetribution = totalMatCost * 0.08; // 8% heavy freight
        } else if (catLower.includes('structure') || catLower.includes('chamber')) {
          defaultRetribution = totalMatCost * 0.04;
        } else {
          defaultRetribution = totalMatCost * 0.015; // 1.5% small accessories
        }

        compiledList.push({
          id: `bom-item-${boq.itemCode}-${res.code}-${Math.random().toString(36).substr(2, 5)}`,
          projectId: project.id,
          materialCode: res.code,
          description: originalMat?.description || `Material ref ${res.code}`,
          category: originalMat?.category || 'Accessories',
          linkedBOQRef: boq.itemCode,
          linkedBOQDesc: boq.description,
          ahspCode: matchedAHSP.ahspCode,
          requiredQuantity: reqQty,
          wasteAllowance: defaultWaste,
          finalRequiredQuantity: finalQty,
          unit: originalMat?.unit || 'unit',
          unitPrice,
          materialCost: totalMatCost,
          vehicleRetributionCost: defaultRetribution,
          finalLandedCost: totalMatCost + defaultRetribution,
          supplier: originalMat?.supplier || 'Vendor Pendukung',
          procurementStatus: 'Draft',
          notes: ''
        });
      });
    });

    // Replace project's BOM items but preserve others
    const filteredOtherProjects = bomItems.filter((item) => item.projectId !== project.id);
    const updatedBOMs = [...filteredOtherProjects, ...compiledList];
    setBOMItems(updatedBOMs);

    addAuditLog(
      `Generated Bill of Materials from BOQ Estimates`,
      `${projectBOM.length} materials`,
      `${compiledList.length} materials compiled dynamically`
    );

    alert(`Successfully compiled ${compiledList.length} required material resources from your active BOQ specifications.`);
  };

  // Add custom manual material
  const handleAddManualMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.code || !newMaterial.description) {
      alert("Please key in both code and description markers.");
      return;
    }

    const finalQty = computedFinalQty(newMaterial.requiredQuantity, newMaterial.wasteAllowance);
    const materialCost = finalQty * newMaterial.unitPrice;
    const finalLanded = computedLandedCost(materialCost, newMaterial.vehicleRetributionCost);

    const manualBOMItem: BOMItem = {
      id: `bom-manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      projectId: project.id,
      materialCode: newMaterial.code.toUpperCase(),
      description: newMaterial.description,
      category: newMaterial.category,
      linkedBOQRef: 'MANUAL',
      linkedBOQDesc: 'Manually Registered Item',
      ahspCode: 'NONE',
      requiredQuantity: newMaterial.requiredQuantity,
      wasteAllowance: newMaterial.wasteAllowance,
      finalRequiredQuantity: finalQty,
      unit: newMaterial.unit,
      unitPrice: newMaterial.unitPrice,
      materialCost,
      vehicleRetributionCost: newMaterial.vehicleRetributionCost,
      finalLandedCost: finalLanded,
      supplier: newMaterial.supplier || 'Direct Sourced',
      procurementStatus: 'Draft',
      notes: newMaterial.notes
    };

    setBOMItems([...bomItems, manualBOMItem]);
    setShowAddModal(false);

    addAuditLog(
      `Manually added item to Bill of Materials`,
      ``,
      `${manualBOMItem.materialCode}: ${manualBOMItem.description} (${manualBOMItem.finalRequiredQuantity} ${manualBOMItem.unit})`
    );

    // Reset manual material form
    setNewMaterial({
      code: '',
      description: '',
      category: 'Pipe Line',
      requiredQuantity: 1,
      wasteAllowance: 5,
      unit: 'm',
      unitPrice: 0,
      vehicleRetributionCost: 0,
      supplier: '',
      notes: ''
    });
  };

  // Handle inline updates
  const handleUpdateItemField = (itemId: string, field: keyof BOMItem, value: any) => {
    const updated = bomItems.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate computed fields if quantities or price change
        if (field === 'requiredQuantity' || field === 'wasteAllowance' || field === 'unitPrice' || field === 'vehicleRetributionCost') {
          const reqQty = Number(updatedItem.requiredQuantity);
          const waste = Number(updatedItem.wasteAllowance);
          const finalQty = reqQty * (1 + waste / 100);
          const price = Number(updatedItem.unitPrice);
          const matCost = finalQty * price;
          const retCost = Number(updatedItem.vehicleRetributionCost);

          updatedItem.finalRequiredQuantity = finalQty;
          updatedItem.materialCost = matCost;
          updatedItem.finalLandedCost = matCost + retCost;
        }
        return updatedItem;
      }
      return item;
    });

    setBOMItems(updated);
  };

  // Refresh pricing from Master Data
  const handleRefreshCosting = () => {
    if (projectBOM.length === 0) {
      alert("No Bill of Materials items exist. Please compile from BOQ first.");
      return;
    }

    let updatedCount = 0;
    const updatedBOMs = bomItems.map((item) => {
      if (item.projectId === project.id) {
        const originalMat = materialMaster.find((m) => m.materialCode === item.materialCode);
        if (originalMat && originalMat.currentPrice !== item.unitPrice) {
          const newPrice = originalMat.currentPrice;
          const finalQty = item.finalRequiredQuantity;
          const matCost = finalQty * newPrice;
          
          updatedCount++;
          return {
            ...item,
            unitPrice: newPrice,
            materialCost: matCost,
            finalLandedCost: matCost + item.vehicleRetributionCost
          };
        }
      }
      return item;
    });

    setBOMItems(updatedBOMs);
    addAuditLog(
      `Refreshed Bill of Materials costings from Master Price Directory`,
      `${updatedCount} prices mutated`,
      `Final values synchronized with master list`
    );
    alert(`Costing refreshed! Mutated ${updatedCount} materials to match updated values in master price register.`);
  };

  // Bulk set procurement review status
  const handleSendToProcurement = () => {
    if (projectBOM.length === 0) {
      alert("No items found. Please compile from BOQ first.");
      return;
    }

    const updated = bomItems.map((item) => {
      if (item.projectId === project.id && item.procurementStatus === 'Draft') {
        return { ...item, procurementStatus: 'Procurement Review Required' as const };
      }
      return item;
    });

    setBOMItems(updated);
    addAuditLog(
      `Dispatched Bill of Materials list to Procurement Review`,
      `Draft state`,
      `Procurement Review Required status locked`
    );
    alert("Dispatched! All materials marked as 'Draft' have been submitted for priority Procurement pricing checks.");
  };

  // Export to Excel using xlsx engine
  const handleExportExcel = () => {
    if (projectBOM.length === 0) {
      alert("No resources to export yet. Please build or generate the list first.");
      return;
    }

    const rows = filteredItems.map((item) => ({
      'Material Code': item.materialCode,
      'Material Description': item.description,
      'Category': item.category,
      'Linked BOQ Code': item.linkedBOQRef,
      'Work Item Context': item.linkedBOQDesc,
      'AHSP Reference': item.ahspCode,
      'Survey Required Qty': item.requiredQuantity,
      'Waste Factor %': item.wasteAllowance,
      'Final Target Qty': item.finalRequiredQuantity,
      'Unit': item.unit,
      'Unit Price (Rp)': item.unitPrice,
      'Raw Material Cost (Rp)': item.materialCost,
      'Vehicle Retribution (Rp)': item.vehicleRetributionCost,
      'Estimated Landed Cost (Rp)': item.finalLandedCost,
      'Registered Vendor': item.supplier,
      'Procurement Status': item.procurementStatus,
      'Engineer Notes': item.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials Manifest');

    // Generate column widths
    const wscols = [
      { wch: 15 }, // Code
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 15 }, // Linked BOQ
      { wch: 25 }, // Work context
      { wch: 12 }, // AHSP
      { wch: 15 }, // Req Qty
      { wch: 12 }, // Waste
      { wch: 15 }, // Final Qty
      { wch: 8 },  // Unit
      { wch: 15 }, // Price
      { wch: 18 }, // Cost
      { wch: 18 }, // Retribution
      { wch: 18 }, // Landed
      { wch: 20 }, // Supplier
      { wch: 15 }, // Status
      { wch: 20 }  // Notes
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `BPM_BOM_${project.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Compute Summary Statistics
  const stats = useMemo(() => {
    let totalMaterialCost = 0;
    let totalVehicleRetributionCost = 0;
    let totalFinalLandedCost = 0;
    let itemsRequiringPermitReview = 0;
    let itemsWithMissingRetributionData = 0;

    projectBOM.forEach((item) => {
      const matCost = item.materialCost || 0;
      const trips = Number(item.trips) || 0;
      const costPerTrip = Number(item.costPerTrip) || 0;
      const manualOverride = Number(item.manualOverrideCost) || 0;
      const retCost = manualOverride > 0 ? manualOverride : (trips * costPerTrip);

      totalMaterialCost += matCost;
      totalVehicleRetributionCost += retCost;
      totalFinalLandedCost += (matCost + retCost);

      if (item.permitStatus === 'Estimated' || item.permitStatus === 'Submitted' || item.permitStatus === 'Expired') {
        itemsRequiringPermitReview++;
      }

      // Missing Data if status required but cost is 0, or cost > 0 but missing ref num or notes
      if (
        (item.permitStatus && item.permitStatus !== 'Not Required' && retCost === 0) || 
        (retCost > 0 && (!item.permitRefNum || !item.notes))
      ) {
        itemsWithMissingRetributionData++;
      }
    });

    return {
      totalMaterialCost,
      totalVehicleRetributionCost,
      totalFinalLandedCost,
      materialTypesCount: projectBOM.length,
      itemsRequiringPermitReview,
      itemsWithMissingRetributionData
    };
  }, [projectBOM]);

  // Combined filtration logic
  const filteredItems = useMemo(() => {
    return projectBOM.filter((item) => {
      // 1. Filter by Status select based on new rules
      if (statusFilter !== 'All') {
        const cost = item.manualOverrideCost || ((item.trips || 0) * (item.costPerTrip || 0));
        if (statusFilter === 'Requires Vehicle Permit') {
          if (!item.permitStatus || item.permitStatus === 'Not Required') return false;
        } else if (statusFilter === 'Retribution Estimated') {
          if (item.permitStatus !== 'Estimated') return false;
        } else if (statusFilter === 'Permit Submitted') {
          if (item.permitStatus !== 'Submitted') return false;
        } else if (statusFilter === 'Permit Approved') {
          if (item.permitStatus !== 'Approved') return false;
        } else if (statusFilter === 'Missing Data') {
          // Warning conditions inside Bill of Materials:
          const hasCostErr = item.permitStatus === 'Not Required' && cost > 0;
          const hasMissingRefErr = cost > 0 && (!item.permitRefNum || !item.notes);
          const hasZeroCostErr = (item.permitStatus && item.permitStatus !== 'Not Required') && cost === 0;
          const isExpiredErr = item.permitStatus === 'Expired';
          if (!(hasCostErr || hasMissingRefErr || hasZeroCostErr || isExpiredErr)) {
            return false;
          }
        }
      }

      // 2. Filter by search query text
      if (normalizeText(searchQuery).length > 0) {
        const queryNorm = normalizeText(searchQuery);
        return (
          normalizeText(item.materialCode).includes(queryNorm) ||
          normalizeText(item.description).includes(queryNorm) ||
          normalizeText(item.category).includes(queryNorm) ||
          normalizeText(item.supplier).includes(queryNorm) ||
          normalizeText(item.linkedBOQRef).includes(queryNorm)
        );
      }

      return true;
    });
  }, [projectBOM, statusFilter, searchQuery]);

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 fade-in">
      
      {/* HEADER BAR & PROJECT BANNER */}
      <div className="bg-white rounded-xl border border-slate-205 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
            {project.id}
          </span>
          <h2 className="text-base font-bold text-slate-800 tracking-tight mt-2 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-700" /> Procurement & Material Bills (BOM)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregate high-precision surveys to compile raw bills of materials, wastage margins, and transport logistics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleGenerateFromBOQ}
            className="text-xs font-semibold bg-blue-700 text-white px-3.5 py-2 rounded-lg hover:bg-blue-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-100"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Generate from Approved BOQ
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-750" /> Add Manual Material
          </button>

          <button
            onClick={handleExportExcel}
            className="text-xs font-semibold bg-emerald-700 text-white px-3.5 py-2 rounded-lg hover:bg-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {/* DETAILED SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Material cost</div>
          <div className="text-sm font-bold text-slate-850 font-mono truncate" title={formattedCurrency(stats.totalMaterialCost)}>
            {formattedCurrency(stats.totalMaterialCost)}
          </div>
          <div className="text-[9px] text-slate-400">Pipa, Pasir & Fittings</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Retribution Cost</div>
          <div className="text-sm font-bold text-slate-850 font-mono text-amber-700 truncate" title={formattedCurrency(stats.totalVehicleRetributionCost)}>
            {formattedCurrency(stats.totalVehicleRetributionCost)}
          </div>
          <div className="text-[9px] text-slate-400">Transport & Permits</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Landed cost</div>
          <div className="text-sm font-extrabold text-blue-800 font-mono truncate" title={formattedCurrency(stats.totalFinalLandedCost)}>
            {formattedCurrency(stats.totalFinalLandedCost)}
          </div>
          <div className="text-[9px] text-slate-400 font-bold text-emerald-600">Material + Retribution</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-bold">Permit Review Required</div>
          <div className={`text-sm font-bold font-mono ${stats.itemsRequiringPermitReview > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-800'}`}>
            {stats.itemsRequiringPermitReview}
          </div>
          <div className="text-[9px] text-slate-400">Est, Subm, or Expired</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-bold font-bold">Missing Retribution Data</div>
          <div className={`text-sm font-bold font-mono ${stats.itemsWithMissingRetributionData > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>
            {stats.itemsWithMissingRetributionData}
          </div>
          <div className="text-[9px] text-slate-400">Need refs or notes</div>
        </div>

      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setStatusFilter('All')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setStatusFilter('Requires Vehicle Permit')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                statusFilter === 'Requires Vehicle Permit'
                  ? 'bg-amber-50 border-amber-300 text-amber-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-906'
              }`}
            >
              Requires Vehicle Permit
            </button>
            <button
              onClick={() => setStatusFilter('Retribution Estimated')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                statusFilter === 'Retribution Estimated'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Retribution Estimated
            </button>
            <button
              onClick={() => setStatusFilter('Permit Submitted')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                statusFilter === 'Permit Submitted'
                  ? 'bg-violet-50 border-violet-300 text-violet-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Permit Submitted
            </button>
            <button
              onClick={() => setStatusFilter('Permit Approved')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                statusFilter === 'Permit Approved'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Permit Approved
            </button>
            <button
              onClick={() => setStatusFilter('Missing Data')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                statusFilter === 'Missing Data'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold bg-rose-50'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Missing Data / Warnings
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSendToProcurement}
              className="text-xs font-semibold border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Send to Procurement Review
            </button>

            <button
              onClick={handleRefreshCosting}
              className="text-xs font-semibold border border-slate-250 bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Costing
            </button>
          </div>

        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search material manifest by description, code, supplier or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs w-full px-3.5 py-2 border border-slate-305 rounded-lg focus:ring-1 focus:ring-blue-500 font-sans"
          />
        </div>
      </div>

      {/* BILL OF MATERIALS TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {projectBOM.length === 0 ? (
          <div className="text-center p-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-700">Empty Bill of Materials Manifest</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No pipeline materials have been extracted from your BOQ quantities yet. Let the compiler decompose resource coefficients first.
              </p>
            </div>
            <button
              onClick={handleGenerateFromBOQ}
              className="text-xs font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              Generate Bill of Materials
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-250 z-10">
                <tr>
                  <th className="px-4 py-3.5">Material Details</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">Required Qty</th>
                  <th className="px-4 py-3.5 text-center">Final Qty (Inc. Waste)</th>
                  <th className="px-4 py-3.5 text-right">Unit Price</th>
                  <th className="px-4 py-3.5 text-right">Raw Material Cost</th>
                  <th className="px-4 py-3.5">Vehicle Type</th>
                  <th className="px-4 py-3 text-center">Trips</th>
                  <th className="px-4 py-3 text-right font-semibold">Cost Per Trip</th>
                  <th className="px-4 py-3 text-right">Manual Override Cost</th>
                  <th className="px-4 py-3 text-right font-bold text-amber-700">Vehicle Retribution Fee</th>
                  <th className="px-4 py-3">Permit / Ref Num</th>
                  <th className="px-4 py-3 text-center">Permit Status</th>
                  <th className="px-4 py-3 text-right font-bold text-blue-800">Final Mat + Ret Cost</th>
                  <th className="px-4 py-3">Supplier / Vendor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredItems.map((item) => {
                  const calculatedFee = item.manualOverrideCost || ((item.trips || 0) * (item.costPerTrip || 0));
                  const finalLanded = (item.materialCost || 0) + calculatedFee;

                  const hasCostErr = item.permitStatus === 'Not Required' && calculatedFee > 0;
                  const hasMissingRefErr = calculatedFee > 0 && (!item.permitRefNum || !item.notes);
                  const hasZeroCostErr = (item.permitStatus && item.permitStatus !== 'Not Required') && calculatedFee === 0;
                  const isExpiredErr = item.permitStatus === 'Expired';
                  const hasAnyWarning = hasCostErr || hasMissingRefErr || hasZeroCostErr || isExpiredErr;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-all ${hasAnyWarning ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{item.description}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.materialCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-700">
                        {item.requiredQuantity.toFixed(2)}
                        <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono text-slate-900 bg-slate-50/70">
                        {item.finalRequiredQuantity.toFixed(2)}
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-755 font-medium">
                        <input
                          type="number"
                          value={item.unitPrice}
                          min="0"
                          onChange={(e) => handleUpdateItemField(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-20 text-right p-1 border border-slate-205 rounded font-mono text-slate-800 inline-block text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 truncate" title={formattedCurrency(item.materialCost)}>
                        {formattedCurrency(item.materialCost)}
                      </td>
                      
                      {/* Vehicle Type */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.vehicleType || ''}
                          onChange={(e) => handleUpdateItemField(item.id, 'vehicleType', e.target.value)}
                          className="w-24 p-1 border border-slate-205 rounded text-xs text-slate-700 bg-white"
                          placeholder="e.g. Truck"
                        />
                      </td>

                      {/* Number of Trips */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={item.trips || 0}
                          min="0"
                          onChange={(e) => handleUpdateItemField(item.id, 'trips', Number(e.target.value))}
                          className="w-12 text-center p-1 border border-slate-205 rounded font-mono text-slate-800"
                        />
                      </td>

                      {/* Cost Per Trip */}
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          value={item.costPerTrip || 0}
                          min="0"
                          onChange={(e) => handleUpdateItemField(item.id, 'costPerTrip', Number(e.target.value))}
                          className="w-20 text-right p-1 border border-slate-205 rounded font-mono text-slate-800 inline-block text-[11px]"
                        />
                      </td>

                      {/* Manual Override Cost */}
                      <td className="px-4 py-3 text-right font-mono">
                        <input
                          type="number"
                          value={item.manualOverrideCost || 0}
                          min="0"
                          onChange={(e) => handleUpdateItemField(item.id, 'manualOverrideCost', Number(e.target.value))}
                          className="w-20 text-right p-1 border border-slate-205 rounded font-mono text-slate-800 inline-block text-[11px]"
                        />
                      </td>

                      {/* Vehicle Retribution Fee (READ-ONLY calculated) */}
                      <td className="px-4 py-3 text-right font-bold font-mono text-amber-700 bg-amber-50/30">
                        {formattedCurrency(calculatedFee)}
                      </td>

                      {/* Permit / Ref Number */}
                      <td className="px-4 py-3 min-w-[100px]">
                        <input
                          type="text"
                          value={item.permitRefNum || ''}
                          onChange={(e) => handleUpdateItemField(item.id, 'permitRefNum', e.target.value)}
                          className={`w-24 p-1 border rounded text-xs text-slate-700 ${hasMissingRefErr ? 'border-amber-300 bg-amber-50/50' : 'border-slate-205 bg-white'}`}
                          placeholder="Ref num"
                        />
                      </td>

                      {/* Permit Status */}
                      <td className="px-4 py-3 text-center">
                        <select
                          value={item.permitStatus || 'Not Required'}
                          onChange={(e) => handleUpdateItemField(item.id, 'permitStatus', e.target.value)}
                          className={`text-[10px] font-bold p-1 border rounded cursor-pointer ${
                            isExpiredErr
                              ? 'bg-red-55 text-rose-700 border-rose-305 bg-rose-50'
                              : item.permitStatus === 'Approved' || item.permitStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.permitStatus === 'Submitted' || item.permitStatus === 'Estimated'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-250'
                          }`}
                        >
                          <option value="Not Required">Not Required</option>
                          <option value="Estimated">Estimated</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Approved">Approved</option>
                          <option value="Paid">Paid</option>
                          <option value="Expired">Expired</option>
                        </select>
                        
                        {/* Warnings display */}
                        {hasAnyWarning && (
                          <div className="text-[9px] text-rose-600 mt-1 font-semibold flex items-center justify-center gap-0.5">
                            <span className="text-amber-500 font-extrabold" title={
                              hasCostErr ? 'Status is Not Required but cost > Rp0!' :
                              hasMissingRefErr ? 'Cost is entered but missing permit ref or notes!' :
                              isExpiredErr ? 'PERMIT EXPIRED!' : 'Permit is required but cost is Rp0!'
                            }>⚠️ Warning</span>
                          </div>
                        )}
                      </td>

                      {/* Final Material + Retribution Cost */}
                      <td className="px-4 py-3 text-right font-extrabold font-mono text-blue-900 bg-blue-50/40 truncate" title={formattedCurrency(finalLanded)}>
                        {formattedCurrency(finalLanded)}
                      </td>

                      <td className="px-4 py-3 font-sans">
                        <input
                          type="text"
                          value={item.supplier}
                          onChange={(e) => handleUpdateItemField(item.id, 'supplier', e.target.value)}
                          className="w-28 p-1 border border-slate-205 rounded text-xs text-slate-700 bg-white"
                          placeholder="Vendor name"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={item.procurementStatus}
                          onChange={(e) => handleUpdateItemField(item.id, 'procurementStatus', e.target.value)}
                          className={`text-[10px] font-bold p-1 border rounded cursor-pointer ${
                            item.procurementStatus === 'Draft'
                              ? 'bg-slate-50 text-slate-600 border-slate-300'
                              : item.procurementStatus === 'Procurement Review Required'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : item.procurementStatus === 'Sourced'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-blue-600 text-white border-blue-600'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Procurement Review Required">Review Required</option>
                          <option value="Sourced">Sourced</option>
                          <option value="Purchased">Purchased</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleUpdateItemField(item.id, 'notes', e.target.value)}
                          className="w-24 p-1 border border-slate-201 rounded text-[11px] text-slate-505"
                          placeholder="Log notes"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD MANUAL MATERIAL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Add Manual Material Specification</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualMaterial} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Material Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAT-PVC-8"
                    value={newMaterial.code}
                    onChange={(e) => setNewMaterial({ ...newMaterial, code: e.target.value })}
                    className="text-xs w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={newMaterial.category}
                    onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                    className="text-xs w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Pipe Line">Pipe Line</option>
                    <option value="Earthworks">Earthworks</option>
                    <option value="Pavement Reinstatement">Pavement Reinstatement</option>
                    <option value="Civil Structure">Civil Structure</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PVC Pipe Dia. 8 inch Class AW SNI"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="text-xs w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Required Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newMaterial.requiredQuantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, requiredQuantity: Number(e.target.value) })}
                    className="text-xs w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Wastage Factor %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newMaterial.wasteAllowance}
                    onChange={(e) => setNewMaterial({ ...newMaterial, wasteAllowance: Number(e.target.value) })}
                    className="text-xs w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. m, unit, btg"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="text-xs w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.unitPrice}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unitPrice: Number(e.target.value) })}
                    className="text-xs w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Logistics Retribution (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.vehicleRetributionCost}
                    onChange={(e) => setNewMaterial({ ...newMaterial, vehicleRetributionCost: Number(e.target.value) })}
                    className="text-xs w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Recommended Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. PT Wavin Indonesia"
                  value={newMaterial.supplier}
                  onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                  className="text-xs w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Notes</label>
                <input
                  type="text"
                  placeholder="Additional compliance or transport guidelines"
                  value={newMaterial.notes}
                  onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                  className="text-xs w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs font-semibold px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 cursor-pointer shadow-sm shadow-blue-100"
                >
                  Register Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
