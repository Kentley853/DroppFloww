/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaterialMaster, LabourMaster, EquipmentMaster, AHSPMaster, Project, BOQItem, AHSPResourceItem } from './types';

// Raw Initial Data
export const INITIAL_MATERIALS: MaterialMaster[] = [
  {
    materialCode: 'M.01',
    description: 'HDPE Pipe OD 90mm (3 inch) PN 10',
    unit: 'meter',
    category: 'Pipe Line',
    supplier: 'PT Wavin Indonesia',
    currentPrice: 95000,
    historicalPrice: 92000,
    lastUpdated: '2026-05-15',
  },
  {
    materialCode: 'M.02',
    description: 'PVC Pipe AW Class 8 inch',
    unit: 'meter',
    category: 'Pipe Line',
    supplier: 'PT Sunrise Steel & Pipe',
    currentPrice: 350000,
    historicalPrice: 345000,
    lastUpdated: '2026-06-01',
  },
  {
    materialCode: 'M.03',
    description: 'Sand for Bedding and Backfill',
    unit: 'm3',
    category: 'Earthworks',
    supplier: 'Lokal Supplier Merapi',
    currentPrice: 200000,
    historicalPrice: 190000,
    lastUpdated: '2026-04-10',
  },
  {
    materialCode: 'M.04',
    description: 'Asphalt Mix (Hotmix Base)',
    unit: 'ton',
    category: 'Pavement Reinstatement',
    supplier: 'PT Jasa Marga Tollroad Maintenance',
    currentPrice: 1800000,
    historicalPrice: 1750000,
    lastUpdated: '2026-06-10',
  },
  {
    materialCode: 'M.05',
    description: 'Concrete ReadyMix K-250',
    unit: 'm3',
    category: 'Civil Structure',
    supplier: 'PT Adhimix Precast',
    currentPrice: 1100000,
    historicalPrice: 1080000,
    lastUpdated: '2026-05-20',
  },
  {
    materialCode: 'M.06',
    description: 'PE Warning Tape Blue (Water Line)',
    unit: 'meter',
    category: 'Safety Accessory',
    supplier: 'PT Safety Utama',
    currentPrice: 5000,
    historicalPrice: 4800,
    lastUpdated: '2026-02-18',
  },
  {
    materialCode: 'M.07',
    description: 'Gate Valve CI Flanged End 3 inch',
    unit: 'pcs',
    category: 'Appurtenance',
    supplier: 'PT Toyo Valves Indonesia',
    currentPrice: 1200000,
    historicalPrice: 1150000,
    lastUpdated: '2026-05-30',
  },
  {
    materialCode: 'M.08',
    description: 'Digital Water Meter Brass 1/2 inch',
    unit: 'pcs',
    category: 'Appurtenance',
    supplier: 'PT Meterindo Agung',
    currentPrice: 350000,
    historicalPrice: 340000,
    lastUpdated: '2026-06-05',
  },
  {
    materialCode: 'M.09',
    description: 'Pipe Fitting Flanged Socket 3 inch HDPE',
    unit: 'set',
    category: 'Pipe Line Connection',
    supplier: 'PT Tunas Abadi',
    currentPrice: 150000,
    historicalPrice: 145000,
    lastUpdated: '2026-05-12',
  },
  {
    materialCode: 'M.10',
    description: 'EPDM Gasket Bolt and Nuts set 8 inch PVC',
    unit: 'pcs',
    category: 'Pipe Line Connection',
    supplier: 'PT Karya Makmur',
    currentPrice: 80000,
    historicalPrice: 75000,
    lastUpdated: '2026-05-25',
  }
];

export const INITIAL_LABOUR: LabourMaster[] = [
  {
    labourCode: 'L.01',
    description: 'Pekerja (Common Laborer)',
    unit: 'OH (Man-Day)',
    dailyRate: 150000,
  },
  {
    labourCode: 'L.02',
    description: 'Tukang (Civil Mason)',
    unit: 'OH (Man-Day)',
    dailyRate: 180000,
  },
  {
    labourCode: 'L.03',
    description: 'Tukang Pipa (Pipe Fitter)',
    unit: 'OH (Man-Day)',
    dailyRate: 200000,
  },
  {
    labourCode: 'L.04',
    description: 'Kepala Tukang (Fitter Lead)',
    unit: 'OH (Man-Day)',
    dailyRate: 210000,
  },
  {
    labourCode: 'L.05',
    description: 'Mandor (Site Foreman)',
    unit: 'OH (Man-Day)',
    dailyRate: 220000,
  }
];

