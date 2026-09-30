/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PipeSegment {
  id: string;
  segmentId: string;
  pipeMaterial: 'HDPE' | 'PVC' | 'Steel' | 'Ductile Iron';
  diameter: '1/2 inch' | '3/4 inch' | '1 inch' | '2 inch' | '3 inch' | '4 inch' | '6 inch' | '8 inch' | '10 inch' | '12 inch';
  lengthM: number;
  installationMethod: 'Open Cut' | 'Bore' | 'HDD' | 'Existing Duct';
  groundCondition: 'Normal Soil' | 'Hard Soil' | 'Rock' | 'Groundwater';
  surfaceType: 'Asphalt' | 'Concrete' | 'Paving Block' | 'Unpaved';
  notes: string;
  confidenceScore?: number;
  requiresConfirmation?: boolean;
  isApproved?: boolean;
}

export interface Appurtenance {
  id: string;
  type: 'Gate Valve' | 'Air Valve' | 'Washout' | 'Reducer' | 'Tee' | 'Bend' | 'Coupling' | 'Water Meter' | 'Service Connection';
  diameter: string;
  quantity: number;
  linkedSegment: string;
  notes: string;
  confidenceScore?: number;
  requiresConfirmation?: boolean;
  isApproved?: boolean;
}

export interface Structure {
  id: string;
  type: 'Valve Chamber' | 'Meter Chamber' | 'Manhole' | 'Thrust Block' | 'Other Civil Structure';
  quantity: number;
  linkedSegment: string;
  notes: string;
  confidenceScore?: number;
  requiresConfirmation?: boolean;
  isApproved?: boolean;
}

export interface CostingIssue {
  id: string;
  sourceEntityId: string;
  itemLabel: string;
  itemType: 'Pipe Segment' | 'Appurtenance' | 'Civil Structure';
  issueType: string;
  missingFields: string[];
  status: string;
  blockingCosting: boolean;
  rawObject: any;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  projectType: string;
  surveyDate: string;
  surveyEngineer: string;
  poValue: number;
  status: 'Draft' | 'Engineer Reviewed' | 'BOQ Approved' | 'RAP Approved' | 'Management Approved';
  pipeSegments: PipeSegment[];
  appurtenances: Appurtenance[];
  structures: Structure[];
  unclearItems?: string[];
  costingIssues?: CostingIssue[];
  notes?: string;
  lastUpdated: string;
  plannedDuration?: number;
  aiDrawingAnalysis?: any;
  detailJunctionCostingState?: any;

  // New Location Hierarchy and settings fields
  country?: string;
  province?: string;
  cityRegency?: string;
  district?: string;
  projectAreaSiteName?: string;
  remoteAreaFlag?: 'Yes' | 'No';
  defaultCostingLocation?: string;
  effectiveCostingDate?: string;
  appliedLocationIndexId?: string;
}

export interface BOMItem {
  id: string;
  projectId: string;
  materialCode: string;
  description: string;
  category: string;
  linkedBOQRef: string;
  linkedBOQDesc: string;
  ahspCode: string;
  requiredQuantity: number;
  wasteAllowance: number; // as percentage, e.g. 5 for 5%
  finalRequiredQuantity: number;
  unit: string;
  unitPrice: number;
  materialCost: number;
  vehicleRetributionCost: number;
  finalLandedCost: number;
  supplier: string;
  procurementStatus: 'Draft' | 'Procurement Review Required' | 'Sourced' | 'Purchased';
  notes: string;
  importStatus?: string; // Confirmed AI Scan or Manual Survey
  
  // Vehicle Retribution properties
  vehicleType?: string;
  trips?: number;
  costPerTrip?: number;
  manualOverrideCost?: number;
  permitRefNum?: string;
  permitStatus?: 'Not Required' | 'Estimated' | 'Submitted' | 'Approved' | 'Paid' | 'Expired';
}

export interface BOQItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  source: 'Manual' | 'AI Extracted' | 'Auto Generated' | 'Excel Upload';
  ahspStatus: 'Matched' | 'Unmatched' | 'Needs Review';
  ahspCode: string;
  notes: string;
  importStatus?: string; // Confirmed AI Scan or Manual Survey
  
  // Optional extra parameters from Excel mapping or pipe generator
  pipeMaterial?: string;
  diameter?: string;
  installationMethod?: string;
  surfaceType?: string;
  segmentId?: string;
  location?: string;
  groundCondition?: string;

  // Vehicle Retribution properties
  vehicleType?: string;
  trips?: number;
  costPerTrip?: number;
  manualOverrideCost?: number;
  permitRefNum?: string;
  permitStatus?: 'Not Required' | 'Estimated' | 'Submitted' | 'Approved' | 'Paid' | 'Expired';
  vehicleRetributionFee?: number;
}

