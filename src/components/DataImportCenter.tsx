/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  MaterialMaster, 
  LabourMaster, 
  EquipmentMaster, 
  AHSPMaster, 
  BOQItem 
} from '../types';
import { 
  Database,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  DatabaseZap,
  Info
} from 'lucide-react';

interface DataImportCenterProps {
  materials: MaterialMaster[];
  setMaterials: (mats: MaterialMaster[]) => void;
  labours: LabourMaster[];
  setLabours: (labs: LabourMaster[]) => void;
  equipments: EquipmentMaster[];
  setEquipments: (equips: EquipmentMaster[]) => void;
  ahspTemplates: AHSPMaster[];
  setAhspTemplates: (ahsp: AHSPMaster[]) => void;
  boqItems: BOQItem[];
  setBOQItems: (items: BOQItem[]) => void;
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
  setActivePage: (page: any) => void;
}

type ImportType = 
  | 'material_master'
  | 'labour_master'
  | 'equipment_master'
  | 'ahsp_detail'
  | 'ahsp_summary'
  | 'project_boq';

interface UploadCardState {
  lastImported: string | null;
  status: 'Idle' | 'Selected' | 'Success' | 'Error';
  fileName: string | null;
  recordCount: number;
}

export default function DataImportCenter({
  materials,
  setMaterials,
  labours,
  setLabours,
  equipments,
  setEquipments,
  ahspTemplates,
  setAhspTemplates,
  boqItems,
  setBOQItems,
  addAuditLog,
  setActivePage
}: DataImportCenterProps) {
  
  const [selectedType, setSelectedType] = useState<ImportType>('project_boq');
  const [dragActive, setDragActive] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  
  // Track state for the 6 cards
  const [cardStates, setCardStates] = useState<Record<ImportType, UploadCardState>>({
    material_master: { lastImported: '2026-06-17', status: 'Success', fileName: 'BPM_MATERIAL_MASTER_V2.xlsx', recordCount: 16 },
    labour_master: { lastImported: '2026-06-17', status: 'Success', fileName: 'BPM_LABOUR_HOY_2026.csv', recordCount: 6 },
    equipment_master: { lastImported: '2026-06-17', status: 'Success', fileName: 'BPM_EQ_TIER_1.xlsx', recordCount: 5 },
    ahsp_detail: { lastImported: '2026-06-17', status: 'Success', fileName: 'PU_AHSP_WATER_INFRA.xlsx', recordCount: 8 },
    ahsp_summary: { lastImported: '2026-06-17', status: 'Success', fileName: 'AHSP_FINAL_SUM.xlsx', recordCount: 8 },
    project_boq: { lastImported: null, status: 'Idle', fileName: null, recordCount: 0 }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // 1. Download ready-made templates
  const downloadTemplate = (type: ImportType) => {
    let filename = '';
    let data: any[] = [];

    switch (type) {
      case 'material_master':
        filename = 'BPM_Material_Master_Template.xlsx';
        data = [
          {
            'Material Code': 'M.11',
            'Category Code': 'CAT-PL',
            'Category Name': 'Pipe Line',
            'Sub Category Code': 'SUB-HDPE',
            'Sub Category Name': 'HDPE pipes',
            'Type Code': 'PN10',
            'Type Name': 'PN10 pressure pipe',
            'Item Code / Kode Barang': 'M_HDPE_PN10_3INCH',
            'Item Name / Nama Barang': 'Supply of HDPE Pipe OD 90 mm (3 inch) PN 10',
            'Unit': 'meter',
            'Supplier': 'Wavin Industry',
            'Current Price': 145000,
            'Last Updated': '2026-06-17'
          },
          {
            'Material Code': 'M.12',
            'Category Code': 'CAT-FITTING',
            'Category Name': 'Steel Fittings',
            'Sub Category Code': 'SUB-GV',
            'Sub Category Name': 'Gate Valves',
            'Type Code': 'CI',
            'Type Name': 'Cast Iron End FL',
            'Item Code / Kode Barang': 'M_GATE_VALVE_3IN',
            'Item Name / Nama Barang': 'Gate Valve 3 inch Flanged End',
            'Unit': 'unit',
            'Supplier': 'Arita Valve Corp',
            'Current Price': 1850000,
            'Last Updated': '2026-06-17'
          }
        ];
        break;

      case 'labour_master':
        filename = 'BPM_Labour_Master_Template.xlsx';
        data = [
          {
            'Labour Code': 'L.01',
            'Labour Description': 'Pekerja (Unskilled Laborer)',
            'Unit': 'OH (Man-Day)',
            'Daily Rate': 150000,
            'Region': 'Jakarta Raya',
            'Last Updated': '2026-06-17'
          },
          {
            'Labour Code': 'L.02',
            'Labour Description': 'Tukang Pipa (Plumber Specialist)',
            'Unit': 'OH (Man-Day)',
            'Daily Rate': 180000,
            'Region': 'Jakarta Raya',
            'Last Updated': '2026-06-17'
          },
          {
            'Labour Code': 'L.05',
            'Labour Description': 'Mandor (Superintendent)',
            'Unit': 'OH (Man-Day)',
            'Daily Rate': 220000,
            'Region': 'Jakarta Raya',
            'Last Updated': '2026-06-17'
          }
        ];
        break;

      case 'equipment_master':
        filename = 'BPM_Equipment_Master_Template.xlsx';
        data = [
          {
            'Equipment Code': 'E.01',
            'Equipment Description': 'Wheel Excavator 0.8 m3 Capacity',
            'Unit': 'Shift (8-Hour)',
            'Rental Rate': 2800000,
            'Supplier': 'BPM Equipment Unit',
            'Last Updated': '2026-06-17'
          },
          {
            'Equipment Code': 'E.04',
            'Equipment Description': 'Horizontal Boring Machine (Alat Bore)',
            'Unit': 'Shift (8-Hour)',
            'Rental Rate': 4500000,
            'Supplier': 'Teknik Prima Sub',
            'Last Updated': '2026-06-17'
          }
        ];
        break;

      case 'ahsp_detail':
        filename = 'BPM_AHSP_Detail_Template.xlsx';
        data = [
          {
            'AHSP Code': 'AHSP-01',
            'Work Item Description': 'Galian tanah keras kedalaman s.d 1 meter (manual)',
            'Work Unit': 'm3',
            'Resource Type': 'Labour',
            'Resource Code': 'L.01',
            'Resource Description': 'Pekerja',
            'Resource Unit': 'OH',
            'Coefficient': 0.75,
            'Unit Price': 150000,
            'Total Resource Cost': 112500,
            'Overhead Percentage': 10,
            'Final Unit Price': 123750
          },
          {
            'AHSP Code': 'AHSP-01',
            'Work Item Description': 'Galian tanah keras kedalaman s.d 1 meter (manual)',
            'Work Unit': 'm3',
            'Resource Type': 'Labour',
            'Resource Code': 'L.05',
            'Resource Description': 'Mandor',
            'Resource Unit': 'OH',
            'Coefficient': 0.025,
            'Unit Price': 220000,
            'Total Resource Cost': 5500,
            'Overhead Percentage': 10,
            'Final Unit Price': 123750
          }
        ];
        break;

      case 'ahsp_summary':
        filename = 'BPM_AHSP_Unit_Price_Summary_Template.xlsx';
        data = [
          {
            'AHSP Code': 'AHSP-01',
            'Work Item Name': 'Manual Excavation in normal soil m3',
            'Unit': 'm3',
            'Unit Price': 110000
          },
          {
            'AHSP Code': 'AHSP-02',
            'Work Item Name': 'Sand Bedding Compaction Under Pipes',
            'Unit': 'm3',
            'Unit Price': 280000
          },
          {
            'AHSP Code': 'AHSP-03',
            'Work Item Name': 'Pemasangan Pipa HDPE Dia. 3 inch',
            'Unit': 'm',
            'Unit Price': 195000
          }
        ];
        break;

      case 'project_boq':
        filename = 'BPM_Project_BOQ_Upload_Template.xlsx';
        data = [
          {
            'BOQ Item Code': 'BOQ-001',
            'Work Description': 'Pemasangan Pipa PVC Dia. 8 inch pada jalan aspal',
            'Quantity': 650,
            'Unit': 'm',
            'AHSP Code': 'AHSP-04',
            'Notes': 'Using Open Cut method in busy traffic condition',
            'Segment ID': 'SG_01',
            'Pipe Material': 'PVC',
            'Diameter': '8 inch',
            'Installation Method': 'Open Cut',
            'Ground Condition': 'Normal Soil',
            'Surface Type': 'Asphalt',
            'Location': 'Jl Kelapa Gading Raya, Block C'
          },
          {
            'BOQ Item Code': 'BOQ-002',
            'Work Description': 'Horizontal Directional Drilling (Bore Crossing) under the main highway',
            'Quantity': 32,
            'Unit': 'm',
            'AHSP Code': 'AHSP-05',
            'Notes': 'Subcontracted specialized directional drilling',
            'Segment ID': 'SG_03',
            'Pipe Material': 'Steel',
            'Diameter': '12 inch',
            'Installation Method': 'Bore',
            'Ground Condition': 'Hard Soil',
            'Surface Type': 'Asphalt',
            'Location': 'Cross Connection point'
          }
        ];
        break;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  };

  // Drag over handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], selectedType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], selectedType);
    }
  };

  // Processing uploaded excel for matching type
  const processFile = (uploadedFile: File, type: ImportType) => {
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      alert('Unsupported file format. Please upload .xlsx, .xls or .csv spreadsheet.');
      return;
    }

    setExcelFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target?.result;
      if (!bstr) return;

      const wb = XLSX.read(bstr, { type: 'binary' });
      const firstSheet = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheet];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (json.length === 0) {
        alert('The uploaded spreadsheet tab is empty.');
        return;
      }

      setParsedRows(json);
      const sheetHeaders = Object.keys(json[0]);
      setHeaders(sheetHeaders);
      setShowPreviewModal(true);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // Commit the parsed excel rows to relevant application state
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const dateStr = new Date().toISOString().substring(0, 10);
    const fileNameStr = excelFile ? excelFile.name : 'Uploaded Spreadsheet';

    let message = '';
    let itemsCount = parsedRows.length;

    switch (selectedType) {
      case 'material_master': {
        const nextMaterials: MaterialMaster[] = [...materials];
        parsedRows.forEach((row, i) => {
          // Identify headers
          const code = String(row['Material Code'] || row['materialCode'] || row['Kode'] || `M.NEW-${i}`).trim();
          const description = String(row['Item Name / Nama Barang'] || row['Item Name'] || row['description'] || row['Nama'] || '').trim();
          const unit = String(row['Unit'] || row['unit'] || 'meter').trim();
          const category = String(row['Category Name'] || row['category'] || 'General').trim();
          const supplier = String(row['Supplier'] || row['supplier'] || 'Procured Vendor').trim();
          const currentPrice = Number(row['Current Price'] || row['currentPrice'] || row['Price'] || 0);

          // Find duplicates or push
          const idx = nextMaterials.findIndex(m => m.materialCode === code);
          const matItem: MaterialMaster = {
            materialCode: code,
            description: description || `Imported material ${code}`,
            unit,
            category,
            supplier,
            currentPrice,
            historicalPrice: currentPrice,
            lastUpdated: dateStr
          };

          if (idx !== -1) {
            nextMaterials[idx] = matItem;
          } else {
            nextMaterials.push(matItem);
          }
        });

        setMaterials(nextMaterials);
        message = `Successfully uploaded & synchronized ${itemsCount} items to Material Master database.`;
        addAuditLog('Excel Material Master Import', `${materials.length} components`, `${nextMaterials.length} components synchronized`);
        break;
      }

      case 'labour_master': {
        const nextLabour: LabourMaster[] = [...labours];
        parsedRows.forEach((row, i) => {
          const code = String(row['Labour Code'] || row['labourCode'] || `L.NEW-${i}`).trim();
          const description = String(row['Labour Description'] || row['description'] || '').trim();
          const unit = String(row['Unit'] || row['unit'] || 'OH').trim();
          const dailyRate = Number(row['Daily Rate'] || row['dailyRate'] || 0);

          const idx = nextLabour.findIndex(l => l.labourCode === code);
          const labItem: LabourMaster = {
            labourCode: code,
            description: description || `Laborer specialist ${code}`,
            unit,
            dailyRate
          };

          if (idx !== -1) {
            nextLabour[idx] = labItem;
          } else {
            nextLabour.push(labItem);
          }
        });

        setLabours(nextLabour);
        message = `Successfully entered ${itemsCount} personnel trades standards inside Labour Database.`;
        addAuditLog('Excel Labour Master Import', `${labours.length} trades`, `${nextLabour.length} trades synchronized`);
        break;
      }

      case 'equipment_master': {
        const nextEquipment: EquipmentMaster[] = [...equipments];
        parsedRows.forEach((row, i) => {
          const code = String(row['Equipment Code'] || row['equipmentCode'] || `E.NEW-${i}`).trim();
          const description = String(row['Equipment Description'] || row['description'] || '').trim();
          const unit = String(row['Unit'] || row['unit'] || 'Shift').trim();
          const rentalRate = Number(row['Rental Rate'] || row['rentalRate'] || 0);

          const idx = nextEquipment.findIndex(eq => eq.equipmentCode === code);
          const eqItem: EquipmentMaster = {
            equipmentCode: code,
            description: description || `Heavy fleet machinery ${code}`,
            unit,
            rentalRate
          };

          if (idx !== -1) {
            nextEquipment[idx] = eqItem;
          } else {
            nextEquipment.push(eqItem);
          }
        });

        setEquipments(nextEquipment);
        message = `Successfully recorded ${itemsCount} machinery rental coefficients to Fleet Asset index.`;
        addAuditLog('Excel Equipment Master Import', `${equipments.length} assets`, `${nextEquipment.length} assets synchronized`);
        break;
      }

      case 'ahsp_detail': {
        // Detailed resource formula mapping
        // We aggregate parsed row components grouped by key 'AHSP Code'
        const groupedAHSP: Record<string, { description: string; unit: string; resources: any[] }> = {};
        parsedRows.forEach((row) => {
          const code = String(row['AHSP Code'] || '').trim();
          if (!code) return;

          if (!groupedAHSP[code]) {
            groupedAHSP[code] = {
              description: String(row['Work Item Description'] || row['description'] || '').trim(),
              unit: String(row['Work Unit'] || row['unit'] || 'meter').trim(),
              resources: []
            };
          }

          const resCode = String(row['Resource Code'] || '').trim();
          const resType = String(row['Resource Type'] || 'Labour').trim() as 'Labour' | 'Material' | 'Equipment';
          const coefficient = Number(row['Coefficient'] || 0);

          if (resCode && coefficient) {
            groupedAHSP[code].resources.push({
              code: resCode,
              type: resType,
              coefficient
            });
          }
        });

        const nextAHSPs: AHSPMaster[] = [...ahspTemplates];
        Object.keys(groupedAHSP).forEach((ahspCode) => {
          const data = groupedAHSP[ahspCode];
          
          // Calculate overall unit cost dynamically by looking up raw prices
          let calculatedPrice = 0;
          data.resources.forEach((res) => {
            let itemPrice = 0;
            if (res.type === 'Material') {
              const matched = materials.find(m => m.materialCode === res.code);
              itemPrice = matched ? matched.currentPrice : 0;
            } else if (res.type === 'Labour') {
              const matched = labours.find(l => l.labourCode === res.code);
              itemPrice = matched ? matched.dailyRate : 0;
            } else if (res.type === 'Equipment') {
              const matched = equipments.find(e => e.equipmentCode === res.code);
              itemPrice = matched ? matched.rentalRate : 0;
            }
            // Resource Cost = Coefficient * Unit Price
            calculatedPrice += (res.coefficient * itemPrice);
          });
          
          // Apply standard 10% overhead safety factor
          calculatedPrice = Math.round(calculatedPrice * 1.1);

          const idx = nextAHSPs.findIndex(a => a.ahspCode === ahspCode);
          const ahspItem: AHSPMaster = {
            ahspCode,
            description: data.description || `Calculated construction recipe ${ahspCode}`,
            unit: data.unit,
            resources: data.resources,
            calculatedUnitPrice: calculatedPrice
          };

          if (idx !== -1) {
            nextAHSPs[idx] = ahspItem;
          } else {
            nextAHSPs.push(ahspItem);
          }
        });

        setAhspTemplates(nextAHSPs);
        message = `Cascading formula solver rebuilt ${Object.keys(groupedAHSP).length} standard construction recipes.`;
        addAuditLog('Excel AHSP Recipe Import', `${ahspTemplates.length} templates`, `${nextAHSPs.length} templates parsed & recalculated`);
        break;
      }

      case 'ahsp_summary': {
        const nextAHSPs: AHSPMaster[] = [...ahspTemplates];
        parsedRows.forEach((row) => {
          const code = String(row['AHSP Code'] || '').trim();
          if (!code) return;

          const desc = String(row['Work Item Name'] || row['description'] || '').trim();
          const unit = String(row['Unit'] || 'meter').trim();
          const price = Number(row['Unit Price'] || row['Cost'] || 0);

          const idx = nextAHSPs.findIndex(a => a.ahspCode === code);
          const ahspItem: AHSPMaster = {
            ahspCode: code,
            description: desc || `Sum price recipe ${code}`,
            unit,
            resources: idx !== -1 ? nextAHSPs[idx].resources : [],
            calculatedUnitPrice: price
          };

          if (idx !== -1) {
            nextAHSPs[idx] = ahspItem;
          } else {
            nextAHSPs.push(ahspItem);
          }
        });

        setAhspTemplates(nextAHSPs);
        message = `Standard pricing index overlayed with ${itemsCount} customized pricing rows.`;
        addAuditLog('Excel AHSP Summary Overlap', `${ahspTemplates.length} recipes`, `${nextAHSPs.length} standard unit prices locked`);
        break;
      }

      case 'project_boq': {
        // Build the BOQ items list
        const parsedBOQs: BOQItem[] = [];
        parsedRows.forEach((row, idx) => {
          const itemCode = row['BOQ Item Code'] || row['itemCode'] || `BQ-XL-${idx + 1}`;
          const desc = row['Work Description'] || row['description'] || '';
          const qtyStr = row['Quantity'] || row['qty'] || '0';
          const qtyVal = Number(String(qtyStr).replace(/[^0-9.-]/g, '')) || 0;
          const unit = row['Unit'] || row['unit'] || 'm';
          const ahspCode = row['AHSP Code'] || row['ahspCode'] || '';
          const notes = row['Notes'] || '';

          // Optional layout
          const seg = row['Segment ID'] || '';
          const pm = row['Pipe Material'] || 'HDPE';
          const diam = row['Diameter'] || '3 inch';
          const inst = row['Installation Method'] || 'Open Cut';
          const grnd = row['Ground Condition'] || 'Normal Soil';
          const surf = row['Surface Type'] || 'Asphalt';
          const loc = row['Location'] || '';

          // Determine initial match status
          const hasMatchingAHSPCode = ahspCode && ahspTemplates.some(a => a.ahspCode === ahspCode);
          let matchedStatus: 'Matched' | 'Unmatched' | 'Needs Review' = 'Unmatched';
          if (hasMatchingAHSPCode) {
            matchedStatus = 'Matched';
          } else if (ahspCode) {
            matchedStatus = 'Needs Review';
          }

          parsedBOQs.push({
            id: `boq-excel-${idx}-${Date.now()}`,
            itemCode,
            description: desc,
            quantity: qtyVal,
            unit,
            source: 'Excel Upload',
            ahspStatus: matchedStatus,
            ahspCode,
            notes,
            pipeMaterial: pm,
            diameter: diam,
            installationMethod: inst,
            surfaceType: surf,
            segmentId: seg,
            location: loc,
            groundCondition: grnd
          });
        });

        // Update target boq list
        setBOQItems(parsedBOQs);
        message = `Successfully injected ${parsedBOQs.length} custom project quantities. Redirection automated to BOQ panel.`;
        addAuditLog('Excel Project BOQ Upload', `Original quantities`, `${parsedBOQs.length} quantities drafted from excel`);
        
        // Auto go to BOQ Estimates screen
        setTimeout(() => {
          setActivePage('boq');
        }, 1200);
        break;
      }
    }

    // Update states of cards
    setCardStates(prev => ({
      ...prev,
      [selectedType]: {
        lastImported: dateStr,
        status: 'Success',
        fileName: fileNameStr,
        recordCount: itemsCount
      }
    }));

    // Reset modals
    setShowPreviewModal(false);
    setExcelFile(null);
    setParsedRows([]);
    setHeaders([]);

    alert(message);
  };

  // Immediate Mock Sample datasets injection for testing & evaluation
  const injectSampleData = (type: ImportType) => {
    let message = '';
    const dateStr = new Date().toISOString().substring(0, 10);

    if (type === 'material_master') {
      const sampleMaterials: MaterialMaster[] = [
        { materialCode: 'M.01', description: 'Pipa GIP Dia. 3 inch', unit: 'meter', category: 'Pipe Line', supplier: 'PT Bakrie Pipe', currentPrice: 285000, historicalPrice: 285000, lastUpdated: dateStr },
        { materialCode: 'M.02', description: 'Pipa HDPE PN-10 PE-100 Sdr-17 OD 110 mm (4 inch)', unit: 'meter', category: 'Pipe Line', supplier: 'PT Wavin', currentPrice: 195000, historicalPrice: 195000, lastUpdated: dateStr },
        { materialCode: 'M.03', description: 'Pipa PVC Kelas AW Dia. 3 inch', unit: 'meter', category: 'Pipe Line', supplier: 'PT Rucika', currentPrice: 75000, historicalPrice: 75000, lastUpdated: dateStr },
        { materialCode: 'M.04', description: 'Gate Valve Dia. 3 inch Flange End CAST IRON', unit: 'unit', category: 'Fitting', supplier: 'PT Arita Prima', currentPrice: 1980000, historicalPrice: 1980000, lastUpdated: dateStr },
        { materialCode: 'M.05', description: 'Water Meter Cast Iron Class B Multi Jet 3 inch', unit: 'unit', category: 'Accs', supplier: 'PT Itron', currentPrice: 3450000, historicalPrice: 3450000, lastUpdated: dateStr },
        { materialCode: 'M.06', description: 'Semen Portland (PC) kg', unit: 'kg', category: 'Civil Materials', supplier: 'Semen Tiga Roda', currentPrice: 1600, historicalPrice: 1600, lastUpdated: dateStr },
        { materialCode: 'M.07', description: 'Pasir Beton m3', unit: 'm3', category: 'Civil Materials', supplier: 'Bumi Silica Sand', currentPrice: 295000, historicalPrice: 295500, lastUpdated: dateStr },
        { materialCode: 'M.08', description: 'Batu Pecah / Split 2/3 m3', unit: 'm3', category: 'Civil Materials', supplier: 'Gunung Mas Quarry', currentPrice: 310000, historicalPrice: 310000, lastUpdated: dateStr }
      ];
      setMaterials(sampleMaterials);
      message = 'Injected 8 realistic water infrastructure materials into Master Database!';
      addAuditLog('Inject Sample Materials Master', 'Original materials', '8 components seeded');
    } else if (type === 'labour_master') {
      const sampleLabour: LabourMaster[] = [
        { labourCode: 'L.01', description: 'Pekerja (Unskilled Laborer)', unit: 'OH (Man-Day)', dailyRate: 155000 },
        { labourCode: 'L.02', description: 'Tukang (Specialist Plumber/Fitter)', unit: 'OH (Man-Day)', dailyRate: 185000 },
        { labourCode: 'L.03', description: 'Kepala Tukang (Lead Welder)', unit: 'OH (Man-Day)', dailyRate: 200000 },
        { labourCode: 'L.04', description: 'Mandor (Field Foreman)', unit: 'OH (Man-Day)', dailyRate: 225000 }
      ];
      setLabours(sampleLabour);
      message = 'Injected 4 standard labor wage trade rates!';
      addAuditLog('Inject Sample Labour Master', 'Original trades', '4 trades seeded');
    } else if (type === 'equipment_master') {
      const sampleEquipment: EquipmentMaster[] = [
        { equipmentCode: 'E.01', description: 'Excavator 80HP Crawler Class', unit: 'Shift (8-Hour)', rentalRate: 2750000 },
        { equipmentCode: 'E.02', description: 'Jack Hammer Pneumatic Compressor 300cfm', unit: 'Shift (8-Hour)', rentalRate: 1200000 },
        { equipmentCode: 'E.03', description: 'Horizontal Directional Drilling Sub-assembly', unit: 'Shift (8-Hour)', rentalRate: 4600000 },
        { equipmentCode: 'E.04', description: 'Asphalt Compactor / Baby Roller 1-Ton', unit: 'Shift (8-Hour)', rentalRate: 850000 }
      ];
      setEquipments(sampleEquipment);
      message = 'Injected 4 heavy construction deployment rental index tiers!';
      addAuditLog('Inject Sample Equipment Master', 'Original fleet', '4 machinery seeded');
    } else if (type === 'ahsp_detail') {
      const sampleAHSPs: AHSPMaster[] = [
        {
          ahspCode: 'AHSP-01',
          description: 'Galian tanah keras kedalaman s.d 1 meter (manual)',
          unit: 'm3',
          resources: [
            { code: 'L.01', type: 'Labour', coefficient: 0.75 },
            { code: 'L.04', type: 'Labour', coefficient: 0.025 }
          ],
          calculatedUnitPrice: 125000
        },
        {
          ahspCode: 'AHSP-03',
          description: 'Pemasangan Pipa HDPE PN-10 PE-100 3 inch (Wavin)',
          unit: 'meter',
          resources: [
            { code: 'M.02', type: 'Material', coefficient: 1.05 },
            { code: 'L.01', type: 'Labour', coefficient: 0.12 },
            { code: 'L.02', type: 'Labour', coefficient: 0.08 }
          ],
          calculatedUnitPrice: 245000
        }
      ];
      setAhspTemplates(sampleAHSPs);
      message = 'Injected 2 fully structural analytical recipes.';
    } else if (type === 'ahsp_summary') {
      const sampleAHSPs: AHSPMaster[] = [
        { ahspCode: 'AHSP-01', description: 'Galian tanah keras kedalaman s.d 1 meter', unit: 'm3', resources: [], calculatedUnitPrice: 125000 },
        { ahspCode: 'AHSP-02', description: 'Urugan pasir padat beralas m3', unit: 'm3', resources: [], calculatedUnitPrice: 295000 },
        { ahspCode: 'AHSP-03', description: 'Pemasangan Pipa HDPE PN-10 PE-100 3 inch', unit: 'meter', resources: [], calculatedUnitPrice: 245000 },
        { ahspCode: 'AHSP-04', description: 'Pemasangan Pipa PVC Kelas AW Dia. 3 inch', unit: 'meter', resources: [], calculatedUnitPrice: 145000 },
        { ahspCode: 'AHSP-05', description: 'Pemasangan Valve Chamber CI 3 inch', unit: 'unit', resources: [], calculatedUnitPrice: 3450000 },
        { ahspCode: 'AHSP-06', description: 'Asphalt Reinstatement restoration m2', unit: 'm2', resources: [], calculatedUnitPrice: 195000 },
        { ahspCode: 'AHSP-07', description: 'Bore Crossing pipa baja pelindung m', unit: 'meter', resources: [], calculatedUnitPrice: 950000 }
      ];
      setAhspTemplates(sampleAHSPs);
      message = 'Injected 7 finalized water infrastructure unit pricing catalogs!';
      addAuditLog('Inject Sample AHSP Unit Price Catalog', 'Original prices', '7 summaries integrated');
    } else if (type === 'project_boq') {
      const sampleBOQs: BOQItem[] = [
        { id: 'b1', itemCode: 'BOQ-01', description: 'Galian tanah keras kedalaman s.d 1 meter (manual)', quantity: 450, unit: 'm3', source: 'Excel Upload', ahspStatus: 'Matched', ahspCode: 'AHSP-01', notes: 'Main line trench' },
        { id: 'b2', itemCode: 'BOQ-02', description: 'Urugan pasir padat beralas m3', quantity: 95, unit: 'm3', source: 'Excel Upload', ahspStatus: 'Matched', ahspCode: 'AHSP-02', notes: 'Base bedding protection' },
        { id: 'b3', itemCode: 'BOQ-03', description: 'Pemasangan Pipa HDPE PN-10 PE-100 3 inch', quantity: 2400, unit: 'meter', source: 'Excel Upload', ahspStatus: 'Matched', ahspCode: 'AHSP-03', notes: 'Suburban distribution main' },
        { id: 'b4', itemCode: 'BOQ-04', description: 'Pemasangan Pipa PVC Kelas AW Dia. 3 inch', quantity: 1200, unit: 'meter', source: 'Excel Upload', ahspStatus: 'Matched', ahspCode: 'AHSP-04', notes: 'Residential service connections' },
        { id: 'b5', itemCode: 'BOQ-05', description: 'VALVE CHAMBER COMPLETE SET 3 inch Flanged CI', quantity: 14, unit: 'unit', source: 'Excel Upload', ahspStatus: 'Matched', ahspCode: 'AHSP-05', notes: 'Isolation nodes placement' },
        { id: 'b6', itemCode: 'BOQ-06', description: 'Asphalt Reinstatement restoration road', quantity: 850, unit: 'm2', source: 'Excel Upload', ahspStatus: 'Matched', ahspCode: 'AHSP-06', notes: 'Restoring public pavement lines' },
        { id: 'b7', itemCode: 'BOQ-07', description: 'Bore Crossing (Horizontal Jacking under Toll Road)', quantity: 36, unit: 'meter', source: 'Excel Upload', ahspStatus: 'Matched', ahspCode: 'AHSP-07', notes: 'Crossing point Toll km 23' }
      ];
      setBOQItems(sampleBOQs);
      message = 'Injected 7 BOQ line-items with associated AHSP references!';
      addAuditLog('Inject Sample BOQ items', '0 quantities', '7 project nodes loaded in draft');
    }

    setCardStates(prev => ({
      ...prev,
      [type]: {
        lastImported: dateStr,
        status: 'Success',
        fileName: 'Realistic_BPM_Hydraulics_Sample.xlsx',
        recordCount: type === 'material_master' ? 8 : type === 'labour_master' ? 4 : type === 'equipment_master' ? 4 : type === 'ahsp_detail' ? 2 : type === 'ahsp_summary' ? 7 : 7
      }
    }));

    alert(message);
  };

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* 1. HERO EXPLAINER BANNER */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Data Import & Synchronization Center</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The RAP cost estimation engine operates with architectural clarity. Set up foundational resources
            rates using **Master Data Excel** imports. Feed actual quantities using **Project BOQ Excel** files to unlock exact RAP cost outputs.
          </p>
        </div>
        <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg shrink-0">
          <p className="text-[10px] text-blue-500 uppercase tracking-widest font-black">Data Security Notice</p>
          <p className="text-[11px] text-blue-700 font-semibold mt-0.5">Files evaluated safely inside sandbox browsers.</p>
        </div>
      </div>

      {/* 2. FORMULA AND WORKFLOW MODEL DIAGRAM */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <DatabaseZap className="w-5 h-5 text-blue-400" />
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">System Workflow & Dynamic Calculation Map</h3>
        </div>

        {/* Dynamic Formula Display */}
        <div className="bg-white/5 border border-white/10 rounded-lg px-6 py-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-blue-300 shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium">Core RAP Cost Formula:</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs md:text-sm bg-black/30 p-2.5 rounded border border-white/5">
            <span className="text-blue-300 font-bold">Project BOQ Quantity</span>
            <span className="text-white">×</span>
            <span className="text-emerald-400 font-bold">AHSP Unit Price</span>
            <span className="text-white">=</span>
            <span className="text-yellow-400 font-bold">RAP Total Cost</span>
          </div>
        </div>

        {/* Visual pipeline layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400">Step 01</span>
            <p className="text-xs font-bold text-slate-205 mt-1">Master Data</p>
            <p className="text-[9px] text-slate-400 mt-1">Material / Labour / Equip</p>
          </div>
          <div className="flex items-center justify-center text-slate-500">
            <ChevronRight className="w-5 h-5 hidden md:block" />
            <span className="md:hidden">↓</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400">Step 02</span>
            <p className="text-xs font-bold text-slate-205 mt-1">Project BOQ</p>
            <p className="text-[9px] text-slate-400 mt-1">Work descriptions & volumes</p>
          </div>
          <div className="flex items-center justify-center text-slate-500">
            <ChevronRight className="w-5 h-5 hidden md:block" />
            <span className="md:hidden">↓</span>
          </div>
          <div className="p-3 bg-blue-900 border border-blue-800 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-blue-300">Step 03</span>
            <p className="text-xs font-bold text-white mt-1">RAP Solved</p>
            <p className="text-[9px] text-blue-200 mt-1">Matched rates multiplied</p>
          </div>
        </div>
      </div>

      {/* 3. THREE GRID UPLOAD SECTION PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column - Cards list */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION A: MASTER PRICE DATA LIBRARY */}
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <h3 className="text-xs uppercase tracking-widest font-black text-slate-500">Section A: Global Master Pricing Data</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CARD 1: Materials */}
              <div 
                onClick={() => setSelectedType('material_master')}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                  selectedType === 'material_master' 
                    ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 font-bold uppercase rounded bg-slate-100 text-slate-600 font-mono">
                    .xlsx .xls .csv
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-3">1. Material Master Upload</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Upload raw product catalogs, pipe suppliers rates, sand, cement, water meters inside pricing libraries.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-450 text-slate-500">
                  <span>Import: <strong className="text-slate-700">{cardStates.material_master.recordCount} rows</strong></span>
                  <span className="font-mono text-emerald-600 font-semibold">Active</span>
                </div>
              </div>

              {/* CARD 2: Labour */}
              <div 
                onClick={() => setSelectedType('labour_master')}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                  selectedType === 'labour_master' 
                    ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded bg-teal-50 text-teal-600 border border-teal-100">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 font-bold uppercase rounded bg-slate-100 text-slate-600 font-mono">
                    .xlsx .csv
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-3">2. Labour Master Upload</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Commit standard daily indices wage rates for manual excavation diggers, pipe fitters, and welders.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-450 text-slate-500">
                  <span>Import: <strong className="text-slate-700">{cardStates.labour_master.recordCount} records</strong></span>
                  <span className="font-mono text-emerald-600 font-semibold">Active</span>
                </div>
              </div>

              {/* CARD 3: Equipment */}
              <div 
                onClick={() => setSelectedType('equipment_master')}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                  selectedType === 'equipment_master' 
                    ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded bg-amber-50 text-amber-600 border border-amber-100">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 font-bold uppercase rounded bg-slate-100 text-slate-600 font-mono">
                    .xlsx .csv
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-3">3. Equipment Master Upload</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Import hourly or shift rental coefficients for Excavators, Jackhammers, and Horizontal Bore drills.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-450 text-slate-500">
                  <span>Import: <strong className="text-slate-700">{cardStates.equipment_master.recordCount} fleet</strong></span>
                  <span className="font-mono text-emerald-600 font-semibold">Active</span>
                </div>
              </div>

              {/* CARD 4: AHSP Recipe detail */}
              <div 
                onClick={() => setSelectedType('ahsp_detail')}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                  selectedType === 'ahsp_detail' 
                    ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded bg-purple-50 text-purple-600 border border-purple-100">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 font-bold uppercase rounded bg-slate-100 text-slate-600 font-mono">
                    .xlsx .xls .csv
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-3">4. AHSP Detail (Recipes) Upload</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Upload full analytical formulas showing coefficient multipliers for labor, materials, and equipment.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-450 text-slate-500">
                  <span>Import: <strong className="text-slate-700">{cardStates.ahsp_detail.recordCount} formulas</strong></span>
                  <span className="font-mono text-purple-600 font-semibold">Formula lock</span>
                </div>
              </div>

              {/* CARD 5: AHSP Summaries */}
              <div 
                onClick={() => setSelectedType('ahsp_summary')}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                  selectedType === 'ahsp_summary' 
                    ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded bg-rose-50 text-rose-600 border border-rose-100">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 font-bold uppercase rounded bg-slate-100 text-slate-600 font-mono">
                    .xlsx .csv
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-3">5. AHSP summaries (Final unit prices)</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Force override or insert pre-calculated summarized final prices for specific AHSP job codes.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-450 text-slate-500">
                  <span>Import: <strong className="text-slate-700">{cardStates.ahsp_summary.recordCount} items</strong></span>
                  <span className="font-mono text-emerald-600 font-semibold">Active</span>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION B: PROJECT-SPECIFIC QUANTITIES */}
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h3 className="text-xs uppercase tracking-widest font-black text-slate-500">Section B: Project-specific Quantities</h3>
            </div>
            
            {/* CARD 6: Project BOQ */}
            <div 
              onClick={() => setSelectedType('project_boq')}
              className={`p-5 rounded-xl border bg-white cursor-pointer transition-all relative overflow-hidden ${
                selectedType === 'project_boq' 
                  ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute top-0 right-0 h-1 flex w-full bg-blue-600"></div>
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-105 rounded-lg bg-blue-50 text-blue-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[9px] px-2 py-0.5 font-bold uppercase rounded bg-slate-100 text-slate-600 font-mono">
                  Mandatory For project estimation
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mt-3">6. Upload Project BOQ Spreadsheet</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Feed final survey volumes and descriptive line-items that require direct cost evaluation.
                Maps directly onto the RAP math pipeline: `BOQ Quantity` × `AHSP Unit Price` = `RAP Cost`.
              </p>
              
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                {cardStates.project_boq.recordCount > 0 ? (
                  <span className="text-emerald-600">Active: <strong>{cardStates.project_boq.recordCount} items</strong> drafted</span>
                ) : (
                  <span className="text-amber-600">No custom Quantities imported yet</span>
                )}
                <span className="text-blue-600 font-bold flex items-center gap-0.5">Configure now <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>

        </div>

        {/* Right column - Live Drop Zone & Upload logic */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider">
                Upload Wizard Console
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Targeting: <strong className="text-slate-700">{selectedType.toUpperCase().replace('_', ' ')}</strong>
              </p>
            </div>

            {/* Template Downloader Button */}
            <button
              onClick={() => downloadTemplate(selectedType)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Selected Template (.xlsx)
            </button>

            {/* Instant Demo Seed injector */}
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
              <span className="text-[9px] uppercase tracking-wider text-indigo-500 font-black">Fast Evaluation Seed</span>
              <p className="text-[10px] text-indigo-700">
                Instantly load real water utility sample dataset rows into the workspace.
              </p>
              <button
                type="button"
                onClick={() => injectSampleData(selectedType)}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded"
              >
                Inject Sample Dataset Demo
              </button>
            </div>

            {/* Drag & Drop File Zone */}
            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              <div className="space-y-3">
                <Upload className="w-6 h-6 text-slate-405 text-slate-400 mx-auto" />
                <div>
                  <p className="text-[11px] font-bold text-slate-800">Drag & drop spreadsheet here</p>
                  <p className="text-[9px] text-slate-450 text-slate-400 mt-1">Accepts Excel (.xlsx/.xls) or standard raw CSV up to 10MB.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded"
                >
                  Browse local files
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 4. SHEET GRID MODAL PREVIEW */}
      {showPreviewModal && parsedRows.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Spreadsheet Parser Pre-Validation Check</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">File: {excelFile?.name} | Destination table: {selectedType.toUpperCase()}</p>
              </div>
              <button 
                onClick={() => { setShowPreviewModal(false); setExcelFile(null); }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {/* Grid preview viewport */}
            <div className="p-6 overflow-auto flex-1">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 uppercase text-[9px] border-b border-slate-200 font-bold">
                    {headers.slice(0, 8).map(hdr => (
                      <th key={hdr} className="py-2 px-3">{hdr}</th>
                    ))}
                    {headers.length > 8 && <th className="py-2 px-3">...</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {parsedRows.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50">
                      {headers.slice(0, 8).map(hdr => (
                        <td key={hdr} className="py-2 px-3 truncate max-w-[150px]" title={String(row[hdr])}>
                          {String(row[hdr] !== undefined ? row[hdr] : '')}
                        </td>
                      ))}
                      {headers.length > 8 && <td className="py-2 px-3 text-slate-400 text-[10px]">({headers.length - 8} more columns)</td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {parsedRows.length > 10 && (
                <p className="text-[10px] text-slate-400 font-mono mt-3 text-center">
                  Showing first 10 rows of {parsedRows.length} total rows detected.
                </p>
              )}
            </div>

            {/* Actions bottom */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 leading-tight">
                Click lock to import clean rows. Cascading recalculations run automatically, indexing values immediately.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowPreviewModal(false); setExcelFile(null); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg inline-flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Import {parsedRows.length} Mapped Rows
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
