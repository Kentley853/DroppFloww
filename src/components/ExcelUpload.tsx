/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { BOQItem } from '../types';
import { 
  Upload, 
  FileSpreadsheet, 
  Map, 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Download, 
  Play, 
  ChevronRight,
  Database
} from 'lucide-react';
import SampleDataLoader from './SampleDataLoader';

interface ExcelUploadProps {
  onImportBOQs: (items: BOQItem[]) => void;
  onCancel: () => void;
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
  onLoadSample?: () => void;
  onClearSample?: () => void;
  isSampleLoaded?: boolean;
}

// Map system fields to Excel columns chosen by the user
interface ColumnMapping {
  itemCode: string;
  description: string;
  quantity: string;
  unit: string;
  pipeMaterial: string;
  diameter: string;
  installationMethod: string;
  surfaceType: string;
  notes: string;
  segmentId: string;
  location: string;
  groundCondition: string;
  ahspCode: string;
}

export default function ExcelUpload({ 
  onImportBOQs, 
  onCancel, 
  addAuditLog,
  onLoadSample,
  onClearSample,
  isSampleLoaded
}: ExcelUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  // Sheet headers and parsed JSON raw data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

  // Mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({
    itemCode: '',
    description: '',
    quantity: '',
    unit: '',
    pipeMaterial: '',
    diameter: '',
    installationMethod: '',
    surfaceType: '',
    notes: '',
    segmentId: '',
    location: '',
    groundCondition: '',
    ahspCode: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // System required fields info
  const systemFields = [
    { key: 'itemCode', label: 'Item Code', required: true },
    { key: 'description', label: 'Work Description', required: true },
    { key: 'quantity', label: 'Quantity (Numeric)', required: true },
    { key: 'unit', label: 'Unit', required: true },
    { key: 'pipeMaterial', label: 'Pipe Material', required: true },
    { key: 'diameter', label: 'Diameter', required: true },
    { key: 'installationMethod', label: 'Installation Method', required: true },
    { key: 'surfaceType', label: 'Road/Surface Type', required: true },
    { key: 'notes', label: 'Notes', required: false },
    { key: 'segmentId', label: 'Segment ID', required: false },
    { key: 'location', label: 'Location', required: false },
    { key: 'groundCondition', label: 'Ground Condition', required: false },
    { key: 'ahspCode', label: 'AHSP Code Reference', required: false },
  ];

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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Reads Excel Binary and loads sheets layout
  const processFile = (uploadedFile: File) => {
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      alert('Unsupported file format. Please upload .xlsx, .xls or .csv spreadsheets.');
      return;
    }

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const readWb = XLSX.read(data, { type: 'binary' });
      setWorkbook(readWb);
      setSheets(readWb.SheetNames);
      
      const firstSheet = readWb.SheetNames[0];
      setSelectedSheet(firstSheet);
      extractSheetData(readWb, firstSheet);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // Extract keys and raw JSON from sheet tab
  const extractSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    // Read clean headers
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z50');
    const sheetHeaders: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = sheet[cellAddress];
      if (cell && cell.v) {
        sheetHeaders.push(String(cell.v).trim());
      }
    }

    setHeaders(sheetHeaders);
    setRawData(json);

    // Try Auto-Guess Mapping columns matching lower strings
    const guesses: Partial<ColumnMapping> = {};
    sheetHeaders.forEach((hdr) => {
      const normalized = hdr.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (normalized.includes('itemcode') || normalized.includes('code') || normalized.includes('kode')) {
        guesses.itemCode = guesses.itemCode || hdr;
      }
      if (normalized.includes('description') || normalized.includes('work') || normalized.includes('uraian') || normalized.includes('pekerjaan')) {
        guesses.description = guesses.description || hdr;
      }
      if (normalized.includes('quantity') || normalized.includes('qty') || normalized.includes('volume') || normalized.includes('jumlah')) {
        guesses.quantity = guesses.quantity || hdr;
      }
      if (normalized.includes('unit') || normalized.includes('satuan')) {
        guesses.unit = guesses.unit || hdr;
      }
      if (normalized.includes('material') || normalized.includes('pipa')) {
        guesses.pipeMaterial = guesses.pipeMaterial || hdr;
      }
      if (normalized.includes('diameter') || normalized.includes('ukuran') || normalized.includes('dim')) {
        guesses.diameter = guesses.diameter || hdr;
      }
      if (normalized.includes('method') || normalized.includes('installation') || normalized.includes('metode')) {
        guesses.installationMethod = guesses.installationMethod || hdr;
      }
      if (normalized.includes('surface') || normalized.includes('road') || normalized.includes('jalan')) {
        guesses.surfaceType = guesses.surfaceType || hdr;
      }
      if (normalized.includes('notes') || normalized.includes('keterangan') || normalized.includes('note')) {
        guesses.notes = guesses.notes || hdr;
      }
      if (normalized.includes('segment') || normalized.includes('ruas')) {
        guesses.segmentId = guesses.segmentId || hdr;
      }
      if (normalized.includes('location') || normalized.includes('lokasi')) {
        guesses.location = guesses.location || hdr;
      }
      if (normalized.includes('ground') || normalized.includes('tanah')) {
        guesses.groundCondition = guesses.groundCondition || hdr;
      }
      if (normalized.includes('ahsp') || normalized.includes('analisa')) {
        guesses.ahspCode = guesses.ahspCode || hdr;
      }
    });

    // Make sure we carry missing required elements to manual
    setMapping({
      itemCode: guesses.itemCode || '',
      description: guesses.description || '',
      quantity: guesses.quantity || '',
      unit: guesses.unit || '',
      pipeMaterial: guesses.pipeMaterial || '',
      diameter: guesses.diameter || '',
      installationMethod: guesses.installationMethod || '',
      surfaceType: guesses.surfaceType || '',
      notes: guesses.notes || '',
      segmentId: guesses.segmentId || '',
      location: guesses.location || '',
      groundCondition: guesses.groundCondition || '',
      ahspCode: guesses.ahspCode || '',
    });
  };

  const handleSheetSelect = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      extractSheetData(workbook, sheetName);
    }
  };

  const handleMapChange = (systemKey: keyof ColumnMapping, excelHdr: string) => {
    setMapping({
      ...mapping,
      [systemKey]: excelHdr
    });
  };

  // Validate single cell row-by-row
  const validateRow = (row: any) => {
    const errors: string[] = [];
    
    const qtyVal = row[mapping.quantity];
    const isQtyEmpty = qtyVal === undefined || qtyVal === '';
    const isQtyNumeric = !isQtyEmpty && !isNaN(Number(qtyVal));

    if (isQtyEmpty) {
      errors.push('Quantity is missing');
    } else if (!isQtyNumeric) {
      errors.push('Quantity must be numeric');
    }

    const descVal = row[mapping.description];
    if (!descVal || String(descVal).trim() === '') {
      errors.push('Work description cannot be empty');
    }

    const unitVal = row[mapping.unit];
    if (!unitVal || String(unitVal).trim() === '') {
      errors.push('Unit cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Perform Final Imports transformation
  const handleFinalImport = () => {
    // Generate clean system BOQ items
    const parsedBOQs: BOQItem[] = [];
    let validatedCount = 0;
    
    rawData.forEach((row, idx) => {
      const validation = validateRow(row);
      if (!validation.isValid) return; // skip invalid or flag manual, prompt guidelines say skip or mark unmatched

      const itemCode = row[mapping.itemCode] ? String(row[mapping.itemCode]).trim() : `XL-BQ-${idx + 1}`;
      const desc = String(row[mapping.description]).trim();
      const qtyStr = row[mapping.quantity];
      const qtyVal = Number(String(qtyStr).replace(/[^0-9.-]/g, '')) || 0; // standard cleaning
      const unit = String(row[mapping.unit]).trim();
      
      const pm = row[mapping.pipeMaterial] ? String(row[mapping.pipeMaterial]).trim() : 'HDPE';
      const diam = row[mapping.diameter] ? String(row[mapping.diameter]).trim() : '3 inch';
      const inst = row[mapping.installationMethod] ? String(row[mapping.installationMethod]).trim() : 'Open Cut';
      const surf = row[mapping.surfaceType] ? String(row[mapping.surfaceType]).trim() : 'Asphalt';
      const grnd = row[mapping.groundCondition] ? String(row[mapping.groundCondition]).trim() : 'Normal Soil';
      const loc = row[mapping.location] ? String(row[mapping.location]).trim() : 'Survey Location';
      const seg = row[mapping.segmentId] ? String(row[mapping.segmentId]).trim() : '';
      const nts = row[mapping.notes] ? String(row[mapping.notes]).trim() : '';
      const rawAhsp = row[mapping.ahspCode] ? String(row[mapping.ahspCode]).trim() : '';

      // Set standard initial matching statuses
      // We'll analyze if the raw template provides "AHSP Code" or we match later
      let matchedAhsp = rawAhsp;
      let status: 'Matched' | 'Unmatched' | 'Needs Review' = 'Unmatched';
      
      if (rawAhsp) {
        status = 'Matched';
      }

      parsedBOQs.push({
        id: `boq-xl-${idx}-${Date.now()}`,
        itemCode,
        description: desc,
        quantity: qtyVal,
        unit,
        source: 'Excel Upload',
        ahspStatus: status,
        ahspCode: matchedAhsp,
        notes: nts,
        pipeMaterial: pm,
        diameter: diam,
        installationMethod: inst,
        surfaceType: surf,
        segmentId: seg,
        location: loc,
        groundCondition: grnd
      });

      validatedCount++;
    });

    if (parsedBOQs.length === 0) {
      alert('Could not find any spreadsheet rows passing basic validations. Please check mapped quantities and descriptions.');
      return;
    }

    addAuditLog(
      `Imported physical BOQ via Excel spreadsheet file upload`,
      `Empty BOQ list`,
      `Successfully loaded ${parsedBOQs.length} verified records from sheet tab [${selectedSheet}]`
    );

    onImportBOQs(parsedBOQs);
  };

  // Pre-configured "Download BOQ Template" generator
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Item Code': 'KODE-001',
        'Work Description': 'Supply of HDPE Pipe OD 90 mm (3 inch) PN 10',
        'Quantity': 380,
        'Unit': 'meter',
        'Pipe Material': 'HDPE',
        'Diameter': '3 inch',
        'Installation Method': 'Open Cut',
        'Surface Type': 'Asphalt',
        'Ground Condition': 'Normal Soil',
        'Notes': 'Brand new connection, brand Wavin',
        'AHSP Code': 'AHSP-03'
      },
      {
        'Item Code': 'KODE-002',
        'Work Description': 'Supply of PVC Pipe Class AW 8 inch',
        'Quantity': 520,
        'Unit': 'meter',
        'Pipe Material': 'PVC',
        'Diameter': '8 inch',
        'Installation Method': 'Open Cut',
        'Surface Type': 'Concrete',
        'Ground Condition': 'Normal Soil',
        'Notes': 'Heavy vehicle roadway routing',
        'AHSP Code': 'AHSP-04'
      },
      {
        'Item Code': 'KODE-003',
        'Work Description': 'Excavation of trench in normal soil',
        'Quantity': 85,
        'Unit': 'm3',
        'Pipe Material': 'HDPE',
        'Diameter': '3 inch',
        'Installation Method': 'Open Cut',
        'Surface Type': 'Asphalt',
        'Ground Condition': 'Normal Soil',
        'Notes': 'Standard manual excavation depth 1.2m',
        'AHSP Code': 'AHSP-01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BOQ-Template-BPM');

    // Fire browser download trigger
    XLSX.writeFile(wb, 'BPM_Engineering_BOQ_Template.xlsx');
  };

  return (
    <div className="space-y-6 fade-in">
      {onLoadSample && onClearSample && (
        <SampleDataLoader 
          onLoadSample={onLoadSample}
          onClearSample={onClearSample}
          isSampleLoaded={!!isSampleLoaded}
        />
      )}

      {/* HEADER BANNER */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Excel Spreadsheet upload pipeline</h2>
          <p className="text-xs text-slate-500 mt-1">Import bulk survey details or BOQ items directly. Map column headers and run row valuations offline.</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" /> Download BOQ template
        </button>
      </div>

      {/* DRAG AND DROP ZONE */}
      {!file ? (
        <div 
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
            dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-white hover:border-slate-400'
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
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 mx-auto">
              <Upload className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Drag & drop your BOQ spreadsheet file here</p>
              <p className="text-xs text-slate-400 mt-1">Supports Excel files (.xlsx, .xls) and standard text-based CSV tables up to 10MB.</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
            >
              Browse Files
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 font-mono tracking-tight">{file.name}</h4>
              <p className="text-[10px] text-slate-400">Size: {(file.size / 1024).toFixed(1)} KB · Mapped on offline engine</p>
            </div>
          </div>
          <button
            onClick={() => { setFile(null); setWorkbook(null); setRawData([]); }}
            className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg hover:border-rose-100 hover:bg-rose-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* WORKBOOK SETTINGS & MAP COLUMNS */}
      {file && sheets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Mapping Side Console */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden col-span-1">
            <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
              <span className="text-xs font-bold tracking-tight uppercase flex items-center gap-1">
                <Map className="w-4 h-4 text-blue-400 shrink-0" /> Column Mapping Selector
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Sheet selector */}
              {sheets.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Target Sheet Tab</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetSelect(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {sheets.map((sh) => (
                      <option key={sh} value={sh}>{sh}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Field matching alignments</h5>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {systemFields.map((fld) => (
                    <div key={fld.key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-700">
                          {fld.label} {fld.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        {!mapping[fld.key as keyof ColumnMapping] && fld.required && (
                          <span className="text-[9px] text-rose-500 font-bold">Unassigned</span>
                        )}
                      </div>
                      <select
                        value={mapping[fld.key as keyof ColumnMapping] || ''}
                        onChange={(e) => handleMapChange(fld.key as keyof ColumnMapping, e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 bg-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Choose Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel right */}
          <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Sheet Grid Preview & Validation Status</h4>
                <span className="text-[10px] font-mono text-slate-500">{rawData.length} rows detected</span>
              </div>

              <div className="p-4 overflow-auto max-h-[440px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Work Description</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Specs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {rawData.map((row, idx) => {
                      const validation = validateRow(row);
                      const keyStr = mapping.itemCode ? row[mapping.itemCode] : '';
                      const descStr = mapping.description ? row[mapping.description] : '';
                      const qtyStr = mapping.quantity ? row[mapping.quantity] : '';
                      const unitStr = mapping.unit ? row[mapping.unit] : '';
                      
                      const specMaterial = mapping.pipeMaterial ? row[mapping.pipeMaterial] : '';
                      const specDiameter = mapping.diameter ? row[mapping.diameter] : '';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3">
                            {validation.isValid ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">Passed</span>
                            ) : (
                              <span 
                                className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold cursor-pointer inline-block"
                                title={validation.errors.join(', ')}
                              >
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 font-mono">{keyStr || '-'}</td>
                          <td className="py-2 px-3 truncate max-w-[180px]" title={descStr}>{descStr || <span className="text-slate-300">Empty</span>}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">{qtyStr || '-'}</td>
                          <td className="py-2 px-3">{unitStr || '-'}</td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                            {specMaterial ? `${specMaterial} ` : ''}{specDiameter ? `(${specDiameter})` : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions banner panel */}
            <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center text-white">
              <span className="text-xs text-slate-400">
                Ensure all required mapping alignments are completed before importing dataset.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Import Validated BOQ Rows
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