export const INITIAL_EQUIPMENT: EquipmentMaster[] = [
  {
    equipmentCode: 'E.01',
    description: 'Excavator 0.8 m3 Rental',
    unit: 'Shift (8-Hour)',
    rentalRate: 3500000,
  },
  {
    equipmentCode: 'E.02',
    description: 'Pneumatic Jack Hammer',
    unit: 'Shift (8-Hour)',
    rentalRate: 400000,
  },
  {
    equipmentCode: 'E.03',
    description: 'Centrifugal Water Pump 3 inch',
    unit: 'Shift (8-Hour)',
    rentalRate: 250000,
  },
  {
    equipmentCode: 'E.04',
    description: 'Tamping Rammer Compactor',
    unit: 'Shift (8-Hour)',
    rentalRate: 500000,
  },
  {
    equipmentCode: 'E.05',
    description: 'Welding Generator Machine',
    unit: 'Shift (8-Hour)',
    rentalRate: 300000,
  }
];

export const INITIAL_AHSP_TEMPLATES: Omit<AHSPMaster, 'calculatedUnitPrice'>[] = [
  {
    ahspCode: 'AHSP-01',
    description: 'Excavation in normal soil by laborer (depth up to 1 meter)',
    unit: 'm3',
    resources: [
      { code: 'L.01', type: 'Labour', coefficient: 0.75 },
      { code: 'L.05', type: 'Labour', coefficient: 0.025 },
      { code: 'E.02', type: 'Equipment', coefficient: 0.05 },
    ],
  },
  {
    ahspCode: 'AHSP-02',
    description: 'Sand Bedding including compaction (per m3)',
    unit: 'm3',
    resources: [
      { code: 'L.01', type: 'Labour', coefficient: 0.30 },
      { code: 'M.03', type: 'Material', coefficient: 1.20 },
      { code: 'E.04', type: 'Equipment', coefficient: 0.10 },
    ],
  },
  {
    ahspCode: 'AHSP-03',
    description: 'Supply and installation of 3 inch HDPE pipe (Open Cut)',
    unit: 'meter',
    resources: [
      { code: 'L.03', type: 'Labour', coefficient: 0.15 },
      { code: 'L.01', type: 'Labour', coefficient: 0.25 },
      { code: 'M.01', type: 'Material', coefficient: 1.05 },
      { code: 'M.09', type: 'Material', coefficient: 0.10 },
    ],
  },
  {
    ahspCode: 'AHSP-04',
    description: 'Supply and installation of 8 inch PVC AW pipe',
    unit: 'meter',
    resources: [
      { code: 'L.03', type: 'Labour', coefficient: 0.25 },
      { code: 'L.01', type: 'Labour', coefficient: 0.40 },
      { code: 'M.02', type: 'Material', coefficient: 1.05 },
      { code: 'M.10', type: 'Material', coefficient: 0.20 },
      { code: 'E.01', type: 'Equipment', coefficient: 0.02 },
    ],
  },
  {
    ahspCode: 'AHSP-05',
    description: 'Asphalt reinstatement with tamping rammer',
    unit: 'm2',
    resources: [
      { code: 'L.01', type: 'Labour', coefficient: 0.50 },
      { code: 'M.04', type: 'Material', coefficient: 0.12 },
      { code: 'E.04', type: 'Equipment', coefficient: 0.05 },
    ],
  },
  {
    ahspCode: 'AHSP-06',
    description: 'Bore crossing and HDD service pipeline under main road',
    unit: 'meter',
    resources: [
      { code: 'L.03', type: 'Labour', coefficient: 0.50 },
      { code: 'L.01', type: 'Labour', coefficient: 1.00 },
      { code: 'E.01', type: 'Equipment', coefficient: 0.10 },
    ],
  },
  {
    ahspCode: 'AHSP-07',
    description: 'Installation of 3 inch Flanged Gate Valve',
    unit: 'pcs',
    resources: [
      { code: 'L.03', type: 'Labour', coefficient: 2.00 },
      { code: 'M.07', type: 'Material', coefficient: 1.00 },
      { code: 'M.09', type: 'Material', coefficient: 2.00 },
    ],
  },
  {
    ahspCode: 'AHSP-08',
    description: 'Installation of 1/2 inch Water Meter',
    unit: 'pcs',
    resources: [
      { code: 'L.03', type: 'Labour', coefficient: 1.00 },
      { code: 'M.08', type: 'Material', coefficient: 1.00 },
    ],
  },
  {
    ahspCode: 'AHSP-09',
    description: 'Valve chamber masonry and concrete construction',
    unit: 'unit',
    resources: [
      { code: 'L.02', type: 'Labour', coefficient: 3.00 },
      { code: 'L.01', type: 'Labour', coefficient: 5.00 },
      { code: 'M.05', type: 'Material', coefficient: 1.50 },
      { code: 'M.10', type: 'Material', coefficient: 1.00 },
    ],
  }
];

