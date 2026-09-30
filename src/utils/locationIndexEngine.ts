import { LocationIndexProfile, PriceSourceRecord } from '../types';

/**
 * Resolves the most specific approved active Location Index Profile from the hierarchy:
 * Project-Specific Index -> City / Regency Index -> Province Index -> National Baseline Index
 */
export function resolveLocationIndex(
  profiles: LocationIndexProfile[],
  projectLocation: { province?: string; cityRegency?: string; projectAreaSiteName?: string },
  effectiveDate?: string
): LocationIndexProfile | null {
  const activeProfiles = profiles.filter(p => p.status === 'Approved');
  
  const targetDate = effectiveDate ? new Date(effectiveDate) : new Date();

  const isWithinDate = (p: LocationIndexProfile) => {
    if (!p.effectiveFrom || !p.effectiveUntil) return true;
    const from = new Date(p.effectiveFrom);
    const until = new Date(p.effectiveUntil);
    return targetDate >= from && targetDate <= until;
  };

  const candidateProfiles = activeProfiles.filter(isWithinDate);

  // 1. Project Area Specific
  if (projectLocation.projectAreaSiteName) {
    const matched = candidateProfiles.find(
      p => p.scope === 'Project' && 
      p.projectArea?.toLowerCase() === projectLocation.projectAreaSiteName?.toLowerCase() &&
      p.cityRegency?.toLowerCase() === projectLocation.cityRegency?.toLowerCase() &&
      p.province.toLowerCase() === projectLocation.province?.toLowerCase()
    );
    if (matched) return matched;
  }

  // 2. City / Regency Specific
  if (projectLocation.cityRegency) {
    const matched = candidateProfiles.find(
      p => p.scope === 'City' && 
      p.cityRegency?.toLowerCase() === projectLocation.cityRegency?.toLowerCase() &&
      p.province.toLowerCase() === projectLocation.province?.toLowerCase()
    );
    if (matched) return matched;
  }

  // 3. Province Specific
  if (projectLocation.province) {
    const matched = candidateProfiles.find(
      p => p.scope === 'Province' && 
      p.province.toLowerCase() === projectLocation.province?.toLowerCase()
    );
    if (matched) return matched;
  }

  // 4. National Baseline
  const national = candidateProfiles.find(p => p.scope === 'National');
  if (national) return national;

  return null;
}

export interface LocationAdjustedOutput {
  baseUnitPrice: number;
  locationMultiplier: number;
  locationAdjustedUnitPrice: number;
  locationAdjustmentAmount: number;
  freightAmount: number;
  vehicleRetributionAmount: number;
  finalLandedUnitPrice: number;
  explanation: string;
  appliedProfileId?: string;
  appliedProfileVersion?: number;
  transportMethod: 'Direct Freight Quote' | 'Vehicle Trip Calculation' | 'Location Logistics Index' | 'None';
  warningMessage?: string;
}

/**
 * Calculates the final costing values based on the resolved Location Index Profile and category-specific rules.
 */
