import { Project, BOQItem, RAPItem, BOMItem } from '../types';

export interface ProjectRatios {
  totalPipelineLength: number;
  totalPipeSegments: number;
  totalBOQWorkItems: number;
  totalValves: number;
  totalChambers: number;
  totalServiceConnections: number;
  plannedDuration: number;
  plannedInstallationRate: number;

  poValue: number;
  totalRAPCost: number;
  estimatedProfit: number;
  estimatedProfitMargin: number;
  rapCostPerMeter: number;
  materialCostPerMeter: number;
  labourCostPerMeter: number;
  equipmentCostPerMeter: number;
  vehicleRetributionCostPerMeter: number;
  plannedDailyCost: number;
  labourCostPercentage: number;
  materialCostPercentage: number;
  equipmentCostPercentage: number;
  vehicleRetributionCostPercentage: number;

  totalLabourCost: number;
  totalMaterialCost: number;
  totalEquipmentCost: number;
  totalVehicleRetributionCost: number;

  // Civil work ratios
  hasExcavation: boolean;
  excavationVolume: number;
  excavationCost: number;
  excavationCostPerM3: number;

  hasBackfill: boolean;
  backfillVolume: number;
  backfillCost: number;
  backfillCostPerM3: number;

  hasAsphalt: boolean;
  asphaltArea: number;
  asphaltCost: number;
  asphaltCostPerM2: number;

  hasConcrete: boolean;
  concreteArea: number;
  concreteCost: number;
  concreteCostPerM2: number;
}