// Recalculates single AHSP item value
export function computeAHSPUnitPrice(
  ahsp: Omit<AHSPMaster, 'calculatedUnitPrice'>,
  materials: MaterialMaster[],
  labours: LabourMaster[],
  equipments: EquipmentMaster[]
): number {
  let cost = 0;
  ahsp.resources.forEach((resource) => {
    if (resource.type === 'Material') {
      const match = materials.find((m) => m.materialCode === resource.code);
      if (match) cost += match.currentPrice * resource.coefficient;
    } else if (resource.type === 'Labour') {
      const match = labours.find((l) => l.labourCode === resource.code);
      if (match) cost += match.dailyRate * resource.coefficient;
    } else if (resource.type === 'Equipment') {
      const match = equipments.find((e) => e.equipmentCode === resource.code);
      if (match) cost += match.rentalRate * resource.coefficient;
    }
  });
  return Math.round(cost);
}

// Builds whole hydrated AHSPMaster array
export function getHydratedAHSPs(
  materials: MaterialMaster[],
  labours: LabourMaster[],
  equipments: EquipmentMaster[]
): AHSPMaster[] {
  return INITIAL_AHSP_TEMPLATES.map((tpl) => {
    return {
      ...tpl,
      calculatedUnitPrice: computeAHSPUnitPrice(tpl, materials, labours, equipments),
    };
  });
}

// Detailed calculation of elements for single AHSP resource breakdown (to build RAP Item)
export interface CostBreakdown {
  labourCost: number;
  materialCost: number;
  equipmentCost: number;
}

export function computeAHSPBreakdown(
  resources: { code: string; type: 'Labour' | 'Material' | 'Equipment'; coefficient: number }[],
  materials: MaterialMaster[],
  labours: LabourMaster[],
  equipments: EquipmentMaster[]
): CostBreakdown {
  let labour = 0;
  let material = 0;
  let equip = 0;

  resources.forEach((resource) => {
    if (resource.type === 'Material') {
      const match = materials.find((m) => m.materialCode === resource.code);
      if (match) material += match.currentPrice * resource.coefficient;
    } else if (resource.type === 'Labour') {
      const match = labours.find((l) => l.labourCode === resource.code);
      if (match) labour += match.dailyRate * resource.coefficient;
    } else if (resource.type === 'Equipment') {
      const match = equipments.find((e) => e.equipmentCode === resource.code);
      if (match) equip += match.rentalRate * resource.coefficient;
    }
  });

  return {
    labourCost: Math.round(labour),
    materialCost: Math.round(material),
    equipmentCost: Math.round(equip),
  };
}

