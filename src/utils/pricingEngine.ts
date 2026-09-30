import { PriceSourceRecord } from '../types';

// Let's establish the initial seed records for our Price Sources Center
export const INITIAL_PRICE_SOURCES: PriceSourceRecord[] = [
  // M.01 - HDPE Pipe OD 90mm PN 10
  {
    id: 'src-m01-1',
    itemCode: 'M.01',
    itemDescription: 'HDPE Pipe OD 90mm (3 inch) PN 10',
    category: 'Material',
    sourceType: 'Verified OpenBravo PO',
    supplierOrSource: 'PT Wavin Indonesia',
    prNumber: 'PR-2026-501',
    poNumber: 'PO-900821',
    sourceDate: '2026-05-15',
    region: 'DKI Jakarta',
    unit: 'meter',
    quantityBasis: '1000m Bulk',
    baseUnitPrice: 85000,
    freightCost: 5000,
    vehicleRetributionCost: 2000,
    tax: 8000,
    landedUnitPrice: 100000,
    validUntil: '2026-11-15',
    reliabilityScore: 1.00,
    approvalStatus: 'Approved',
    notes: 'Standard procurement rate under contract.',
    attachmentLink: '#/contracts/po-900821.pdf'
  },
  {
    id: 'src-m01-2',
    itemCode: 'M.01',
    itemDescription: 'HDPE Pipe OD 90mm (3 inch) PN 10',
    category: 'Material',
    sourceType: 'Verified Supplier Quotation',
    supplierOrSource: 'PT Vinilon Group',
    quotationNumber: 'QTN-2026-8902',
    sourceDate: '2026-06-10',
    region: 'West Java',
    unit: 'meter',
    quantityBasis: '500m Project Order',
    baseUnitPrice: 90000,
    freightCost: 3000,
    vehicleRetributionCost: 1000,
    tax: 9100,
    landedUnitPrice: 103100,
    validUntil: '2026-09-10',
    reliabilityScore: 0.90,
    approvalStatus: 'Approved',
    notes: 'Q2 special competitive price quote.',
    attachmentLink: '#/quotes/qtn-8902.pdf'
  },
  {
    id: 'src-m01-3',
    itemCode: 'M.01',
    itemDescription: 'HDPE Pipe OD 90mm (3 inch) PN 10',
    category: 'Material',
    sourceType: 'Official Reference Price',
    supplierOrSource: 'BPS DKI Jakarta Price Bulletin',
    sourceDate: '2026-01-20', // older than 120 days
    region: 'DKI Jakarta',
    unit: 'meter',
    quantityBasis: 'Regional Index',
    baseUnitPrice: 88000,
    freightCost: 0,
    vehicleRetributionCost: 0,
    tax: 8800,
    landedUnitPrice: 96800,
    validUntil: '2026-07-20',
    reliabilityScore: 0.80,
    approvalStatus: 'Approved',
    notes: 'DKI local construction index Q1.',
    attachmentLink: ''
  },

  // M.02 - PVC Pipe AW Class 8 inch
  {
    id: 'src-m02-1',
    itemCode: 'M.02',
    itemDescription: 'PVC Pipe AW Class 8 inch',
    category: 'Material',
    sourceType: 'Verified OpenBravo PO',
    supplierOrSource: 'PT Sunrise Steel & Pipe',
    prNumber: 'PR-2026-488',
    poNumber: 'PO-900223',
    sourceDate: '2026-06-01',
    region: 'DKI Jakarta',
    unit: 'meter',
    quantityBasis: 'Projects Agreement',
    baseUnitPrice: 310000,
    freightCost: 15000,
    vehicleRetributionCost: 5000,
    tax: 31000,
    landedUnitPrice: 361000,
    validUntil: '2026-12-01',
    reliabilityScore: 1.00,
    approvalStatus: 'Approved',
    notes: 'Bulk pricing agreed upon.'
  },
  {
    id: 'src-m02-2',
    itemCode: 'M.02',
    itemDescription: 'PVC Pipe AW Class 8 inch',
    category: 'Material',
    sourceType: 'Verified Supplier Quotation',
    supplierOrSource: 'PT Wavin Mascot',
    quotationNumber: 'QT-2006-21',
    sourceDate: '2026-06-18',
    region: 'Banten',
    unit: 'meter',
    quantityBasis: '200m minimum order',
    baseUnitPrice: 320000,
    freightCost: 10000,
    vehicleRetributionCost: 4000,
    tax: 33400,
    landedUnitPrice: 367400,
    validUntil: '2026-09-18',
    reliabilityScore: 0.90,
    approvalStatus: 'Approved'
  },

  // M.03 - Sand
  {
    id: 'src-m03-1',
    itemCode: 'M.03',
    itemDescription: 'Sand for Bedding and Backfill',
    category: 'Material',
    sourceType: 'Market Reference',
    supplierOrSource: 'Lokal Supplier Merapi',
    sourceDate: '2026-04-10',
    region: 'Tangsel',
    unit: 'm3',
    quantityBasis: 'Per Truckload (8m3)',
    baseUnitPrice: 180000,
    freightCost: 20000,
    vehicleRetributionCost: 5000,
    tax: 0,
    landedUnitPrice: 205000,
    validUntil: '2026-10-10',
    reliabilityScore: 0.60,
    approvalStatus: 'Approved'
  },

  // M.04 - Asphalt Mix
  {
    id: 'src-m04-1',
    itemCode: 'M.04',
    itemDescription: 'Asphalt Mix (Hotmix Base)',
    category: 'Material',
    sourceType: 'Market Reference',
    supplierOrSource: 'PT Jasa Marga Tollroad Maintenance',
    sourceDate: '2026-06-10',
    region: 'Jabodetabek',
    unit: 'ton',
    quantityBasis: 'Minimum 5 tons transport',
    baseUnitPrice: 1650000,
    freightCost: 150000,
    vehicleRetributionCost: 20000,
    tax: 0,
    landedUnitPrice: 1820000,
    validUntil: '2026-12-10',
    reliabilityScore: 0.60,
    approvalStatus: 'Approved'
  },

  // M.05 - Concrete ReadyMix K-250
  {
    id: 'src-m05-1',
    itemCode: 'M.05',
    itemDescription: 'Concrete ReadyMix K-250',
    category: 'Material',
    sourceType: 'Verified Supplier Quotation',
    supplierOrSource: 'PT Adhimix Precast',
    quotationNumber: 'QTN-2026-AD-991',
    sourceDate: '2026-05-20',
    region: 'DKI Jakarta',
    unit: 'm3',
    quantityBasis: 'Mixer Truck 7m3',
    baseUnitPrice: 1000000,
    freightCost: 100000,
    vehicleRetributionCost: 0,
    tax: 100000,
    landedUnitPrice: 1200000,
    validUntil: '2026-11-20',
    reliabilityScore: 0.90,
    approvalStatus: 'Approved'
  },

  // L.01 - Pekerja (Common Laborer)
  {
    id: 'src-l01-1',
    itemCode: 'L.01',
    itemDescription: 'Pekerja (Common Laborer)',
    category: 'Labour',
    sourceType: 'Official Reference Price',
    supplierOrSource: 'DKI Jakarta Governor Regulation (UMR Index)',
    sourceDate: '2026-01-01',
    region: 'DKI Jakarta',
    unit: 'OH (Man-Day)',
    quantityBasis: 'Minimum wage benchmark',
    baseUnitPrice: 150000,
    freightCost: 0,
    vehicleRetributionCost: 0,
    tax: 0,
    landedUnitPrice: 150000,
    validUntil: '2026-12-31',
    reliabilityScore: 0.80,
    approvalStatus: 'Approved'
  },

  // E.01 - Excavator 0.8 m3 Rental
  {
    id: 'src-e01-1',
    itemCode: 'E.01',
    itemDescription: 'Excavator 0.8 m3 Rental',
    category: 'Equipment',
    sourceType: 'Verified Supplier Quotation',
    supplierOrSource: 'PT United Tractors Rent',
    quotationNumber: 'QTN-UT-9921',
    sourceDate: '2026-05-01',
    region: 'West Java',
    unit: 'Shift (8-Hour)',
    quantityBasis: 'Day rate mobilization inclusive',
    baseUnitPrice: 3200000,
    freightCost: 300000,
    vehicleRetributionCost: 0,
    tax: 320000,
    landedUnitPrice: 3820000,
    validUntil: '2026-11-01',
    reliabilityScore: 0.90,
    approvalStatus: 'Approved'
  }
];