export function calculateProjectRatios(
  project: Project,
  boqItems: BOQItem[],
  rapItems: RAPItem[],
  bomItems: BOMItem[] = []
): ProjectRatios {
  // 1. Pipeline scales
  const totalPipelineLength = project.pipeSegments ? project.pipeSegments.reduce((sum, s) => sum + s.lengthM, 0) : 0;
  const totalPipeSegments = project.pipeSegments ? project.pipeSegments.length : 0;
  const totalBOQWorkItems = boqItems ? boqItems.length : 0;

  const totalValves = project.appurtenances
    ? project.appurtenances
        .filter((a) => a.type.toLowerCase().includes('valve'))
        .reduce((sum, a) => sum + a.quantity, 0)
    : 0;

  const totalChambers = project.structures
    ? project.structures
        .filter((s) => s.type.toLowerCase().includes('chamber') || s.type.toLowerCase().includes('manhole'))
        .reduce((sum, s) => sum + s.quantity, 0)
    : 0;

  const totalServiceConnections = project.appurtenances
    ? project.appurtenances
        .filter((a) => a.type === 'Service Connection' || a.type === 'Water Meter')
        .reduce((sum, a) => sum + a.quantity, 0)
    : 0;

  const plannedDuration = project.plannedDuration || 30; // standard default
  const plannedInstallationRate = plannedDuration > 0 ? totalPipelineLength / plannedDuration : 0;

  // 2. Financial breakdowns
  const poValue = project.poValue || 0;
  const totalRAPCost = rapItems ? rapItems.reduce((sum, item) => sum + item.totalCost, 0) : 0;
  const estimatedProfit = poValue - totalRAPCost;
  const estimatedProfitMargin = poValue > 0 ? (estimatedProfit / poValue) * 100 : 0;

  // Resource breakdowns
  let totalLabourCost = 0;
  let totalMaterialCost = 0;
  let totalEquipmentCost = 0;

  if (rapItems && rapItems.length > 0) {
    rapItems.forEach((item) => {
      totalLabourCost += (item.labourCost || 0) * (item.quantity || 0);
      totalMaterialCost += (item.materialCost || 0) * (item.quantity || 0);
      totalEquipmentCost += (item.equipmentCost || 0) * (item.quantity || 0);
    });
  }

  // Calculate Total Vehicle Retribution from RAP, BOQ, or BOM
  const totalVehicleRetributionCost = rapItems && rapItems.length > 0
    ? rapItems.reduce((sum, item) => sum + (item.vehicleRetributionFee || 0), 0)
    : boqItems && boqItems.length > 0
    ? boqItems.reduce((sum, item) => sum + (item.manualOverrideCost || ((item.trips || 0) * (item.costPerTrip || 0))), 0)
    : bomItems && bomItems.length > 0
    ? bomItems
        .filter((item) => item.projectId === project.id)
        .reduce((sum, item) => sum + (item.vehicleRetributionCost || 0), 0)
    : totalMaterialCost * 0.05;

  // Project ratios
  const rapCostPerMeter = totalPipelineLength > 0 ? totalRAPCost / totalPipelineLength : 0;
  const materialCostPerMeter = totalPipelineLength > 0 ? totalMaterialCost / totalPipelineLength : 0;
  const labourCostPerMeter = totalPipelineLength > 0 ? totalLabourCost / totalPipelineLength : 0;
  const equipmentCostPerMeter = totalPipelineLength > 0 ? totalEquipmentCost / totalPipelineLength : 0;
  const vehicleRetributionCostPerMeter = totalPipelineLength > 0 ? totalVehicleRetributionCost / totalPipelineLength : 0;

  const plannedDailyCost = plannedDuration > 0 ? totalRAPCost / plannedDuration : 0;

  const labourCostPercentage = totalRAPCost > 0 ? (totalLabourCost / totalRAPCost) * 100 : 0;
  const materialCostPercentage = totalRAPCost > 0 ? (totalMaterialCost / totalRAPCost) * 100 : 0;
  const equipmentCostPercentage = totalRAPCost > 0 ? (totalEquipmentCost / totalRAPCost) * 100 : 0;
  const vehicleRetributionCostPercentage = totalRAPCost > 0 ? (totalVehicleRetributionCost / totalRAPCost) * 100 : 0;

  // Civil Work sub-calculations
  // Excavation
  const excavationBOQs = boqItems
    ? boqItems.filter((b) => b.itemCode.startsWith('BOQ-E') || b.description.toLowerCase().includes('excavation'))
    : [];
  const excavationVolume = excavationBOQs.reduce((sum, b) => sum + b.quantity, 0);
  const excavationCost = rapItems
    ? rapItems
        .filter((r) => excavationBOQs.some((b) => b.itemCode === r.boqRef))
        .reduce((sum, r) => sum + r.totalCost, 0)
    : 0;
  const excavationCostPerM3 = excavationVolume > 0 ? excavationCost / excavationVolume : 0;

  // Backfill
  const backfillBOQs = boqItems
    ? boqItems.filter(
        (b) =>
          b.description.toLowerCase().includes('sand bedding') ||
          b.description.toLowerCase().includes('backfill') ||
          b.description.toLowerCase().includes('compaction')
      )
    : [];
  const backfillVolume = backfillBOQs.reduce((sum, b) => sum + b.quantity, 0);
  const backfillCost = rapItems
    ? rapItems
        .filter((r) => backfillBOQs.some((b) => b.itemCode === r.boqRef))
        .reduce((sum, r) => sum + r.totalCost, 0)
    : 0;
  const backfillCostPerM3 = backfillVolume > 0 ? backfillCost / backfillVolume : 0;

  // Asphalt Restoration
  const asphaltBOQs = boqItems
    ? boqItems.filter((b) => b.description.toLowerCase().includes('asphalt'))
    : [];
  const asphaltArea = asphaltBOQs.reduce((sum, b) => sum + b.quantity, 0);
  const asphaltCost = rapItems
    ? rapItems
        .filter((r) => asphaltBOQs.some((b) => b.itemCode === r.boqRef))
        .reduce((sum, r) => sum + r.totalCost, 0)
    : 0;
  const asphaltCostPerM2 = asphaltArea > 0 ? asphaltCost / asphaltArea : 0;

  // Concrete Restoration
  const concreteBOQs = boqItems
    ? boqItems.filter(
        (b) =>
          b.description.toLowerCase().includes('concrete') &&
          !b.description.toLowerCase().includes('pipe') &&
          (b.unit.toLowerCase() === 'm2' || b.unit.toLowerCase() === 'm3' || b.description.toLowerCase().includes('restore') || b.description.toLowerCase().includes('reinstatement'))
      )
    : [];
  const concreteArea = concreteBOQs.reduce((sum, b) => sum + b.quantity, 0);
  const concreteCost = rapItems
    ? rapItems
        .filter((r) => concreteBOQs.some((b) => b.itemCode === r.boqRef))
        .reduce((sum, r) => sum + r.totalCost, 0)
    : 0;
  const concreteCostPerM2 = concreteArea > 0 ? concreteCost / concreteArea : 0;

  return {
    totalPipelineLength,
    totalPipeSegments,
    totalBOQWorkItems,
    totalValves,
    totalChambers,
    totalServiceConnections,
    plannedDuration,
    plannedInstallationRate,
    poValue,
    totalRAPCost,
    estimatedProfit,
    estimatedProfitMargin,
    rapCostPerMeter,
    materialCostPerMeter,
    labourCostPerMeter,
    equipmentCostPerMeter,
    vehicleRetributionCostPerMeter,
    plannedDailyCost,
    labourCostPercentage,
    materialCostPercentage,
    equipmentCostPercentage,
    vehicleRetributionCostPercentage,

    totalLabourCost,
    totalMaterialCost,
    totalEquipmentCost,
    totalVehicleRetributionCost,

    hasExcavation: excavationVolume > 0,
    excavationVolume,
    excavationCost,
    excavationCostPerM3,

    hasBackfill: backfillVolume > 0,
    backfillVolume,
    backfillCost,
    backfillCostPerM3,

    hasAsphalt: asphaltArea > 0,
    asphaltArea,
    asphaltCost,
    asphaltCostPerM2,

    hasConcrete: concreteArea > 0,
    concreteArea,
    concreteCost,
    concreteCostPerM2,
  };
}