// Default Seed Project
export const SEED_PROJECTS: Project[] = [
  {
    id: 'PRJ-2026-001',
    name: 'Kelapa Gading Trunk Main Pipe Replacement',
    client: 'PAM JAYA (Regional Jakarta Utara)',
    location: 'Jl. Kelapa Gading Raya, Block C-D, North Jakarta',
    projectType: 'Trunk Main Pipeline',
    surveyDate: '2026-06-12',
    surveyEngineer: 'Ir. Ahmad Subagja',
    poValue: 1250000000,
    status: 'Draft',
    plannedDuration: 45,
    pipeSegments: [
      {
        id: 'seg-1',
        segmentId: 'S-01',
        pipeMaterial: 'PVC',
        diameter: '8 inch',
        lengthM: 850,
        installationMethod: 'Open Cut',
        groundCondition: 'Normal Soil',
        surfaceType: 'Asphalt',
        notes: 'Main distribution replacement under asphalt roadway.',
      },
      {
        id: 'seg-2',
        segmentId: 'S-02',
        pipeMaterial: 'HDPE',
        diameter: '3 inch',
        lengthM: 350,
        installationMethod: 'Open Cut',
        groundCondition: 'Hard Soil',
        surfaceType: 'Concrete',
        notes: 'Infill connecting loop under concrete sidewalk.',
      },
      {
        id: 'seg-3',
        segmentId: 'S-03',
        pipeMaterial: 'HDPE',
        diameter: '3 inch',
        lengthM: 45,
        installationMethod: 'Bore',
        groundCondition: 'Hard Soil',
        surfaceType: 'Paving Block',
        notes: 'Service road crossing near crossing junction.',
      }
    ],
    appurtenances: [
      {
        id: 'app-1',
        type: 'Gate Valve',
        diameter: '3 inch',
        quantity: 3,
        linkedSegment: 'S-02',
        notes: 'Isolation valves for zone partition.',
      },
      {
        id: 'app-2',
        type: 'Water Meter',
        diameter: '1/2 inch',
        quantity: 12,
        linkedSegment: 'S-03',
        notes: 'DMA bulk tap indicators for individual households.',
      }
    ],
    structures: [
      {
        id: 'str-1',
        type: 'Valve Chamber',
        quantity: 2,
        linkedSegment: 'S-02',
        notes: 'Standard brick masonry with cast iron cover.',
      }
    ],
    unclearItems: [
      'Survey notebook page 4 handwriting near crossing point has blurred offset notation of length (estimated 45m or 54m). Checked manually as 45m.'
    ],
    lastUpdated: '2026-06-17T00:39:15-07:00'
  }
];