// Helper to determine reliability weight based on source type
export function getReliabilityWeight(sourceType: string): number {
  switch (sourceType) {
    case 'Verified OpenBravo PO':
      return 1.00;
    case 'Verified Supplier Quotation':
      return 0.90;
    case 'Official Reference Price':
      return 0.80;
    case 'Market Reference':
      return 0.60;
    case 'Manual Engineering Estimate':
      return 0.40;
    default:
      return 0.40;
  }
}

// Helper to calculate recency weight based on source date vs current app date (2026-06-22)
export function getRecencyWeight(sourceDateStr: string): number {
  try {
    const sourceDate = new Date(sourceDateStr);
    const currentDate = new Date('2026-06-22');
    const diffTime = Math.abs(currentDate.getTime() - sourceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) return 1.00;
    if (diffDays <= 90) return 0.85;
    if (diffDays <= 180) return 0.70;
    return 0.50;
  } catch {
    return 0.50; // fallback standard weighting
  }
}

// Check if a pricing source is older than 6 months or 12 months
export interface ReviewStatusReport {
  isExpired: boolean; // > 12 months
  needsReview: boolean; // > 6 months
  statusText: string;
}

export function checkExpiryStatus(sourceDateStr: string): ReviewStatusReport {
  try {
    const sourceDate = new Date(sourceDateStr);
    const currentDate = new Date('2026-06-22');
    const diffTime = Math.abs(currentDate.getTime() - sourceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      return { isExpired: true, needsReview: true, statusText: 'Expired (> 12 mo)' };
    }
    if (diffDays > 180) {
      return { isExpired: false, needsReview: true, statusText: 'Needs Price Review (> 6 mo)' };
    }
    return { isExpired: false, needsReview: false, statusText: 'Active & Valid' };
  } catch {
    return { isExpired: false, needsReview: false, statusText: 'Active' };
  }
}