export function calculateLocationAdjustedCost(params: {
  baseUnitPrice: number;
  costCategory: 'Material' | 'Labour' | 'Equipment' | string;
  priceBasis?: string;
  deliveryIncluded?: 'Yes' | 'No';
  locationIndexProfile?: LocationIndexProfile | null;
  directFreight?: number;
  vehicleRetribution?: number;
  manualOverride?: number;
  transportMethodSelection?: 'Direct Freight' | 'Vehicle Trip' | 'Location Index' | 'None';
  multiplyRetributionWithIndex?: boolean;
}): LocationAdjustedOutput {
  const {
    baseUnitPrice,
    costCategory,
    priceBasis = 'Ex-Warehouse Price',
    deliveryIncluded = 'No',
    locationIndexProfile,
    directFreight = 0,
    vehicleRetribution = 0,
    manualOverride,
    transportMethodSelection = 'Location Index',
    multiplyRetributionWithIndex = false,
  } = params;

  // If there's a manual override, that bypasses index logic
  if (manualOverride !== undefined && manualOverride > 0) {
    return {
      baseUnitPrice,
      locationMultiplier: 1.0,
      locationAdjustedUnitPrice: manualOverride,
      locationAdjustmentAmount: manualOverride - baseUnitPrice,
      freightAmount: 0,
      vehicleRetributionAmount: 0,
      finalLandedUnitPrice: manualOverride,
      explanation: `Manual pricing override applied: Rp${manualOverride.toLocaleString()}`,
      appliedProfileId: undefined,
      appliedProfileVersion: undefined,
      transportMethod: 'None',
    };
  }

  // Defaults
  let multiplier = 1.0;
  let explanation = 'No index applied.';
  let warningMessage: string | undefined;

  // Check if profile exists and is approved
  const profileValid = locationIndexProfile && locationIndexProfile.status === 'Approved';

  if (!profileValid) {
    warningMessage = 'Missing Approved Location Index — Baseline Price Retained';
    explanation = 'Baseline index of 1.000 applied (No approved index matched or profile not configured).';
  } else if (locationIndexProfile) {
    const isMaterial = costCategory.toLowerCase() === 'material';
    const isLabour = costCategory.toLowerCase() === 'labour';
    const isEquipment = costCategory.toLowerCase() === 'equipment';

    if (isLabour) {
      multiplier = locationIndexProfile.labourIndex;
      explanation = `Labour index of ${multiplier.toFixed(3)} applied from profile "${locationIndexProfile.id}" (v${locationIndexProfile.version}).`;
    } else if (isEquipment) {
      multiplier = locationIndexProfile.equipmentIndex;
      explanation = `Equipment index of ${multiplier.toFixed(3)} applied from profile "${locationIndexProfile.id}" (v${locationIndexProfile.version}).`;
    } else if (isMaterial) {
      // Material Index eligibility rules:
      // Apply ONLY when the price source is base-city, ex-warehouse, national, or manual estimate without delivery.
      const isEligibleBasis = [
        'Ex-Warehouse Price',
        'Base City Reference Price',
        'National Master Price',
        'Manual Engineering Estimate'
      ].includes(priceBasis);

      const alreadyDelivered = deliveryIncluded === 'Yes' || priceBasis === 'Local Delivered Price' || priceBasis === 'Supplier Quotation' || priceBasis === 'OpenBravo PO History';

      if (isEligibleBasis && !alreadyDelivered) {
        multiplier = locationIndexProfile.materialIndex;
        explanation = `Material index of ${multiplier.toFixed(3)} applied for basis "${priceBasis}" from profile "${locationIndexProfile.id}" (v${locationIndexProfile.version}).`;
      } else {
        multiplier = 1.0;
        explanation = `Material index NOT applied. Reason: Price is already delivered/local or includes logistics (Basis: ${priceBasis}, Delivery Included: ${deliveryIncluded}).`;
      }
    }
  }

  const locationAdjustedUnitPrice = Math.round(baseUnitPrice * multiplier);
  const locationAdjustmentAmount = locationAdjustedUnitPrice - baseUnitPrice;

  // Logistics / Freight calculations
  let freightAmount = 0;
  let transportMethod: LocationAdjustedOutput['transportMethod'] = 'None';

  if (costCategory.toLowerCase() === 'material') {
    // Determine transport method: only one can be active at a time
    if (transportMethodSelection === 'Direct Freight' && directFreight > 0) {
      freightAmount = directFreight;
      transportMethod = 'Direct Freight Quote';
    } else if (transportMethodSelection === 'Vehicle Trip') {
      // Handled outside this function or passed as directFreight
      freightAmount = directFreight;
      transportMethod = 'Vehicle Trip Calculation';
    } else if (transportMethodSelection === 'Location Index' && profileValid && locationIndexProfile) {
      // Calculate logistics based on transportIndex multiplier * baseUnitPrice
      const transportMult = locationIndexProfile.transportIndex - 1.0; // Index 1.15 means +15% of base price
      freightAmount = transportMult > 0 ? Math.round(baseUnitPrice * transportMult) : 0;
      transportMethod = 'Location Logistics Index';
    }
  }

  // Vehicle Retribution cost
  let retributionMultiplier = 1.0;
  if (multiplyRetributionWithIndex && profileValid && locationIndexProfile && costCategory.toLowerCase() === 'material') {
    retributionMultiplier = locationIndexProfile.materialIndex;
  }
  const vehicleRetributionAmount = Math.round(vehicleRetribution * retributionMultiplier);

  const finalLandedUnitPrice = locationAdjustedUnitPrice + freightAmount + vehicleRetributionAmount;

  return {
    baseUnitPrice,
    locationMultiplier: multiplier,
    locationAdjustedUnitPrice,
    locationAdjustmentAmount,
    freightAmount,
    vehicleRetributionAmount,
    finalLandedUnitPrice,
    explanation,
    appliedProfileId: locationIndexProfile?.id,
    appliedProfileVersion: locationIndexProfile?.version,
    transportMethod,
    warningMessage,
  };
}