// Helper to auto-generate draft BOQ items from project survey datasets
export function generateBOQsFromProject(project: Project): BOQItem[] {
  const items: BOQItem[] = [];

  // 1. Pipe Supply & Installation Items
  // Group segments by Material + Diameter + Installation
  const pipeGroups: { [key: string]: { length: number; material: string; diameter: string; installation: string; ground: string; surface: string } } = {};
  
  project.pipeSegments.forEach((seg) => {
    const key = `${seg.pipeMaterial}-${seg.diameter}-${seg.installationMethod}`;
    if (!pipeGroups[key]) {
      pipeGroups[key] = {
        length: 0,
        material: seg.pipeMaterial,
        diameter: seg.diameter,
        installation: seg.installationMethod,
        ground: seg.groundCondition,
        surface: seg.surfaceType,
      };
    }
    pipeGroups[key].length += seg.lengthM;
  });

  let counter = 1;

  Object.values(pipeGroups).forEach((gp) => {
    const itemCode = `BOQ-P-${String(counter++).padStart(3, '0')}`;
    let ahspCode = '';
    
    // Auto matching logic rule
    if (gp.material === 'HDPE' && gp.diameter === '3 inch') {
      ahspCode = 'AHSP-03';
    } else if (gp.material === 'PVC' && gp.diameter === '8 inch') {
      ahspCode = 'AHSP-04';
    } else if (gp.installation === 'Bore' || gp.installation === 'HDD') {
      ahspCode = 'AHSP-06';
    }

    items.push({
      id: `boq-${project.id}-${itemCode}`,
      itemCode,
      description: `Pipe laying & installation of ${gp.material} ${gp.diameter} (Jointing details, pressure testing & mobilization inclusive, Method: ${gp.installation})`,
      quantity: gp.length,
      unit: 'meter',
      source: 'Auto Generated',
      ahspStatus: ahspCode ? 'Matched' : 'Unmatched',
      ahspCode: ahspCode,
      notes: `Generated from pipe segment list. ground: ${gp.ground}, surface: ${gp.surface}`,
      pipeMaterial: gp.material,
      diameter: gp.diameter,
      installationMethod: gp.installation,
      surfaceType: gp.surface,
    });
  });

  // 2. Earthworks: Excavation & Bedding automatically calculated
  let totalOpenCutLength = project.pipeSegments
    .filter((s) => s.installationMethod === 'Open Cut')
    .reduce((sum, s) => sum + s.lengthM, 0);

  if (totalOpenCutLength > 0) {
    // Estimations: Assume avg depth 1.2m, width 0.6m -> Volume = length * 1.2 * 0.6 = length * 0.72 m3
    const excavationVol = Math.round(totalOpenCutLength * 0.72);
    // Sand bedding: avg 10cm depth -> Volume = length * 0.1 * 0.6 = length * 0.06 m3
    const sandVol = Math.round(totalOpenCutLength * 0.06);

    const bqExcavationCode = `BOQ-E-001`;
    items.push({
      id: `boq-${project.id}-${bqExcavationCode}`,
      itemCode: bqExcavationCode,
      description: `Excavation of trench in normal soil for pipeline (depth up to 1.2m)`,
      quantity: excavationVol,
      unit: 'm3',
      source: 'Auto Generated',
      ahspStatus: 'Matched',
      ahspCode: 'AHSP-01',
      notes: `Calculated standard excavation multiplier on open-cut pipelines length (${totalOpenCutLength}m)`,
    });

    const bqSandCode = `BOQ-E-002`;
    items.push({
      id: `boq-${project.id}-${bqSandCode}`,
      itemCode: bqSandCode,
      description: `In-situ sand bedding and leveling layer for pipeline protection`,
      quantity: sandVol,
      unit: 'm3',
      source: 'Auto Generated',
      ahspStatus: 'Matched',
      ahspCode: 'AHSP-02',
      notes: `Calculated standard bedding layer multiplier on open-cut pipelines length (${totalOpenCutLength}m)`,
    });
  }

  // 3. Surface Reinstatements
  const asphaltLength = project.pipeSegments
    .filter((s) => s.installationMethod === 'Open Cut' && s.surfaceType === 'Asphalt')
    .reduce((sum, s) => sum + s.lengthM, 0);

  if (asphaltLength > 0) {
    // Width is approx 0.8 meter of asphalt cut width
    const asphaltArea = Math.round(asphaltLength * 0.8);
    
    const bqAsphaltCode = `BOQ-R-001`;
    items.push({
      id: `boq-${project.id}-${bqAsphaltCode}`,
      itemCode: bqAsphaltCode,
      description: `Asphalt pavement reinstatement (thickness 5cm with proper compacting)`,
      quantity: asphaltArea,
      unit: 'm2',
      source: 'Auto Generated',
      ahspStatus: 'Matched',
      ahspCode: 'AHSP-05',
      notes: `Calculated pavement reinstatement for asphalt surface pipelines (${asphaltLength}m)`,
    });
  }

  // 4. Appurtenance quantities
  // Group appurtenances by type
  const appGroups: { [key: string]: { quantity: number; diameter: string } } = {};
  project.appurtenances.forEach((app) => {
    const key = `${app.type}-${app.diameter}`;
    if (!appGroups[key]) {
      appGroups[key] = { quantity: 0, diameter: app.diameter };
    }
    appGroups[key].quantity += app.quantity;
  });

  let appCounter = 1;
  Object.entries(appGroups).forEach(([typeDiam, info]) => {
    const [type] = typeDiam.split('-');
    const itemCode = `BOQ-A-${String(appCounter++).padStart(3, '0')}`;
    let ahspCode = '';
    
    if (type === 'Gate Valve') {
      ahspCode = 'AHSP-07';
    } else if (type === 'Water Meter') {
      ahspCode = 'AHSP-08';
    }

    items.push({
      id: `boq-${project.id}-${itemCode}`,
      itemCode,
      description: `Supply and installation of ${type} ${info.diameter} (including flanges, accessories)`,
      quantity: info.quantity,
      unit: 'pcs',
      source: 'Auto Generated',
      ahspStatus: ahspCode ? 'Matched' : 'Unmatched',
      ahspCode: ahspCode,
      notes: `Linked directly to appurtenances dataset.`,
    });
  });

  // 5. Structures quantities
  const strGroups: { [key: string]: number } = {};
  project.structures.forEach((str) => {
    strGroups[str.type] = (strGroups[str.type] || 0) + str.quantity;
  });

  let strCounter = 1;
  Object.entries(strGroups).forEach(([type, qty]) => {
    const itemCode = `BOQ-S-${String(strCounter++).padStart(3, '0')}`;
    let ahspCode = '';
    if (type === 'Valve Chamber') {
      ahspCode = 'AHSP-09';
    }

    items.push({
      id: `boq-${project.id}-${itemCode}`,
      itemCode,
      description: `Construction of standard structural ${type} with reinforced concrete cover`,
      quantity: qty,
      unit: 'unit',
      source: 'Auto Generated',
      ahspStatus: ahspCode ? 'Matched' : 'Unmatched',
      ahspCode: ahspCode,
      notes: `Linked directly to structural design features.`,
    });
  });

  return items;
}