export interface RAPItem {
  id: string;
  rapItemCode: string;
  boqRef: string; // references boq ID or main code
  description: string;
  quantity: number;
  unit: string;
  labourCost: number;
  materialCost: number;
  equipmentCost: number;
  unitCost: number;
  totalCost: number;
  ahspReference: string;
  notes: string;

  // Vehicle Retribution properties
  vehicleType?: string;
  trips?: number;
  costPerTrip?: number;
  manualOverrideCost?: number;
  permitRefNum?: string;
  permitStatus?: 'Not Required' | 'Estimated' | 'Submitted' | 'Approved' | 'Paid' | 'Expired';
  vehicleRetributionFee?: number;

  // Location Index fields
  baseUnitPrice?: number;
  locationMultiplier?: number;
  locationAdjustedUnitPrice?: number;
  locationIndexProfileId?: string;
  locationIndexVersion?: number;
  locationAdjustmentAmount?: number;
  freightAmount?: number;
  vehicleRetributionAmount?: number;
  finalLandedUnitPrice?: number;
  locationIndexSource?: string;
  overrideReason?: string;
  overrideUser?: string;
  overrideDate?: string;
}

export interface MaterialMaster {
  materialCode: string;
  description: string;
  unit: string;
  category: string;
  supplier: string;
  currentPrice: number;
  historicalPrice: number;
  lastUpdated: string;
}

export interface LabourMaster {
  labourCode: string;
  description: string;
  unit: string;
  dailyRate: number;
}

export interface EquipmentMaster {
  equipmentCode: string;
  description: string;
  unit: string;
  rentalRate: number;
}

export interface AHSPResourceItem {
  code: string; // references MaterialMaster, LabourMaster, or EquipmentMaster code
  type: 'Labour' | 'Material' | 'Equipment';
  coefficient: number;
}

export interface AHSPMaster {
  ahspCode: string;
  description: string;
  unit: string;
  resources: AHSPResourceItem[];
  calculatedUnitPrice: number; // dynamically computed
  customLabour?: number;
  customMaterial?: number;
  customEquipment?: number;
  customUnitPrice?: number;
}

export interface AuditLog {
  id: string;
  projectId: string;
  operator: string;
  details: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface PriceSourceRecord {
  id: string;
  itemCode: string;
  itemDescription: string;
  category: 'Material' | 'Labour' | 'Equipment' | string;
  sourceType: 'Verified OpenBravo PO' | 'Verified Supplier Quotation' | 'Official Reference Price' | 'Market Reference' | 'Manual Engineering Estimate' | 'Missing Price';
  supplierOrSource: string;
  prNumber?: string;
  poNumber?: string;
  quotationNumber?: string;
  sourceDate: string;
  region: string;
  unit: string;
  quantityBasis: string;
  baseUnitPrice: number;
  freightCost: number;
  vehicleRetributionCost: number;
  tax: number;
  landedUnitPrice: number;
  validUntil: string;
  reliabilityScore: number; // 0.0 to 1.0
  approvalStatus: 'Draft' | 'Approved' | 'Archived';
  notes?: string;
  attachmentLink?: string;

  // New Price Source Location Fields
  priceLocation?: string;
  priceBasis?: string;
  deliveryIncluded?: 'Yes' | 'No';
  priceValidityDate?: string;
  supplierSource?: string;
  freightIncluded?: 'Yes' | 'No';
  locationIndexEligible?: 'Yes' | 'No';
  appliedLocationIndex?: string;
  adjustedUnitPrice?: number;
  adjustmentExplanation?: string;
}

export interface CostingSummary {
  processed: number;
  boqCount: number;
  bomCount: number;
  ahspCount: number;
  reviewCount: number;
  rapCount: number;
  blockedCount: number;
}

export interface LocationIndexProfile {
  id: string; // Index ID
  scope: 'National' | 'Province' | 'City' | 'Project';
  province: string;
  cityRegency?: string;
  projectArea?: string;
  materialIndex: number;
  labourIndex: number;
  equipmentIndex: number;
  transportIndex: number; // Transport/Logistics Index
  effectiveFrom: string;
  effectiveUntil: string;
  sourceReference: string;
  approvedBy?: string;
  approvalDate?: string;
  status: 'Draft' | 'Approved' | 'Expired' | 'Rejected';
  notes?: string;
  version: number;
}

export interface LocationAdjustmentAuditLog {
  id: string;
  projectId: string;
  timestamp: string;
  action: string;
  operator: string;
  previousValue?: string;
  newValue?: string;
}

export interface FileMetadata {
  projectId: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  drawingHash: string;
  analysisRunId?: string;
}