export const INITIAL_LOCATION_PROFILES: LocationIndexProfile[] = [
  {
    id: 'idx-national',
    scope: 'National',
    province: 'National',
    materialIndex: 1.000,
    labourIndex: 1.000,
    equipmentIndex: 1.000,
    transportIndex: 1.000,
    effectiveFrom: '2026-01-01',
    effectiveUntil: '2026-12-31',
    sourceReference: 'National Baseline standard',
    approvedBy: 'BPM Admin',
    approvalDate: '2026-01-01',
    status: 'Approved',
    notes: 'Approved standard baseline index with no adjustment (1.000).',
    version: 1
  },
  {
    id: 'idx-jakarta',
    scope: 'Province',
    province: 'DKI Jakarta',
    materialIndex: 1.000,
    labourIndex: 1.000,
    equipmentIndex: 1.000,
    transportIndex: 1.000,
    effectiveFrom: '2026-01-01',
    effectiveUntil: '2026-12-31',
    sourceReference: 'DKI Standard Price Index',
    approvedBy: 'Siti Aminah',
    approvalDate: '2026-01-10',
    status: 'Approved',
    notes: 'Approved standard baseline for DKI Jakarta Area.',
    version: 1
  },
  {
    id: 'idx-bandung',
    scope: 'City',
    province: 'West Java',
    cityRegency: 'Bandung',
    materialIndex: 1.080,
    labourIndex: 0.950,
    equipmentIndex: 1.020,
    transportIndex: 1.100,
    effectiveFrom: '2026-01-01',
    effectiveUntil: '2026-12-31',
    sourceReference: 'West Java Price Bulletin 2026',
    approvedBy: 'Eko Wijaya',
    approvalDate: '2026-02-15',
    status: 'Approved',
    notes: 'Bandung regional adjustment profile.',
    version: 1
  },
  {
    id: 'idx-papua',
    scope: 'Project',
    province: 'Papua',
    cityRegency: 'Jayapura',
    projectArea: 'District X',
    materialIndex: 1.350,
    labourIndex: 1.200,
    equipmentIndex: 1.250,
    transportIndex: 1.400,
    effectiveFrom: '2026-01-01',
    effectiveUntil: '2026-12-31',
    sourceReference: 'Papua SPAM Special Estimate',
    approvedBy: 'Bambang Pratama',
    approvalDate: '2026-03-20',
    status: 'Approved',
    notes: 'Project-specific high altitude/remote access profile for Jayapura District X SPAM project.',
    version: 1
  },
  {
    id: 'idx-papua-draft',
    scope: 'Province',
    province: 'Papua',
    materialIndex: 1.400,
    labourIndex: 1.250,
    equipmentIndex: 1.300,
    transportIndex: 1.500,
    effectiveFrom: '2026-06-01',
    effectiveUntil: '2026-12-31',
    sourceReference: 'Papua Regional Survey Draft',
    status: 'Draft',
    notes: 'Draft index for Papua province pending BPM audit.',
    version: 1
  }
];