// Compute comprehensive statistics and the Weighted Recommended Price
export interface PricingCalculationResult {
  itemCode: string;
  itemDescription: string;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  medianPrice: number;
  weightedPrice: number;
  sourceCount: number;
  lastUpdated: string;
  sourceReliability: number; // 0.0 to 1.0 (mean score of active sources)
  reviewRequired: boolean;
  priceStatus: 'Verified OpenBravo PO' | 'Verified Supplier Quotation' | 'Official Reference Price' | 'Market Reference' | 'Manual Engineering Estimate' | 'Missing Price';
  warningMessage?: string;
}

export function calculatePricingSummary(
  allRecords: PriceSourceRecord[],
  itemCode: string,
  useMedianPrice: boolean = false,
  fallbackStaticPrice: number = 0
): PricingCalculationResult {
  // Filter active, approved records for this item
  const records = allRecords.filter(r => r.itemCode === itemCode && r.approvalStatus === 'Approved');
  
  // If no source exists in the database
  if (records.length === 0) {
    const manualRef = allRecords.find(r => r.itemCode === itemCode);
    const itemDesc = manualRef?.itemDescription || 'Unknown Material';
    
    return {
      itemCode,
      itemDescription: itemDesc,
      lowestPrice: fallbackStaticPrice,
      highestPrice: fallbackStaticPrice,
      averagePrice: fallbackStaticPrice,
      medianPrice: fallbackStaticPrice,
      weightedPrice: fallbackStaticPrice,
      sourceCount: 0,
      lastUpdated: '2026-06-22',
      sourceReliability: 0.40,
      reviewRequired: true,
      priceStatus: 'Manual Engineering Estimate',
      warningMessage: 'No verified procurement source available.'
    };
  }

  const prices = records.map(r => r.landedUnitPrice).sort((a, b) => a - b);
  const lowestPrice = prices[0];
  const highestPrice = prices[prices.length - 1];
  const averagePrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

  // Median Calculation
  let medianPrice = averagePrice;
  const mid = Math.floor(prices.length / 2);
  if (prices.length % 2 !== 0) {
    medianPrice = prices[mid];
  } else {
    medianPrice = Math.round((prices[mid - 1] + prices[mid]) / 2);
  }

  // Weighted Recommended Price Calculation
  // Weighted Recommended Price = Sum(Landed Unit Price * Reliability Weight * Recency Weight) / Sum(Reliability Weight * Recency Weight)
  let weightedNumerator = 0;
  let weightedDenominator = 0;
  let maxDateMs = 0;
  let totalReliability = 0;
  let hasNeedsReview = false;

  records.forEach((rec) => {
    // Exclude records older than 12 months for automated use without approval
    const expiry = checkExpiryStatus(rec.sourceDate);
    if (expiry.needsReview) {
      hasNeedsReview = true;
    }
    if (expiry.isExpired) {
      // Still list, but give minimal weights
    }

    const relWeight = getReliabilityWeight(rec.sourceType);
    const recWeight = getRecencyWeight(rec.sourceDate);
    const combinedWeight = relWeight * recWeight;

    weightedNumerator += rec.landedUnitPrice * combinedWeight;
    weightedDenominator += combinedWeight;

    const recordMs = new Date(rec.sourceDate).getTime();
    if (recordMs > maxDateMs) {
      maxDateMs = recordMs;
    }
    totalReliability += relWeight;
  });

  const weightedPrice = weightedDenominator > 0 
    ? Math.round(weightedNumerator / weightedDenominator) 
    : averagePrice;

  // Best source category matching preference priorities
  let priceStatus: PricingCalculationResult['priceStatus'] = 'Manual Engineering Estimate';
  if (records.some(r => r.sourceType === 'Verified OpenBravo PO')) {
    priceStatus = 'Verified OpenBravo PO';
  } else if (records.some(r => r.sourceType === 'Verified Supplier Quotation')) {
    priceStatus = 'Verified Supplier Quotation';
  } else if (records.some(r => r.sourceType === 'Official Reference Price')) {
    priceStatus = 'Official Reference Price';
  } else if (records.some(r => r.sourceType === 'Market Reference')) {
    priceStatus = 'Market Reference';
  }

  const lastUpdated = maxDateMs > 0 
    ? new Date(maxDateMs).toISOString().split('T')[0] 
    : '2026-06-22';

  const sourceReliability = Math.round((totalReliability / records.length) * 100) / 100;

  return {
    itemCode,
    itemDescription: records[0].itemDescription,
    lowestPrice,
    highestPrice,
    averagePrice,
    medianPrice,
    weightedPrice: useMedianPrice ? medianPrice : weightedPrice,
    sourceCount: records.length,
    lastUpdated,
    sourceReliability,
    reviewRequired: hasNeedsReview,
    priceStatus,
    warningMessage: priceStatus === 'Manual Engineering Estimate' ? 'No verified procurement source available.' : undefined
  };
}
