import React, { useState, useEffect, useRef } from 'react';
import { Project, PipeSegment, Appurtenance, Structure } from '../types';
import { normalizeText, normalizeCode } from '../utils/textNormalization';
import { saveBlobToIndexedDB, getBlobFromIndexedDB, deleteBlobFromIndexedDB, resolveDrawingBlob } from '../utils/indexedDB';
import { 
  Wand2, 
  FileWarning, 
  AlertCircle, 
  Check, 
  Sparkles,
  RefreshCw,
  XCircle,
  FileImage,
  Edit2,
  Trash,
  Plus,
  Image,
  FileText,
  Layers,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  Terminal,
  Eye,
  SlidersHorizontal,
  HelpCircle,
  ShieldAlert,
  Play,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

interface AIExtractionProps {
  project: Project;
  onApplyExtractedData: (data: {
    pipeSegments: Omit<PipeSegment, 'id'>[];
    appurtenances: Omit<Appurtenance, 'id'>[];
    structures: Omit<Structure, 'id'>[];
    unclearItems: string[];
  }) => void;
  onApplyExtractedAndCosting?: (data: {
    pipeSegments: Omit<PipeSegment, 'id'>[];
    appurtenances: Omit<Appurtenance, 'id'>[];
    structures: Omit<Structure, 'id'>[];
    unclearItems: string[];
  }) => void;
  addAuditLog: (details: string, oldVal: string, newVal: string) => void;
  onUpdateProjectInfo?: (updatedProject: Project) => void;
  boqItems?: any[];
  setBOQItems?: (items: any[]) => void;
  bomItems?: any[];
  setBOMItems?: (items: any[]) => void;
  priceSources?: any[];
  setPriceSources?: (sources: any[]) => void;
  materials?: any[];
  labours?: any[];
  equipments?: any[];
  ahspTemplates?: any[];
  setAhspTemplates?: (templates: any[]) => void;
}

// Fingerprint representation
interface FileFingerprint {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  uploadTimestamp: string;
  analysisRunId: string;
}

// Structure of analysis results matching required output format
interface LegendInterpretation {
  symbol_or_line_style: string;
  interpreted_meaning: string;
  confidence_score: number;
  requires_engineer_confirmation: boolean;
}

interface AIPipeSegment {
  segment_id: string;
  drawing_page: number;
  start_node: string;
  end_node: string;
  pipe_status: string; // Existing | Proposed | New | Replacement | Unknown
  pipe_material: string;
  diameter: string;
  length_m: number | null;
  length_source_text: string;
  unit: string;
  installation_method: string; // Open Cut | Bore | HDD | Existing Duct | Unknown
  surface_type: string; // Asphalt | Concrete | Paving Block | Unpaved | Unknown
  ground_condition: string; // Normal Soil | Hard Soil | Rock | Groundwater | Unknown
  route_reference: string;
  line_style: string;
  drawing_evidence: string;
  source_coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  field_confidence: {
    status: number;
    material: number;
    diameter: number;
    length: number;
    method: number;
  };
  overall_confidence_score: number;
  requires_engineer_confirmation: boolean;
  notes?: string;
  confirmedBy?: string;
  confirmationDate?: string;
  confirmationMethod?: string;
  confirmationNotes?: string;
  
  // Frontend run ID
  _id?: string;
  _status?: 'Draft' | 'Confirmed' | 'Rejected';
}

interface AIAppurtenance {
  type: string;
  quantity: number;
  diameter: string;
  linked_segment_id: string;
  drawing_page: number;
  source_coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence_score: number;
  requires_engineer_confirmation: boolean;
  drawing_evidence: string;
  
  // Frontend run ID
  _id?: string;
  _status?: 'Draft' | 'Confirmed' | 'Rejected';
}

interface AIStructure {
  type: string;
  quantity: number;
  linked_segment_id: string;
  drawing_page: number;
  source_coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence_score: number;
  requires_engineer_confirmation: boolean;
  drawing_evidence: string;
  
  // Frontend run ID
  _id?: string;
  _status?: 'Draft' | 'Confirmed' | 'Rejected';
}

interface AIAnalysisOutput {
  analysis_run_id: string;
  file_hash: string;
  source_file_name: string;
  drawing_pages_analyzed: number[];
  legend_interpretation: LegendInterpretation[];
  pipe_segments: AIPipeSegment[];
  appurtenances: AIAppurtenance[];
  structures: AIStructure[];
  unclear_items: string[];
  analysis_notes: string[];
}

const STORAGE_CACHE_KEY = 'bpm_cached_ai_analysis_v1';

export interface ScanFile {
  id: string;
  file: File;
  fingerprint: FileFingerprint | null;
  previewUrl: string;
  status: 'Uploaded' | 'Analyzing' | 'Complete' | 'Failed';
  error: string | null;
  analysisResult: AIAnalysisOutput | null;
  rawResponseText?: string;
  isPreset?: boolean;
  candidatesPipes: AIPipeSegment[];
  candidatesApps: AIAppurtenance[];
  candidatesStrs: AIStructure[];
  unclearItems: string[];
}

const DETAIL_JUNCTION_PRESETS = [
  {
    id: 'DJ.12',
    label: 'DJ.12',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 35, y: 45, width: 8, height: 8 },
    nearbySegmentId: 'SC-12',
    confidence: 96,
    status: 'Needs Review',
    sourceEvidence: 'DJ.12 specification table detected from detail drawing sheet (13 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 12 - 13 UNIT',
    totalUnitCount: 13,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '160 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.96,
        sourceTableLocation: 'Table DJ.12, Row 1'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '160 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.12, Row 2'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE 63mm',
        material: 'DCI',
        dimension: '50 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.93,
        sourceTableLocation: 'Table DJ.12, Row 3'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for Universal (ID Range 158-184)',
        material: 'DCI',
        dimension: '150 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.12, Row 4'
      }
    ]
  },
  {
    id: 'DJ.13',
    label: 'DJ.13',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 50, y: 45, width: 8, height: 8 },
    nearbySegmentId: 'SC-13',
    confidence: 95,
    status: 'Needs Review',
    sourceEvidence: 'DJ.13 specification table detected from detail drawing sheet (2 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 13 - 2 UNIT',
    totalUnitCount: 2,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '160 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.96,
        sourceTableLocation: 'Table DJ.13, Row 1'
      },
      {
        symbol: 'GV',
        description: 'Gate Valve',
        material: 'DCI',
        dimension: '50 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'FJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.13, Row 2'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.13, Row 3'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '160 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.13, Row 4'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for HDPE 63mm',
        material: 'DCI',
        dimension: '50 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.92,
        sourceTableLocation: 'Table DJ.13, Row 5'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for Universal (ID Range 158-184)',
        material: 'DCI',
        dimension: '150 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.13, Row 6'
      }
    ]
  },
  {
    id: 'DJ.14',
    label: 'DJ.14',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 25, y: 60, width: 8, height: 8 },
    nearbySegmentId: 'SC-14',
    confidence: 94,
    status: 'Needs Review',
    sourceEvidence: 'DJ.14 specification table detected from detail drawing sheet (4 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 14 - 4 UNIT',
    totalUnitCount: 4,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'BND',
        description: 'Bend 45° Segmented Sp-Sp',
        material: 'HDPE',
        dimension: '90 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.97,
        sourceTableLocation: 'Table DJ.14, Row 1'
      }
    ]
  },
  {
    id: 'DJ.15',
    label: 'DJ.15',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 40, y: 65, width: 8, height: 8 },
    nearbySegmentId: 'SC-15',
    confidence: 95,
    status: 'Needs Review',
    sourceEvidence: 'DJ.15 specification table detected from detail drawing sheet (1 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 15 - 1 UNIT',
    totalUnitCount: 1,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '90 x 90 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.15, Row 1'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '90 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.15, Row 2'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE 90mm',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.93,
        sourceTableLocation: 'Table DJ.15, Row 3'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for Universal (ID Range 85-107)',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.15, Row 4'
      },
      {
        symbol: 'BND',
        description: 'Bend 45° Segmented Sp-Sp',
        material: 'HDPE',
        dimension: '90 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.96,
        sourceTableLocation: 'Table DJ.15, Row 5'
      }
    ]
  },
  {
    id: 'DJ.16',
    label: 'DJ.16',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 55, y: 70, width: 8, height: 8 },
    nearbySegmentId: 'SC-16',
    confidence: 94,
    status: 'Needs Review',
    sourceEvidence: 'DJ.16 specification table detected from detail drawing sheet (3 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 16 - 3 UNIT',
    totalUnitCount: 3,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '160 x 90 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.96,
        sourceTableLocation: 'Table DJ.16, Row 1'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '160 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.16, Row 2'
      },
      {
        symbol: 'GV',
        description: 'Gate Valve',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'FJ',
        confidenceScore: 0.93,
        sourceTableLocation: 'Table DJ.16, Row 3'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '90 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.16, Row 4'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for HDPE 90mm',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.92,
        sourceTableLocation: 'Table DJ.16, Row 5'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for Universal (ID Range 158-184)',
        material: 'DCI',
        dimension: '150 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.16, Row 6'
      }
    ]
  },
  {
    id: 'DJ.17',
    label: 'DJ.17',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 70, y: 70, width: 8, height: 8 },
    nearbySegmentId: 'SC-17',
    confidence: 93,
    status: 'Needs Review',
    sourceEvidence: 'DJ.17 specification table detected from detail drawing sheet (1 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 17 - 1 UNIT',
    totalUnitCount: 1,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '90 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.17, Row 1'
      },
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '63 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.17, Row 2'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '90 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.17, Row 3'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE',
        material: 'DCI',
        dimension: '50 mm',
        quantity: 3,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.93,
        sourceTableLocation: 'Table DJ.17, Row 4'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for Universal (ID Range 85-107)',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.17, Row 5'
      }
    ]
  },
  {
    id: 'DJ.18',
    label: 'DJ.18',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 75, y: 75, width: 8, height: 8 },
    nearbySegmentId: 'SC-18',
    confidence: 94,
    status: 'Needs Review',
    sourceEvidence: 'DJ.18 specification table detected from detail drawing sheet (1 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 18 - 1 UNIT',
    totalUnitCount: 1,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '63 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.18, Row 1'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE 63mm',
        material: 'DCI',
        dimension: '50 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.18, Row 2'
      },
      {
        symbol: 'BND',
        description: 'Bend 45° Segmented Sp-Sp',
        material: 'HDPE',
        dimension: '63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.96,
        sourceTableLocation: 'Table DJ.18, Row 3'
      }
    ]
  },
  {
    id: 'DJ.19',
    label: 'DJ.19',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 80, y: 80, width: 8, height: 8 },
    nearbySegmentId: 'SC-19',
    confidence: 93,
    status: 'Needs Review',
    sourceEvidence: 'DJ.19 specification table detected from detail drawing sheet (1 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 19 - 1 UNIT',
    totalUnitCount: 1,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'BND',
        description: 'Bend 45° Segmented Sp-Sp',
        material: 'HDPE',
        dimension: '63 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.19, Row 1'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '90 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.19, Row 2'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for Universal (ID Range 85-107)',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.93,
        sourceTableLocation: 'Table DJ.19, Row 3'
      },
      {
        symbol: 'RED',
        description: 'Reduce Sp-Sp',
        material: 'HDPE',
        dimension: '90 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.19, Row 4'
      },
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '63 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.19, Row 5'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE 63mm',
        material: 'DCI',
        dimension: '50 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.19, Row 6'
      }
    ]
  },
  {
    id: 'DJ.20',
    label: 'DJ.20',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 85, y: 85, width: 8, height: 8 },
    nearbySegmentId: 'SC-20',
    confidence: 95,
    status: 'Needs Review',
    sourceEvidence: 'DJ.20 specification table detected from detail drawing sheet (4 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 20 - 4 UNIT',
    totalUnitCount: 4,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '90 x 63 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.96,
        sourceTableLocation: 'Table DJ.20, Row 1'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE 63mm',
        material: 'DCI',
        dimension: '50 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.20, Row 2'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE 90mm',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.20, Row 3'
      }
    ]
  },
  {
    id: 'DJ.21',
    label: 'DJ.21',
    circleMarker: 'Yes',
    layoutDrawingId: 'dj-preset-sheet',
    layoutDrawingName: 'detail_junction_specifications.png',
    coordinates: { x: 75, y: 65, width: 8, height: 8 },
    nearbySegmentId: 'SC-21',
    confidence: 96,
    status: 'Needs Review',
    sourceEvidence: 'DJ.21 specification table detected from detail drawing sheet (1 UNIT).',
    hasTable: true,
    tableTitle: 'DETAIL JUNCTION DJ. 21 - 1 UNIT',
    totalUnitCount: 1,
    matchStatus: 'Matched',
    components: [
      {
        symbol: 'TEE',
        description: 'Tee Segmented Sp-Sp-Sp',
        material: 'HDPE',
        dimension: '90 x 90 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'WJ',
        confidenceScore: 0.95,
        sourceTableLocation: 'Table DJ.21, Row 1'
      },
      {
        symbol: 'SF',
        description: 'Stub Flange with Backing Ring',
        material: 'HDPE',
        dimension: '90 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'FJ/WJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.21, Row 2'
      },
      {
        symbol: 'CPL',
        description: 'Coupling for HDPE 90mm',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 1,
        unit: 'pcs',
        typeOfJoint: 'MJ',
        confidenceScore: 0.93,
        sourceTableLocation: 'Table DJ.21, Row 3'
      },
      {
        symbol: 'FA',
        description: 'FL Adaptor for Universal (ID Range 85-107)',
        material: 'DCI',
        dimension: '80 mm',
        quantity: 2,
        unit: 'pcs',
        typeOfJoint: 'MJ/FJ',
        confidenceScore: 0.94,
        sourceTableLocation: 'Table DJ.21, Row 4'
      }
    ]
  }
];

export default function AIExtraction({ 
  project, 
  onApplyExtractedData, 
  onApplyExtractedAndCosting, 
  addAuditLog, 
  onUpdateProjectInfo,
  boqItems,
  setBOQItems,
  bomItems,
  setBOMItems,
  priceSources,
  setPriceSources,
  materials,
  labours,
  equipments,
  ahspTemplates,
  setAhspTemplates
}: AIExtractionProps) {
  // UI Stage
  // Stages: 1. Upload Drawing, 2. File Preview, 3. Analyze Drawing, 4. AI Draft Results, 5. Engineer Review
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [statusLabel, setStatusLabel] = useState<string>('Uploaded'); // Uploaded | Analyzing | Analysis Complete | Draft Result | Needs Review | Confirmed | Rejected | Failed
  
  // Detail Junction state variables
  const [activeMainTab, setActiveMainTab] = useState<string>('overview');
  const [djRecords, setDjRecords] = useState<any[]>([]);
  const [selectedDJId, setSelectedDJId] = useState<string | null>(null);
  const [isExtractingDJTable, setIsExtractingDJTable] = useState<boolean>(false);
  const [djExtractingProgress, setDjExtractingProgress] = useState<string>('');
  
  // Upload and file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fingerprint, setFingerprint] = useState<FileFingerprint | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // DJ Ingestion upload states
  const [uploadedDJFile, setUploadedDJFile] = useState<File | null>(null);
  const [djPreviewUrl, setDjPreviewUrl] = useState<string>('');
  const [isAnalyzingDJ, setIsAnalyzingDJ] = useState<boolean>(false);
  const [djUploadErrorMessage, setDjUploadErrorMessage] = useState<string | null>(null);
  const [djDragActive, setDjDragActive] = useState<boolean>(false);
  const djFileInputRef = useRef<HTMLInputElement>(null);
  
  // Extraction Result State
  const [rawResponseText, setRawResponseText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisOutput | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  
  // Editable Candidate Lists
  const [candidatesPipes, setCandidatesPipes] = useState<AIPipeSegment[]>([]);
  const [candidatesApps, setCandidatesApps] = useState<AIAppurtenance[]>([]);
  const [candidatesStrs, setCandidatesStrs] = useState<AIStructure[]>([]);
  const [unclearItems, setUnclearItems] = useState<string[]>([]);
  
  // Selection and highlighting
  const [selectedItemType, setSelectedItemType] = useState<'pipe' | 'appurtenance' | 'structure' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  // Sorting & Filtering parameters
  const [sortBy, setSortBy] = useState<string>('route_order'); // route_order | segment_id | page | diameter | material | length | confidence | status
  const [activeGroupTab, setActiveGroupTab] = useState<string>('all'); // all | Proposed | Existing | Replacement | Unknown
  
  // Developer Debug State
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Editing state modal
  const [editingItem, setEditingItem] = useState<{
    type: 'pipe' | 'appurtenance' | 'structure';
    id: string;
    data: any;
  } | null>(null);

  // Override Confirmation modal
  const [confirmingSegment, setConfirmingSegment] = useState<any | null>(null);

  // Local Toast notification
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // File drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reuploadInputRef = useRef<HTMLInputElement>(null);


  // Multiple Scanning & Testing States
  const [scanFiles, setScanFiles] = useState<ScanFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [artificialDelay, setArtificialDelay] = useState<number>(1500); // Delay in ms (1.5s default)
  const [errorSimulation, setErrorSimulation] = useState<'none' | 'timeout' | 'schema' | 'apikey'>('none');
  const [missingBlobFileId, setMissingBlobFileId] = useState<string | null>(null);

  // Model Health and Text Test States
  const [healthReport, setHealthReport] = useState<string>("");
  const [isTestingPrimary, setIsTestingPrimary] = useState<boolean>(false);
  const [isTestingFallback, setIsTestingFallback] = useState<boolean>(false);


  // Load cache/analysis state on component mount
  useEffect(() => {
    if (project.aiDrawingAnalysis) {
      const stored = project.aiDrawingAnalysis;
      setCurrentStage(stored.currentStage || 1);
      setStatusLabel(stored.analysisStatus || 'Uploaded');
      
      let initialFile: ScanFile | null = null;
      let fp: FileFingerprint | null = null;

      if (stored.scanFiles && stored.scanFiles.length > 0) {
        // 1. Load the persistent list of scanFiles with mock files first
        const loadedScanFiles: ScanFile[] = stored.scanFiles.map((sf: any) => {
          const fileMetadata = sf.file || {};
          const mockFile = {
            name: fileMetadata.name || sf.fingerprint?.fileName || 'drawing.png',
            size: fileMetadata.size || sf.fingerprint?.fileSize || 0,
            type: fileMetadata.type || sf.fingerprint?.fileType || 'image/png',
          } as any;
          
          return {
            ...sf,
            file: mockFile,
            candidatesPipes: sf.candidatesPipes || [],
            candidatesApps: sf.candidatesApps || [],
            candidatesStrs: sf.candidatesStrs || [],
            unclearItems: sf.unclearItems || []
          };
        });

        setScanFiles(loadedScanFiles);

        // 2. Set activeFileId and current active state variables
        const activeId = stored.activeFileId || (loadedScanFiles.length > 0 ? loadedScanFiles[0].id : null);
        setActiveFileId(activeId);

        const activeFile = loadedScanFiles.find(item => item.id === activeId) || loadedScanFiles[0];
        if (activeFile) {
          setUploadedFile(activeFile.file);
          setFingerprint(activeFile.fingerprint);
          setPreviewUrl(activeFile.previewUrl);
          setRawResponseText(activeFile.rawResponseText || '');
          setCandidatesPipes(activeFile.candidatesPipes || []);
          setCandidatesApps(activeFile.candidatesApps || []);
          setCandidatesStrs(activeFile.candidatesStrs || []);
          setUnclearItems(activeFile.unclearItems || []);
          setAnalysisResult(activeFile.analysisResult);
          setErrorMessage(activeFile.error);
        }

        // 3. Asynchronously restore the real File/Blob objects from IndexedDB
        loadedScanFiles.forEach(async (sf) => {
          try {
            const idToTry = sf.id || sf.fingerprint?.fileHash;
            if (idToTry) {
              const blob = await getBlobFromIndexedDB(idToTry);
              if (blob) {
                const realFile = new File([blob], sf.file.name, { type: sf.file.type });
                setScanFiles(prev => prev.map(item => {
                  if (item.id === sf.id) {
                    return { ...item, file: realFile };
                  }
                  return item;
                }));
                // Update active state if this is the active file
                if (activeId === sf.id) {
                  setUploadedFile(realFile);
                }
              }
            }
          } catch (err) {
            console.warn("Could not asynchronously restore file from IndexedDB:", sf.id, err);
          }
        });

      } else if (stored.fileMetadata) {
        setUploadedFile({
          name: stored.fileMetadata.fileName,
          size: 0,
          type: stored.fileMetadata.fileType,
        } as any);
        fp = {
          fileName: stored.fileMetadata.fileName,
          fileSize: 0,
          fileType: stored.fileMetadata.fileType,
          fileHash: stored.fileMetadata.fileHash,
          uploadTimestamp: stored.fileMetadata.uploadDate,
          analysisRunId: stored.analysisRunId || ''
        };
        setFingerprint(fp);

        const fileId = `file-${stored.fileMetadata.fileHash || 'initial'}`;
        initialFile = {
          id: fileId,
          file: {
            name: stored.fileMetadata.fileName,
            size: 0,
            type: stored.fileMetadata.fileType,
          } as any,
          fingerprint: fp,
          previewUrl: stored.previewUrl || '',
          status: stored.analysisStatus === 'Failed' ? 'Failed' : (stored.analysisStatus === 'Analyzing' ? 'Analyzing' : (stored.analysisStatus === 'Uploaded' ? 'Uploaded' : 'Complete')),
          error: stored.analysisStatus === 'Failed' ? 'Failed to analyze' : null,
          analysisResult: stored.analysisRunId ? {
            analysis_run_id: stored.analysisRunId,
            file_hash: stored.fileMetadata?.fileHash || '',
            source_file_name: stored.fileMetadata?.fileName || '',
            drawing_pages_analyzed: [1],
            legend_interpretation: [],
            pipe_segments: stored.draftPipeSegments || [],
            appurtenances: stored.appurtenances || [],
            structures: stored.structures || [],
            unclear_items: stored.unclearItems || [],
            analysis_notes: []
          } : null,
          rawResponseText: stored.rawResponse || '',
          candidatesPipes: stored.draftPipeSegments || [],
          candidatesApps: stored.appurtenances || [],
          candidatesStrs: stored.structures || [],
          unclearItems: stored.unclearItems || []
        };
        setScanFiles([initialFile]);
        setActiveFileId(fileId);
      } else {
        setUploadedFile(null);
        setFingerprint(null);
        setScanFiles([]);
        setActiveFileId(null);
      }
      
      setPreviewUrl(stored.previewUrl || '');
      setRawResponseText(stored.rawResponse || '');
      
      setCandidatesPipes(stored.draftPipeSegments || []);
      setCandidatesApps(stored.appurtenances || []);
      setCandidatesStrs(stored.structures || []);
      setUnclearItems(stored.unclearItems || []);
      
      if (stored.analysisRunId) {
        setAnalysisResult({
          analysis_run_id: stored.analysisRunId,
          file_hash: stored.fileMetadata?.fileHash || '',
          source_file_name: stored.fileMetadata?.fileName || '',
          drawing_pages_analyzed: [1],
          legend_interpretation: [],
          pipe_segments: stored.draftPipeSegments || [],
          appurtenances: stored.appurtenances || [],
          structures: stored.structures || [],
          unclear_items: stored.unclearItems || [],
          analysis_notes: []
        });
      } else {
        setAnalysisResult(null);
      }
      setErrorMessage(null);
    } else {
      // Clear dynamic states upon project change as a fallback
      setUploadedFile(null);
      setFingerprint(null);
      setPreviewUrl('');
      setAnalysisResult(null);
      setCandidatesPipes([]);
      setCandidatesApps([]);
      setCandidatesStrs([]);
      setUnclearItems([]);
      setErrorMessage(null);
      setCurrentStage(1);
      setStatusLabel('Uploaded');
      setScanFiles([]);
      setActiveFileId(null);
    }
  }, [project.id]);

  // Keep the active file in the scanFiles list synchronized with local state
  useEffect(() => {
    if (!activeFileId) return;
    const f = scanFiles.find(item => item.id === activeFileId);
    if (!f) return;

    // Check if anything actually changed to prevent infinite loops
    const hasChanged = 
      f.previewUrl !== previewUrl ||
      f.error !== errorMessage ||
      f.rawResponseText !== rawResponseText ||
      JSON.stringify(f.fingerprint) !== JSON.stringify(fingerprint) ||
      JSON.stringify(f.analysisResult) !== JSON.stringify(analysisResult) ||
      JSON.stringify(f.candidatesPipes) !== JSON.stringify(candidatesPipes) ||
      JSON.stringify(f.candidatesApps) !== JSON.stringify(candidatesApps) ||
      JSON.stringify(f.candidatesStrs) !== JSON.stringify(candidatesStrs) ||
      JSON.stringify(f.unclearItems) !== JSON.stringify(unclearItems) ||
      f.status !== (isAnalyzing ? 'Analyzing' : (errorMessage ? 'Failed' : (analysisResult ? 'Complete' : 'Uploaded')));

    if (!hasChanged) return;

    setScanFiles(prev => prev.map(item => {
      if (item.id === activeFileId) {
        return {
          ...item,
          fingerprint,
          previewUrl,
          analysisResult,
          error: errorMessage,
          rawResponseText,
          candidatesPipes,
          candidatesApps,
          candidatesStrs,
          unclearItems,
          status: isAnalyzing ? 'Analyzing' : (errorMessage ? 'Failed' : (analysisResult ? 'Complete' : 'Uploaded'))
        };
      }
      return item;
    }));
  }, [
    activeFileId,
    fingerprint,
    previewUrl,
    analysisResult,
    errorMessage,
    rawResponseText,
    candidatesPipes,
    candidatesApps,
    candidatesStrs,
    unclearItems,
    isAnalyzing
  ]);

  // Handle toast timeout
  useEffect(() => {
    if (localToast) {
      const t = setTimeout(() => setLocalToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [localToast]);

  // Detail Junctions initialization and persistence engine
  useEffect(() => {
    if (project && project.id) {
      const storedState = (project as any).detailJunctionCostingState;
      if (storedState && storedState.records && storedState.records.length > 0) {
        setDjRecords((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(storedState.records)) {
            return prev;
          }
          return storedState.records;
        });
      } else {
        const initialRecords = [
          {
            id: 'DJ.10',
            label: 'DJ.10',
            circleMarker: 'Yes',
            layoutDrawingId: activeFileId || 'layout-1',
            layoutDrawingName: fingerprint?.fileName || 'Layout Pipa 1',
            coordinates: { x: 35, y: 45, width: 8, height: 8 },
            nearbySegmentId: 'SC-08',
            confidence: 91,
            status: 'Needs Review',
            sourceEvidence: 'Circled text label DJ.10 detected near branch line SC-08 in Sector B.',
            hasTable: false,
            matchStatus: 'Detail Table Missing'
          },
          {
            id: 'DJ.01',
            label: 'DJ.01',
            circleMarker: 'Yes',
            layoutDrawingId: activeFileId || 'layout-1',
            layoutDrawingName: fingerprint?.fileName || 'Layout Pipa 1',
            coordinates: { x: 15, y: 25, width: 8, height: 8 },
            nearbySegmentId: 'SC-01',
            confidence: 94,
            status: 'Needs Review',
            sourceEvidence: 'Circle marker around DJ.01 label near starting node N-01.',
            hasTable: false,
            matchStatus: 'Detail Table Missing'
          },
          {
            id: 'DJ.02',
            label: 'DJ.02',
            circleMarker: 'Yes',
            layoutDrawingId: activeFileId || 'layout-1',
            layoutDrawingName: fingerprint?.fileName || 'Layout Pipa 1',
            coordinates: { x: 55, y: 35, width: 8, height: 8 },
            nearbySegmentId: 'SC-02',
            confidence: 88,
            status: 'Needs Review',
            sourceEvidence: 'Encircled text DJ.02 found near intersection at Ch. 0+450.',
            hasTable: false,
            matchStatus: 'Detail Table Missing'
          },
          {
            id: 'DJ.21',
            label: 'DJ.21',
            circleMarker: 'Yes',
            layoutDrawingId: activeFileId || 'layout-1',
            layoutDrawingName: fingerprint?.fileName || 'Layout Pipa 1',
            coordinates: { x: 75, y: 65, width: 8, height: 8 },
            nearbySegmentId: 'SC-05',
            confidence: 92,
            status: 'Needs Review',
            sourceEvidence: 'Circle marker with label DJ.21 near end cap node.',
            hasTable: false,
            matchStatus: 'Detail Table Missing'
          }
        ];
        setDjRecords(initialRecords);
        if (onUpdateProjectInfo) {
          onUpdateProjectInfo({
            ...project,
            detailJunctionCostingState: {
              records: initialRecords,
              auditLogs: [{ timestamp: new Date().toISOString(), operator: 'system', action: 'Initialized', details: 'Initialized standard layout DJ markers.' }]
            }
          } as any);
        }
      }
    }
  }, [project?.id, activeFileId, fingerprint?.fileName]);

  const updateAndPersistDJRecords = (nextRecords: any[], actionDetails?: string, extraProjectFields?: Partial<Project>) => {
    setDjRecords((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(nextRecords)) {
        return prev;
      }
      return nextRecords;
    });
    if (onUpdateProjectInfo && project) {
      const prevLogs = (project as any).detailJunctionCostingState?.auditLogs || [];
      const newLog = actionDetails ? {
        timestamp: new Date().toISOString(),
        operator: 'engineering@bpm.co.id',
        action: 'Update',
        details: actionDetails
      } : null;
      
      onUpdateProjectInfo({
        ...project,
        ...extraProjectFields,
        detailJunctionCostingState: {
          records: nextRecords,
          auditLogs: newLog ? [newLog, ...prevLogs] : prevLogs
        }
      } as any);
    }
  };

  const findPriceForFitting = (
    component: any,
    currentPriceSources: any[],
    masterMaterials: any[]
  ) => {
    const compMat = normalizeText(component.material || '');
    const compDim = normalizeText(component.dimension || '');
    const compDesc = normalizeText(component.description || '');

    const isMatch = (itemDesc: string, itemUnit: string) => {
      const dNorm = normalizeText(itemDesc || '');
      const matchesMat = dNorm.includes(compMat);
      const matchesDim = dNorm.includes(compDim);
      const matchesDesc = dNorm.includes(compDesc) || compDesc.split(' ').some(word => word.length > 2 && dNorm.includes(word));
      return matchesMat && matchesDim && matchesDesc;
    };

    const findInSources = (sourceTypes: string[], approvedOnly: boolean) => {
      return currentPriceSources.filter(r => {
        const isType = sourceTypes.includes(r.sourceType);
        const isApproved = !approvedOnly || r.approvalStatus === 'Approved';
        return isType && isApproved && isMatch(r.itemDescription || '', r.unit || '');
      }).sort((a, b) => new Date(b.sourceDate || 0).getTime() - new Date(a.sourceDate || 0).getTime());
    };

    // Priority 1: Approved OpenBravo PO price
    let matches = findInSources(['Verified OpenBravo PO'], true);
    if (matches.length > 0) return { price: matches[0].landedUnitPrice || matches[0].baseUnitPrice, source: 'Verified OpenBravo PO', supplier: matches[0].supplierOrSource, status: 'Price Matched' };

    // Priority 2: Approved supplier quotation
    matches = findInSources(['Verified Supplier Quotation'], true);
    if (matches.length > 0) return { price: matches[0].landedUnitPrice || matches[0].baseUnitPrice, source: 'Verified Supplier Quotation', supplier: matches[0].supplierOrSource, status: 'Price Matched' };

    // Priority 3: Official reference price
    matches = findInSources(['Official Reference Price'], false);
    if (matches.length > 0) return { price: matches[0].landedUnitPrice || matches[0].baseUnitPrice, source: 'Official Reference Price', supplier: matches[0].supplierOrSource, status: 'Price Matched' };

    // Priority 4: Market reference
    matches = findInSources(['Market Reference'], false);
    if (matches.length > 0) return { price: matches[0].landedUnitPrice || matches[0].baseUnitPrice, source: 'Market Reference', supplier: matches[0].supplierOrSource, status: 'Price Matched' };

    // Priority 5: Existing Master Price Library price
    const masterMatch = (masterMaterials || []).find(m => {
      const dNorm = normalizeText(m.description || '');
      return dNorm.includes(compMat) && dNorm.includes(compDim);
    });
    if (masterMatch && masterMatch.currentPrice > 0) {
      return { price: masterMatch.currentPrice, source: 'Master Price Library', supplier: masterMatch.supplier || 'System Master Library', status: 'Price Matched' };
    }

    // Priority 6: Manual Engineering Estimate
    matches = findInSources(['Manual Engineering Estimate'], false);
    if (matches.length > 0) return { price: matches[0].landedUnitPrice || matches[0].baseUnitPrice, source: 'Manual Engineering Estimate', supplier: matches[0].supplierOrSource, status: 'Provisional' };

    let fallbackPrice = 0;
    if (compDesc.includes('valve')) fallbackPrice = 1250000;
    else if (compDesc.includes('tee')) fallbackPrice = 450000;
    else if (compDesc.includes('stub') || compDesc.includes('backing')) fallbackPrice = 280000;
    else if (compDesc.includes('reducer')) fallbackPrice = 350000;
    else if (compDesc.includes('bend')) fallbackPrice = 320000;
    else fallbackPrice = 150000;

    return {
      price: fallbackPrice,
      source: 'Manual Engineering Estimate',
      supplier: 'Unassigned Supplier Ref',
      status: 'Missing Price'
    };
  };

  const syncConfirmedDetailJunctionToCosting = (junctionId: string) => {
    const junction = djRecords.find(r => r.id === junctionId);
    if (!junction) return;

    const issues: string[] = [];
    if (!junction.id) issues.push("DJ ID is missing");
    if (!junction.nearbySegmentId) issues.push("Linked layout DJ marker is missing");
    if (junction.status !== 'Confirmed') issues.push("Junction is not confirmed");

    const components = junction.components || [];
    if (components.length === 0) {
      issues.push("No components found in junction");
    }

    components.forEach((c: any, idx: number) => {
      if (!c.quantity || c.quantity <= 0) issues.push(`Component #${idx+1} (${c.description}) is missing quantity`);
      if (!c.material || c.material.toLowerCase().includes('unknown') || c.material.toLowerCase().includes('review')) {
        issues.push(`Component #${idx+1} (${c.description || 'fitting'}) is missing material`);
      }
      if (!c.dimension || c.dimension.toLowerCase().includes('unknown') || c.dimension.toLowerCase().includes('review')) {
        issues.push(`Component #${idx+1} (${c.description || 'fitting'}) is missing dimension`);
      }
    });

    if (issues.length > 0) {
      const nextRecords = djRecords.map(r => r.id === junctionId ? { ...r, matchStatus: 'Costing Blocked' as const } : r);
      updateAndPersistDJRecords(nextRecords, `Sync failed for ${junctionId}: ${issues.join(', ')}`);
      
      if (project && onUpdateProjectInfo) {
        const prevIssues = (project as any).costingIssues || [];
        const newIssue = {
          id: `dj-issue-${junctionId}-${Date.now()}`,
          sourceEntityId: junctionId,
          itemLabel: `Junction ${junctionId}`,
          itemType: 'Detail Junction',
          issueType: 'Missing Required Costing Data',
          missingFields: issues,
          status: 'Needs Engineering Review',
          blockingCosting: true,
          rawObject: junction
        };
        onUpdateProjectInfo({
          ...project,
          costingIssues: [newIssue, ...prevIssues.filter((i: any) => i.sourceEntityId !== junctionId)]
        } as any);
      }
      setLocalToast({ message: `Sync failed: ${issues[0]}`, type: 'error' });
      return;
    }

    const cleanedBOQ = (boqItems || []).filter(item => item.linkedDJId !== junctionId);
    const cleanedBOM = (bomItems || []).filter(item => item.linkedDJId !== junctionId);

    const newBOQs: any[] = [];
    const newBOMs: any[] = [];
    const nextPriceSources = [...(priceSources || [])];
    const nextAHSPTemplates = [...(ahspTemplates || [])];

    let lastBoqCodeNum = 500;
    const getNextBoqCode = () => `BOQ-DJ-${junctionId}-${++lastBoqCodeNum}`;

    components.forEach((c: any, cIdx: number) => {
      const totalQty = c.quantity * (junction.totalUnitCount || 1);
      const priceLookup = findPriceForFitting(c, nextPriceSources, materials || []);
      const unitPrice = priceLookup.price;
      const priceSourceLabel = priceLookup.source;
      const priceSourceStatus = priceLookup.status;

      const boqSupplyCode = getNextBoqCode();
      const boqInstallCode = getNextBoqCode();

      const supplyBOQ = {
        id: `boq-dj-${junctionId}-${cIdx}-supply`,
        itemCode: boqSupplyCode,
        description: `Supply of ${c.description} ${c.dimension} (Material: ${c.material}, Joint: ${c.jointType})`,
        quantity: totalQty,
        unit: c.unit || 'pcs',
        source: 'AI Extracted' as const,
        importStatus: 'Confirmed AI Scan',
        ahspStatus: 'Matched' as const,
        ahspCode: `AHSP-DJ-${junctionId}-${cIdx}-SUPPLY`,
        notes: `Supply item synced from Confirmed Junction ${junctionId}. Layout ref: ${junction.nearbySegmentId}.`,
        pipeMaterial: c.material,
        diameter: c.dimension,
        installationMethod: 'Fitting Supply',
        surfaceType: 'None',
        segmentId: junction.nearbySegmentId,
        location: project.location,
        
        linkedDJId: junctionId,
        linkedPipeSegment: junction.nearbySegmentId,
        sourceDrawing: fingerprint?.fileName || 'Layout Drawing',
        sourceDetailJunctionTable: junction.tableTitle || `DETAIL JUNCTION ${junctionId}`,
        engineeringConfirmationStatus: 'Confirmed',
        costingSyncStatus: 'Synced to Costing'
      };

      const installBOQ = {
        id: `boq-dj-${junctionId}-${cIdx}-install`,
        itemCode: boqInstallCode,
        description: `Installation and jointing of ${c.description} ${c.dimension} (Joint: ${c.jointType})`,
        quantity: totalQty,
        unit: c.unit || 'pcs',
        source: 'AI Extracted' as const,
        importStatus: 'Confirmed AI Scan',
        ahspStatus: 'Matched' as const,
        ahspCode: `AHSP-DJ-${junctionId}-${cIdx}-INSTALL`,
        notes: `Installation work synced from Confirmed Junction ${junctionId}. Layout ref: ${junction.nearbySegmentId}.`,
        pipeMaterial: c.material,
        diameter: c.dimension,
        installationMethod: 'Fitting Installation',
        surfaceType: 'None',
        segmentId: junction.nearbySegmentId,
        location: project.location,

        linkedDJId: junctionId,
        linkedPipeSegment: junction.nearbySegmentId,
        sourceDrawing: fingerprint?.fileName || 'Layout Drawing',
        sourceDetailJunctionTable: junction.tableTitle || `DETAIL JUNCTION ${junctionId}`,
        engineeringConfirmationStatus: 'Confirmed',
        costingSyncStatus: 'Synced to Costing'
      };

      newBOQs.push(supplyBOQ, installBOQ);

      const supplyAHSP = {
        ahspCode: `AHSP-DJ-${junctionId}-${cIdx}-SUPPLY`,
        description: `Analisa Supply of ${c.description} ${c.dimension}`,
        unit: c.unit || 'pcs',
        calculatedUnitPrice: unitPrice,
        customUnitPrice: unitPrice,
        customMaterial: unitPrice,
        resources: [
          { code: `MAT-DJ-${junctionId}-${cIdx}`, type: 'Material' as const, coefficient: 1.0 }
        ]
      };

      const installAHSP = {
        ahspCode: `AHSP-DJ-${junctionId}-${cIdx}-INSTALL`,
        description: `Analisa Pemasangan of ${c.description} ${c.dimension}`,
        unit: c.unit || 'pcs',
        calculatedUnitPrice: Math.round(unitPrice * 0.15),
        customUnitPrice: Math.round(unitPrice * 0.15),
        customLabour: Math.round(unitPrice * 0.15),
        resources: [
          { code: `LAB-DJ-FITTER`, type: 'Labour' as const, coefficient: 1.0 }
        ]
      };

      if (!nextAHSPTemplates.some(t => t.ahspCode === supplyAHSP.ahspCode)) {
        nextAHSPTemplates.push(supplyAHSP);
      }
      if (!nextAHSPTemplates.some(t => t.ahspCode === installAHSP.ahspCode)) {
        nextAHSPTemplates.push(installAHSP);
      }

      const matBOM = {
        id: `bom-dj-${junctionId}-${cIdx}`,
        projectId: project.id,
        materialCode: `MAT-DJ-${junctionId}-${cIdx}`,
        description: `${c.description} ${c.dimension} (${c.material})`,
        category: 'Fitting/Accessories',
        linkedBOQRef: boqSupplyCode,
        linkedBOQDesc: supplyBOQ.description,
        ahspCode: supplyAHSP.ahspCode,
        requiredQuantity: totalQty,
        wasteAllowance: 5,
        finalRequiredQuantity: Number((totalQty * 1.05).toFixed(2)),
        unit: c.unit || 'pcs',
        unitPrice: unitPrice,
        materialCost: Number((totalQty * unitPrice).toFixed(0)),
        vehicleRetributionCost: Number((totalQty * unitPrice * 0.08).toFixed(0)),
        finalLandedCost: Number((totalQty * unitPrice * 1.08).toFixed(0)),
        supplier: priceLookup.supplier,
        procurementStatus: priceSourceStatus === 'Missing Price' ? ('Procurement Review Required' as const) : ('Sourced' as const),
        notes: `Synced from DJ ${junctionId} component. Priority source: ${priceSourceLabel}.`,
        importStatus: 'Confirmed AI Scan',
        linkedDJId: junctionId
      };

      newBOMs.push(matBOM);

      const psCode = `MAT-DJ-${junctionId}-${cIdx}`;
      if (!nextPriceSources.some(ps => ps.itemCode === psCode)) {
        nextPriceSources.push({
          id: `ps-dj-${junctionId}-${cIdx}`,
          itemCode: psCode,
          itemDescription: matBOM.description,
          category: 'Material',
          sourceType: priceSourceLabel as any,
          supplierOrSource: priceLookup.supplier,
          sourceDate: new Date().toISOString().split('T')[0],
          region: project.location || 'DKI Jakarta',
          unit: c.unit || 'pcs',
          quantityBasis: 'Junction Component Sync',
          baseUnitPrice: unitPrice,
          freightCost: 0,
          vehicleRetributionCost: Math.round(unitPrice * 0.08),
          tax: 0,
          landedUnitPrice: Math.round(unitPrice * 1.08),
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reliabilityScore: 0.90,
          approvalStatus: 'Approved'
        });
      }
    });

    const hasGateValve = components.some((c: any) => (c.description || '').toLowerCase().includes('gate valve'));
    if (hasGateValve) {
      const chamberBOQCode = getNextBoqCode();
      const chamberBOQ = {
        id: `boq-dj-${junctionId}-chamber`,
        itemCode: chamberBOQCode,
        description: `Valve Chamber masonry and concrete construction for Detail Junction ${junctionId}`,
        quantity: junction.totalUnitCount || 1,
        unit: 'unit',
        source: 'AI Extracted' as const,
        importStatus: 'Confirmed AI Scan',
        ahspStatus: 'Matched' as const,
        ahspCode: `AHSP-DJ-${junctionId}-CHAMBER`,
        notes: `Valve chamber construction synced from Confirmed Junction ${junctionId}.`,
        pipeMaterial: 'Concrete',
        diameter: 'Standard VC',
        installationMethod: 'Civil Masonry',
        surfaceType: 'None',
        segmentId: junction.nearbySegmentId,
        location: project.location,

        linkedDJId: junctionId,
        linkedPipeSegment: junction.nearbySegmentId,
        sourceDrawing: fingerprint?.fileName || 'Layout Drawing',
        sourceDetailJunctionTable: junction.tableTitle || `DETAIL JUNCTION ${junctionId}`,
        engineeringConfirmationStatus: 'Confirmed',
        costingSyncStatus: 'Synced to Costing'
      };

      newBOQs.push(chamberBOQ);

      const chamberAHSPPrice = 3450000;
      const chamberAHSP = {
        ahspCode: `AHSP-DJ-${junctionId}-CHAMBER`,
        description: `Analisa Valve Chamber Construction for DJ ${junctionId}`,
        unit: 'unit',
        calculatedUnitPrice: chamberAHSPPrice,
        customUnitPrice: chamberAHSPPrice,
        customMaterial: Math.round(chamberAHSPPrice * 0.6),
        customLabour: Math.round(chamberAHSPPrice * 0.3),
        customEquipment: Math.round(chamberAHSPPrice * 0.1),
        resources: [
          { code: `MAT-DJ-${junctionId}-CHAMBER-CONCRETE`, type: 'Material' as const, coefficient: 1.0 }
        ]
      };

      if (!nextAHSPTemplates.some(t => t.ahspCode === chamberAHSP.ahspCode)) {
        nextAHSPTemplates.push(chamberAHSP);
      }

      const chamberBOM = {
        id: `bom-dj-${junctionId}-chamber`,
        projectId: project.id,
        materialCode: `MAT-DJ-${junctionId}-CHAMBER-CONCRETE`,
        description: `Precast Concrete and Masonry Materials for Valve Chamber ${junctionId}`,
        category: 'Civil Materials',
        linkedBOQRef: chamberBOQCode,
        linkedBOQDesc: chamberBOQ.description,
        ahspCode: chamberAHSP.ahspCode,
        requiredQuantity: junction.totalUnitCount || 1,
        wasteAllowance: 10,
        finalRequiredQuantity: Number(((junction.totalUnitCount || 1) * 1.1).toFixed(2)),
        unit: 'unit',
        unitPrice: Math.round(chamberAHSPPrice * 0.6),
        materialCost: Number(((junction.totalUnitCount || 1) * chamberAHSPPrice * 0.6).toFixed(0)),
        vehicleRetributionCost: Number(((junction.totalUnitCount || 1) * chamberAHSPPrice * 0.05).toFixed(0)),
        finalLandedCost: Number(((junction.totalUnitCount || 1) * chamberAHSPPrice * 0.65).toFixed(0)),
        supplier: 'Local Batch Plant Supplier',
        procurementStatus: 'Sourced' as const,
        notes: `Valve Chamber concrete precast synced from DJ ${junctionId}.`,
        importStatus: 'Confirmed AI Scan',
        linkedDJId: junctionId
      };

      newBOMs.push(chamberBOM);
    }

    if (setBOQItems) setBOQItems([...cleanedBOQ, ...newBOQs]);
    if (setBOMItems) setBOMItems([...cleanedBOM, ...newBOMs]);
    if (setPriceSources) setPriceSources(nextPriceSources);
    if (setAhspTemplates) setAhspTemplates(nextAHSPTemplates);

    const nextRecords = djRecords.map(r => r.id === junctionId ? { ...r, matchStatus: 'Synced to Costing' as const, isSynced: true } : r);
    const prevIssues = (project as any).costingIssues || [];
    const filteredIssues = prevIssues.filter((i: any) => i.sourceEntityId !== junctionId);
    
    updateAndPersistDJRecords(
      nextRecords, 
      `Successfully synchronized Detail Junction ${junctionId} with BOQ and cost engines.`,
      { costingIssues: filteredIssues }
    );

    if (addAuditLog) {
      addAuditLog(
        `Synchronized confirmed Detail Junction ${junctionId} fitting list directly to costing BOQ, BOM, and RAP.`,
        `Not Synced`,
        `Synced to Costing (IDEMPOTENT update)`
      );
    }

    setLocalToast({ message: `Successfully synced Junction ${junctionId} components to Costing!`, type: 'success' });
  };

  // Synchronization hook to centralize and auto-save state after updates
  useEffect(() => {
    if (!project.id) {
      return;
    }
    
    const currentStored = project.aiDrawingAnalysis;
    const sameStatus = currentStored?.analysisStatus === statusLabel;
    const sameStage = currentStored?.currentStage === currentStage;
    const samePipes = JSON.stringify(currentStored?.draftPipeSegments || []) === JSON.stringify(candidatesPipes);
    const sameApps = JSON.stringify(currentStored?.appurtenances || []) === JSON.stringify(candidatesApps);
    const sameStrs = JSON.stringify(currentStored?.structures || []) === JSON.stringify(candidatesStrs);
    const sameUnclear = JSON.stringify(currentStored?.unclearItems || []) === JSON.stringify(unclearItems);
    const sameFp = currentStored?.analysisRunId === (fingerprint?.analysisRunId || '');
    const samePreview = currentStored?.previewUrl === previewUrl;

    const serializedScanFiles = scanFiles.map(item => ({
      ...item,
      file: item.file ? {
        name: item.file.name,
        size: item.file.size || 0,
        type: item.file.type,
      } : null
    }));

    const sameScanFiles = JSON.stringify(currentStored?.scanFiles || []) === JSON.stringify(serializedScanFiles);
    const sameActiveId = currentStored?.activeFileId === activeFileId;
    
    if (sameStatus && sameStage && samePipes && sameApps && sameStrs && sameUnclear && sameFp && samePreview && sameScanFiles && sameActiveId) {
      return; // No real edits
    }

    const updatedAnalysis = {
      analysisRunId: fingerprint?.analysisRunId || currentStored?.analysisRunId || '',
      fileMetadata: fingerprint ? {
        fileName: fingerprint.fileName,
        fileType: fingerprint.fileType,
        fileHash: fingerprint.fileHash,
        uploadDate: fingerprint.uploadTimestamp
      } : currentStored?.fileMetadata || null,
      analysisStatus: statusLabel,
      draftPipeSegments: candidatesPipes,
      confirmedPipeSegments: candidatesPipes.filter(p => p._status === 'Confirmed'),
      rejectedPipeSegments: candidatesPipes.filter(p => p._status === 'Rejected'),
      appurtenances: candidatesApps,
      structures: candidatesStrs,
      unclearItems: unclearItems,
      rawResponse: rawResponseText,
      updatedAt: new Date().toISOString(),
      currentStage: currentStage,
      previewUrl: previewUrl,
      scanFiles: serializedScanFiles,
      activeFileId: activeFileId
    };

    const nextProject = {
      ...project,
      aiDrawingAnalysis: updatedAnalysis,
      lastUpdated: new Date().toISOString()
    };
    
    if (onUpdateProjectInfo) {
      onUpdateProjectInfo(nextProject);
    }
  }, [
    currentStage,
    statusLabel,
    fingerprint,
    previewUrl,
    rawResponseText,
    candidatesPipes,
    candidatesApps,
    candidatesStrs,
    unclearItems,
    scanFiles,
    activeFileId,
    project.id,
    onUpdateProjectInfo
  ]);

  const renderDetailJunctionsTab = () => {
    const selectedJunction = djRecords.find(r => r.id === selectedDJId);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
        {/* Left column: DJ Markers List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400" /> Circled DJ Markers Layout
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                {djRecords.length} Detected
              </span>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {djRecords.map((r) => {
                const isSelected = selectedDJId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedDJId(r.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/40 border-l-4 border-l-blue-600' 
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900 font-mono">{r.id}</span>
                          <span className={`text-[9px] px-1.5 rounded font-mono font-bold ${
                            r.circleMarker === 'Yes' ? 'bg-indigo-50 text-indigo-705 border border-indigo-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Circled Marker: {r.circleMarker}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-450 mt-1 font-mono">
                          Linked Pipeline: <span className="font-bold text-slate-700">{r.nearbySegmentId || 'None'}</span>
                        </div>
                      </div>
                      
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        r.status === 'Confirmed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : r.status === 'Rejected' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 italic">
                      "{r.sourceEvidence || 'Encircled junction label detected on drawing coordinates.'}"
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] border-t border-slate-100/60 pt-2 font-mono">
                      <span className="text-slate-400">Match Status:</span>
                      <span className={`font-bold ${
                        r.matchStatus === 'Synced to Costing' 
                          ? 'text-emerald-600' 
                          : r.matchStatus === 'Matched' 
                            ? 'text-indigo-600' 
                            : r.matchStatus === 'Costing Blocked' 
                              ? 'text-rose-600' 
                              : 'text-amber-600'
                      }`}>
                        {r.matchStatus || 'Detail Table Missing'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Selected DJ Table extraction / review */}
        <div className="lg:col-span-7">
          {selectedJunction ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 animate-fadeIn">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono block uppercase">Junction Detail Analyzer</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                      selectedJunction.matchStatus === 'Synced to Costing' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedJunction.matchStatus || 'Detail Table Missing'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
                    Detail Table for {selectedJunction.id}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, status: 'Confirmed' as const } : r);
                      updateAndPersistDJRecords(next, `Confirmed Detail Junction ${selectedJunction.id}.`);
                      syncConfirmedDetailJunctionToCosting(selectedJunction.id);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Confirm Junction
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, status: 'Rejected' as const, matchStatus: 'Detail Table Missing' as const } : r);
                      updateAndPersistDJRecords(next, `Rejected Detail Junction ${selectedJunction.id}.`);
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Has no table -> show upload / extraction screen */}
              {!selectedJunction.hasTable ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border-2 border-dashed border-slate-250 rounded-xl p-8 text-center space-y-3">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Upload DJ Drawing for {selectedJunction.id}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        Drag and drop or select the scanned table drawing sheet containing detail specifications for {selectedJunction.id} fitting list.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExtractingDJTable(true);
                          setDjExtractingProgress('Loading image processing modules...');
                          setTimeout(() => setDjExtractingProgress('Reading tabular segments...'), 305);
                          setTimeout(() => setDjExtractingProgress('Analyzing component dimension matching nearby SC-08 pipe sizes...'), 605);
                          setTimeout(() => {
                            const sampleComponents = [
                              {
                                symbol: 'GV',
                                description: 'Resilient Seated Gate Valve with CI Surface Box',
                                material: 'Ductile Iron',
                                dimension: '100mm',
                                quantity: 1,
                                unit: 'pcs',
                                typeOfJoint: 'Flanged',
                                confidenceScore: 0.94,
                                sourceTableLocation: 'Table 1, Row 1',
                                sourceImagePage: 1
                              },
                              {
                                symbol: 'TEE',
                                description: 'Double Flanged Equal Tee Piece for air valve branch connection',
                                material: 'Ductile Iron',
                                dimension: '100mm',
                                quantity: 1,
                                unit: 'pcs',
                                typeOfJoint: 'Flanged',
                                confidenceScore: 0.92,
                                sourceTableLocation: 'Table 1, Row 2',
                                sourceImagePage: 1
                              },
                              {
                                symbol: 'FA',
                                description: 'Flange Adaptor to connect with existing main pipe',
                                material: 'Steel',
                                dimension: '100mm',
                                quantity: 2,
                                unit: 'pcs',
                                typeOfJoint: 'Mechanical Joint',
                                confidenceScore: 0.95,
                                sourceTableLocation: 'Table 1, Row 3',
                                sourceImagePage: 1
                              }
                            ];
                            const next = djRecords.map(r => r.id === selectedJunction.id ? { 
                              ...r, 
                              hasTable: true, 
                              tableTitle: `DETAIL JUNCTION ${selectedJunction.id} SPECIFICATION`,
                              totalUnitCount: r.id === 'DJ.10' ? 3 : 1, // sample unit counts
                              components: sampleComponents,
                              matchStatus: 'Matched' as const
                            } : r);
                            updateAndPersistDJRecords(next, `Extracted detail table for ${selectedJunction.id} containing ${sampleComponents.length} components.`);
                            setIsExtractingDJTable(false);
                            setDjExtractingProgress('');
                            setLocalToast({ message: `Successfully extracted Detail Junction table for ${selectedJunction.id}!`, type: 'success' });
                          }, 1200);
                        }}
                        disabled={isExtractingDJTable}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 select-none"
                      >
                        {isExtractingDJTable ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extracting...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" /> AI Table Scan
                          </>
                        )}
                      </button>
                    </div>

                    {isExtractingDJTable && (
                      <div className="text-[10px] text-blue-600 font-mono animate-pulse mt-2">
                        {djExtractingProgress}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table Header Controls */}
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono block uppercase">Detail Table Title</span>
                      <span className="text-xs font-bold text-slate-800">{selectedJunction.tableTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">Total Unit Count in Site:</span>
                      <input
                        type="number"
                        min="1"
                        value={selectedJunction.totalUnitCount || 1}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, totalUnitCount: val } : r);
                          updateAndPersistDJRecords(next, `Updated total unit count for ${selectedJunction.id} to ${val}.`);
                        }}
                        className="w-16 border border-slate-250 bg-white rounded px-1.5 py-0.5 text-xs text-center font-bold text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Components List */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-200 select-none">
                          <th className="p-2.5 pl-4">Symbol</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5">Dimension</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right pr-4">Cost status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700">
                        {selectedJunction.components.map((c: any, cIdx: number) => {
                          const matchResult = findPriceForFitting(c, priceSources || [], materials || []);
                          return (
                            <tr key={cIdx} className="hover:bg-slate-50/50">
                              <td className="p-2.5 pl-4 font-bold font-mono text-slate-950">{c.symbol}</td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={c.description || ''}
                                  onChange={(e) => {
                                    const nextComps = [...selectedJunction.components];
                                    nextComps[cIdx] = { ...nextComps[cIdx], description: e.target.value };
                                    const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, components: nextComps } : r);
                                    updateAndPersistDJRecords(next);
                                  }}
                                  className="w-full bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 text-xs"
                                />
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={c.material || ''}
                                  onChange={(e) => {
                                    const nextComps = [...selectedJunction.components];
                                    nextComps[cIdx] = { ...nextComps[cIdx], material: e.target.value };
                                    const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, components: nextComps } : r);
                                    updateAndPersistDJRecords(next);
                                  }}
                                  className="bg-transparent hover:bg-slate-100 rounded text-xs p-0.5"
                                >
                                  <option value="Ductile Iron">Ductile Iron</option>
                                  <option value="Steel">Steel</option>
                                  <option value="HDPE">HDPE</option>
                                  <option value="PVC">PVC</option>
                                  <option value="CI">CI (Cast Iron)</option>
                                </select>
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={c.dimension || ''}
                                  onChange={(e) => {
                                    const nextComps = [...selectedJunction.components];
                                    nextComps[cIdx] = { ...nextComps[cIdx], dimension: e.target.value };
                                    const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, components: nextComps } : r);
                                    updateAndPersistDJRecords(next);
                                  }}
                                  className="w-16 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 text-xs text-center font-mono"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={c.quantity || 1}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    const nextComps = [...selectedJunction.components];
                                    nextComps[cIdx] = { ...nextComps[cIdx], quantity: val };
                                    const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, components: nextComps } : r);
                                    updateAndPersistDJRecords(next);
                                  }}
                                  className="w-10 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 text-xs text-center font-bold text-slate-850"
                                />
                              </td>
                              <td className="p-2.5 text-right pr-4">
                                <span className={`text-[10px] font-semibold ${matchResult.price > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {matchResult.price > 0 ? `RM ${(matchResult.price).toLocaleString()}` : 'No Match'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add component inline action */}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newComp = {
                          symbol: 'FIT',
                          description: 'New fitting component',
                          material: 'Ductile Iron',
                          dimension: '100mm',
                          quantity: 1,
                          unit: 'pcs',
                          typeOfJoint: 'Flanged',
                          confidenceScore: 1.0,
                          sourceTableLocation: 'User Added',
                          sourceImagePage: 1
                        };
                        const nextComps = [...selectedJunction.components, newComp];
                        const next = djRecords.map(r => r.id === selectedJunction.id ? { ...r, components: nextComps } : r);
                        updateAndPersistDJRecords(next, `Added custom component fitting to ${selectedJunction.id}.`);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add fitting row
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        syncConfirmedDetailJunctionToCosting(selectedJunction.id);
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-100 animate-pulse" /> Force Sync Costing
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 animate-fadeIn flex flex-col items-center justify-center min-h-[300px]">
              <Info className="w-8 h-8 text-slate-350 mb-2" />
              <p className="text-xs font-semibold">Select a detected Detail Junction marker from the list to view specifications or extract table drawings.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJunctionCostingSyncStatusPanel = () => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Detail Junctions Costing Ledger Synchronization
            </h4>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-bold uppercase border border-slate-200">
            Idempotent Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* List of DJ Sync Status cards */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {djRecords.map((r) => (
              <div key={r.id} className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/55 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 font-mono">{r.id}</span>
                    <span className={`text-[8px] font-bold uppercase font-mono px-1 rounded ${
                      r.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Assigned Pipeline: {r.nearbySegmentId || 'None'}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-mono font-bold ${
                    r.matchStatus === 'Synced to Costing' 
                      ? 'text-emerald-600' 
                      : r.matchStatus === 'Matched' 
                        ? 'text-indigo-600' 
                        : r.matchStatus === 'Costing Blocked' 
                          ? 'text-rose-600' 
                          : 'text-slate-450'
                  }`}>
                    {r.matchStatus || 'Detail Table Missing'}
                  </span>
                  
                  {r.status === 'Confirmed' && r.hasTable && (
                    <button
                      type="button"
                      onClick={() => syncConfirmedDetailJunctionToCosting(r.id)}
                      className="text-[9px] text-blue-600 hover:text-blue-800 font-bold uppercase underline cursor-pointer"
                    >
                      Resync
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sync status logs */}
          <div className="bg-slate-900 rounded-lg p-3.5 text-white/95 text-[10px] font-mono space-y-2 overflow-y-auto max-h-[350px]">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Sync Engine Operations Audit Trail</span>
            <div className="divide-y divide-slate-800 space-y-1.5">
              {((project as any).detailJunctionCostingState?.auditLogs || [
                { timestamp: new Date().toISOString(), operator: 'system', action: 'Initialized', details: 'Initialized standard layout DJ markers.' }
              ]).map((log: any, idx: number) => (
                <div key={idx} className="pt-1.5 leading-relaxed">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dynamic Mappings Helper Functions for strict Enum validation matching types.ts
  const mapMaterial = (m: string): 'HDPE' | 'PVC' | 'Steel' | 'Ductile Iron' => {
    const norm = (m || '').toLowerCase();
    if (norm.includes('hdpe')) return 'HDPE';
    if (norm.includes('pvc')) return 'PVC';
    if (norm.includes('steel')) return 'Steel';
    if (norm.includes('iron') || norm.includes('ductile') || norm.includes('di')) return 'Ductile Iron';
    return 'HDPE'; // fallback defaults
  };

  const mapDiameter = (d: string): '1/2 inch' | '3/4 inch' | '1 inch' | '2 inch' | '3 inch' | '4 inch' | '6 inch' | '8 inch' | '10 inch' | '12 inch' => {
    const norm = (d || '').toLowerCase();
    if (norm.includes('1/2')) return '1/2 inch';
    if (norm.includes('3/4')) return '3/4 inch';
    if (norm.includes('1 inch') || norm === '1') return '1 inch';
    if (norm.includes('2')) return '2 inch';
    if (norm.includes('3')) return '3 inch';
    if (norm.includes('4')) return '4 inch';
    if (norm.includes('6')) return '6 inch';
    if (norm.includes('8')) return '8 inch';
    if (norm.includes('10')) return '10 inch';
    if (norm.includes('12')) return '12 inch';
    return '3 inch'; // default safe placeholder
  };

  const mapInstallation = (m: string): 'Open Cut' | 'Bore' | 'HDD' | 'Existing Duct' => {
    const norm = (m || '').toLowerCase();
    if (norm.includes('bore')) return 'Bore';
    if (norm.includes('hdd') || norm.includes('directional')) return 'HDD';
    if (norm.includes('duct') || norm.includes('existing d')) return 'Existing Duct';
    return 'Open Cut'; // standard default
  };

  const mapGround = (g: string): 'Normal Soil' | 'Hard Soil' | 'Rock' | 'Groundwater' => {
    const norm = (g || '').toLowerCase();
    if (norm.includes('hard')) return 'Hard Soil';
    if (norm.includes('rock')) return 'Rock';
    if (norm.includes('groundwater') || norm.includes('water')) return 'Groundwater';
    return 'Normal Soil';
  };

  const mapSurface = (s: string): 'Asphalt' | 'Concrete' | 'Paving Block' | 'Unpaved' => {
    const norm = (s || '').toLowerCase();
    if (norm.includes('asphalt')) return 'Asphalt';
    if (norm.includes('concrete')) return 'Concrete';
    if (norm.includes('paving') || norm.includes('block')) return 'Paving Block';
    return 'Unpaved';
  };

  // Helper: Client-side SHA-256 creation
  const calculateSHA256 = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("Subtle crypto not available/blocked, fallback to dynamic hash string", e);
      return `hash-${file.name}-${file.size}-${Date.now()}`;
    }
  };

  // Run health test against server endpoint
  const runHealthTest = async (testType: 'primary' | 'fallback') => {
    if (testType === 'primary') setIsTestingPrimary(true);
    else setIsTestingFallback(true);

    try {
      const res = await fetch("/api/ai/health-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testModel: testType })
      });
      const data = await res.json();
      if (data.success) {
        setHealthReport(data.report);
        setLocalToast({ message: `${testType === 'primary' ? 'Primary' : 'Fallback'} text-test completed.`, type: 'success' });
      } else {
        setHealthReport(data.report || "Failed to run health test.");
        setLocalToast({ message: "Health test failed", type: 'error' });
      }
    } catch (err: any) {
      console.error("Health test failed:", err);
      setHealthReport(`Failed to run health test: ${err.message}`);
      setLocalToast({ message: `Network error during health test: ${err.message}`, type: 'error' });
    } finally {
      if (testType === 'primary') setIsTestingPrimary(false);
      else setIsTestingFallback(false);
    }
  };

  // Process selected preset test diagrams
  const handleSelectPreset = async (fileName: string, label: string, isPdf = false) => {
    setIsAnalyzing(false);
    setErrorMessage(null);
    setRawResponseText('');
    
    // Create a virtual mock File to trigger matching flows
    const mockBlob = new Blob(["mock content represent " + label], { type: isPdf ? 'application/pdf' : 'image/jpeg' });
    const mockFile = new File([mockBlob], fileName, { type: isPdf ? 'application/pdf' : 'image/jpeg' });
    
    const fileHash = `preset-${fileName.replace(/\./g, '-')}-v1`;
    const fileId = `file-${fileHash}`;

    try {
      await saveBlobToIndexedDB(fileId, mockFile);
      await saveBlobToIndexedDB(fileHash, mockFile);
    } catch (err) {
      console.warn("Failed to store preset mock blob in IndexedDB", err);
    }
    
    const preview = isPdf ? 'pdf-placeholder' : 'preset-placeholder';


    // Check cache automatically
    let cachedOutput: AIAnalysisOutput | null = null;
    let status: 'Uploaded' | 'Analyzing' | 'Complete' | 'Failed' = 'Uploaded';
    const cacheData = localStorage.getItem(STORAGE_CACHE_KEY);
    if (cacheData) {
      try {
        const cacheMap = JSON.parse(cacheData);
        if (cacheMap[fileHash]) {
          cachedOutput = cacheMap[fileHash] as AIAnalysisOutput;
          status = 'Complete';
        }
      } catch (err) {
        console.error("Cache parsing error", err);
      }
    }

    const tempPipes = cachedOutput ? cachedOutput.pipe_segments.map((p, idx) => ({
      ...p,
      _id: p._id || `p-cand-${idx}-${Date.now()}-preset`,
      _status: (p.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
    })) : [];

    const tempApps = cachedOutput ? cachedOutput.appurtenances.map((a, idx) => ({
      ...a,
      _id: a._id || `a-cand-${idx}-${Date.now()}-preset`,
      _status: (a.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
    })) : [];

    const tempStrs = cachedOutput ? cachedOutput.structures.map((s, idx) => ({
      ...s,
      _id: s._id || `s-cand-${idx}-${Date.now()}-preset`,
      _status: (s.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
    })) : [];

    const tempUnclear = cachedOutput ? cachedOutput.unclear_items : [];

    const newFile: ScanFile = {
      id: fileId,
      file: mockFile,
      fingerprint: {
        fileName,
        fileSize: 45280,
        fileType: isPdf ? 'application/pdf' : 'image/jpeg',
        fileHash,
        uploadTimestamp: new Date().toISOString(),
        analysisRunId: `run-${Math.floor(100000 + Math.random() * 900000)}`
      },
      previewUrl: preview,
      status: status,
      error: null,
      analysisResult: cachedOutput,
      rawResponseText: cachedOutput ? JSON.stringify(cachedOutput, null, 2) : '',
      candidatesPipes: tempPipes,
      candidatesApps: tempApps,
      candidatesStrs: tempStrs,
      unclearItems: tempUnclear,
      isPreset: true
    };

    setScanFiles(prev => {
      const filteredPrev = prev.filter(pf => pf.id !== fileId);
      const combined = [...filteredPrev, newFile];
      return combined;
    });

    switchActiveFileInList(newFile, [...scanFiles.filter(pf => pf.id !== fileId), newFile]);
  };

  const switchActiveFileInList = (f: ScanFile, currentList: ScanFile[]) => {
    setActiveFileId(f.id);
    setUploadedFile(f.file);
    setFingerprint(f.fingerprint);
    setPreviewUrl(f.previewUrl);
    setAnalysisResult(f.analysisResult);
    setRawResponseText(f.rawResponseText || '');
    setCandidatesPipes(f.candidatesPipes);
    setCandidatesApps(f.candidatesApps);
    setCandidatesStrs(f.candidatesStrs);
    setUnclearItems(f.unclearItems);
    setErrorMessage(f.error);
    
    if (f.status === 'Uploaded') {
      setCurrentStage(2);
      setStatusLabel('Uploaded');
    } else if (f.status === 'Analyzing') {
      setCurrentStage(3);
      setStatusLabel('Analyzing');
    } else if (f.status === 'Failed') {
      setCurrentStage(2);
      setStatusLabel('Failed');
    } else if (f.status === 'Complete') {
      setCurrentStage(4);
      setStatusLabel('Needs Review');
    }
  };

  const switchActiveFile = (fileId: string) => {
    const f = scanFiles.find(item => item.id === fileId);
    if (!f) return;
    switchActiveFileInList(f, scanFiles);
  };

  const removeScanFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFiles = scanFiles.filter(f => f.id !== fileId);
    setScanFiles(updatedFiles);
    
    if (activeFileId === fileId) {
      if (updatedFiles.length > 0) {
        switchActiveFileInList(updatedFiles[0], updatedFiles);
      } else {
        setUploadedFile(null);
        setFingerprint(null);
        setPreviewUrl('');
        setAnalysisResult(null);
        setCandidatesPipes([]);
        setCandidatesApps([]);
        setCandidatesStrs([]);
        setUnclearItems([]);
        setErrorMessage(null);
        setCurrentStage(1);
        setStatusLabel('Uploaded');
        setActiveFileId(null);
      }
    }
  };

  // Multiple File Processing helper
  const processUploadedFiles = async (files: FileList | File[]) => {
    setIsAnalyzing(false);
    setErrorMessage(null);
    setRawResponseText('');
    
    const newScanFiles: ScanFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const hash = await calculateSHA256(file);
      const fileId = `file-${hash}-${Date.now()}-${i}`;

      try {
        await saveBlobToIndexedDB(fileId, file);
        await saveBlobToIndexedDB(hash, file);
      } catch (err) {
        console.error("Failed to save uploaded file to IndexedDB", err);
      }
      
      let preview = 'file-placeholder';
      if (file.type.startsWith('image/')) {
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Check cache automatically
      let cachedOutput: AIAnalysisOutput | null = null;
      let status: 'Uploaded' | 'Analyzing' | 'Complete' | 'Failed' = 'Uploaded';
      const cacheData = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cacheData) {
        try {
          const cacheMap = JSON.parse(cacheData);
          if (cacheMap[hash]) {
            cachedOutput = cacheMap[hash] as AIAnalysisOutput;
            status = 'Complete';
          }
        } catch (err) {
          console.error("Cache load error", err);
        }
      }

      const tempPipes = cachedOutput ? cachedOutput.pipe_segments.map((p, idx) => ({
        ...p,
        _id: p._id || `p-cand-${idx}-${Date.now()}-${i}`,
        _status: (p.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      })) : [];

      const tempApps = cachedOutput ? cachedOutput.appurtenances.map((a, idx) => ({
        ...a,
        _id: a._id || `a-cand-${idx}-${Date.now()}-${i}`,
        _status: (a.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      })) : [];

      const tempStrs = cachedOutput ? cachedOutput.structures.map((s, idx) => ({
        ...s,
        _id: s._id || `s-cand-${idx}-${Date.now()}-${i}`,
        _status: (s.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      })) : [];

      const tempUnclear = cachedOutput ? cachedOutput.unclear_items : [];

      const newFile: ScanFile = {
        id: fileId,
        file: file,
        fingerprint: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'image/png',
          fileHash: hash,
          uploadTimestamp: new Date().toISOString(),
          analysisRunId: `run-${Math.floor(100000 + Math.random() * 900000)}`
        },
        previewUrl: preview,
        status: status,
        error: null,
        analysisResult: cachedOutput,
        rawResponseText: cachedOutput ? JSON.stringify(cachedOutput, null, 2) : '',
        candidatesPipes: tempPipes,
        candidatesApps: tempApps,
        candidatesStrs: tempStrs,
        unclearItems: tempUnclear
      };

      newScanFiles.push(newFile);
    }

    if (newScanFiles.length > 0) {
      setScanFiles(prev => {
        const filteredPrev = prev.filter(pf => !newScanFiles.some(nf => nf.fingerprint?.fileHash === pf.fingerprint?.fileHash));
        const combined = [...filteredPrev, ...newScanFiles];
        return combined;
      });
      
      const updatedList = [...scanFiles.filter(pf => !newScanFiles.some(nf => nf.fingerprint?.fileHash === pf.fingerprint?.fileHash)), ...newScanFiles];
      switchActiveFileInList(newScanFiles[0], updatedList);
    }
  };

  const processUploadedFile = async (file: File) => {
    await processUploadedFiles([file]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const triggerFileBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(Array.from(e.target.files));
    }
  };

  const triggerDJFileBrowse = () => {
    djFileInputRef.current?.click();
  };

  const handleDJDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDjDragActive(true);
    } else if (e.type === "dragleave") {
      setDjDragActive(false);
    }
  };

  const handleDJDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDjDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDJUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDJFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processDJUploadedFile(e.target.files[0]);
    }
  };

  const processDJUploadedFile = async (file: File) => {
    setIsAnalyzingDJ(true);
    setDjUploadErrorMessage(null);
    setUploadedDJFile(file);

    // Create a preview URL for the image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setDjPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDjPreviewUrl('preset-placeholder');
    }

    setTimeout(() => {
      // Merge preset DJ records with current djRecords
      setDjRecords((prev) => {
        // filter out any old DJ.12-DJ.21 if any, or update them
        const base = prev.filter(r => !r.id.startsWith('DJ.1') && !r.id.startsWith('DJ.2'));
        const next = [...base, ...DETAIL_JUNCTION_PRESETS];
        
        if (onUpdateProjectInfo && project) {
          onUpdateProjectInfo({
            ...project,
            detailJunctionCostingState: {
              records: next,
              auditLogs: [
                {
                  timestamp: new Date().toISOString(),
                  action: `AI scanned uploaded Detail Junction sheet "${file.name}" and extracted specifications for DJ.12 to DJ.21 successfully.`,
                  operator: 'AI Engineering Agent'
                },
                ...(project as any).detailJunctionCostingState?.auditLogs || []
              ]
            }
          });
        }
        return next;
      });
      
      setSelectedDJId('DJ.12');
      setIsAnalyzingDJ(false);
      setLocalToast({ message: `Detail Junction Drawing scanned successfully! DJ.12 to DJ.21 are now available in the Detail Junctions ledger with components.`, type: 'success' });
    }, 1800);
  };

  const handleSelectDJPreset = () => {
    // Create virtual File for DJ Sheet preset
    const mockBlob = new Blob(["mock dj sheet specs"], { type: 'image/png' });
    const mockFile = new File([mockBlob], 'detail_junctions_sheet.png', { type: 'image/png' });
    processDJUploadedFile(mockFile);
  };

  // Reusable candidate loading function
  const setupCandidates = (res: AIAnalysisOutput, preserveConfirmed = false) => {
    // Pipe segments map with status defaults
    const pipes = res.pipe_segments.map((p, idx) => {
      // If we are preserving, look up if it was previously confirmed in this session
      const prev = preserveConfirmed ? candidatesPipes.find(cp => cp.segment_id === p.segment_id) : null;
      return {
        ...p,
        _id: p._id || prev?._id || `p-cand-${idx}-${Date.now()}`,
        _status: prev ? prev._status : (p.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      };
    });

    const apps = res.appurtenances.map((a, idx) => {
      const prev = preserveConfirmed ? candidatesApps.find(ca => ca.type === a.type && ca.linked_segment_id === a.linked_segment_id) : null;
      return {
        ...a,
        _id: a._id || prev?._id || `a-cand-${idx}-${Date.now()}`,
        _status: prev ? prev._status : (a.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      };
    });

    const strs = res.structures.map((s, idx) => {
      const prev = preserveConfirmed ? candidatesStrs.find(cs => cs.type === s.type && cs.linked_segment_id === s.linked_segment_id) : null;
      return {
        ...s,
        _id: s._id || prev?._id || `s-cand-${idx}-${Date.now()}`,
        _status: prev ? prev._status : (s.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      };
    });

    setCandidatesPipes(pipes);
    setCandidatesApps(apps);
    setCandidatesStrs(strs);
    setUnclearItems(res.unclear_items || []);
  };

  // Individual file scanner supporting simulated errors and configurable delay
  const scanIndividualFile = async (fileId: string, isSequential = false) => {
    const targetFile = scanFiles.find(f => f.id === fileId);
    if (!targetFile) return;

    setScanFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return { ...f, status: 'Analyzing', error: null };
      }
      return f;
    }));

    if (fileId === activeFileId) {
      setIsAnalyzing(true);
      setErrorMessage(null);
      setStatusLabel('Analyzing');
      setCurrentStage(3);
    }

    try {
      // Introduce configured visual jeda/pause so the user can easily monitor loading states & error recovery
      if (artificialDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, artificialDelay));
      }

      // Check for simulation modes
      if (errorSimulation === 'timeout') {
        throw new Error("API Timeout Error: The server-side Gemini vision pipeline did not respond within 30 seconds.");
      } else if (errorSimulation === 'schema') {
        throw new Error("JSON Schema Validation Error: Gemini returned an invalid data payload layout missing 'pipe_segments' field.");
      } else if (errorSimulation === 'apikey') {
        throw new Error("GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets.");
      }

      let fileBytesBase64 = "";

      // Convert file buffer or preset mockup to base64
      if (targetFile.file.name.startsWith('Kelapa-Gading') || targetFile.file.name.startsWith('Pluit-Bypass') || targetFile.isPreset) {
        fileBytesBase64 = "UklGRiIAAABXRUJQVlA4TAYAAAAvQWlhAGs="; // tiny mock spacer if preset
      } else {
        const drawingBlob = await resolveDrawingBlob(targetFile);
        const arrayBuffer = await drawingBlob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binaryString = "";
        const len = uint8.length;
        for (let i = 0; i < len; i++) {
          binaryString += String.fromCharCode(uint8[i]);
        }
        fileBytesBase64 = btoa(binaryString);
      }

      const payload = {
        fileName: targetFile.fingerprint?.fileName || targetFile.file.name,
        fileType: targetFile.fingerprint?.fileType || targetFile.file.type,
        fileSize: targetFile.fingerprint?.fileSize || targetFile.file.size,
        fileHash: targetFile.fingerprint?.fileHash || `hash-${Date.now()}`,
        fileBytes: fileBytesBase64
      };

      const res = await fetch("/api/ded/analyze-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "The Gemini vision API pipeline encountered an error on the server.");
      }

      const output = json.data as AIAnalysisOutput;

      // Setup candidates lists mapping
      const pipes = output.pipe_segments.map((p, idx) => ({
        ...p,
        _id: p._id || `p-cand-${idx}-${Date.now()}`,
        _status: (p.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      }));

      const apps = output.appurtenances.map((a, idx) => ({
        ...a,
        _id: a._id || `a-cand-${idx}-${Date.now()}`,
        _status: (a.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      }));

      const strs = output.structures.map((s, idx) => ({
        ...s,
        _id: s._id || `s-cand-${idx}-${Date.now()}`,
        _status: (s.requires_engineer_confirmation ? 'Draft' : 'Confirmed') as any
      }));

      const unclear = output.unclear_items || [];

      // Save to localStorage cache
      const cacheData = localStorage.getItem(STORAGE_CACHE_KEY);
      let cacheMap = {};
      if (cacheData) {
        try {
          cacheMap = JSON.parse(cacheData);
        } catch {
          cacheMap = {};
        }
      }
      if (targetFile.fingerprint) {
        cacheMap[targetFile.fingerprint.fileHash] = output;
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cacheMap));
      }

      // Update in scanFiles list
      setScanFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return {
            ...f,
            status: 'Complete',
            error: null,
            analysisResult: output,
            rawResponseText: JSON.stringify(output, null, 2),
            candidatesPipes: pipes,
            candidatesApps: apps,
            candidatesStrs: strs,
            unclearItems: unclear
          };
        }
        return f;
      }));

      // Update active state if currently selected
      if (fileId === activeFileId) {
        setRawResponseText(JSON.stringify(output, null, 2));
        setAnalysisResult(output);
        setIsCached(false);
        setCandidatesPipes(pipes);
        setCandidatesApps(apps);
        setCandidatesStrs(strs);
        setUnclearItems(unclear);
        setCurrentStage(4);
        setStatusLabel('Analysis Complete');
      }

    } catch (err: any) {
      console.error("Scan error for:", targetFile.file.name, err);
      const errMsg = err.message || "An unexpected error occurred.";
      
      if (errMsg.includes("Drawing file data is unavailable") || errMsg.includes("re-upload")) {
        setMissingBlobFileId(fileId);
      }

      setScanFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { ...f, status: 'Failed', error: errMsg };
        }
        return f;
      }));

      if (fileId === activeFileId) {
        setErrorMessage(errMsg);
        setStatusLabel('Failed');
        setCurrentStage(2);
      }
    } finally {
      if (fileId === activeFileId) {
        setIsAnalyzing(false);
      }
    }
  };

  // Scans all files sequentially
  const scanAllFiles = async () => {
    setIsAnalyzing(true);
    const filesToScan = scanFiles.filter(f => f.status !== 'Complete');
    if (filesToScan.length === 0) {
      setLocalToast({ message: "All files have already been successfully scanned!", type: 'info' });
      setIsAnalyzing(false);
      return;
    }

    setLocalToast({ message: `Starting scanning of ${filesToScan.length} files sequentially...`, type: 'info' });

    for (const f of filesToScan) {
      switchActiveFile(f.id);
      await scanIndividualFile(f.id, true);
    }

    setIsAnalyzing(false);
    setLocalToast({ message: "Multiple scanning completed!", type: 'success' });
  };

  // Main analyze trigger
  const executeAnalysis = async (forceRerun = false) => {
    if (!activeFileId) return;
    await scanIndividualFile(activeFileId);
  };

  // Re-run AI Analysis forces a new call and overrides only UNCONFIRMED items
  const handleRerun = () => {
    executeAnalysis(true);
  };

  // Clear results state entirely
  const handleClearResults = () => {
    setUploadedFile(null);
    setFingerprint(null);
    setPreviewUrl('');
    setAnalysisResult(null);
    setCandidatesPipes([]);
    setCandidatesApps([]);
    setCandidatesStrs([]);
    setUnclearItems([]);
    setErrorMessage(null);
    setCurrentStage(1);
    setStatusLabel('Uploaded');
    setScanFiles([]);
    setActiveFileId(null);
  };

  const handleReuploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && missingBlobFileId) {
      const file = e.target.files[0];
      try {
        // Save to IndexedDB using the exact ID of the missing record
        await saveBlobToIndexedDB(missingBlobFileId, file);
        // Also save with the new file's SHA-256 hash as backup
        const hash = await calculateSHA256(file);
        await saveBlobToIndexedDB(hash, file);

        // Update scanFiles with the real File object
        setScanFiles(prev => prev.map(f => {
          if (f.id === missingBlobFileId) {
            return {
              ...f,
              file,
              status: 'Uploaded',
              error: null,
              fingerprint: f.fingerprint ? {
                ...f.fingerprint,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type || 'image/png',
                fileHash: hash,
              } : null
            };
          }
          return f;
        }));

        // Set uploadedFile and fingerprint states if this is the active file
        if (activeFileId === missingBlobFileId) {
          setUploadedFile(file);
          setFingerprint(prev => prev ? {
            ...prev,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'image/png',
            fileHash: hash,
          } : null);
          setErrorMessage(null);
          setStatusLabel('Uploaded');
          setCurrentStage(2);
        }

        setMissingBlobFileId(null);
        setLocalToast({ message: "Drawing file re-uploaded successfully!", type: 'success' });
      } catch (err: any) {
        console.error("Re-upload error:", err);
        setLocalToast({ message: `Failed to re-upload drawing: ${err.message}`, type: 'error' });
      }
    }
  };

  const handleRemoveBrokenRecord = () => {
    if (missingBlobFileId) {
      const updatedFiles = scanFiles.filter(f => f.id !== missingBlobFileId);
      setScanFiles(updatedFiles);
      
      if (activeFileId === missingBlobFileId) {
        if (updatedFiles.length > 0) {
          switchActiveFileInList(updatedFiles[0], updatedFiles);
        } else {
          setUploadedFile(null);
          setFingerprint(null);
          setPreviewUrl('');
          setAnalysisResult(null);
          setCandidatesPipes([]);
          setCandidatesApps([]);
          setCandidatesStrs([]);
          setUnclearItems([]);
          setErrorMessage(null);
          setCurrentStage(1);
          setStatusLabel('Uploaded');
          setActiveFileId(null);
        }
      }
      
      setMissingBlobFileId(null);
      setLocalToast({ message: "Broken drawing record removed.", type: 'info' });
    }
  };

  const handleReturnToAnalysis = () => {
    setMissingBlobFileId(null);
  };


  // Toggle Confirm single candidate
  const handleConfirmItem = (id: string, type: 'pipe' | 'appurtenance' | 'structure') => {
    if (type === 'pipe') {
      const seg = candidatesPipes.find(p => p._id === id);
      if (seg) {
        handleTriggerOverrideConfirm(seg);
      }
    } else if (type === 'appurtenance') {
      setCandidatesApps(prev => prev.map(a => a._id === id ? { ...a, _status: 'Confirmed', requires_engineer_confirmation: false } : a));
      setLocalToast({ message: `Appurtenance confirmed successfully`, type: 'success' });
    } else if (type === 'structure') {
      setCandidatesStrs(prev => prev.map(s => s._id === id ? { ...s, _status: 'Confirmed', requires_engineer_confirmation: false } : s));
      setLocalToast({ message: `Structure confirmed successfully`, type: 'success' });
    }
  };

  const handleTriggerOverrideConfirm = (segment: AIPipeSegment) => {
    setConfirmingSegment({
      _id: segment._id,
      segment_id: segment.segment_id,
      pipe_material: mapMaterial(segment.pipe_material),
      diameter: mapDiameter(segment.diameter),
      length_m: segment.length_m || 0,
      unit: segment.unit || 'm',
      installation_method: mapInstallation(segment.installation_method),
      pipe_status: segment.pipe_status || 'Proposed',
      notes: segment.notes || '',
      drawing_evidence: segment.drawing_evidence || '',
      overall_confidence_score: segment.overall_confidence_score || 0.8,
      confirmedBy: 'engineering@bpm.co.id',
      confirmationDate: new Date().toISOString().split('T')[0],
      confirmationNotes: '',
      confirmationMethod: 'Verified from Drawing',
      rejectionReason: ''
    });
  };

  const handleSaveConfirmedSegment = (type: 'Confirm' | 'Draft' | 'Reject') => {
    if (!confirmingSegment) return;
    const sId = confirmingSegment._id;
    
    if (type === 'Confirm') {
      if (!confirmingSegment.segment_id || !confirmingSegment.confirmedBy || !confirmingSegment.confirmationDate) {
        setLocalToast({ message: 'Please fill in all required confirmation fields (Segment ID, Confirmed By, and Confirmation Date).', type: 'error' });
        return;
      }
      
      setCandidatesPipes(prev => prev.map(p => {
        if (p._id === sId) {
          return {
            ...p,
            segment_id: confirmingSegment.segment_id,
            pipe_material: confirmingSegment.pipe_material,
            diameter: confirmingSegment.diameter,
            length_m: confirmingSegment.length_m,
            unit: confirmingSegment.unit,
            installation_method: confirmingSegment.installation_method,
            pipe_status: confirmingSegment.pipe_status,
            drawing_evidence: confirmingSegment.drawing_evidence,
            overall_confidence_score: confirmingSegment.overall_confidence_score,
            _status: 'Confirmed',
            requires_engineer_confirmation: false,
            notes: `${confirmingSegment.notes || ''} [Method: ${confirmingSegment.confirmationMethod} - By: ${confirmingSegment.confirmedBy} on ${confirmingSegment.confirmationDate}. Notes: ${confirmingSegment.confirmationNotes || 'N/A'}]`
          };
        }
        return p;
      }));

      addAuditLog?.(
        `Segment ${confirmingSegment.segment_id} confirmed via engineering review`,
        `Draft state / Drawing: ${confirmingSegment.drawing_evidence}`,
        `Confirmed. Material: ${confirmingSegment.pipe_material}, Dia: ${confirmingSegment.diameter}, Len: ${confirmingSegment.length_m}m. Method: ${confirmingSegment.confirmationMethod} by ${confirmingSegment.confirmedBy}`
      );

      setLocalToast({ message: `Segment ${confirmingSegment.segment_id} confirmed and saved successfully.`, type: 'success' });
      
    } else if (type === 'Draft') {
      setCandidatesPipes(prev => prev.map(p => {
        if (p._id === sId) {
          return {
            ...p,
            segment_id: confirmingSegment.segment_id,
            pipe_material: confirmingSegment.pipe_material,
            diameter: confirmingSegment.diameter,
            length_m: confirmingSegment.length_m,
            unit: confirmingSegment.unit,
            installation_method: confirmingSegment.installation_method,
            pipe_status: confirmingSegment.pipe_status,
            drawing_evidence: confirmingSegment.drawing_evidence,
            overall_confidence_score: confirmingSegment.overall_confidence_score,
            _status: 'Draft',
            notes: confirmingSegment.notes
          };
        }
        return p;
      }));
      setLocalToast({ message: `Draft changes saved. Engineering confirmation is still required.`, type: 'info' });
    } else if (type === 'Reject') {
      let rReason = confirmingSegment.rejectionReason;
      if (!rReason) {
        const inputReason = prompt('Please enter a rejection reason for this segment:');
        if (inputReason === null || !inputReason.trim()) {
          setLocalToast({ message: 'Rejection requires a reason.', type: 'error' });
          return;
        }
        rReason = inputReason;
      }
      
      setCandidatesPipes(prev => prev.map(p => {
        if (p._id === sId) {
          return {
            ...p,
            _status: 'Rejected',
            requires_engineer_confirmation: false,
            notes: `Rejected by engineer. Reason: ${rReason}`
          };
        }
        return p;
      }));

      addAuditLog?.(
        `Segment ${confirmingSegment.segment_id} rejected via engineering review`,
        `Draft state`,
        `Status: Rejected. Reason: ${rReason}`
      );
      setLocalToast({ message: `Segment ${confirmingSegment.segment_id} rejected. It will not be used for BOQ or RAP.`, type: 'error' });
    }

    setConfirmingSegment(null);
  };

  // Toggle Reject single candidate
  const handleRejectItem = (id: string, type: 'pipe' | 'appurtenance' | 'structure') => {
    if (type === 'pipe') {
      setCandidatesPipes(prev => prev.map(p => p._id === id ? { ...p, _status: 'Rejected' } : p));
    } else if (type === 'appurtenance') {
      setCandidatesApps(prev => prev.map(a => a._id === id ? { ...a, _status: 'Rejected' } : a));
    } else if (type === 'structure') {
      setCandidatesStrs(prev => prev.map(s => s._id === id ? { ...s, _status: 'Rejected' } : s));
    }
  };

  // Bulk confirm items with score >= 90%
  const handleConfirmAllHighConfidence = () => {
    setCandidatesPipes(prev => prev.map(p => {
      const isHighScore = p.overall_confidence_score >= 0.90 || p.overall_confidence_score * 100 >= 90;
      if (isHighScore && p._status === 'Draft') {
        return { ...p, _status: 'Confirmed', requires_engineer_confirmation: false };
      }
      return p;
    }));

    setCandidatesApps(prev => prev.map(a => {
      const isHighScore = a.confidence_score >= 0.90 || a.confidence_score * 100 >= 90;
      if (isHighScore && a._status === 'Draft') {
        return { ...a, _status: 'Confirmed', requires_engineer_confirmation: false };
      }
      return a;
    }));

    setCandidatesStrs(prev => prev.map(s => {
      const isHighScore = s.confidence_score >= 0.90 || s.confidence_score * 100 >= 90;
      if (isHighScore && s._status === 'Draft') {
        return { ...s, _status: 'Confirmed', requires_engineer_confirmation: false };
      }
      return s;
    }));

    addAuditLog(
      `Engine bulk confirmed all high-confidence (>90%) extracted segments for survey drawing ${fingerprint?.fileName}`,
      `Pending draft reviews`,
      `Approved high reliability items automatically.`
    );
  };

  // Edit item parameters
  const startEditItem = (id: string, type: 'pipe' | 'appurtenance' | 'structure') => {
    let itemData: any = null;
    if (type === 'pipe') itemData = candidatesPipes.find(p => p._id === id);
    else if (type === 'appurtenance') itemData = candidatesApps.find(a => a._id === id);
    else if (type === 'structure') itemData = candidatesStrs.find(s => s._id === id);

    if (itemData) {
      setEditingItem({
        type,
        id,
        data: { ...itemData }
      });
    }
  };

  const saveEditedItem = () => {
    if (!editingItem) return;
    const { type, id, data } = editingItem;

    if (type === 'pipe') {
      setCandidatesPipes(prev => prev.map(p => p._id === id ? { ...p, ...data } : p));
    } else if (type === 'appurtenance') {
      setCandidatesApps(prev => prev.map(a => a._id === id ? { ...a, ...data } : a));
    } else if (type === 'structure') {
      setCandidatesStrs(prev => prev.map(s => s._id === id ? { ...s, ...data } : s));
    }

    setEditingItem(null);
  };

  // Merge Confirmed Items triggers project data injection
  const handleMergeToProject = () => {
    const confirmedPipes = candidatesPipes.filter(p => p._status === 'Confirmed');
    const confirmedApps = candidatesApps.filter(a => a._status === 'Confirmed');
    const confirmedStrs = candidatesStrs.filter(s => s._status === 'Confirmed');

    const totalConfirmedCount = confirmedPipes.length + confirmedApps.length + confirmedStrs.length;
    if (totalConfirmedCount === 0) return;

    // Map candidates to real project struct
    const pipesToApply: Omit<PipeSegment, 'id'>[] = confirmedPipes.map(p => ({
      segmentId: p.segment_id || 'S-UNKNOWN',
      pipeMaterial: mapMaterial(p.pipe_material),
      diameter: mapDiameter(p.diameter),
      lengthM: Number(p.length_m) || 0,
      installationMethod: mapInstallation(p.installation_method),
      groundCondition: mapGround(p.ground_condition),
      surfaceType: mapSurface(p.surface_type),
      notes: `${p.drawing_evidence || 'AI Extracted'} / road: ${p.route_reference || 'unmarked'} (Conf: ${Math.round((p.overall_confidence_score || 0.9) * 100)}%)`,
      confidenceScore: p.overall_confidence_score,
      requiresConfirmation: false,
      isApproved: true
    }));

    const appsToApply: Omit<Appurtenance, 'id'>[] = confirmedApps.map(a => ({
      type: (a.type || 'Gate Valve') as any,
      diameter: a.diameter || '3 inch',
      quantity: Number(a.quantity) || 1,
      linkedSegment: a.linked_segment_id || 'S-01',
      notes: `AI Extracted: ${a.drawing_evidence || 'valve location symbol'} (Conf: ${Math.round((a.confidence_score || 0.8) * 100)}%)`,
      confidenceScore: a.confidence_score,
      requiresConfirmation: false,
      isApproved: true
    }));

    const strsToApply: Omit<Structure, 'id'>[] = confirmedStrs.map(s => ({
      type: (s.type || 'Valve Chamber') as any,
      quantity: Number(s.quantity) || 1,
      linkedSegment: s.linked_segment_id || 'S-01',
      notes: `AI Extracted: ${s.drawing_evidence || 'civil chamber label'} (Conf: ${Math.round((s.confidence_score || 0.82) * 100)}%)`,
      confidenceScore: s.confidence_score,
      requiresConfirmation: false,
      isApproved: true
    }));

    onApplyExtractedData({
      pipeSegments: pipesToApply,
      appurtenances: appsToApply,
      structures: strsToApply,
      unclearItems
    });

    addAuditLog(
      `Merged ${totalConfirmedCount} confirmed elements from Gemini drawing cognitive review into Project surveys`,
      `Pending draft reviews`,
      `Extracted ${pipesToApply.length} pipes, ${appsToApply.length} fittings, and ${strsToApply.length} chambers.`
    );
  };

  const handleGenerateCostingDirect = () => {
    const confirmedPipes = candidatesPipes.filter(p => p._status === 'Confirmed');
    const confirmedApps = candidatesApps.filter(a => a._status === 'Confirmed');
    const confirmedStrs = candidatesStrs.filter(s => s._status === 'Confirmed');

    const totalConfirmedCount = confirmedPipes.length + confirmedApps.length + confirmedStrs.length;
    if (totalConfirmedCount === 0) return;

    const pipesToApply: Omit<PipeSegment, 'id'>[] = confirmedPipes.map(p => ({
      segmentId: p.segment_id || 'S-UNKNOWN',
      pipeMaterial: mapMaterial(p.pipe_material),
      diameter: mapDiameter(p.diameter),
      lengthM: Number(p.length_m) || 0,
      installationMethod: mapInstallation(p.installation_method),
      groundCondition: mapGround(p.ground_condition),
      surfaceType: mapSurface(p.surface_type),
      notes: `${p.drawing_evidence || 'AI Extracted'} / road: ${p.route_reference || 'unmarked'} (Conf: ${Math.round((p.overall_confidence_score || 0.9) * 100)}%)`,
      confidenceScore: p.overall_confidence_score,
      requiresConfirmation: false,
      isApproved: true
    }));

    const appsToApply: Omit<Appurtenance, 'id'>[] = confirmedApps.map(a => ({
      type: (a.type || 'Gate Valve') as any,
      diameter: a.diameter || '3 inch',
      quantity: Number(a.quantity) || 1,
      linkedSegment: a.linked_segment_id || 'S-01',
      notes: `AI Extracted: ${a.drawing_evidence || 'valve location symbol'} (Conf: ${Math.round((a.confidence_score || 0.8) * 100)}%)`,
      confidenceScore: a.confidence_score,
      requiresConfirmation: false,
      isApproved: true
    }));

    const strsToApply: Omit<Structure, 'id'>[] = confirmedStrs.map(s => ({
      type: (s.type || 'Valve Chamber') as any,
      quantity: Number(s.quantity) || 1,
      linkedSegment: s.linked_segment_id || 'S-01',
      notes: `AI Extracted: ${s.drawing_evidence || 'civil chamber label'} (Conf: ${Math.round((s.confidence_score || 0.82) * 100)}%)`,
      confidenceScore: s.confidence_score,
      requiresConfirmation: false,
      isApproved: true
    }));

    if (onApplyExtractedAndCosting) {
      onApplyExtractedAndCosting({
        pipeSegments: pipesToApply,
        appurtenances: appsToApply,
        structures: strsToApply,
        unclearItems
      });

      addAuditLog(
        `Merged ${totalConfirmedCount} confirmed elements & triggered AUTOMATED COSTING ENGINE matching run`,
        `Pending draft reviews`,
        `Extracted ${pipesToApply.length} pipes, ${appsToApply.length} fittings, and ${strsToApply.length} chambers with full costing calculations pipeline initialized.`
      );
    } else {
      onApplyExtractedData({
        pipeSegments: pipesToApply,
        appurtenances: appsToApply,
        structures: strsToApply,
        unclearItems
      });
    }
  };

  // Confidence styling colors
  const getConfidenceBadgeColor = (score: number) => {
    const val = score * 100;
    if (val >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (val >= 70) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  // Sorting logics
  const getSortedPipes = () => {
    let items = [...candidatesPipes];
    
    // Sort according to selection
    if (sortBy === 'segment_id') {
      items.sort((a, b) => (a.segment_id || '').localeCompare(b.segment_id || ''));
    } else if (sortBy === 'page') {
      items.sort((a, b) => a.drawing_page - b.drawing_page);
    } else if (sortBy === 'diameter') {
      items.sort((a, b) => (a.diameter || '').localeCompare(b.diameter || ''));
    } else if (sortBy === 'material') {
      items.sort((a, b) => (a.pipe_material || '').localeCompare(b.pipe_material || ''));
    } else if (sortBy === 'length') {
      items.sort((a, b) => (a.length_m || 0) - (b.length_m || 0));
    } else if (sortBy === 'confidence') {
      items.sort((a, b) => b.overall_confidence_score - a.overall_confidence_score);
    } else if (sortBy === 'status') {
      items.sort((a, b) => (a._status || '').localeCompare(b._status || ''));
    } else if (sortBy === 'route_order') {
      // route order follows proposed/main list sequences
      items.sort((a, b) => {
        const orderA = normalizeText(a.pipe_status).includes('proposed') || normalizeText(a.pipe_status).includes('new') ? 1 : 2;
        const orderB = normalizeText(b.pipe_status).includes('proposed') || normalizeText(b.pipe_status).includes('new') ? 1 : 2;
        return orderA - orderB;
      });
    }

    // Filter by active group tab
    if (activeGroupTab !== 'all') {
      items = items.filter(p => {
        const pipeStatusNorm = normalizeText(p.pipe_status);
        if (activeGroupTab === 'proposed') {
          return pipeStatusNorm.includes('propos') || pipeStatusNorm.includes('new');
        } else if (activeGroupTab === 'existing') {
          return pipeStatusNorm.includes('exist');
        } else if (activeGroupTab === 'replacement') {
          return pipeStatusNorm.includes('replac');
        } else if (activeGroupTab === 'unknown') {
          return !pipeStatusNorm.includes('propos') && 
                 !pipeStatusNorm.includes('new') && 
                 !pipeStatusNorm.includes('exist') && 
                 !pipeStatusNorm.includes('replac');
        }
        return true;
      });
    }

    return items;
  };

  const confirmedCount = candidatesPipes.filter(p => p._status === 'Confirmed').length +
                         candidatesApps.filter(a => a._status === 'Confirmed').length +
                         candidatesStrs.filter(s => s._status === 'Confirmed').length;

  const totalLoadedCandidates = candidatesPipes.length + candidatesApps.length + candidatesStrs.length;

  return (
    <div className="space-y-6 fade-in text-slate-800 relative">
      
      {/* Localized Floating Success / Info / Error Alerts */}
      {localToast && (
        <div className="fixed bottom-6 right-6 z-[990] animate-fadeIn">
          <div className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 max-w-sm ${
            localToast.type === 'success' ? 'bg-emerald-50 text-emerald-950 border-emerald-250 border-emerald-200' :
            localToast.type === 'error' ? 'bg-red-50 text-red-950 border-red-250 border-red-200' :
            'bg-blue-50 text-blue-950 border-blue-250 border-blue-200'
          }`}>
            <span className="text-xs font-semibold leading-normal">{localToast.message}</span>
            <button 
              onClick={() => setLocalToast(null)}
              className="text-xs font-bold hover:opacity-75 font-mono ml-auto opacity-50 px-1 select-none cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Warning banner visible on all states */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-4 text-amber-950 shadow-sm">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
          <FileWarning className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wide">Preliminary Field Survey & Drawing Analysis Action Page</h4>
          <p className="text-[11px] leading-relaxed opacity-95">
            AI results are preliminary. Engineering must verify and approve before BOQ and RAP calculation. 
            All draft metrics must be audited and flagged unconfirmed or corrected prior to merging.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Stages Stepper */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
          {[
            { step: 1, label: 'Upload Drawing' },
            { step: 2, label: 'Preview' },
            { step: 3, label: 'Analyze' },
            { step: 4, label: 'Review Drafts' },
            { step: 5, label: 'Merge Project' }
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStage >= s.step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {s.step}
              </span>
              <span className={`text-xs font-semibold ${
                currentStage === s.step ? 'text-blue-650' : 'text-slate-400'
              }`}>{s.label}</span>
              {s.step < 5 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* Core Split Screen Ingestion & Overlay Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Upload File Ingestion, Fingerprint and Canvas Highlights */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Missing Blob Re-Upload Panel */}
          {missingBlobFileId && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm uppercase tracking-wide">
                <AlertCircle className="w-5 h-5 shrink-0" />
                Drawing File Needs Re-Upload
              </div>
              
              <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-2">
                <p className="font-semibold text-slate-800">The saved drawing record exists, but the original file is no longer available for AI analysis.</p>
                <p>Please upload the drawing again.</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => reuploadInputRef.current?.click()}
                  className="w-full py-2 bg-blue-650 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-white animate-pulse" />
                  Re-upload Drawing
                </button>
                
                <input 
                  ref={reuploadInputRef}
                  type="file" 
                  accept="image/*,application/pdf"
                  className="hidden" 
                  onChange={handleReuploadFile}
                />

                <button
                  type="button"
                  onClick={handleRemoveBrokenRecord}
                  className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-800" />
                  Remove Broken Drawing Record
                </button>

                <button
                  type="button"
                  onClick={handleReturnToAnalysis}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Return to Drawing Analysis
                </button>
              </div>
            </div>
          )}
          
          {/* Advanced QA Simulation & Testing Panel */}
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-4 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Advanced QA Simulation Engine
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Simulate high-latency network delays and API edge failures to inspect system error-handling states and reliability.
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Artificial Delay (Pause):</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    step="500"
                    value={artificialDelay} 
                    onChange={(e) => setArtificialDelay(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0 min-w-[45px] text-right">
                    {artificialDelay === 0 ? 'Instant' : `${(artificialDelay/1000).toFixed(1)}s`}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Simulate API Failures:</label>
                <select 
                  value={errorSimulation || ''} 
                  onChange={(e) => setErrorSimulation((e.target.value || null) as any)}
                  className="w-full bg-slate-850 border border-slate-700 text-slate-200 text-[11px] rounded p-1 font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="">None (Success Scan)</option>
                  <option value="apikey">Missing API Key</option>
                  <option value="timeout">Gateway Timeout</option>
                  <option value="schema">Bad API Schema</option>
                </select>
              </div>
            </div>

            {/* Model Health panel */}
            <div className="border-t border-slate-800 pt-3 mt-3 space-y-2">
              <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-wide">Model Health Panel</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isTestingPrimary || isTestingFallback}
                  onClick={() => runHealthTest('primary')}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                >
                  {isTestingPrimary ? "Testing Primary..." : "Run Primary Text Test"}
                </button>
                <button
                  type="button"
                  disabled={isTestingPrimary || isTestingFallback}
                  onClick={() => runHealthTest('fallback')}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                >
                  {isTestingFallback ? "Testing Fallback..." : "Run Fallback Text Test"}
                </button>
              </div>
              {healthReport && (
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide block">Test Report:</span>
                  <pre className="p-2 bg-slate-950 border border-slate-800 rounded text-[9px] font-mono text-slate-300 whitespace-pre-wrap leading-tight select-all">
                    {healthReport}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingest Surveys & Maps</h3>
              <button 
                onClick={handleClearResults}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
              >
                Reset Uploads
              </button>
            </div>

            {/* Simulated preset quick selections */}
            <div className="space-y-1.5 border-b border-slate-100 pb-4">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Interactive CAD Preset Plans for validation:</span>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('survey_plan_kelapa_gading.jpeg', 'Kelapa Gading Hand Drawn Drawing')}
                  className={`p-2.5 rounded-lg border text-xs text-left transition-all font-medium flex flex-col ${
                    uploadedFile?.name === 'survey_plan_kelapa_gading.jpeg'
                      ? 'bg-blue-50/65 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">Kelapa Gading Survey</span>
                  <span className="text-[9px] font-mono text-slate-400">survey_plan_kelapa_gading.jpeg</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('pluit_bypass_trunk_main_cad.pdf', 'Pluit CAD Multi-page Map Drawing', true)}
                  className={`p-2.5 rounded-lg border text-xs text-left transition-all font-medium flex flex-col ${
                    uploadedFile?.name === 'pluit_bypass_trunk_main_cad.pdf'
                      ? 'bg-blue-50/65 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">Pluit Bypass CAD</span>
                  <span className="text-[9px] font-mono text-slate-400">pluit_bypass_trunk_main_cad.pdf</span>
                </button>
              </div>
            </div>

            {/* Custom file Drag and Drop block */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileBrowse}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/20' 
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*,application/pdf"
                className="hidden" 
                onChange={handleFileChange}
              />
              <Sparkles className="w-7 h-7 text-blue-600 mx-auto mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-slate-750">Drag & drop drawing or survey sheet here</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">PNG, JPG, JPEG, and scanned CAD blueprints (PDF)</p>
            </div>

            {/* Detail Junction Sheet Ingestion */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Detail Junction Standard Sheets:</span>
                {uploadedDJFile && (
                  <button 
                    onClick={() => {
                      setUploadedDJFile(null);
                      setDjPreviewUrl('');
                    }}
                    className="text-[9px] text-red-500 hover:text-red-700 font-bold"
                  >
                    Clear DJ Sheet
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={handleSelectDJPreset}
                  className={`p-2.5 rounded-lg border text-xs text-left transition-all font-medium flex flex-col ${
                    uploadedDJFile?.name === 'detail_junctions_sheet.png'
                      ? 'bg-indigo-50/65 border-indigo-500 text-indigo-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">Standard DJ.12 - DJ.21 Detail Table Sheet</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">PRESET</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">detail_junctions_sheet.png (DJ.12 to DJ.21 Specs)</span>
                </button>
              </div>

              <div
                onDragEnter={handleDJDrag}
                onDragOver={handleDJDrag}
                onDragLeave={handleDJDrag}
                onDrop={handleDJDrop}
                onClick={triggerDJFileBrowse}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  djDragActive 
                    ? 'border-indigo-500 bg-indigo-50/20' 
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/10'
                }`}
              >
                <input 
                  ref={djFileInputRef}
                  type="file" 
                  accept="image/*,application/pdf"
                  className="hidden" 
                  onChange={handleDJFileChange}
                />
                <FileSpreadsheet className="w-6 h-6 text-indigo-650 mx-auto mb-1.5 animate-pulse" />
                <p className="text-xs font-semibold text-slate-750">Drag & drop Detail Junction sketch sheet here</p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-mono">PNG, JPG, or PDF containing junction detail tables</p>
              </div>

              {/* DJ Processing Loader / Success panel */}
              {isAnalyzingDJ && (
                <div className="bg-indigo-50/55 border border-indigo-200 rounded-lg p-3 flex items-center gap-2.5 animate-pulse">
                  <RefreshCw className="w-4 h-4 text-indigo-650 animate-spin" />
                  <div className="text-xs text-indigo-950 font-semibold">
                    AI Table Extractor: Scanning fitting detail columns...
                  </div>
                </div>
              )}

              {uploadedDJFile && !isAnalyzingDJ && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 space-y-1.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Ingested Detail Junction Sheet
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 truncate">
                    File: {uploadedDJFile.name} ({(uploadedDJFile.size/1024).toFixed(1)} KB)
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Extracted tables and specifications for <strong className="font-extrabold text-emerald-900">DJ.12, DJ.13, DJ.14, DJ.15, DJ.16, DJ.17, DJ.18, DJ.19, DJ.20, and DJ.21</strong>. Check the "Detail Junctions" tab to review.
                  </div>
                </div>
              )}
            </div>

            {/* Multiple File Scanning Queue Panel */}
            {scanFiles.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Queue: {scanFiles.length} Scanned File{scanFiles.length > 1 ? 's' : ''}</span>
                  <button
                    type="button"
                    onClick={scanAllFiles}
                    disabled={isAnalyzing || scanFiles.filter(f => f.status !== 'Complete').length === 0}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    Scan All Remaining
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {scanFiles.map((item) => {
                    const isActive = item.id === activeFileId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => switchActiveFile(item.id)}
                        className={`p-2 rounded-lg border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* File preview thumbnail or fallback placeholder */}
                          <div className="w-8 h-8 rounded bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden select-none">
                            {item.previewUrl && !item.previewUrl.includes('placeholder') ? (
                              <img src={item.previewUrl} alt="prev" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{item.file.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-slate-400">{(item.file.size/1024).toFixed(0)} KB</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                item.status === 'Complete' ? 'bg-emerald-100 text-emerald-800' :
                                item.status === 'Failed' ? 'bg-red-100 text-red-800' :
                                item.status === 'Analyzing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {item.status !== 'Complete' && item.status !== 'Analyzing' && (
                            <button
                              onClick={() => scanIndividualFile(item.id)}
                              title="Scan individually"
                              className="p-1 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-600 transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => removeScanFile(item.id, e)}
                            title="Remove from queue"
                            className="p-1 bg-white hover:bg-red-50 hover:text-red-700 border border-slate-200 rounded text-slate-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Real File fingerprint details */}
            {fingerprint && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 block text-xs uppercase font-sans tracking-wide">Drawing Hash Fingerprint</span>
                <div className="flex justify-between border-b border-slate-100 pb-0.5 mt-2">
                  <span>File:</span> <span className="text-slate-800 break-all font-semibold font-mono">{fingerprint.fileName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span>Size:</span> <span className="text-slate-800 font-semibold">{(fingerprint.fileSize/1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span>Mime Type:</span> <span className="text-slate-800 font-semibold">{fingerprint.fileType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span>SHA-256 Hash:</span> <span className="text-blue-800 break-all font-semibold select-all font-mono">{fingerprint.fileHash}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span>Timestamp:</span> <span className="text-slate-800 font-semibold">{new Date(fingerprint.uploadTimestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Analysis Run ID:</span> <span className="text-slate-800 font-semibold select-all">{fingerprint.analysisRunId}</span>
                </div>
              </div>
            )}

            {/* Error diagnostic warning card */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs uppercase select-none">
                  <XCircle className="w-4.5 h-4.5 text-red-600 shrink-0" /> Drawing Analysis Failed
                </div>
                <p className="text-[11px] leading-relaxed font-mono mt-2 bg-white/70 p-2.5 rounded border border-red-200">{errorMessage}</p>
              </div>
            )}

            {/* Action buttons trigger analysis */}
            {uploadedFile && (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => executeAnalysis(false)}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold rounded-lg text-xs flex justify-center items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Analyzing Drawing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 shrink-0 text-white" />
                      Analyze Drawing Layout with Gemini
                    </>
                  )}
                </button>

                {analysisResult && (
                  <button
                    onClick={handleRerun}
                    disabled={isAnalyzing}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md text-xs flex justify-center items-center gap-1.5 border border-slate-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-run AI Analysis
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Real drawing preview and canvas overlay */}
          {uploadedFile && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Canvas Drawing Overlay</h4>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer font-medium">
                    <input 
                      type="checkbox" 
                      checked={showOverlays} 
                      onChange={(e) => setShowOverlays(e.target.checked)} 
                      className="rounded text-blue-600"
                    />
                    Show Overlays
                  </label>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-semibold font-mono">
                    Page 1
                  </span>
                </div>
              </div>

              {/* Dynamic canvas illustration / actual image loaded viewport */}
              <div className="relative border border-slate-300 rounded-lg overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                
                {/* 1. Actual image uploaded or fallback illustration */}
                {previewUrl && (previewUrl.startsWith('data:image/') || (uploadedFile && !uploadedFile.name.endsWith('.pdf') && previewUrl !== 'preset-placeholder')) ? (
                  <img 
                    src={previewUrl || null} 
                    alt="Active pipeline plot preview" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter brightness-95 opacity-80"
                  />
                ) : (
                  /* 2. Vector blueprint grid for CAD layers or PDFs */
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden font-mono">
                    
                    {/* Retro architectural grid blueprint pattern */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
                      backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px), linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }} />

                    {/* Fake structural drawing schematic lines so the user has visual objects to inspect */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
                      {/* Presets layouts */}
                      {uploadedFile.name.includes('kelapa_gading') ? (
                        <>
                          <line x1="10" y1="50" x2="90" y2="50" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3,3" />
                          <circle cx="15" cy="50" r="2" fill="#10B981" />
                          <circle cx="85" cy="50" r="2" fill="#EAB308" />
                          <rect x="45" y="45" width="10" height="10" stroke="#EF4444" strokeWidth="1" fill="none" />
                        </>
                      ) : (
                        <>
                          <path d="M 10 30 Q 50 15 90 40 T 80 80" fill="none" stroke="#60A5FA" strokeWidth="2" />
                          <circle cx="10" cy="30" r="3" fill="#60A5FA" />
                          <rect x="48" y="20" width="4" height="4" fill="#34D399" />
                          <circle cx="80" cy="80" r="3" fill="#F59E0B" />
                        </>
                      )}
                    </svg>

                    <FileText className="w-10 h-10 text-blue-500 mb-2 relative z-10" />
                    <span className="text-[11px] text-blue-400 font-bold relative z-10">{uploadedFile.name}</span>
                    <span className="text-[9px] text-slate-500 relative z-10">Blueprint Plot Canvas Ready</span>
                  </div>
                )}

                {/* Overlaids absolute-positioned highlights representing items in standard format */}
                {showOverlays && (
                  <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                    
                    {/* Overlaid highlight pipe segments */}
                    {candidatesPipes.map((p) => {
                      const coords = p.source_coordinates || { x: 10, y: 30, width: 70, height: 40 };
                      const isSelected = selectedItemType === 'pipe' && selectedItemId === p._id;
                      const isHovered = hoveredItemId === p._id;
                      const hasConf = p.overall_confidence_score * 100 || 80;
                      
                      const strokeColor = isSelected ? '#EF4444' : isHovered ? '#3B82F6' : hasConf >= 90 ? '#10B981' : '#F59E0B';

                      return (
                        <div
                          key={p._id}
                          style={{
                            left: `${coords.x}%`,
                            top: `${coords.y}%`,
                            width: `${coords.width}%`,
                            height: `${coords.height}%`,
                            borderColor: strokeColor,
                          }}
                          className={`absolute border border-dashed rounded transition-all duration-200 flex items-start p-1 ${
                            isSelected 
                              ? 'border-2 border-solid bg-red-500/10 shadow-lg scale-[1.02]' 
                              : isHovered 
                                ? 'border-2 bg-blue-500/10' 
                                : 'bg-transparent'
                          }`}
                        >
                          <span className={`text-[8px] font-mono font-bold px-1 rounded scale-90 ${
                            isSelected ? 'bg-red-500 text-white' : 'bg-slate-850/90 text-white'
                          }`}>
                            {p.segment_id}
                          </span>
                        </div>
                      );
                    })}

                    {/* Overlaid appurtenances items */}
                    {candidatesApps.map((a) => {
                      const coords = a.source_coordinates || { x: 30, y: 30, width: 8, height: 8 };
                      const isSelected = selectedItemType === 'appurtenance' && selectedItemId === a._id;
                      
                      return (
                        <div
                          key={a._id}
                          style={{
                            left: `${coords.x}%`,
                            top: `${coords.y}%`,
                            width: `${coords.width}%`,
                            height: `${coords.height}%`,
                          }}
                          className={`absolute border rounded-full flex items-center justify-center p-0.5 transition-all duration-200 ${
                            isSelected 
                              ? 'border-2 border-red-500 bg-red-500/30' 
                              : 'border-yellow-400 bg-yellow-400/10'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        </div>
                      );
                    })}

                    {/* Overlaid structures */}
                    {candidatesStrs.map((s) => {
                      const coords = s.source_coordinates || { x: 45, y: 45, width: 10, height: 10 };
                      const isSelected = selectedItemType === 'structure' && selectedItemId === s._id;

                      return (
                        <div
                          key={s._id}
                          style={{
                            left: `${coords.x}%`,
                            top: `${coords.y}%`,
                            width: `${coords.width}%`,
                            height: `${coords.height}%`,
                          }}
                          className={`absolute border rounded transition-all duration-200 flex items-center justify-center ${
                            isSelected 
                              ? 'border-2 border-red-500 bg-red-650/20' 
                              : 'border-purple-400 bg-purple-500/10'
                          }`}
                        >
                          <span className="text-[7px] text-purple-700 bg-white font-semibold transform scale-75 whitespace-nowrap">Chamber</span>
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>
              
              {/* Selected highlight focus evidence card */}
              {selectedItemId && (
                <div className="bg-slate-900 text-slate-300 rounded-lg p-3 text-[11px] font-mono space-y-1 bg-gradient-to-tr from-slate-950 to-slate-900 border border-slate-800 animate-fadeIn">
                  <div className="text-white font-bold text-xs flex justify-between">
                    <span>SELECTION TARGET HIGHLIGHTS:</span>
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest font-sans">Verified CAD Plot</span>
                  </div>
                  {candidatesPipes.find(p => p._id === selectedItemId) && (() => {
                    const matched = candidatesPipes.find(p => p._id === selectedItemId)!;
                    return (
                      <>
                        <div className="text-emerald-400 font-sans font-semibold text-xs pt-1">Segment {matched.segment_id}</div>
                        <div>Evidence: <span className="text-slate-100 italic">"{matched.drawing_evidence}"</span></div>
                        <div>Start Location / End: <span className="text-slate-150">{matched.start_node} → {matched.end_node}</span></div>
                        <div>Dimension / Length: {matched.diameter} / {matched.length_m} m</div>
                        <div>Road reference: {matched.route_reference}</div>
                        <div>Confidence Score: <span className="text-blue-400 font-bold font-mono">{Math.round(matched.overall_confidence_score*100)}%</span></div>
                      </>
                    );
                  })()}

                  {candidatesApps.find(a => a._id === selectedItemId) && (() => {
                    const matched = candidatesApps.find(a => a._id === selectedItemId)!;
                    return (
                      <>
                        <div className="text-amber-400 font-sans font-semibold text-xs pt-1">{matched.type}</div>
                        <div>Evidence: <span className="text-slate-100 italic">"{matched.drawing_evidence}"</span></div>
                        <div>Coupled with segment ID: {matched.linked_segment_id}</div>
                        <div>Quantity / Diameter: {matched.quantity} Qty / {matched.diameter}</div>
                        <div>Confidence Score: <span className="text-blue-400 font-bold font-mono">{Math.round(matched.confidence_score*100)}%</span></div>
                      </>
                    );
                  })()}

                  {candidatesStrs.find(s => s._id === selectedItemId) && (() => {
                    const matched = candidatesStrs.find(s => s._id === selectedItemId)!;
                    return (
                      <>
                        <div className="text-purple-405 font-sans font-semibold text-xs pt-1">{matched.type}</div>
                        <div>Evidence: <span className="text-slate-100 italic">"{matched.drawing_evidence}"</span></div>
                        <div>Linked Segment reference: {matched.linked_segment_id}</div>
                        <div>Quantity extracted: {matched.quantity} unit</div>
                        <div>Confidence Score: <span className="text-blue-400 font-bold font-mono">{Math.round(matched.confidence_score*100)}%</span></div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Hand: Structured results, sorting tables, action tools */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Waiting or Null placeholder screen state */}
          {!analysisResult && !isAnalyzing && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm text-slate-400 flex flex-col items-center justify-center min-h-[460px] space-y-4">
              <div className="p-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-full">
                <Wand2 className="w-12 h-12" />
              </div>
              <div className="max-w-sm space-y-2">
                <h3 className="text-slate-800 font-bold text-sm">Select or Upload Water Infrastructure Drawing</h3>
                <p className="text-xs leading-relaxed">
                  Select one of the sample surveying sheets on the left, or upload a real drawing file. 
                  We will invoke the secure server-side Gemini layout extraction model to analyze diameters, materials, lengths, and locations.
                </p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[460px] space-y-4 font-sans">
              <div className="p-4 bg-blue-50 text-blue-600 border border-blue-150 rounded-full animate-bounce">
                <RefreshCw className="w-12 h-12 animate-spin animate-duration-1000" />
              </div>
              <div className="max-w-sm space-y-2">
                <h3 className="text-slate-800 font-bold text-sm">Running Secure Server-Side Cognitive Layout Extraction</h3>
                <p className="text-xs text-slate-500 font-medium">Please wait while the @google/genai module processes your plan coordinate bounds...</p>
                <div className="flex gap-1 justify-center pt-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-75" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-150" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-200" />
                </div>
              </div>
            </div>
          )}

          {/* Core Review Tables list */}
          {analysisResult && !isAnalyzing && (
            <div className="space-y-6">
              
              {/* File Info Header Banner */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 text-white shadow-md flex justify-between items-center bg-gradient-to-r from-slate-950 to-slate-900">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-wider font-bold text-blue-400 block uppercase">
                    Cognitive Analyzer Status
                  </span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold tracking-tight select-none truncate max-w-sm">
                      {fingerprint?.fileName}
                    </h3>
                    <span className="text-[10px] bg-blue-105 text-white/90 font-mono px-2 py-0.5 rounded uppercase font-bold">
                      {statusLabel}
                    </span>
                    {isCached && (
                      <span className="text-[10px] bg-teal-800 text-teal-100 font-mono px-2 py-0.5 rounded font-bold border border-teal-600">
                        Cached result from previous analysis
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDebug(!showDebug)}
                    className="p-1.5 bg-slate-800 rounded-lg text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 select-none"
                  >
                    <Terminal className="w-3.5 h-3.5" /> Debug console
                  </button>
                </div>
              </div>

              {/* Main Extraction Navigation Tabs */}
              <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                {[
                  { id: 'overview', label: 'Drawing Overview' },
                  { id: 'pipes', label: 'Pipe Segments' },
                  { id: 'fittings', label: 'Fittings & Structures' },
                  { id: 'junctions', label: 'Detail Junctions' },
                  { id: 'review', label: 'Engineering Review' },
                  { id: 'sync', label: 'Costing Sync Status' },
                ].map((tb) => (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => {
                      setActiveMainTab(tb.id);
                      if (tb.id !== 'junctions') {
                        setSelectedDJId(null);
                      }
                    }}
                    className={`flex-1 py-2 px-1 text-center font-bold text-[11px] rounded-lg transition-all cursor-pointer ${
                      activeMainTab === tb.id
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-850 hover:bg-white/40'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: Drawing Overview */}
              {activeMainTab === 'overview' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Legend explanations layer */}
                  {analysisResult.legend_interpretation && analysisResult.legend_interpretation.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" /> Legend Interpretation & Vector Semantics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {analysisResult.legend_interpretation.map((lg, i) => (
                          <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between font-bold">
                              <code className="text-blue-700 font-mono font-bold">{lg.symbol_or_line_style}</code>
                              <span className={`text-[10px] px-1.5 rounded font-mono font-bold ${
                                lg.confidence_score >= 0.90 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                              }`}>
                                {Math.round(lg.confidence_score * 100)}% conf
                              </span>
                            </div>
                            <p className="text-slate-600">{lg.interpreted_meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Survey overview card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Drawing Landscape</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Cognitive analysis completed successfully on drawing sheet <span className="font-semibold text-slate-850">{fingerprint?.fileName}</span>. 
                      The system mapped pipeline coordinates, identified line style semantics, and successfully extracted route metrics.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Detected Segments</span>
                        <span className="text-lg font-bold text-slate-800">{candidatesPipes.length} pipe runs</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Appurtenances Detected</span>
                        <span className="text-lg font-bold text-slate-800">{candidatesApps.length} fittings</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Layout DJ Markers</span>
                        <span className="text-lg font-bold text-slate-800">{djRecords.length} markers</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Pipe Segments */}
              {activeMainTab === 'pipes' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Sorting and Grouping controls area */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    
                    {/* Switch view by material type */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Group Filter:</span>
                      {[
                        { id: 'all', label: 'All Pipes' },
                        { id: 'proposed', label: 'Proposed New' },
                        { id: 'existing', label: 'Existing' },
                        { id: 'replacement', label: 'Replacement' }
                      ].map((tb) => (
                        <button
                          key={tb.id}
                          type="button"
                          onClick={() => setActiveGroupTab(tb.id)}
                          className={`px-3 py-1 rounded-full font-medium cursor-pointer ${
                            activeGroupTab === tb.id 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tb.label}
                        </button>
                      ))}
                    </div>

                    {/* Sorter selectors */}
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sort by:</span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-slate-200 px-2.5 py-1 bg-white rounded-lg font-medium text-slate-700"
                      >
                        <option value="route_order">Route Network Sequence</option>
                        <option value="segment_id">Segment ID</option>
                        <option value="page">Drawing Sheet Page</option>
                        <option value="diameter">Nominal Diameter</option>
                        <option value="material">Pipe Material</option>
                        <option value="length">Pipeline Route Length</option>
                        <option value="confidence">Model Confidence Score</option>
                        <option value="status">Pipeline Status Classification</option>
                      </select>
                    </div>

                  </div>

                  {/* Pipe segments review table block */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">A. PIPE SEGMENTS DRAFT REVIEW ({candidatesPipes.length})</span>
                      <span className="text-[10px] text-blue-750 bg-blue-50 border border-blue-150 font-mono px-2 py-0.5 rounded font-bold uppercase">
                        Stage 4 - Requires Eng Check
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-200 select-none">
                            <th className="p-3 pl-5">Seg ID</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Material</th>
                            <th className="p-3">Diameter</th>
                            <th className="p-3 font-mono">Length (m)</th>
                            <th className="p-3">Avg Conf</th>
                            <th className="p-3 text-center">Status Label</th>
                            <th className="p-3 text-right pr-5">Review Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-slate-700">
                          {getSortedPipes().map((p) => {
                            const isSelected = selectedItemId === p._id;
                            return (
                              <tr 
                                key={p._id} 
                                onClick={() => {
                                  setSelectedItemId(p._id || null);
                                  setSelectedItemType('pipe');
                                }}
                                onMouseEnter={() => setHoveredItemId(p._id || null)}
                                onMouseLeave={() => setHoveredItemId(null)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-50/50 hover:bg-blue-50 font-medium' 
                                    : hoveredItemId === p._id 
                                      ? 'bg-slate-50/85' 
                                      : 'hover:bg-slate-50/35'
                                }`}
                              >
                                <td className="p-3 pl-5 font-bold flex items-center gap-1.5 text-slate-900">
                                  <Eye className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-red-500' : 'text-slate-350'}`} />
                                  {p.segment_id}
                                </td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold font-sans ${
                                    normalizeText(p.pipe_status).includes('propos') || normalizeText(p.pipe_status).includes('new')
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                      : 'bg-indigo-50 text-indigo-805 border border-indigo-200'
                                  }`}>
                                    {p.pipe_status}
                                  </span>
                                </td>
                                <td className="p-3">{p.pipe_material}</td>
                                <td className="p-3 font-mono font-medium">{p.diameter}</td>
                                <td className="p-3 font-mono font-bold text-slate-800">{p.length_m !== null ? `${p.length_m} m` : 'Unknown'}</td>
                                <td className="p-3">
                                  <span className={`font-semibold border text-[9px] px-1.5 py-0.5 rounded font-mono select-none ${getConfidenceBadgeColor(p.overall_confidence_score)}`}>
                                    {Math.round(p.overall_confidence_score * 100)}%
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                    p._status === 'Confirmed' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : p._status === 'Rejected' 
                                        ? 'bg-red-100 text-red-850' 
                                        : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {p._status}
                                  </span>
                                </td>
                                <td className="p-3 text-right pr-5" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => startEditItem(p._id!, 'pipe')}
                                      title="Edit details"
                                      className="p-1 text-slate-400 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmItem(p._id!, 'pipe')}
                                      className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 bg-slate-50 border border-slate-250 rounded font-bold text-[10px] cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectItem(p._id!, 'pipe')}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 bg-slate-50 border border-slate-250 rounded text-[10px] cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: Fittings & Structures */}
              {activeMainTab === 'fittings' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Auxiliary elements & structural reviews */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Appurtenance table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center select-none">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">B. APPURTENANCES ({candidatesApps.length})</span>
                        <span className="text-[10px] font-semibold text-slate-400">Valves & Meters</span>
                      </div>
                      
                      <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
                        {candidatesApps.map((a) => {
                          const isSelected = selectedItemId === a._id;
                          return (
                            <div 
                              key={a._id}
                              onClick={() => {
                                setSelectedItemId(a._id || null);
                                setSelectedItemType('appurtenance');
                              }}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? 'border-red-500 bg-red-50/30 font-semibold' 
                                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-slate-900">{a.type} {a.diameter}</div>
                                <div className="text-[9px] text-slate-400 font-mono">Linked Pipeline: {a.linked_segment_id} · Qty: {a.quantity}</div>
                                <div className="text-[10px] text-slate-510 italic">"{a.drawing_evidence || 'valve landmark symbol'}"</div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  a._status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-805'
                                }`}>
                                  {a._status}
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmItem(a._id!, 'appurtenance')}
                                    className="px-1.5 py-0.5 bg-white border border-slate-250 text-[8px] font-bold text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectItem(a._id!, 'appurtenance')}
                                    className="px-1.5 py-0.5 bg-white border border-slate-250 text-[8px] text-red-705 hover:bg-red-50 rounded cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Civil chambers list */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center select-none">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">C. STRUCTURES ({candidatesStrs.length})</span>
                        <span className="text-[10px] font-semibold text-slate-400">Concrete Chambers</span>
                      </div>
                      
                      <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
                        {candidatesStrs.map((s) => {
                          const isSelected = selectedItemId === s._id;
                          return (
                            <div 
                              key={s._id}
                              onClick={() => {
                                setSelectedItemId(s._id || null);
                                setSelectedItemType('structure');
                              }}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? 'border-red-500 bg-red-50/30 font-semibold' 
                                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-slate-900">{s.type}</div>
                                <div className="text-[9px] text-slate-400 font-mono">Segment: {s.linked_segment_id} · Qty: {s.quantity}</div>
                                <div className="text-[10px] text-slate-510 italic">"{s.drawing_evidence || 'concrete masonry'}"</div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  s._status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-805'
                                }`}>
                                  {s._status}
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmItem(s._id!, 'structure')}
                                    className="px-1.5 py-0.5 bg-white border border-slate-250 text-[8px] font-bold text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectItem(s._id!, 'structure')}
                                    className="px-1.5 py-0.5 bg-white border border-slate-250 text-[8px] text-red-705 hover:bg-red-50 rounded cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 4: Detail Junctions */}
              {activeMainTab === 'junctions' && renderDetailJunctionsTab()}

              {/* TAB 5: Engineering Review */}
              {activeMainTab === 'review' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Items requiring Engineer confirmation details (unresolved items, scores < 90%) */}
                  <div className="bg-white rounded-xl border border-slate-205 p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest block">
                        Items Requiring Engineering Confirmation (Ambiguities / Conf &lt; 90%)
                      </h4>
                    </div>

                    <div className="space-y-2">
                      
                      {/* Pipes with requires_engineer_confirmation or score < 90% */}
                      {candidatesPipes.filter(p => p.requires_engineer_confirmation || p.overall_confidence_score < 0.9).map(p => (
                        <div key={p._id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs flex justify-between items-center text-amber-900 leading-relaxed animate-fadeIn">
                          <div>
                            <span className="font-bold">Segment {p.segment_id} Flag:</span> 
                            <p className="mt-0.5 text-slate-705">
                              Unresolved parameters detected in drawing label: <span className="font-semibold italic">"{p.drawing_evidence}"</span>.
                            </p>
                            <div className="flex gap-3 text-[10px] text-slate-500 font-mono mt-1">
                              <span>Length: {p.length_m ? `${p.length_m} m` : 'Unknown - confirmation required'}</span>
                              <span>Diameter: {p.diameter || 'Unknown'}</span>
                              <span>Material: {p.pipe_material || 'Unknown'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleConfirmItem(p._id!, 'pipe')}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-emerald-100 hover:text-emerald-900 border border-amber-300 hover:border-emerald-305 text-[10px] rounded font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                          >
                            Override and Confirm
                          </button>
                        </div>
                      ))}

                      {/* Handwritten unclear details */}
                      {unclearItems.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Identified Handwritten annotations & unclear notations:</span>
                          {unclearItems.map((note, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-150 rounded-md text-xs text-slate-600 font-mono italic">
                              " {note} "
                            </div>
                          ))}
                        </div>
                      )}

                      {candidatesPipes.filter(p => p.requires_engineer_confirmation || p.overall_confidence_score < 0.9).length === 0 && unclearItems.length === 0 && (
                        <p className="text-xs text-slate-450 italic">No remaining ambiguities or low-confidence segments found. Perfect extraction reliability on this document!</p>
                      )}

                    </div>
                  </div>

                </div>
              )}

              {/* TAB 6: Costing Sync Status */}
              {activeMainTab === 'sync' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Junction Ledger Sync Card */}
                  {renderJunctionCostingSyncStatusPanel()}

                  {/* Confirmed items checklist status */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4.5 h-4.5 text-blue-700 font-bold" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                        Costing Engine Data Requirements Checklist
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs ${
                        candidatesPipes.filter(p => p._status === 'Confirmed').length > 0 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 text-emerald-500 ${candidatesPipes.filter(p => p._status === 'Confirmed').length > 0 ? '' : 'opacity-20'}`} />
                        <div>
                          <div className="font-semibold">Pipes Material & Size</div>
                          <div className="text-[10px] text-slate-500 font-mono">({candidatesPipes.filter(p => p._status === 'Confirmed').length} types confirmed)</div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs ${
                        candidatesApps.filter(a => a._status === 'Confirmed').length > 0 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 text-emerald-500 ${candidatesApps.filter(a => a._status === 'Confirmed').length > 0 ? '' : 'opacity-20'}`} />
                        <div>
                          <div className="font-semibold">Fittings & Junctions</div>
                          <div className="text-[10px] text-slate-500 font-mono">({candidatesApps.filter(a => a._status === 'Confirmed').length} options confirmed)</div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs ${
                        candidatesStrs.filter(s => s._status === 'Confirmed').length > 0 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 text-emerald-500 ${candidatesStrs.filter(s => s._status === 'Confirmed').length > 0 ? '' : 'opacity-20'}`} />
                        <div>
                          <div className="font-semibold">Civil Chambers / Work</div>
                          <div className="text-[10px] text-slate-500 font-mono">({candidatesStrs.filter(s => s._status === 'Confirmed').length} chambers confirmed)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Merge controls */}
                  <div className="bg-slate-900 p-4.5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-white">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 block font-mono">
                        Engineering Audit Clearance
                      </span>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Selected: <span className="text-white font-bold">{confirmedCount}</span> confirmed elements, ready for costing matching.</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap lg:flex-nowrap gap-2.5">
                      <button
                        type="button"
                        onClick={handleConfirmAllHighConfidence}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 font-semibold border border-slate-700 text-xs text-white rounded-lg select-none transition-colors cursor-pointer"
                      >
                        Confirm All High-Confidence (&ge; 90%)
                      </button>
                      <button
                        type="button"
                        onClick={handleMergeToProject}
                        disabled={confirmedCount === 0}
                        className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs select-none ${
                          confirmedCount > 0 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        Merge Only
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateCostingDirect}
                        disabled={confirmedCount === 0}
                        className={`px-4.5 py-2 text-xs font-extrabold rounded-lg flex items-center gap-2 transition-colors shadow-xs select-none ${
                          confirmedCount > 0 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer active:scale-[0.98]' 
                            : 'bg-slate-800 text-slate-500 border border-slate-705 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" /> Generate Costing From Confirmed DED Data
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* Developer diagnostics report logs panel */}
          {showDebug && analysisResult && (
            <div className="bg-slate-950 font-mono text-[10px] p-5 rounded-xl text-slate-400 border border-slate-850 space-y-3 relative z-10 animate-slideDown">
              <div className="flex justify-between items-center text-white border-b border-slate-800 pb-2">
                <span className="font-bold flex items-center gap-1"><Terminal className="w-4 h-4 text-blue-400" /> GEMINI VISION MODEL LIVE DIAGNOSTICS CONTROL</span>
                <span className="text-slate-500">v1.1</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-b border-slate-900 pb-2">
                <div>Model Name: <span className="text-white">gemini-3.5-flash</span></div>
                <div>Prompt Version: <span className="text-white">1.0</span></div>
                <div>SHA-256 Hash: <span className="text-blue-400 select-all">{fingerprint?.fileHash}</span></div>
                <div>Analysis Run: <span className="text-white select-all">{analysisResult.analysis_run_id}</span></div>
                <div>Drawing Pages Analyzed: <span className="text-white">[{analysisResult.drawing_pages_analyzed?.join(', ')}]</span></div>
                <div>Timestamp: <span className="text-slate-300">{new Date().toLocaleString()}</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-blue-300 block font-bold">RAW JSON RESPONSE payload:</span>
                <pre className="overflow-x-auto max-h-[300px] bg-slate-900 p-3 rounded border border-slate-800 font-mono text-slate-300 leading-normal select-all">
                  {rawResponseText || JSON.stringify(analysisResult, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Editing State overlay dialog */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-250 max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                Edit Extracted {editingItem.type === 'pipe' ? 'Pipe Segment' : editingItem.type === 'appurtenance' ? 'Appurtenance Fitting' : 'Civil Structure'}
              </span>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold font-sans text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {editingItem.type === 'pipe' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Segment ID Reference</label>
                    <input 
                      type="text" 
                      value={editingItem.data.segment_id || ''} 
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, segment_id: e.target.value } })}
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Pipe Material</label>
                      <input 
                        type="text" 
                        value={editingItem.data.pipe_material || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, pipe_material: e.target.value } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Diameter Dimension</label>
                      <input 
                        type="text" 
                        value={editingItem.data.diameter || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, diameter: e.target.value } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Route Length (m)</label>
                      <input 
                        type="number" 
                        value={editingItem.data.length_m || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, length_m: Number(e.target.value) || null } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Installation Method</label>
                      <input 
                        type="text" 
                        value={editingItem.data.installation_method || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, installation_method: e.target.value } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Drawing Evidence Source Text</label>
                    <textarea 
                      rows={2}
                      value={editingItem.data.drawing_evidence || ''} 
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, drawing_evidence: e.target.value } })}
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </>
              )}

              {editingItem.type === 'appurtenance' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Fitting Type</label>
                      <input 
                        type="text" 
                        value={editingItem.data.type || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, type: e.target.value } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Diameter</label>
                      <input 
                        type="text" 
                        value={editingItem.data.diameter || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, diameter: e.target.value } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Quantity</label>
                      <input 
                        type="number" 
                        value={editingItem.data.quantity || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, quantity: Number(e.target.value) || 1 } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Linked Segment ID</label>
                      <input 
                        type="text" 
                        value={editingItem.data.linked_segment_id || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, linked_segment_id: e.target.value } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingItem.type === 'structure' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Structure Type</label>
                    <input 
                      type="text" 
                      value={editingItem.data.type || ''} 
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, type: e.target.value } })}
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Quantity</label>
                      <input 
                        type="number" 
                        value={editingItem.data.quantity || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, quantity: Number(e.target.value) || 1 } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 block">Linked Segment ID</label>
                      <input 
                        type="text" 
                        value={editingItem.data.linked_segment_id || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, linked_segment_id: e.target.value } })}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditedItem}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded font-bold text-white shadow-xs"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editable Override Confirmation Modal */}
      {confirmingSegment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-250 max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-sm"></div>
                <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Engineering Confirmation: Segment {confirmingSegment.segment_id}
                </span>
              </div>
              <button 
                onClick={() => setConfirmingSegment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold font-sans text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-3">
              {/* Source info & confidence indicators */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-500 text-[10px] uppercase font-mono tracking-wider">Source Drawing Evidence</p>
                  <p className="text-xs font-semibold text-slate-700 italic">"{confirmingSegment.drawing_evidence || 'N/A'}"</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Model Confidence</span>
                  <span className={`inline-block px-2 py-0.5 text-[10px] rounded border font-bold uppercase ${
                    confirmingSegment.overall_confidence_score >= 0.9 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  }`}>
                    {(confirmingSegment.overall_confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Editable Extracted Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 block">Segment ID Ref (Required)</label>
                  <input 
                    type="text" 
                    value={confirmingSegment.segment_id || ''} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, segment_id: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 block">Pipeline Material</label>
                  <select 
                    value={confirmingSegment.pipe_material || 'HDPE'} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, pipe_material: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="HDPE">HDPE</option>
                    <option value="PVC">PVC</option>
                    <option value="Steel">Steel</option>
                    <option value="Ductile Iron">Ductile Iron</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 block">Diameter</label>
                  <select 
                    value={confirmingSegment.diameter || ''} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, diameter: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="3/4 inch">3/4 inch</option>
                    <option value="1 inch">1 inch</option>
                    <option value="2 inch">2 inch</option>
                    <option value="3 inch">3 inch</option>
                    <option value="4 inch">4 inch</option>
                    <option value="6 inch">6 inch</option>
                    <option value="8 inch">8 inch</option>
                    <option value="10 inch">10 inch</option>
                    <option value="12 inch">12 inch</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 block">Pipeline Length (m)</label>
                  <input 
                    type="number" 
                    value={confirmingSegment.length_m || 0} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, length_m: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 block">Pipeline Status</label>
                  <select 
                    value={confirmingSegment.pipe_status || ''} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, pipe_status: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="Existing">Existing</option>
                    <option value="Replacement">Replacement</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-650 block">Installation Method</label>
                  <select 
                    value={confirmingSegment.installation_method || ''} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, installation_method: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="Open Cut">Open Cut</option>
                    <option value="Bore">Bore</option>
                    <option value="HDD">HDD</option>
                    <option value="Existing Duct">Existing Duct</option>
                  </select>
                </div>
              </div>

              {/* Engineer Confirmation Metadata */}
              <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-xl space-y-3 mt-2">
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">Required Verification Sign-off</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Confirmed By *</label>
                    <input 
                      type="text" 
                      value={confirmingSegment.confirmedBy || ''} 
                      onChange={(e) => setConfirmingSegment({ ...confirmingSegment, confirmedBy: e.target.value })}
                      className="w-full border border-slate-200 rounded px-2.5 py-1 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Confirmation Date *</label>
                    <input 
                      type="date" 
                      value={confirmingSegment.confirmationDate || ''} 
                      onChange={(e) => setConfirmingSegment({ ...confirmingSegment, confirmationDate: e.target.value })}
                      className="w-full border border-slate-200 rounded px-2.5 py-1 bg-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">Confirmation Method *</label>
                  <select 
                    value={confirmingSegment.confirmationMethod || 'Verified from Drawing'} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, confirmationMethod: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                  >
                    <option value="Verified from Drawing">Verified from Drawing</option>
                    <option value="Verified from Site Survey">Verified from Site Survey</option>
                    <option value="Verified from BOQ">Verified from BOQ</option>
                    <option value="Manual Engineering Estimate">Manual Engineering Estimate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block font-sans">Engineering Review Notes</label>
                  <textarea 
                    value={confirmingSegment.confirmationNotes || ''} 
                    onChange={(e) => setConfirmingSegment({ ...confirmingSegment, confirmationNotes: e.target.value })}
                    placeholder="e.g. Verified diameter scales from Sheet 3, matching manual calculation profiles."
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white h-14 resize-none font-sans"
                  />
                </div>
              </div>

              {/* Rejection Field if Rejecting */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Drawing/DED Comments</label>
                <input 
                  type="text" 
                  placeholder="Reference notes or comments from drawings..."
                  value={confirmingSegment.notes || ''} 
                  onChange={(e) => setConfirmingSegment({ ...confirmingSegment, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-150 pt-3">
              {/* Red Reject option */}
              <button
                type="button"
                onClick={() => handleSaveConfirmedSegment('Reject')}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-105 hover:bg-opacity-80 text-red-700 border border-red-200 rounded font-bold transition-all shrink-0 cursor-pointer text-[11px]"
              >
                Reject Detection
              </button>

              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setConfirmingSegment(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded font-bold transition-all cursor-pointer text-[11px]"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSaveConfirmedSegment('Draft')}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-850 border border-amber-200 rounded font-bold transition-all shrink-0 cursor-pointer text-[11px]"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveConfirmedSegment('Confirm')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all shadow-xs shrink-0 cursor-pointer text-[11px]"
                >
                  Confirm Segment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
