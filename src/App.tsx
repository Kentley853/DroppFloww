/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Project, 
  BOQItem, 
  RAPItem, 
  MaterialMaster, 
  LabourMaster, 
  EquipmentMaster, 
  AHSPMaster, 
  AuditLog,
  PipeSegment,
  Appurtenance,
  Structure,
  BOMItem,
  PriceSourceRecord,
  CostingIssue,
  CostingSummary,
  LocationIndexProfile,
  FileMetadata
} from './types';
import { 
  SEED_PROJECTS, 
  INITIAL_MATERIALS, 
  INITIAL_LABOUR, 
  INITIAL_EQUIPMENT, 
  getHydratedAHSPs, 
  computeAHSPBreakdown, 
  generateBOQsFromProject 
} from './mockData';
import { INITIAL_PRICE_SOURCES, calculatePricingSummary } from './utils/pricingEngine';
import { INITIAL_LOCATION_PROFILES, calculateLocationAdjustedCost } from './utils/locationIndexEngine';
import { normalizeText, normalizeCode, hasText, safeIncludes } from './utils/textNormalization';
import Sidebar, { PageId } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectsPage from './components/ProjectsPage';
import ProjectDetails from './components/ProjectDetails';
import ExcelUpload from './components/ExcelUpload';
import DataImportCenter from './components/DataImportCenter';
import AIExtraction from './components/AIExtraction';
import BOQTableComponent from './components/BOQTableComponent';
import BillOfMaterials from './components/BillOfMaterials';
import PriceSourcesCenter from './components/PriceSourcesCenter';
import RAPTableComponent from './components/RAPTableComponent';
import ProfitSummary from './components/ProfitSummary';
import MasterDataManagement from './components/MasterDataManagement';
import ApprovalAudit from './components/ApprovalAudit';
import ProcessFlowchart from './components/ProcessFlowchart';
import ButtonQA from './components/ButtonQA';
import { Sparkles, HelpCircle, User, Droplet, Clock, Save, Trash2, AlertCircle, Plus, Upload, Play, FileText, LayoutGrid, X, MapPin, Calendar, Briefcase, Building2 } from 'lucide-react';

const STORAGE_PROJECTS_KEY = 'bpm_automation_projects_v3';
const STORAGE_BOQ_KEY = 'bpm_automation_boqs_v3';
const STORAGE_MATERIALS_KEY = 'bpm_automation_materials_v3';
const STORAGE_LABOUR_KEY = 'bpm_automation_labours_v3';
const STORAGE_EQUIPMENT_KEY = 'bpm_automation_equipments_v3';
const STORAGE_AHSP_KEY = 'bpm_automation_ahsp_v3';
const STORAGE_AUDIT_KEY = 'bpm_automation_audits_v3';
const STORAGE_BOM_KEY = 'bpm_automation_bom_v3';
const STORAGE_PRICE_SOURCES_KEY = 'bpm_automation_price_sources_v3';
const STORAGE_LOCATION_PROFILES_KEY = 'bpm_automation_location_profiles_v3';

export default function App() {
  // Navigation
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  // Core Persisted Database Lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [boqItems, setBOQItems] = useState<BOQItem[]>([]);
  const [rapItems, setRAPItems] = useState<RAPItem[]>([]);
  const [bomItems, setBOMItems] = useState<BOMItem[]>([]);
  const [priceSources, setPriceSources] = useState<PriceSourceRecord[]>([]);
  const [locationIndexProfiles, setLocationIndexProfiles] = useState<LocationIndexProfile[]>([]);

  // Safety global saving & load status tracker states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'Saving' | 'Saved' | 'Save Failed' | 'Unsaved Changes'>('Saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Global toast system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Clear verification modals selectors
  const [showClearModal, setShowClearModal] = useState<'sample' | 'entire' | null>(null);
  const [projectNameConfirm, setProjectNameConfirm] = useState<string>('');
  
  // Master Databases
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [labours, setLabours] = useState<LabourMaster[]>([]);
  const [equipments, setEquipments] = useState<EquipmentMaster[]>([]);
  const [ahspTemplates, setAhspTemplates] = useState<AHSPMaster[]>([]);

  // Safety Audit tracker
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Project Management and Tracking States
  const [uploadedFilesMetadata, setUploadedFilesMetadata] = useState<FileMetadata[]>([]);
  const [isProjectDirty, setIsProjectDirty] = useState<boolean>(false);
  const [isSavingProject, setIsSavingProject] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const skipDirtyCheckRef = useRef<boolean>(false);

  // Switch confirmation state
  const [switchProjectTargetId, setSwitchProjectTargetId] = useState<string | null>(null);

  // New Project Modal fields
  const [isCreateNewModalOpen, setIsCreateNewModalOpen] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjPOValue, setNewProjPOValue] = useState<string>('0');
  const [newProjProvince, setNewProjProvince] = useState('Jakarta');
  const [newProjCity, setNewProjCity] = useState('Jakarta Selatan');
  const [newProjDistrict, setNewProjDistrict] = useState('Kebayoran Baru');
  const [newProjArea, setNewProjArea] = useState('');
  const [newProjDate, setNewProjDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newProjEngineer, setNewProjEngineer] = useState('engineering@bpm.co.id');
  const [newProjDuration, setNewProjDuration] = useState<string>('12');
  const [newProjRemoteFlag, setNewProjRemoteFlag] = useState<'Yes' | 'No'>('No');

  // Multi-project selection index
  const [activeProjectId, setActiveProjectId] = useState<string>('PRJ-2026-001');

  // Costing pipeline generation results summary modal state
  const [costingResult, setCostingResult] = useState<{
    processed: number;
    boqCount: number;
    bomCount: number;
    ahspCount: number;
    reviewCount: number;
    rapCount: number;
    blockedCount: number;
  } | null>(null);

  // --- PERSISTENCE: INITIAL MASTER DATABASES LOADING ---
  useEffect(() => {
    // 1. Materials Master
    const cachedMaterials = localStorage.getItem(STORAGE_MATERIALS_KEY);
    let loadedMaterials = INITIAL_MATERIALS;
    if (cachedMaterials) {
      try {
        loadedMaterials = JSON.parse(cachedMaterials);
      } catch (e) {
        console.error('Error parsing materials cache', e);
      }
    }
    setMaterials(loadedMaterials);

    // 2. Labour Master
    const cachedLabour = localStorage.getItem(STORAGE_LABOUR_KEY);
    let loadedLabour = INITIAL_LABOUR;
    if (cachedLabour) {
      try {
        loadedLabour = JSON.parse(cachedLabour);
      } catch (e) {
        console.error('Error parsing labour cache', e);
      }
    }
    setLabours(loadedLabour);

    // 3. Equipment Master
    const cachedEquipment = localStorage.getItem(STORAGE_EQUIPMENT_KEY);
    let loadedEquipment = INITIAL_EQUIPMENT;
    if (cachedEquipment) {
      try {
        loadedEquipment = JSON.parse(cachedEquipment);
      } catch (e) {
        console.error('Error parsing equipment cache', e);
      }
    }
    setEquipments(loadedEquipment);

    // 4. Hydrated AHSP formulas
    const cachedAHSP = localStorage.getItem(STORAGE_AHSP_KEY);
    let loadedAHSP = getHydratedAHSPs(loadedMaterials, loadedLabour, loadedEquipment);
    if (cachedAHSP) {
      try {
        loadedAHSP = JSON.parse(cachedAHSP);
      } catch (e) {
        console.error('Error parsing AHSP cache', e);
      }
    }
    setAhspTemplates(loadedAHSP);

    // 5. Projects list
    const cachedProjects = localStorage.getItem(STORAGE_PROJECTS_KEY);
    let loadedProjects = SEED_PROJECTS;
    if (cachedProjects) {
      try {
        loadedProjects = JSON.parse(cachedProjects);
      } catch (e) {
        console.error('Error parsing projects cache', e);
      }
    }
    setProjects(loadedProjects);

    // 6. Location Index Profiles
    const cachedProfiles = localStorage.getItem(STORAGE_LOCATION_PROFILES_KEY);
    let loadedProfiles = INITIAL_LOCATION_PROFILES;
    if (cachedProfiles) {
      try {
        loadedProfiles = JSON.parse(cachedProfiles);
      } catch (e) {
        console.error('Error loading location profiles cache', e);
      }
    }
    setLocationIndexProfiles(loadedProfiles);

    // Select Active Project ID from cache or default
    const savedActiveId = localStorage.getItem('bpm_active_project_id_v3');
    const activeId = savedActiveId || (loadedProjects[0] ? loadedProjects[0].id : '');

    setIsInitialized(true);

    // Safely load the project child records
    if (activeId) {
      loadProjectData(activeId, loadedProjects);
    }
  }, []);

  // --- EXTRACT FILE METADATA UTILITY ---
  const extractFileMetadataFromProject = (proj: Project): FileMetadata[] => {
    const metaList: FileMetadata[] = [];
    const scanFiles = proj.aiDrawingAnalysis?.scanFiles;
    if (Array.isArray(scanFiles)) {
      scanFiles.forEach((sf: any) => {
        if (sf.fingerprint) {
          metaList.push({
            projectId: proj.id,
            fileId: sf.id,
            fileName: sf.fingerprint.fileName || sf.file?.name || 'drawing.png',
            mimeType: sf.fingerprint.fileType || sf.file?.type || 'image/png',
            size: sf.fingerprint.fileSize || sf.file?.size || 0,
            uploadedAt: sf.fingerprint.uploadTimestamp || new Date().toISOString(),
            drawingHash: sf.fingerprint.fileHash,
            analysisRunId: sf.fingerprint.analysisRunId
          });
        }
      });
    }
    return metaList;
  };

  // --- PROJECT SANDBOX LOADER ---
  const loadProjectData = (projectId: string, currentProjectsList?: Project[]) => {
    if (!projectId) return;

    const list = currentProjectsList || projects;
    const proj = list.find((p) => p.id === projectId);
    if (!proj) return;

    skipDirtyCheckRef.current = true;

    // Load separate project records
    const recordsKey = `bpm_project_records_${projectId}`;
    const cachedRecords = localStorage.getItem(recordsKey);

    if (cachedRecords) {
      try {
        const parsed = JSON.parse(cachedRecords);
        
        // Restore project-specific state arrays
        if (Array.isArray(parsed.boqItems)) {
          setBOQItems(parsed.boqItems);
        } else {
          setBOQItems(generateBOQsFromProject(proj));
        }

        if (Array.isArray(parsed.bomItems)) {
          setBOMItems(parsed.bomItems);
        } else {
          setBOMItems([]);
        }

        if (Array.isArray(parsed.priceSources)) {
          setPriceSources(parsed.priceSources);
        } else {
          setPriceSources(INITIAL_PRICE_SOURCES);
        }

        if (Array.isArray(parsed.rapItems)) {
          setRAPItems(parsed.rapItems);
        } else {
          setRAPItems([]);
        }

        if (Array.isArray(parsed.auditLogs)) {
          setAuditLogs(parsed.auditLogs);
        } else {
          setAuditLogs([]);
        }

        if (Array.isArray(parsed.uploadedFilesMetadata)) {
          setUploadedFilesMetadata(parsed.uploadedFilesMetadata);
        } else {
          const initialMeta = extractFileMetadataFromProject(proj);
          setUploadedFilesMetadata(initialMeta);
        }

      } catch (e) {
        console.error(`Error loading project records for ${projectId}`, e);
      }
    } else {
      // Initialize fresh/empty project records
      const initialBOQ = generateBOQsFromProject(proj);
      setBOQItems(initialBOQ);
      setBOMItems([]);
      setPriceSources(INITIAL_PRICE_SOURCES);
      setRAPItems([]);
      setAuditLogs([
        {
          id: `log-init-${Date.now()}`,
          projectId: projectId,
          operator: 'System',
          details: 'Initialized fresh project environment.',
          oldValue: '',
          newValue: proj.name,
          timestamp: new Date().toISOString()
        }
      ]);
      setUploadedFilesMetadata(extractFileMetadataFromProject(proj));
    }

    setActiveProject(proj);
    setActiveProjectId(projectId);
    localStorage.setItem('bpm_active_project_id_v3', projectId);

    setIsProjectDirty(false);
    setSaveStatus('Saved');
    const formattedTime = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    setLastSavedAt(formattedTime);
    setLastSavedTime(formattedTime);

    setTimeout(() => {
      skipDirtyCheckRef.current = false;
    }, 100);
  };

  // --- PROJECT RECORDS SAVER ---
  const saveProjectData = (projectId: string, currentStates?: {
    activeProject?: Project | null;
    boqItems?: BOQItem[];
    bomItems?: BOMItem[];
    priceSources?: PriceSourceRecord[];
    rapItems?: RAPItem[];
    auditLogs?: AuditLog[];
    uploadedFilesMetadata?: FileMetadata[];
  }, isAuto = false) => {
    if (!projectId) return;

    const targetProject = currentStates?.activeProject !== undefined ? currentStates.activeProject : activeProject;
    const targetBOQ = currentStates?.boqItems !== undefined ? currentStates.boqItems : boqItems;
    const targetBOM = currentStates?.bomItems !== undefined ? currentStates.bomItems : bomItems;
    const targetPriceSources = currentStates?.priceSources !== undefined ? currentStates.priceSources : priceSources;
    const targetRAP = currentStates?.rapItems !== undefined ? currentStates.rapItems : rapItems;
    const targetAudit = currentStates?.auditLogs !== undefined ? currentStates.auditLogs : auditLogs;
    const targetFileMeta = currentStates?.uploadedFilesMetadata !== undefined ? currentStates.uploadedFilesMetadata : uploadedFilesMetadata;

    if (!targetProject) return;

    const recordsBundle = {
      projectId,
      boqItems: targetBOQ,
      bomItems: targetBOM,
      priceSources: targetPriceSources,
      rapItems: targetRAP,
      auditLogs: targetAudit,
      uploadedFilesMetadata: targetFileMeta,
      lastSavedAt: new Date().toISOString()
    };

    const recordsKey = `bpm_project_records_${projectId}`;
    localStorage.setItem(recordsKey, JSON.stringify(recordsBundle));

    // Update targetProject in metadata list
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          ...targetProject,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });

    setProjects(updatedProjects);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updatedProjects));

    if (!isAuto) {
      showToast('Project Saved Successfully', 'success');
      setSaveStatus('Saved');
      const formattedTime = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      setLastSavedAt(formattedTime);
      setLastSavedTime(formattedTime);
      setIsProjectDirty(false);
    }
  };

  // Switch project handler
  const handleSwitchProject = (targetId: string) => {
    if (isProjectDirty) {
      setSwitchProjectTargetId(targetId);
    } else {
      loadProjectData(targetId);
      setActivePage('dashboard');
    }
  };

  // Duplicate Project
  const handleDuplicateProject = (sourceId: string) => {
    const sourceProj = projects.find(p => p.id === sourceId);
    if (!sourceProj) return;

    const newId = `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicatedProj: Project = {
      ...sourceProj,
      id: newId,
      name: `${sourceProj.name} (Copy)`,
      lastUpdated: new Date().toISOString()
    };

    // Duplicate records bundle
    const sourceRecordsKey = `bpm_project_records_${sourceId}`;
    const cachedRecords = localStorage.getItem(sourceRecordsKey);
    if (cachedRecords) {
      try {
        const parsed = JSON.parse(cachedRecords);
        parsed.projectId = newId;
        if (Array.isArray(parsed.boqItems)) {
          parsed.boqItems = parsed.boqItems.map((item: any) => ({ ...item, id: item.id.replace(sourceId, newId) }));
        }
        localStorage.setItem(`bpm_project_records_${newId}`, JSON.stringify(parsed));
      } catch (e) {
        console.error("Failed to duplicate child records", e);
      }
    }

    const nextProjects = [...projects, duplicatedProj];
    setProjects(nextProjects);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjects));
    showToast(`Duplicated project to "${duplicatedProj.name}"`, 'success');
  };

  // Archive Project
  const handleArchiveProject = (projectId: string) => {
    const next = projects.map((p) => {
      if (p.id === projectId) {
        const isArchived = !(p as any).isArchived;
        return { ...p, isArchived, lastUpdated: new Date().toISOString() };
      }
      return p;
    });
    setProjects(next);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(next));
    const targetProj = next.find(p => p.id === projectId);
    showToast((targetProj as any).isArchived ? 'Project Archived Successfully' : 'Project Unarchived Successfully', 'success');
  };

  // Delete Project Sandbox
  const handleDeleteProject = async (projectId: string) => {
    const targetProj = projects.find(p => p.id === projectId);
    const deletedName = targetProj ? targetProj.name : '';

    // Remove metadata list
    const nextProjects = projects.filter((p) => p.id !== projectId);
    setProjects(nextProjects);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjects));

    // Delete IndexedDB binary blobs for layout drawings
    const recordsKey = `bpm_project_records_${projectId}`;
    const cached = localStorage.getItem(recordsKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const fileMeta = parsed.uploadedFilesMetadata || [];
        if (Array.isArray(fileMeta)) {
          const { deleteBlobFromIndexedDB } = await import('./utils/indexedDB');
          for (const fm of fileMeta) {
            if (fm.fileId) await deleteBlobFromIndexedDB(fm.fileId);
            if (fm.drawingHash) await deleteBlobFromIndexedDB(fm.drawingHash);
          }
        }
      } catch (e) {
        console.error("Failed deleting IndexedDB blobs", e);
      }
    }

    // Delete isolated record bundle
    localStorage.removeItem(`bpm_project_records_${projectId}`);

    if (activeProjectId === projectId) {
      setActiveProject(null);
      setActiveProjectId('');
      setBOQItems([]);
      setBOMItems([]);
      setRAPItems([]);
      setPriceSources(INITIAL_PRICE_SOURCES);
      localStorage.removeItem('bpm_active_project_id_v3');
      setActivePage('projects');
    }

    showToast(`Project "${deletedName}" has been permanently deleted.`, 'info');
  };

  // Monitor state changes to set dirty flag
  useEffect(() => {
    if (!isInitialized || !activeProjectId) return;
    if (skipDirtyCheckRef.current) return;

    setIsProjectDirty(true);
    setSaveStatus('Unsaved Changes');
  }, [activeProject, boqItems, bomItems, priceSources, auditLogs, uploadedFilesMetadata]);

  // Debounced Auto-Save Effect
  useEffect(() => {
    if (!isInitialized || !isProjectDirty || !activeProjectId) return;

    setSaveStatus('Unsaved Changes');

    const timer = setTimeout(() => {
      setIsSavingProject(true);
      setSaveStatus('Saving');
      try {
        saveProjectData(activeProjectId, undefined, true);
        setIsProjectDirty(false);
        setIsSavingProject(false);
        setSaveStatus('Saved');
        const formattedTime = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        setLastSavedAt(formattedTime);
        setLastSavedTime(formattedTime);
      } catch (err) {
        console.error("Auto-save failed", err);
        setSaveStatus('Save Failed');
        setIsSavingProject(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    activeProjectId,
    activeProject,
    boqItems,
    bomItems,
    priceSources,
    auditLogs,
    uploadedFilesMetadata,
    isProjectDirty,
    isInitialized
  ]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- REAL-TIME CASCADING RAP RECALCULATION ENGINE ---
  useEffect(() => {
    if (boqItems.length === 0) {
      setRAPItems([]);
      return;
    }

    const calculatedRaps = boqItems.map((boq) => {
      // Calculate vehicle retribution fee for this BOQ element
      const retributionFee = boq.manualOverrideCost || ((boq.trips || 0) * (boq.costPerTrip || 0));

      // 1. Locate mapped AHSP
      const match = ahspTemplates.find((ah) => ah.ahspCode === boq.ahspCode);
      if (match) {
        const isCustom = match.customUnitPrice !== undefined;
        
        // Calculate original baseline breakdown for audit reference
        const baselineBreakdown = isCustom ? {
          labourCost: match.customLabour || 0,
          materialCost: match.customMaterial || 0,
          equipmentCost: match.customEquipment || 0
        } : computeAHSPBreakdown(match.resources, materials, labours, equipments);
        const baselineUnitVal = isCustom ? (match.customUnitPrice || 0) : (baselineBreakdown.labourCost + baselineBreakdown.materialCost + baselineBreakdown.equipmentCost);

        // Find active location profile applied to the current project
        const activeProfile = locationIndexProfiles.find(p => p.id === activeProject?.appliedLocationIndexId);
        
        let adjustedLabourCost = 0;
        let adjustedMaterialCost = 0;
        let adjustedEquipmentCost = 0;
        let totalFreightAmount = 0;
        let totalRetributionAmount = 0;

        if (isCustom) {
          const mIndex = activeProfile ? activeProfile.materialIndex : 1.0;
          const lIndex = activeProfile ? activeProfile.labourIndex : 1.0;
          const eIndex = activeProfile ? activeProfile.equipmentIndex : 1.0;

          adjustedLabourCost = (match.customLabour || 0) * lIndex;
          adjustedMaterialCost = (match.customMaterial || 0) * mIndex;
          adjustedEquipmentCost = (match.customEquipment || 0) * eIndex;
        } else {
          match.resources.forEach((resource) => {
            if (resource.type === 'Material') {
              const resMatch = materials.find((m) => m.materialCode === resource.code);
              if (resMatch) {
                const ps = priceSources.find((p) => p.itemCode === resource.code);
                const adj = calculateLocationAdjustedCost({
                  baseUnitPrice: resMatch.currentPrice,
                  costCategory: 'Material',
                  priceBasis: ps?.priceBasis || 'Ex-Warehouse Price',
                  deliveryIncluded: ps?.deliveryIncluded || 'No',
                  locationIndexProfile: activeProfile,
                  directFreight: ps?.freightCost || 0,
                  vehicleRetribution: ps?.vehicleRetributionCost || 0,
                  transportMethodSelection: 'Location Index'
                });

                adjustedMaterialCost += adj.locationAdjustedUnitPrice * resource.coefficient;
                totalFreightAmount += adj.freightAmount * resource.coefficient;
                totalRetributionAmount += adj.vehicleRetributionAmount * resource.coefficient;
              }
            } else if (resource.type === 'Labour') {
              const resMatch = labours.find((l) => l.labourCode === resource.code);
              if (resMatch) {
                const adj = calculateLocationAdjustedCost({
                  baseUnitPrice: resMatch.dailyRate,
                  costCategory: 'Labour',
                  locationIndexProfile: activeProfile
                });
                adjustedLabourCost += adj.locationAdjustedUnitPrice * resource.coefficient;
              }
            } else if (resource.type === 'Equipment') {
              const resMatch = equipments.find((e) => e.equipmentCode === resource.code);
              if (resMatch) {
                const adj = calculateLocationAdjustedCost({
                  baseUnitPrice: resMatch.rentalRate,
                  costCategory: 'Equipment',
                  locationIndexProfile: activeProfile
                });
                adjustedEquipmentCost += adj.locationAdjustedUnitPrice * resource.coefficient;
              }
            }
          });
        }

        adjustedLabourCost = Math.round(adjustedLabourCost);
        adjustedMaterialCost = Math.round(adjustedMaterialCost);
        adjustedEquipmentCost = Math.round(adjustedEquipmentCost);
        totalFreightAmount = Math.round(totalFreightAmount);
        totalRetributionAmount = Math.round(totalRetributionAmount);

        // Compute total unit price including regional adjustments, logistics/freight and retribution
        const unitVal = adjustedLabourCost + adjustedMaterialCost + adjustedEquipmentCost + totalFreightAmount + totalRetributionAmount;

        // Carry forward any user overrides on this RAP item if they exist
        const existingRap = rapItems.find(r => r.id === `rap-${boq.id}`);
        const hasOverride = existingRap && existingRap.overrideUser !== undefined;
        const finalUnitCost = hasOverride ? (existingRap.unitCost || unitVal) : unitVal;

        return {
          id: `rap-${boq.id}`,
          rapItemCode: `RAP-${boq.itemCode}`,
          boqRef: boq.itemCode,
          description: boq.description,
          quantity: boq.quantity,
          unit: boq.unit,
          labourCost: adjustedLabourCost,
          materialCost: adjustedMaterialCost + totalFreightAmount + totalRetributionAmount, // bundle freight and logistics with material
          equipmentCost: adjustedEquipmentCost,
          unitCost: finalUnitCost,
          // Include vehicle retribution fee in final cost
          totalCost: Number((boq.quantity * finalUnitCost).toFixed(0)) + retributionFee,
          ahspReference: match.ahspCode,
          notes: boq.notes || '',

          // Retribution fields passed down
          vehicleType: boq.vehicleType,
          trips: boq.trips,
          costPerTrip: boq.costPerTrip,
          manualOverrideCost: boq.manualOverrideCost,
          permitRefNum: boq.permitRefNum,
          permitStatus: boq.permitStatus,
          vehicleRetributionFee: retributionFee,

          // Location Indexing Auditing Fields
          locationMultiplier: activeProfile ? activeProfile.materialIndex : 1.0,
          locationAdjustedUnitPrice: unitVal,
          locationAdjustmentAmount: unitVal - baselineUnitVal,
          freightAmount: totalFreightAmount,
          vehicleRetributionAmount: totalRetributionAmount,
          finalLandedUnitPrice: unitVal,
          locationIndexSource: activeProfile ? `${activeProfile.id} (v${activeProfile.version})` : 'Universal baseline',
          
          // Preserve any existing overrides
          overrideReason: existingRap?.overrideReason,
          overrideUser: existingRap?.overrideUser,
          overrideDate: existingRap?.overrideDate
        };
      } else {
        // Unmatched fallback -> IDR 0 (or just retribution fee if any)
        return {
          id: `rap-${boq.id}`,
          rapItemCode: `RAP-${boq.itemCode}`,
          boqRef: boq.itemCode,
          description: boq.description,
          quantity: boq.quantity,
          unit: boq.unit,
          labourCost: 0,
          materialCost: 0,
          equipmentCost: 0,
          unitCost: 0,
          totalCost: retributionFee,
          ahspReference: '',
          notes: boq.notes || 'Needs AHSP mapping review',

          // Retribution fields passed down
          vehicleType: boq.vehicleType,
          trips: boq.trips,
          costPerTrip: boq.costPerTrip,
          manualOverrideCost: boq.manualOverrideCost,
          permitRefNum: boq.permitRefNum,
          permitStatus: boq.permitStatus,
          vehicleRetributionFee: retributionFee,

          // Fallbacks for Location Indexing
          locationMultiplier: 1.0,
          locationAdjustedUnitPrice: 0,
          locationAdjustmentAmount: 0,
          freightAmount: 0,
          vehicleRetributionAmount: 0,
          finalLandedUnitPrice: 0,
          locationIndexSource: 'Universal baseline'
        };
      }
    });

    setRAPItems((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(calculatedRaps)) {
        return prev;
      }
      return calculatedRaps;
    });
  }, [boqItems, ahspTemplates, materials, labours, equipments, activeProject, locationIndexProfiles, priceSources]);

  // --- ACTIONS STATE SYNC ---
  const handleUpdateProjectInfo = useCallback((updatedProject: Project) => {
    setActiveProject((currentActive) => {
      if (currentActive && JSON.stringify(currentActive) === JSON.stringify(updatedProject)) {
        return currentActive;
      }
      return updatedProject;
    });

    setProjects((prevProjects) => {
      const nextProjects = prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      if (JSON.stringify(prevProjects) === JSON.stringify(nextProjects)) {
        return prevProjects;
      }
      return nextProjects;
    });
  }, []);

  const handleUpdateMaterialsList = (nextMats: MaterialMaster[]) => {
    setMaterials(nextMats);
  };

  const handleUpdateLabourList = (nextLabour: LabourMaster[]) => {
    setLabours(nextLabour);
  };

  const handleUpdateEquipmentList = (nextEquip: EquipmentMaster[]) => {
    setEquipments(nextEquip);
  };

  const handleUpdateAHSPTemplatelist = (nextAHSP: AHSPMaster[]) => {
    setAhspTemplates(nextAHSP);
  };

  const handleUpdateBOQList = (nextBOQs: BOQItem[]) => {
    setBOQItems(nextBOQs);
  };

  // Helper trigger audit logs
  const handleAddAuditLog = (details: string, oldVal: string, newVal: string) => {
    const item: AuditLog = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      projectId: activeProject?.id || 'PRJ-MAIN',
      operator: 'engineering@bpm.co.id',
      details,
      oldValue: oldVal,
      newValue: newVal,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [item, ...prev]);
  };

  // --- SINGLE SOURCE OF TRUTH: COSTING DATA SYNCHRONIZATION ENGINE ---
  const resolveMaterialUnitPrice = (
    materialCode: string,
    currentPriceSources: PriceSourceRecord[],
    masterMaterials: MaterialMaster[]
  ) => {
    const codeNorm = normalizeCode(materialCode);
    if (!codeNorm) {
      return {
        price: 0,
        sourceStatus: 'Missing Price',
        supplier: 'Unassigned Supplier Ref',
        hasApprovedPrice: false
      };
    }

    // Priority 1: Match against the most recent 'Approved' supplier price records in the Price Source Center database (approvalStatus === 'Approved')
    const approved = currentPriceSources
      .filter((r) => normalizeCode(r.itemCode) === codeNorm && normalizeText(r.approvalStatus) === 'approved')
      .sort((a, b) => new Date(b.sourceDate || 0).getTime() - new Date(a.sourceDate || 0).getTime());

    if (approved.length > 0) {
      return {
        price: approved[0].landedUnitPrice || 0,
        sourceStatus: approved[0].sourceType || 'Supplier Direct',
        supplier: approved[0].supplierOrSource || 'Approved Supplier',
        hasApprovedPrice: true
      };
    }

    // Priority 2: Use historical supplier price lists or the last approved transaction (fall back to priceSources list)
    const anyMatch = currentPriceSources
      .filter((r) => normalizeCode(r.itemCode) === codeNorm)
      .sort((a, b) => new Date(b.sourceDate || 0).getTime() - new Date(a.sourceDate || 0).getTime());

    if (anyMatch.length > 0 && (anyMatch[0].landedUnitPrice || 0) > 0) {
      return {
        price: anyMatch[0].landedUnitPrice,
        sourceStatus: anyMatch[0].sourceType || 'Historical Price',
        supplier: anyMatch[0].supplierOrSource || 'Supplier Ref',
        hasApprovedPrice: false
      };
    }

    // Priority 3: Fall back to regional government standard reference rates (Official Reference Price)
    const masterObj = masterMaterials.find((m) => normalizeCode(m.materialCode) === codeNorm);
    if (masterObj && (masterObj.currentPrice || 0) > 0) {
      return {
        price: masterObj.currentPrice,
        sourceStatus: 'Official Reference Price',
        supplier: masterObj.supplier || 'Regional Government Standard',
        hasApprovedPrice: false
      };
    }

    // Priority 4: Generate a provisional 'Procurement Review Required' placeholder template (Missing Price) marked with Rp0
    return {
      price: 0,
      sourceStatus: 'Missing Price',
      supplier: 'Unassigned Supplier Ref',
      hasApprovedPrice: false
    };
  };

  const syncConfirmedEngineeringDataToCosting = (projectId: string, customProject?: Project) => {
    const project = customProject || projects.find((p) => p.id === projectId) || activeProject;
    if (!project) return;

    const pipeSegmentsList = project.pipeSegments || [];
    const appurtenancesList = project.appurtenances || [];
    const structuresList = project.structures || [];

    const confirmedPipes = pipeSegmentsList.filter((p) => !p.requiresConfirmation);
    const confirmedApps = appurtenancesList.filter((a) => !a.requiresConfirmation);
    const confirmedStrs = structuresList.filter((s) => !s.requiresConfirmation);

    const costingIssues: CostingIssue[] = [];
    const validConfirmedPipes: PipeSegment[] = [];
    const validConfirmedApps: Appurtenance[] = [];
    const validConfirmedStrs: Structure[] = [];

    // 1. Process and validate Pipe Segments
    confirmedPipes.forEach((seg, idx) => {
      const missingFields: string[] = [];
      const segIdNorm = normalizeText(seg.segmentId);
      if (!hasText(seg.segmentId) || segIdNorm === 's unknown' || segIdNorm === 'unknown' || segIdNorm === 's-unknown') {
        missingFields.push('segmentId');
      }
      const matNorm = normalizeText(seg.pipeMaterial);
      if (!hasText(seg.pipeMaterial) || matNorm === 'unknown' || matNorm === 'unknown material') {
        missingFields.push('material');
      }
      const diamNorm = normalizeText(seg.diameter);
      if (!hasText(seg.diameter) || diamNorm === 'unknown' || diamNorm === 'unknown diameter') {
        missingFields.push('diameter');
      }
      if (seg.lengthM === undefined || seg.lengthM === null || seg.lengthM <= 0) {
        missingFields.push('length');
        missingFields.push('unit');
      }
      const methodNorm = normalizeText(seg.installationMethod);
      if (!hasText(seg.installationMethod) || methodNorm === 'unknown' || methodNorm === 'method requires review' || methodNorm.includes('review')) {
        missingFields.push('installationMethod');
      }

      if (missingFields.length > 0) {
        console.warn("DED costing skipped item due to missing field", {
          itemId: seg.id,
          itemType: 'Pipe Segment',
          missingFields,
        });
        costingIssues.push({
          id: `issue-${project.id}-${seg.id || `pipe-${idx}`}`,
          sourceEntityId: seg.id || `pipe-missing-id-${idx}`,
          itemLabel: seg.segmentId || "Unnamed Pipe Segment",
          itemType: 'Pipe Segment',
          issueType: "Missing Required Costing Data",
          missingFields,
          status: "Needs Engineering Review",
          blockingCosting: true,
          rawObject: seg
        });
      } else {
        validConfirmedPipes.push(seg);
      }
    });

    // 2. Process and validate Appurtenances (fittings)
    confirmedApps.forEach((app, idx) => {
      const missingFields: string[] = [];
      const typeNorm = normalizeText(app.type);
      if (!hasText(app.type) || typeNorm === 'unknown' || typeNorm === 'unnamed work item') {
        missingFields.push('type');
      }
      if (app.quantity === undefined || app.quantity === null || app.quantity <= 0) {
        missingFields.push('quantity');
      }
      const diamNorm = normalizeText(app.diameter);
      if (!hasText(app.diameter) || diamNorm === 'unknown' || diamNorm === 'unknown diameter') {
        missingFields.push('diameter');
      }

      if (missingFields.length > 0) {
        console.warn("DED costing skipped item due to missing field", {
          itemId: app.id,
          itemType: 'Appurtenance',
          missingFields,
        });
        costingIssues.push({
          id: `issue-${project.id}-${app.id || `app-${idx}`}`,
          sourceEntityId: app.id || `app-missing-id-${idx}`,
          itemLabel: app.type || "Unnamed Appurtenance",
          itemType: 'Appurtenance',
          issueType: "Missing Required Costing Data",
          missingFields,
          status: "Needs Engineering Review",
          blockingCosting: true,
          rawObject: app
        });
      } else {
        validConfirmedApps.push(app);
      }
    });

    // 3. Process and validate Structures (civil structures)
    confirmedStrs.forEach((str, idx) => {
      const missingFields: string[] = [];
      const typeNorm = normalizeText(str.type);
      if (!hasText(str.type) || typeNorm === 'unknown' || typeNorm === 'unnamed work item') {
        missingFields.push('type');
      }
      if (str.quantity === undefined || str.quantity === null || str.quantity <= 0) {
        missingFields.push('quantity');
      }

      if (missingFields.length > 0) {
        console.warn("DED costing skipped item due to missing field", {
          itemId: str.id,
          itemType: 'Civil Structure',
          missingFields,
        });
        costingIssues.push({
          id: `issue-${project.id}-${str.id || `str-${idx}`}`,
          sourceEntityId: str.id || `str-missing-id-${idx}`,
          itemLabel: str.type || "Unnamed Structure",
          itemType: 'Civil Structure',
          issueType: "Missing Required Costing Data",
          missingFields,
          status: "Needs Engineering Review",
          blockingCosting: true,
          rawObject: str
        });
      } else {
        validConfirmedStrs.push(str);
      }
    });

    const newBOQItems: BOQItem[] = [];

    // Keep manual extra unlinked BOQ items
    boqItems.forEach((existingBoq) => {
       if (!existingBoq.segmentId) {
         newBOQItems.push(existingBoq);
       }
    });

    // Translate valid pipes -> BOQ
    let pipeCounter = 1;
    validConfirmedPipes.forEach((seg) => {
      let ahspCode = '';
      const matNorm = normalizeText(seg.pipeMaterial);
      const diamNorm = normalizeText(seg.diameter);
      const methodNorm = normalizeText(seg.installationMethod);

      if (matNorm === 'pvc' && diamNorm === '8 inch') {
        ahspCode = 'K-1-3.12';
      } else if (matNorm === 'hdpe' && diamNorm === '3 inch') {
        if (methodNorm === 'bore' || methodNorm === 'hdd') {
          ahspCode = 'BORE-3';
        } else {
          ahspCode = 'HDPE-3-OC';
        }
      } else if (methodNorm === 'bore' || methodNorm === 'hdd') {
        ahspCode = 'BORE-3';
      } else {
        ahspCode = matNorm === 'pvc' ? 'AHSP-04' : 'AHSP-03';
      }

      const matchTemp = ahspTemplates.find((t) => normalizeCode(t.ahspCode) === normalizeCode(ahspCode));
      const isAIScan = seg.id.startsWith('ai-') || (seg.notes && (seg.notes.includes('AI') || seg.notes.includes('Extracted')));

      const itemCode = `BOQ-P-${String(pipeCounter++).padStart(3, '0')}`;
      const existing = boqItems.find((o) => o.segmentId === seg.segmentId);

      newBOQItems.push({
        id: existing?.id || `boq-${project.id}-${itemCode}-${seg.segmentId}`,
        itemCode: existing?.itemCode || itemCode,
        description: `Pipe laying & installation of ${seg.pipeMaterial} ${seg.diameter} (Jointing details, pressure testing & mobilization inclusive, Method: ${seg.installationMethod})`,
        quantity: seg.lengthM,
        unit: 'meter',
        source: isAIScan ? 'AI Extracted' : 'Manual',
        importStatus: isAIScan ? 'Confirmed AI Scan' : 'Manual Survey',
        ahspStatus: matchTemp ? 'Matched' : 'Unmatched',
        ahspCode: ahspCode,
        notes: seg.notes || `Linked dynamically to ${seg.segmentId}.`,
        pipeMaterial: seg.pipeMaterial,
        diameter: seg.diameter,
        installationMethod: seg.installationMethod,
        surfaceType: seg.surfaceType,
        segmentId: seg.segmentId,
        groundCondition: seg.groundCondition,
        location: project.location,

        // Restore retribution/overrides
        vehicleType: existing?.vehicleType,
        trips: existing?.trips,
        costPerTrip: existing?.costPerTrip,
        manualOverrideCost: existing?.manualOverrideCost,
        permitRefNum: existing?.permitRefNum,
        permitStatus: existing?.permitStatus,
        vehicleRetributionFee: existing?.vehicleRetributionFee
      });

      // Associated Asphalt Reinstatement?
      if (normalizeText(seg.surfaceType) === 'asphalt') {
        const asphaltArea = seg.lengthM * 0.5; // width 0.5m
        const existingAsphalt = boqItems.find((o) => o.segmentId === `${seg.segmentId}-asphalt`);
        const rCode = `BOQ-R-${String(pipeCounter++).padStart(3, '0')}`;

        newBOQItems.push({
          id: existingAsphalt?.id || `boq-${project.id}-${rCode}-${seg.segmentId}-asphalt`,
          itemCode: existingAsphalt?.itemCode || rCode,
          description: `Asphalt pavement reinstatement (thickness 5cm with proper compacting, linked to segment ${seg.segmentId})`,
          quantity: asphaltArea,
          unit: 'm2',
          source: isAIScan ? 'AI Extracted' : 'Manual',
          importStatus: isAIScan ? 'Confirmed AI Scan' : 'Manual Survey',
          ahspStatus: 'Matched',
          ahspCode: 'ASP-RESTORE',
          notes: `Calculated asphalt pavement reinstatement for segment ${seg.segmentId}`,
          segmentId: `${seg.segmentId}-asphalt`,
          surfaceType: 'Asphalt',

          // Restore retribution/overrides
          vehicleType: existingAsphalt?.vehicleType,
          trips: existingAsphalt?.trips,
          costPerTrip: existingAsphalt?.costPerTrip,
          manualOverrideCost: existingAsphalt?.manualOverrideCost,
          permitRefNum: existingAsphalt?.permitRefNum,
          permitStatus: existingAsphalt?.permitStatus,
          vehicleRetributionFee: existingAsphalt?.vehicleRetributionFee
        });
      }
    });

    // Translate valid appurtenances -> BOQ
    let appCounter = 1;
    validConfirmedApps.forEach((app) => {
      let ahspCode = '';
      const appTypeNorm = normalizeText(app.type);
      const appDiamNorm = normalizeText(app.diameter);

      if (appTypeNorm === 'gate valve') {
        ahspCode = appDiamNorm.includes('8') ? 'GV-8' : 'AHSP-07';
      } else if (appTypeNorm === 'water meter') {
        ahspCode = appDiamNorm.includes('3') ? 'WM-3' : 'AHSP-08';
      } else {
        ahspCode = 'AHSP-07';
      }

      const matchTemp = ahspTemplates.find((t) => normalizeCode(t.ahspCode) === normalizeCode(ahspCode));
      const itemCode = `BOQ-A-${String(appCounter++).padStart(3, '0')}`;
      const existing = boqItems.find((o) => o.segmentId === `app-${app.id}`);
      const isAIScan = app.id.startsWith('ai-') || (app.notes && (app.notes.includes('AI') || app.notes.includes('Extracted')));

      newBOQItems.push({
        id: existing?.id || `boq-${project.id}-${itemCode}-app-${app.id}`,
        itemCode: existing?.itemCode || itemCode,
        description: `Supply and installation of ${app.type} ${app.diameter} (including flanges, accessories)`,
        quantity: app.quantity,
        unit: 'pcs',
        source: isAIScan ? 'AI Extracted' : 'Manual',
        importStatus: isAIScan ? 'Confirmed AI Scan' : 'Manual Survey',
        ahspStatus: matchTemp ? 'Matched' : 'Needs Review',
        ahspCode: ahspCode,
        notes: app.notes || `Linked directly to appurtenance ${app.id}`,
        segmentId: `app-${app.id}`,

        // Restore retribution/overrides
        vehicleType: existing?.vehicleType,
        trips: existing?.trips,
        costPerTrip: existing?.costPerTrip,
        manualOverrideCost: existing?.manualOverrideCost,
        permitRefNum: existing?.permitRefNum,
        permitStatus: existing?.permitStatus,
        vehicleRetributionFee: existing?.vehicleRetributionFee
      });
    });

    // Translate valid structures (civil structures) -> BOQ
    let strCounter = 1;
    validConfirmedStrs.forEach((str) => {
      let ahspCode = 'AHSP-09';
      if (normalizeText(str.type) === 'valve chamber') {
        ahspCode = 'VC-8';
      }
      const matchTemp = ahspTemplates.find((t) => normalizeCode(t.ahspCode) === normalizeCode(ahspCode));
      const itemCode = `BOQ-S-${String(strCounter++).padStart(3, '0')}`;
      const existing = boqItems.find((o) => o.segmentId === `str-${str.id}`);
      const isAIScan = str.id.startsWith('ai-') || (str.notes && (str.notes.includes('AI') || str.notes.includes('Extracted')));

      newBOQItems.push({
        id: existing?.id || `boq-${project.id}-${itemCode}-str-${str.id}`,
        itemCode: existing?.itemCode || itemCode,
        description: `Construction of standard structural ${str.type} with reinforced concrete cover`,
        quantity: str.quantity,
        unit: 'unit',
        source: isAIScan ? 'AI Extracted' : 'Manual',
        importStatus: isAIScan ? 'Confirmed AI Scan' : 'Manual Survey',
        ahspStatus: matchTemp ? 'Matched' : 'Needs Review',
        ahspCode: ahspCode,
        notes: str.notes || `Linked directly to structure ${str.id}`,
        segmentId: `str-${str.id}`,

        // Restore retribution/overrides
        vehicleType: existing?.vehicleType,
        trips: existing?.trips,
        costPerTrip: existing?.costPerTrip,
        manualOverrideCost: existing?.manualOverrideCost,
        permitRefNum: existing?.permitRefNum,
        permitStatus: existing?.permitStatus,
        vehicleRetributionFee: existing?.vehicleRetributionFee
      });
    });

    // Translate to BOM items dynamically from valid BOQ items
    const newBOMItems: BOMItem[] = [];
    const nextPriceSources = [...priceSources];
    let matchedAhspCount = 0;

    newBOQItems.forEach((boq) => {
      const match = ahspTemplates.find((t) => normalizeCode(t.ahspCode) === normalizeCode(boq.ahspCode));
      if (!match) return;
      
      matchedAhspCount++;

      (match.resources || []).forEach((res, index) => {
        if (res.type === 'Material') {
          // Priority-based pricing resolution
          const pricingInfo = resolveMaterialUnitPrice(res.code, nextPriceSources, materials);
          const recPrice = pricingInfo.price;
          const recSupplier = pricingInfo.supplier;

          const resCodeNorm = normalizeCode(res.code);
          const resNameNorm = normalizeText(res.name);

          // 5% waste for pipes, 10% for asphalts/concrete/sand, 5% standard fallback
          const isPipe = resCodeNorm.includes('M01') || resCodeNorm.includes('M02') || resNameNorm.includes('pipa') || resNameNorm.includes('pipe');
          const isBulk = resCodeNorm.includes('M03') || resCodeNorm.includes('M04') || resCodeNorm.includes('M05') || resNameNorm.includes('asphalt') || resNameNorm.includes('concrete') || resNameNorm.includes('sand') || resNameNorm.includes('semen');
          
          let wastePct = 5;
          if (isPipe) {
            wastePct = 5;
          } else if (isBulk) {
            wastePct = 10;
          }

          const rawQty = (boq.quantity || 0) * (res.coefficient || 0);
          const finalQty = Number((rawQty * (1 + wastePct / 100)).toFixed(2));
          const matCost = Number((finalQty * recPrice).toFixed(0));
          const retributionRate = isPipe ? 0.08 : 0.05;
          const retributionCost = Number((matCost * retributionRate).toFixed(0));

          // Retain manual procurement status/supplier overrides if matched
          const existingBOM = bomItems.find(
            (o) => normalizeCode(o.materialCode) === resCodeNorm && o.linkedBOQRef === boq.itemCode
          );

          newBOMItems.push({
            id: existingBOM?.id || `bom-${boq.id}-${res.code}-${index}`,
            projectId: project.id,
            materialCode: res.code,
            description: materials.find((m) => normalizeCode(m.materialCode) === resCodeNorm)?.description || res.name,
            category: safeIncludes(boq.description, 'pipa') || safeIncludes(boq.description, 'pipe') ? 'Pipe Line' : 'Civil Work/Reinstatement',
            linkedBOQRef: boq.itemCode,
            linkedBOQDesc: boq.description,
            ahspCode: match.ahspCode,
            requiredQuantity: Number(rawQty.toFixed(2)),
            wasteAllowance: wastePct,
            finalRequiredQuantity: finalQty,
            unit: materials.find((m) => normalizeCode(m.materialCode) === resCodeNorm)?.unit || res.unit || 'pcs',
            unitPrice: recPrice,
            materialCost: matCost,
            vehicleRetributionCost: retributionCost,
            finalLandedCost: matCost + retributionCost,
            supplier: existingBOM?.supplier || recSupplier,
            procurementStatus: pricingInfo.sourceStatus === 'Missing Price' 
              ? 'Procurement Review Required' 
              : (existingBOM?.procurementStatus || 'Sourced'),
            notes: `Auto computed using coefficient ${res.coefficient} under AHSP template ${match.ahspCode}`,
            importStatus: boq.importStatus,

            // Retain retribution fields
            vehicleType: existingBOM?.vehicleType,
            trips: existingBOM?.trips,
            costPerTrip: existingBOM?.costPerTrip,
            manualOverrideCost: existingBOM?.manualOverrideCost,
            permitRefNum: existingBOM?.permitRefNum,
            permitStatus: existingBOM?.permitStatus
          });

          // Price Sources Center check: make sure this material has a record in priceSources!
          const psExists = nextPriceSources.some((ps) => normalizeCode(ps.itemCode) === resCodeNorm);
          if (!psExists) {
            nextPriceSources.push({
              id: `ps-auto-${res.code}-${Date.now()}-${index}`,
              itemCode: res.code,
              itemDescription: materials.find((m) => normalizeCode(m.materialCode) === resCodeNorm)?.description || res.name,
              category: 'Material',
              sourceType: 'Manual Engineering Estimate',
              supplierOrSource: 'Unassigned Supplier Ref',
              sourceDate: new Date().toISOString().split('T')[0],
              region: project.location || 'DKI Jakarta',
              unit: materials.find((m) => normalizeCode(m.materialCode) === resCodeNorm)?.unit || res.unit || 'pcs',
              quantityBasis: 'Estimated Demand',
              baseUnitPrice: 0,
              freightCost: 0,
              vehicleRetributionCost: 0,
              tax: 0,
              landedUnitPrice: 0,
              validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              reliabilityScore: 0.40,
              approvalStatus: 'Draft'
            });
          }
        }
      });
    });

    const updatedProjectObj: Project = {
      ...project,
      pipeSegments: project.pipeSegments,
      appurtenances: project.appurtenances,
      structures: project.structures,
      costingIssues: costingIssues,
      lastUpdated: new Date().toISOString()
    };

    setProjects((prevProjects) => {
      const nextProjects = prevProjects.map((p) => p.id === updatedProjectObj.id ? updatedProjectObj : p);
      if (JSON.stringify(prevProjects) === JSON.stringify(nextProjects)) {
        return prevProjects;
      }
      return nextProjects;
    });

    setActiveProject((prevActive) => {
      if (prevActive && prevActive.id === updatedProjectObj.id) {
        // Exclude lastUpdated from comparison to avoid time-based trigger loops
        const prevCopy = { ...prevActive, lastUpdated: '' };
        const nextCopy = { ...updatedProjectObj, lastUpdated: '' };
        if (JSON.stringify(prevCopy) === JSON.stringify(nextCopy)) {
          return prevActive;
        }
        return updatedProjectObj;
      }
      return prevActive;
    });

    setBOQItems((prevBOQ) => {
      if (JSON.stringify(prevBOQ) === JSON.stringify(newBOQItems)) {
        return prevBOQ;
      }
      return newBOQItems;
    });

    setBOMItems((prevBOM) => {
      if (JSON.stringify(prevBOM) === JSON.stringify(newBOMItems)) {
        return prevBOM;
      }
      return newBOMItems;
    });

    setPriceSources((prevPS) => {
      if (JSON.stringify(prevPS) === JSON.stringify(nextPriceSources)) {
        return prevPS;
      }
      return nextPriceSources;
    });

    // Prepare costing result summary statistics
    const missingPriceCount = newBOMItems.filter(bm => bm.procurementStatus === 'Procurement Review Required').length;
    const itemsProcessed = validConfirmedPipes.length + validConfirmedApps.length + validConfirmedStrs.length;
    const totalBlockedCount = costingIssues.filter(issue => issue.blockingCosting).length;

    setCostingResult({
      processed: itemsProcessed,
      boqCount: newBOQItems.length,
      bomCount: newBOMItems.length,
      ahspCount: matchedAhspCount,
      reviewCount: missingPriceCount,
      rapCount: newBOQItems.length, // lines that will draw into RAP
      blockedCount: totalBlockedCount
    });
  };

  const handleApplyAIExtractedData = (extracted: {
    pipeSegments: Omit<PipeSegment, 'id'>[];
    appurtenances: Omit<Appurtenance, 'id'>[];
    structures: Omit<Structure, 'id'>[];
    unclearItems: string[];
  }) => {
    if (!activeProject) return;

    // Apply and set unique IDs
    const pipes: PipeSegment[] = extracted.pipeSegments.map((p, i) => ({
      ...p,
      id: `ai-p-seg-${Date.now()}-${i}`,
    }));

    const apps: Appurtenance[] = extracted.appurtenances.map((a, i) => ({
      ...a,
      id: `ai-app-${Date.now()}-${i}`,
    }));

    const strs: Structure[] = extracted.structures.map((s, i) => ({
      ...s,
      id: `ai-str-${Date.now()}-${i}`,
    }));

    const nextProject: Project = {
      ...activeProject,
      pipeSegments: [...activeProject.pipeSegments, ...pipes],
      appurtenances: [...activeProject.appurtenances, ...apps],
      structures: [...activeProject.structures, ...strs],
      unclearItems: [...(activeProject.unclearItems || []), ...extracted.unclearItems],
      lastUpdated: new Date().toISOString()
    };

    handleUpdateProjectInfo(nextProject);
    setActivePage('project'); // Take back to project surveys table to review
  };

  const handleApplyAIExtractedAndGenerateCosting = (extracted: {
    pipeSegments: Omit<PipeSegment, 'id'>[];
    appurtenances: Omit<Appurtenance, 'id'>[];
    structures: Omit<Structure, 'id'>[];
    unclearItems: string[];
  }) => {
    if (!activeProject) return;

    // 1. Set unique IDs
    const pipes: PipeSegment[] = extracted.pipeSegments.map((p, i) => ({
      ...p,
      id: `ai-p-seg-${Date.now()}-${i}`,
    }));

    const apps: Appurtenance[] = extracted.appurtenances.map((a, i) => ({
      ...a,
      id: `ai-app-${Date.now()}-${i}`,
    }));

    const strs: Structure[] = extracted.structures.map((s, i) => ({
      ...s,
      id: `ai-str-${Date.now()}-${i}`,
    }));

    const nextProject: Project = {
      ...activeProject,
      pipeSegments: pipes,
      appurtenances: apps,
      structures: strs,
      unclearItems: extracted.unclearItems,
      status: 'Engineer Reviewed',
      lastUpdated: new Date().toISOString()
    };

    // Update active project
    setProjects(projects.map((p) => (p.id === nextProject.id ? nextProject : p)));
    setActiveProject(nextProject);

    // Run synchronization directly on nextProject to build BOQ and BOM immediately!
    syncConfirmedEngineeringDataToCosting(nextProject.id, nextProject);

    // Force redirection to project statistics summaries
    setActivePage('dashboard');

    handleAddAuditLog(
      'Evaluated costings automatically from confirmed survey items successfully',
      'Staged drawing preview list',
      'Auto matched layout with price libraries.'
    );
  };

  // Direct actions triggers advancing status timeline
  const handleApproveBOQQuantities = () => {
    if (!activeProject) return;
    const nextProject: Project = { ...activeProject, status: 'BOQ Approved' };
    handleUpdateProjectInfo(nextProject);
    handleAddAuditLog('Approved & Locked BOQ items list', 'Draft Review', 'BOQ Approved');
    setActivePage('rap'); // take to RAP pricing page immediately!
    alert('Bill of Quantities has been locked & approved. Generating calculations inside the RAP COST center now.');
  };

  const handleApproveRAPCosts = () => {
    if (!activeProject) return;
    const nextProject: Project = { ...activeProject, status: 'RAP Approved' };
    handleUpdateProjectInfo(nextProject);
    handleAddAuditLog('Approved & Recalculation locked for RAP Costing elements', 'BOQ Locked', 'RAP Approved');
    setActivePage('profit'); // take to PO vs RAP summary page!
    alert('Rencana Anggaran Pelaksanaan (RAP) costs are locked and approved. Heading to Profit margin review diagnostics.');
  };

  const calculateOverallRAP = () => {
    return rapItems.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const handleLoadSampleCalculation = () => {
    // 1. Create custom AHSP templates with precise overridden costs as requested
    const sampleAHSPs: AHSPMaster[] = [
      {
        ahspCode: 'K-1-3.12',
        description: 'Pemasangan Pipa PVC Dia. 8 inch pada Tanah Biasa',
        unit: 'm',
        resources: [],
        calculatedUnitPrice: 196719,
        customLabour: 167786,
        customMaterial: 0,
        customEquipment: 28933,
        customUnitPrice: 196719
      },
      {
        ahspCode: 'HDPE-3-OC',
        description: 'Pemasangan Pipa HDPE Dia. 3 inch Open Cut',
        unit: 'm',
        resources: [],
        calculatedUnitPrice: 145000,
        customLabour: 45000,
        customMaterial: 85000,
        customEquipment: 15000,
        customUnitPrice: 145000
      },
      {
        ahspCode: 'BORE-3',
        description: 'Bore Crossing Pipa HDPE Dia. 3 inch',
        unit: 'm',
        resources: [],
        calculatedUnitPrice: 400000,
        customLabour: 120000,
        customMaterial: 95000,
        customEquipment: 185000,
        customUnitPrice: 400000
      },
      {
        ahspCode: 'GV-8',
        description: 'Gate Valve 8 inch Installation',
        unit: 'unit',
        resources: [],
        calculatedUnitPrice: 4200000,
        customLabour: 450000,
        customMaterial: 3500000,
        customEquipment: 250000,
        customUnitPrice: 4200000
      },
      {
        ahspCode: 'WM-3',
        description: 'Water Meter 3 inch Installation',
        unit: 'unit',
        resources: [],
        calculatedUnitPrice: 2100000,
        customLabour: 250000,
        customMaterial: 1750000,
        customEquipment: 100000,
        customUnitPrice: 2100000
      },
      {
        ahspCode: 'VC-8',
        description: 'Valve Chamber Construction',
        unit: 'unit',
        resources: [],
        calculatedUnitPrice: 6000000,
        customLabour: 1500000,
        customMaterial: 4000000,
        customEquipment: 500000,
        customUnitPrice: 6000000
      },
      {
        ahspCode: 'ASP-RESTORE',
        description: 'Asphalt Reinstatement',
        unit: 'm2',
        resources: [],
        calculatedUnitPrice: 200000,
        customLabour: 45000,
        customMaterial: 125000,
        customEquipment: 30000,
        customUnitPrice: 200000
      }
    ];

    // Merge into templates to preserve other AHSPs if any
    const nextTemplates = [...ahspTemplates];
    sampleAHSPs.forEach((s) => {
      const idx = nextTemplates.findIndex((ah) => ah.ahspCode === s.ahspCode);
      if (idx >= 0) {
        nextTemplates[idx] = s;
      } else {
        nextTemplates.push(s);
      }
    });

    // 2. Define direct target project
    const sampleProject: Project = {
      id: 'PRJ-DEMO-2026',
      name: 'New Connection Kelapa Gading',
      client: 'PT Air Bersih Jakarta',
      location: 'Kelapa Gading, Jakarta Utara',
      projectType: 'New Connection',
      surveyDate: '2026-06-19',
      surveyEngineer: 'Engineering BPM',
      poValue: 250000000,
      status: 'Draft',
      pipeSegments: [
        {
          id: 'demo-s-1',
          segmentId: 'S-01',
          pipeMaterial: 'PVC',
          diameter: '8 inch',
          lengthM: 100,
          installationMethod: 'Open Cut',
          groundCondition: 'Normal Soil',
          surfaceType: 'Asphalt',
          notes: 'Main distribution pipe installation'
        },
        {
          id: 'demo-s-2',
          segmentId: 'S-02',
          pipeMaterial: 'HDPE',
          diameter: '3 inch',
          lengthM: 70,
          installationMethod: 'Open Cut',
          groundCondition: 'Normal Soil',
          surfaceType: 'Concrete',
          notes: 'Service connection pipe'
        },
        {
          id: 'demo-s-3',
          segmentId: 'S-03',
          pipeMaterial: 'HDPE',
          diameter: '3 inch',
          lengthM: 18,
          installationMethod: 'Bore',
          groundCondition: 'Normal Soil',
          surfaceType: 'Asphalt',
          notes: 'Bore crossing under road'
        }
      ],
      appurtenances: [
        {
          id: 'demo-a-1',
          type: 'Gate Valve',
          diameter: '8 inch',
          quantity: 2,
          linkedSegment: 'S-01',
          notes: ''
        },
        {
          id: 'demo-a-2',
          type: 'Water Meter',
          diameter: '3 inch',
          quantity: 1,
          linkedSegment: 'S-02',
          notes: ''
        },
        {
          id: 'demo-a-3',
          type: 'Tee',
          diameter: '8 inch',
          quantity: 1,
          linkedSegment: 'S-01',
          notes: ''
        }
      ],
      structures: [
        {
          id: 'demo-st-1',
          type: 'Valve Chamber',
          quantity: 2,
          linkedSegment: 'S-01',
          notes: ''
        },
        {
          id: 'demo-st-2',
          type: 'Meter Chamber',
          quantity: 1,
          linkedSegment: 'S-02',
          notes: ''
        }
      ],
      unclearItems: [],
      notes: 'Kelapa Gading high pressure grid extension demo calculation',
      lastUpdated: new Date().toISOString()
    };

    // 3. Define the linked BOQ list
    const sampleBOQs: BOQItem[] = [
      {
        id: 'boq-demo-1',
        itemCode: 'BOQ-001',
        description: 'Pemasangan Pipa PVC Dia. 8 inch pada Tanah Biasa',
        quantity: 100,
        unit: 'm',
        source: 'Auto Generated',
        ahspStatus: 'Matched',
        ahspCode: 'K-1-3.12',
        notes: 'Main distribution pipe installation'
      },
      {
        id: 'boq-demo-2',
        itemCode: 'BOQ-002',
        description: 'Pemasangan Pipa HDPE Dia. 3 inch Open Cut',
        quantity: 70,
        unit: 'm',
        source: 'Auto Generated',
        ahspStatus: 'Matched',
        ahspCode: 'HDPE-3-OC',
        notes: 'Service connection pipe'
      },
      {
        id: 'boq-demo-3',
        itemCode: 'BOQ-003',
        description: 'Bore Crossing Pipa HDPE Dia. 3 inch',
        quantity: 18,
        unit: 'm',
        source: 'Auto Generated',
        ahspStatus: 'Matched',
        ahspCode: 'BORE-3',
        notes: 'Bore crossing under road'
      },
      {
        id: 'boq-demo-4',
        itemCode: 'BOQ-004',
        description: 'Gate Valve 8 inch Installation',
        quantity: 2,
        unit: 'unit',
        source: 'Auto Generated',
        ahspStatus: 'Matched',
        ahspCode: 'GV-8',
        notes: 'Gate Valve installation linked with S-01'
      },
      {
        id: 'boq-demo-5',
        itemCode: 'BOQ-005',
        description: 'Water Meter 3 inch Installation',
        quantity: 1,
        unit: 'unit',
        source: 'Auto Generated',
        ahspStatus: 'Matched',
        ahspCode: 'WM-3',
        notes: 'Water Meter Installation linked with S-02'
      },
      {
        id: 'boq-demo-6',
        itemCode: 'BOQ-006',
        description: 'Valve Chamber Construction',
        quantity: 2,
        unit: 'unit',
        source: 'Auto Generated',
        ahspStatus: 'Matched',
        ahspCode: 'VC-8',
        notes: 'Valve Chamber construction linked with S-01'
      },
      {
        id: 'boq-demo-7',
        itemCode: 'BOQ-007',
        description: 'Asphalt Reinstatement',
        quantity: 100,
        unit: 'm2',
        source: 'Auto Generated',
        ahspStatus: 'Matched',
        ahspCode: 'ASP-RESTORE',
        notes: 'Asphalt reinstatement for PVC pipe trench'
      }
    ];

    // Append to projects
    const hasProject = projects.some((p) => p.id === 'PRJ-DEMO-2026');
    const updatedProjects = hasProject
      ? projects.map((p) => (p.id === 'PRJ-DEMO-2026' ? sampleProject : p))
      : [sampleProject, ...projects];

    const sampleBOMs: BOMItem[] = [
      {
        id: 'bom-demo-i1',
        projectId: 'PRJ-DEMO-2026',
        materialCode: 'MAT-PVC-200',
        description: 'PVC Pipe Dia. 8 inch AW Class',
        category: 'Pipe Line',
        linkedBOQRef: 'BOQ-001',
        linkedBOQDesc: 'Pemasangan Pipa PVC Dia. 8 inch pada Tanah Biasa',
        ahspCode: 'K-1-3.12',
        requiredQuantity: 100,
        wasteAllowance: 5,
        finalRequiredQuantity: 105,
        unit: 'm',
        unitPrice: 150000,
        materialCost: 15750000,
        vehicleRetributionCost: 1260000, // 8% bulk transport
        finalLandedCost: 17010000,
        supplier: 'PT Wavin Indonesia',
        procurementStatus: 'Sourced',
        notes: 'High-grade PVC pipe supply'
      },
      {
        id: 'bom-demo-i2',
        projectId: 'PRJ-DEMO-2026',
        materialCode: 'MAT-HDPE-90',
        description: 'HDPE Pipe Dia. 3 inch SDR-17 PN10',
        category: 'Pipe Line',
        linkedBOQRef: 'BOQ-002',
        linkedBOQDesc: 'Pemasangan Pipa HDPE Dia. 3 inch Open Cut',
        ahspCode: 'HDPE-3-OC',
        requiredQuantity: 70,
        wasteAllowance: 5,
        finalRequiredQuantity: 73.5,
        unit: 'm',
        unitPrice: 84500,
        materialCost: 6210750,
        vehicleRetributionCost: 496860,
        finalLandedCost: 6707610,
        supplier: 'PT Vinilon Group',
        procurementStatus: 'Sourced',
        notes: 'SDR 17 compliance report active'
      },
      {
        id: 'bom-demo-i3',
        projectId: 'PRJ-DEMO-2026',
        materialCode: 'MAT-VALVE-200',
        description: 'Gate Valve 8 inch SNI Standard Flanged',
        category: 'Pipe Line Connection',
        linkedBOQRef: 'BOQ-004',
        linkedBOQDesc: 'Gate Valve 8 inch Installation',
        ahspCode: 'GV-8',
        requiredQuantity: 2,
        wasteAllowance: 0,
        finalRequiredQuantity: 2,
        unit: 'unit',
        unitPrice: 3450000,
        materialCost: 6900000,
        vehicleRetributionCost: 138000, // 2% accessory
        finalLandedCost: 7038000,
        supplier: 'PT Bestindo Vendor',
        procurementStatus: 'Purchased',
        notes: 'Delivered to central block warehouse'
      },
      {
        id: 'bom-demo-i4',
        projectId: 'PRJ-DEMO-2026',
        materialCode: 'MAT-SAND',
        description: 'River Sand Bedding bulk',
        category: 'Earthworks',
        linkedBOQRef: 'BOQ-006',
        linkedBOQDesc: 'Valve Chamber Construction',
        ahspCode: 'VC-8',
        requiredQuantity: 12,
        wasteAllowance: 10,
        finalRequiredQuantity: 13.2,
        unit: 'm3',
        unitPrice: 190000,
        materialCost: 2508000,
        vehicleRetributionCost: 200640,
        finalLandedCost: 2708640,
        supplier: 'Depo Pasir Merak',
        procurementStatus: 'Draft',
        notes: 'Coarse sand bedding layer backfill'
      },
      {
        id: 'bom-demo-i5',
        projectId: 'PRJ-DEMO-2026',
        materialCode: 'MAT-PORTLAND',
        description: 'Portland Cement Type 1 PCC',
        category: 'Civil Structure',
        linkedBOQRef: 'BOQ-006',
        linkedBOQDesc: 'Valve Chamber Construction',
        ahspCode: 'VC-8',
        requiredQuantity: 120,
        wasteAllowance: 5,
        finalRequiredQuantity: 126,
        unit: 'sak',
        unitPrice: 68000,
        materialCost: 8568050,
        vehicleRetributionCost: 171360,
        finalLandedCost: 8739410,
        supplier: 'Semen Tiga Roda',
        procurementStatus: 'Draft',
        notes: 'Heavy grade construct bags'
      },
      {
        id: 'bom-demo-i6',
        projectId: 'PRJ-DEMO-2026',
        materialCode: 'MAT-ASPHALT',
        description: 'Asphalt Topping AC-WC Hotmix',
        category: 'Pavement Reinstatement',
        linkedBOQRef: 'BOQ-007',
        linkedBOQDesc: 'Asphalt Reinstatement',
        ahspCode: 'ASP-RESTORE',
        requiredQuantity: 100,
        wasteAllowance: 10,
        finalRequiredQuantity: 110,
        unit: 'm2',
        unitPrice: 115000,
        materialCost: 12650000,
        vehicleRetributionCost: 1012000,
        finalLandedCost: 13662000,
        supplier: 'PT Aspal Jawa',
        procurementStatus: 'Draft',
        notes: 'Priority road reinstatement project'
      }
    ];

    setProjects(updatedProjects);
    setActiveProject(sampleProject);
    setActiveProjectId('PRJ-DEMO-2026');
    setAhspTemplates(nextTemplates);
    setBOQItems(sampleBOQs);
    setBOMItems(sampleBOMs);

    // Audit Log event
    const auditItem: AuditLog = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      projectId: 'PRJ-DEMO-2026',
      operator: 'engineering@bpm.co.id',
      details: 'Sample calculation data loaded',
      oldValue: 'System Empty / Draft initialization',
      newValue: 'PRJ-DEMO-2026 Active demo project state loaded',
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
  };

  const handleClearCurrentProjectData = () => {
    if (!activeProject) return;

    const clearedId = activeProject.id;
    const clearedName = activeProject.name;

    // Reset list states for active project in React
    setBOQItems([]);
    setBOMItems([]);
    setRAPItems([]);
    setPriceSources(INITIAL_PRICE_SOURCES);
    setUploadedFilesMetadata([]);

    // Add Audit Log
    const auditItem: AuditLog = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      projectId: clearedId,
      operator: 'engineering@bpm.co.id',
      details: 'Current project data was fully cleared and reset.',
      oldValue: clearedName,
      newValue: 'Clean empty workspace initialized for current project.',
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditItem, ...prev]);

    // Save empty states into active project records bundle immediately
    saveProjectData(clearedId, {
      activeProject,
      boqItems: [],
      bomItems: [],
      priceSources: INITIAL_PRICE_SOURCES,
      rapItems: [],
      auditLogs: [auditItem],
      uploadedFilesMetadata: []
    });

    showToast(`Current project "${clearedName}" data fully cleared.`, 'info');
  };

  const handleCreateNewBlankProject = (name = 'New Water Pipeline Project') => {
    const blankProjectId = `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const freshDoc: Project = {
      id: blankProjectId,
      name: name,
      client: 'BPM Developer',
      location: 'Jakarta',
      projectType: 'Water Pipeline Costing',
      surveyDate: new Date().toISOString().split('T')[0],
      surveyEngineer: 'engineering@bpm.co.id',
      poValue: 0,
      status: 'Draft',
      pipeSegments: [],
      appurtenances: [],
      structures: [],
      lastUpdated: new Date().toISOString()
    };

    const nextProjects = [...projects, freshDoc];
    setProjects(nextProjects);
    setActiveProject(freshDoc);
    setActiveProjectId(blankProjectId);
    setBOQItems([]);
    setBOMItems([]);
    setRAPItems([]);
    setPriceSources(INITIAL_PRICE_SOURCES);

    const auditItem: AuditLog = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      projectId: blankProjectId,
      operator: 'engineering@bpm.co.id',
      details: 'New project initialized',
      oldValue: '',
      newValue: name,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditItem, ...prev]);

    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjects));
    localStorage.setItem(STORAGE_BOQ_KEY, JSON.stringify([]));
    localStorage.setItem(STORAGE_BOM_KEY, JSON.stringify([]));
    localStorage.setItem(STORAGE_PRICE_SOURCES_KEY, JSON.stringify(INITIAL_PRICE_SOURCES));
    localStorage.setItem('bpm_active_project_id_v3', blankProjectId);

    showToast(`Started new project: ${name}`, 'success');
    return freshDoc;
  };

  const handleClearEntireProject = () => {
    // Create audit item
    const auditItem: AuditLog = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      projectId: 'RESET-CLEARED',
      operator: 'engineering@bpm.co.id',
      details: 'Entire project database purged by administrator sign-off',
      oldValue: activeProject?.name || 'Active',
      newValue: 'Clean empty workstation initialized.',
      timestamp: new Date().toISOString()
    };

    setProjects([]);
    setActiveProject(null);
    setActiveProjectId('');
    setBOQItems([]);
    setBOMItems([]);
    setRAPItems([]);
    setPriceSources(INITIAL_PRICE_SOURCES);
    setAuditLogs([auditItem]);
    setActivePage('dashboard');

    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify([]));
    localStorage.setItem(STORAGE_BOQ_KEY, JSON.stringify([]));
    localStorage.setItem(STORAGE_BOM_KEY, JSON.stringify([]));
    localStorage.setItem(STORAGE_PRICE_SOURCES_KEY, JSON.stringify(INITIAL_PRICE_SOURCES));
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify([auditItem]));
    localStorage.removeItem('bpm_active_project_id_v3');

    showToast('Project database completely cleared. Initialized fresh workstation.', 'success');
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800">
      
      {/* SIDE CONTROL */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={(p) => setActivePage(p as PageId)} 
        projectName={activeProject?.name || ''} 
        projectStatus={activeProject?.status || 'Draft'}
        onClearCurrentProject={() => setShowClearModal('sample')}
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitchProject={handleSwitchProject}
        onNewProjectClick={() => setIsCreateNewModalOpen(true)}
        onSaveProjectClick={() => saveProjectData(activeProjectId)}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedAt}
      />

      {/* COMPONENT BODY VIEWPORTS */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* UPPER HEADER BAR */}
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-700 flex items-center justify-center rounded shrink-0 shadow-sm">
              <span className="text-white font-bold text-xs uppercase">BPM</span>
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-800 hidden md:block">
              BPM Engineering RAP Automation System
            </h1>
            {projects.length > 1 && (
              <select
                value={activeProjectId}
                onChange={(e) => {
                  handleSwitchProject(e.target.value);
                }}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:border-blue-500 font-medium text-slate-700 ml-2 shadow-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Global Saving Module */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1 bg-slate-50/75 rounded-lg">
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    saveStatus === 'Saving' ? 'bg-blue-500 animate-pulse' :
                    saveStatus === 'Saved' ? 'bg-emerald-500' :
                    saveStatus === 'Save Failed' ? 'bg-rose-500' :
                    'bg-amber-500 animate-pulse'
                  }`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    saveStatus === 'Saving' ? 'text-blue-600 animate-pulse' :
                    saveStatus === 'Saved' ? 'text-emerald-700 font-medium' :
                    saveStatus === 'Save Failed' ? 'text-rose-600' :
                    'text-amber-700 font-extrabold'
                  }`}>
                    {saveStatus}
                  </span>
                </div>
                {lastSavedTime ? (
                  <span className="text-[8px] text-slate-400 font-mono font-medium block">
                    Saved: {lastSavedTime}
                  </span>
                ) : (
                  <span className="text-[8px] text-slate-400 font-mono font-medium block">
                    Unsaved
                  </span>
                )}
              </div>
              
              <button
                onClick={() => saveProjectData(activeProjectId)}
                disabled={isSavingProject}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all select-none duration-150 cursor-pointer ${
                  isProjectDirty 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                Save Project
              </button>
            </div>

            <div className="h-4 border-r border-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-wider text-slate-550 font-semibold font-mono hidden md:inline">Server Online</span>
            </div>

            <div className="h-4 border-r border-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-650">
                BM
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-705 leading-none">Engineering BPM</div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">engineering@bpm.co.id</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto max-w-[1400px] w-full mx-auto">
          {activePage === 'projects' ? (
            <ProjectsPage
              projects={projects}
              activeProjectId={activeProjectId}
              onOpenProject={loadProjectData}
              onDuplicateProject={handleDuplicateProject}
              onArchiveProject={handleArchiveProject}
              onDeleteProject={handleDeleteProject}
              onNewProjectClick={() => setIsCreateNewModalOpen(true)}
            />
          ) : activeProject ? (
            <>
              {activePage === 'dashboard' && (
                <Dashboard 
                  project={activeProject} 
                  boqItems={boqItems} 
                  rapItems={rapItems} 
                  bomItems={bomItems}
                  calculateOverallRAP={calculateOverallRAP}
                  setActivePage={(page) => setActivePage(page as PageId)}
                  onLoadSample={handleLoadSampleCalculation}
                  onClearSample={handleClearCurrentProjectData}
                  isSampleLoaded={activeProject?.id === 'PRJ-DEMO-2026'}
                  onSyncCosting={() => syncConfirmedEngineeringDataToCosting(activeProject.id)}
                />
              )}

              {activePage === 'project' && (
                <ProjectDetails 
                  project={activeProject} 
                  updateProject={handleUpdateProjectInfo}
                  addAuditLog={handleAddAuditLog}
                  onLoadSample={handleLoadSampleCalculation}
                  onClearSample={handleClearCurrentProjectData}
                  isSampleLoaded={activeProject?.id === 'PRJ-DEMO-2026'}
                  locationProfiles={locationIndexProfiles}
                />
              )}

              {activePage === 'import-center' && (
                <DataImportCenter 
                  materials={materials}
                  setMaterials={handleUpdateMaterialsList}
                  labours={labours}
                  setLabours={handleUpdateLabourList}
                  equipments={equipments}
                  setEquipments={handleUpdateEquipmentList}
                  ahspTemplates={ahspTemplates}
                  setAhspTemplates={handleUpdateAHSPTemplatelist}
                  boqItems={boqItems}
                  setBOQItems={setBOQItems}
                  addAuditLog={handleAddAuditLog}
                  setActivePage={setActivePage}
                />
              )}

              {activePage === 'upload' && (
                <ExcelUpload 
                  onImportBOQs={(items) => {
                    setBOQItems(items);
                    setActivePage('boq');
                  }}
                  onCancel={() => setActivePage('dashboard')}
                  addAuditLog={handleAddAuditLog}
                  onLoadSample={handleLoadSampleCalculation}
                  onClearSample={handleClearCurrentProjectData}
                  isSampleLoaded={activeProject?.id === 'PRJ-DEMO-2026'}
                />
              )}

              {activePage === 'ai-extract' && (
                <AIExtraction 
                  project={activeProject} 
                  onApplyExtractedData={handleApplyAIExtractedData}
                  onApplyExtractedAndCosting={handleApplyAIExtractedAndGenerateCosting}
                  addAuditLog={handleAddAuditLog}
                  onUpdateProjectInfo={handleUpdateProjectInfo}
                  boqItems={boqItems}
                  setBOQItems={setBOQItems}
                  bomItems={bomItems}
                  setBOMItems={setBOMItems}
                  priceSources={priceSources}
                  setPriceSources={setPriceSources}
                  materials={materials}
                  labours={labours}
                  equipments={equipments}
                  ahspTemplates={ahspTemplates}
                  setAhspTemplates={setAhspTemplates}
                />
              )}

              {activePage === 'button-qa' && (
                <ButtonQA
                  onManualSave={() => saveProjectData(activeProjectId)}
                  onLoadSample={handleLoadSampleCalculation}
                  onClearSample={() => setShowClearModal('sample')}
                  onClearEntire={() => setShowClearModal('entire')}
                  onApproveBOQ={handleApproveBOQQuantities}
                  onApproveRAP={handleApproveRAPCosts}
                  projectStatus={activeProject.status}
                  projectName={activeProject.name}
                  boqCount={boqItems.length}
                  bomCount={bomItems.length}
                  priceCount={priceSources.length}
                  auditCount={auditLogs.length}
                />
              )}

              {activePage === 'price-sources' && (
                <PriceSourcesCenter
                  priceSources={priceSources}
                  setPriceSources={setPriceSources}
                  materials={materials}
                  labours={labours}
                  equipments={equipments}
                  onUpdateMaterialPrice={(itemCode, newPrice) => {
                    const nextMaterials = materials.map((m) =>
                      m.materialCode === itemCode ? { ...m, currentRecommendedPrice: newPrice } : m
                    );
                    setMaterials(nextMaterials);
                    setAhspTemplates(getHydratedAHSPs(nextMaterials, labours, equipments));
                  }}
                  addAuditLog={handleAddAuditLog}
                />
              )}

              {activePage === 'boq' && (
                <BOQTableComponent 
                  boqItems={boqItems} 
                  ahspMaster={ahspTemplates} 
                  updateBOQItems={handleUpdateBOQList}
                  projectStatus={activeProject.status}
                  onApproveBOQ={handleApproveBOQQuantities}
                  addAuditLog={handleAddAuditLog}
                />
              )}

              {activePage === 'bom' && (
                <BillOfMaterials 
                  project={activeProject}
                  boqItems={boqItems}
                  bomItems={bomItems}
                  setBOMItems={setBOMItems}
                  materialMaster={materials}
                  ahspTemplates={ahspTemplates}
                  addAuditLog={handleAddAuditLog}
                />
              )}

              {activePage === 'rap' && (
                <RAPTableComponent 
                  boqItems={boqItems} 
                  ahspMaster={ahspTemplates} 
                  materials={materials} 
                  labours={labours} 
                  equipments={equipments} 
                  rapItems={rapItems}
                  updateRAPItems={setRAPItems}
                  projectStatus={activeProject.status}
                  onApproveRAP={handleApproveRAPCosts}
                  addAuditLog={handleAddAuditLog}
                />
              )}

              {activePage === 'profit' && (
                <ProfitSummary 
                  project={activeProject} 
                  rapItems={rapItems} 
                  calculateOverallRAP={calculateOverallRAP}
                  setActivePage={(page) => setActivePage(page as PageId)}
                  onLoadSample={handleLoadSampleCalculation}
                  onClearSample={handleClearCurrentProjectData}
                  isSampleLoaded={activeProject?.id === 'PRJ-DEMO-2026'}
                />
              )}

              {activePage === 'master-data' && (
                <MasterDataManagement 
                  materials={materials}
                  setMaterials={handleUpdateMaterialsList}
                  labours={labours}
                  setLabours={handleUpdateLabourList}
                  equipments={equipments}
                  setEquipments={handleUpdateEquipmentList}
                  ahspTemplates={ahspTemplates}
                  setAhspTemplates={handleUpdateAHSPTemplatelist}
                  addAuditLog={handleAddAuditLog}
                  locationProfiles={locationIndexProfiles}
                  setLocationProfiles={setLocationIndexProfiles}
                />
              )}

              {activePage === 'audit' && (
                <ApprovalAudit 
                  project={activeProject} 
                  updateProject={handleUpdateProjectInfo}
                  auditLogs={auditLogs}
                  addAuditLog={handleAddAuditLog}
                  boqItems={boqItems}
                  rapItems={rapItems}
                  bomItems={bomItems}
                />
              )}

              {activePage === 'flowchart' && (
                <ProcessFlowchart 
                  setActivePage={(page) => setActivePage(page as PageId)}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto py-12 px-6">
              {!isInitialized ? (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                  <p className="font-medium font-sans">Initializing PT Bestindo Putra Mandiri costing environment...</p>
                </div>
              ) : (
                <div className="text-center space-y-8 animate-fadeIn w-full">
                  <div className="w-16 h-16 bg-blue-50 text-blue-700 flex items-center justify-center rounded-2xl mx-auto shadow-sm border border-blue-100">
                    <LayoutGrid className="w-8 h-8 text-blue-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                      No project data available.
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-sans max-w-md mx-auto">
                      Start a new project, upload a BOQ, import a DED drawing, or load a demo project.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-xl mx-auto">
                    {/* OPTION 1: START NEW */}
                    <button
                      type="button"
                      id="empty-action-new-project"
                      onClick={() => {
                        handleCreateNewBlankProject('New Water Pipeline Project');
                        setActivePage('project');
                      }}
                      className="group p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl text-left shadow-xs transition-all duration-150 flex flex-col gap-3 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shrink-0">
                        <Plus className="w-4 h-4 text-blue-650" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Start New Project</h4>
                        <p className="text-[11px] text-slate-400 font-sans leading-normal mt-0.5">Initialize a blank water pipe survey costing file</p>
                      </div>
                    </button>

                    {/* OPTION 2: UPLOAD BOQ */}
                    <button
                      type="button"
                      id="empty-action-upload-boq"
                      onClick={() => {
                        handleCreateNewBlankProject('Project with Uploaded BOQ');
                        setActivePage('import-center');
                      }}
                      className="group p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl text-left shadow-xs transition-all duration-150 flex flex-col gap-3 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-sans">Upload BOQ</h4>
                        <p className="text-[11px] text-slate-400 font-sans leading-normal mt-0.5">Import Excel schedule of rates / bill of quantities</p>
                      </div>
                    </button>

                    {/* OPTION 3: IMPORT DED DRAWING */}
                    <button
                      type="button"
                      id="empty-action-ded-scan"
                      onClick={() => {
                        handleCreateNewBlankProject('Project with DED Scan');
                        setActivePage('ai-extract');
                      }}
                      className="group p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl text-left shadow-xs transition-all duration-150 flex flex-col gap-3 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 group-hover:bg-teal-100 text-teal-650 flex items-center justify-center transition-colors shrink-0">
                        <FileText className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-sans">Import DED Drawing</h4>
                        <p className="text-[11px] text-slate-400 font-sans leading-normal mt-0.5">Extract pipe coordinates and segments from Sketch scans</p>
                      </div>
                    </button>

                    {/* OPTION 4: LOAD DEMO PROJECT */}
                    <button
                      type="button"
                      id="empty-action-load-demo"
                      onClick={() => {
                        handleLoadSampleCalculation();
                        setActivePage('dashboard');
                      }}
                      className="group p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl text-left shadow-xs transition-all duration-150 flex flex-col gap-3 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors shrink-0 font-sans">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-sans">Load Demo Project</h4>
                        <p className="text-[11px] text-slate-400 font-sans leading-normal mt-0.5">Populate application with fully hydrated BPM calculations</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

      </div>

      {/* Global Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-55 flex items-center gap-2.5 bg-slate-900 border border-slate-750 text-slate-100 rounded-lg py-3 px-4 shadow-xl text-xs max-w-sm animate-bounce">
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-400 animate-ping' :
            toast.type === 'error' ? 'bg-rose-500 animate-ping' :
            'bg-amber-400 animate-ping'
          }`} />
          <p className="font-semibold leading-relaxed tracking-wide text-slate-200">{toast.message}</p>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-200 transition-colors pl-2 text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Safe Confirmation Dialog Modals */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <AlertCircle className={`w-5 h-5 ${showClearModal === 'entire' ? 'text-red-650 text-red-600' : 'text-red-600'}`} />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {showClearModal === 'entire' ? 'Purge Entire Project Database?' : 'Clear Current Project Data?'}
              </h3>
            </div>

            {showClearModal === 'entire' ? (
              <div className="space-y-3">
                <p className="text-slate-550 leading-relaxed text-slate-500">
                  This is a critical operation. This will purge all active pricing entries, uploaded BOQs, AI scanning logs, and reset the environment to a clean fresh slate.
                </p>
                <div className="p-2.5 bg-rose-50/50 border border-rose-150 rounded text-[11px] text-red-750">
                  To confirm, please type active project name: <strong className="font-bold font-mono text-xs text-red-800">"{activeProject?.name}"</strong> below.
                </div>
                <input
                  type="text"
                  placeholder="Type active project name..."
                  value={projectNameConfirm}
                  onChange={(e) => setProjectNameConfirm(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:bg-white text-xs font-mono"
                />
              </div>
            ) : (
              <p className="text-slate-550 leading-relaxed text-slate-500">
                Are you sure you want to clear all data entered, imported, generated, or calculated for the currently active project <span className="font-bold text-slate-800">"{activeProject?.name || 'Untitled'}"</span>? This will reset the workspace for this project to a clean empty state.
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(null);
                  setProjectNameConfirm('');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded font-bold cursor-pointer font-sans"
              >
                No, Keep Data
              </button>
              
              {showClearModal === 'entire' ? (
                <button
                  type="button"
                  disabled={projectNameConfirm !== activeProject?.name}
                  onClick={() => {
                    handleClearEntireProject();
                    setShowClearModal(null);
                    setProjectNameConfirm('');
                  }}
                  className={`px-4 py-1.5 rounded font-bold text-white transition-opacity select-none ${
                    projectNameConfirm === activeProject?.name
                      ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                      : 'bg-red-300 opacity-60 cursor-not-allowed'
                  }`}
                >
                  Unlinked Purge All
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleClearCurrentProjectData();
                    setShowClearModal(null);
                  }}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer font-sans"
                >
                  Yes, Clear Project Data
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DED COSTING GENERATOR SUMMARY MODAL */}
      {costingResult && (
        <div id="costing-result-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">DED Costing Result Summary</h3>
              </div>
              <button 
                onClick={() => setCostingResult(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                The costing pipeline processed the confirmed engineering layout. Standard quantity take-offs have been evaluated, matched to regional coefficient and labor weights:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Processed Items</div>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">{costingResult.processed}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Pipes / Fittings / Strs</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Matched AHSP</div>
                  <div className="text-lg font-bold text-blue-600 mt-0.5">{costingResult.ahspCount}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Job rate build-ups</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-sans text-emerald-750">BOQ Items</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">{costingResult.boqCount} lines</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Quantities Take-Off</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">BOM Items</div>
                  <div className="text-lg font-bold text-indigo-600 mt-0.5">{costingResult.bomCount} items</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Material requirements</div>
                </div>

                <div className="p-3 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-yellow-600 tracking-wider font-sans">Price Reviews</div>
                  <div className="text-lg font-bold text-yellow-700 mt-0.5">{costingResult.reviewCount} materials</div>
                  <div className="text-[9px] text-slate-450 mt-0.5">Missing supplier prices</div>
                </div>

                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-red-650 tracking-wider font-sans">Blocked survey</div>
                  <div className="text-lg font-bold text-red-700 mt-0.5">{costingResult.blockedCount} items</div>
                  <div className="text-[9px] text-slate-450 mt-0.5 font-sans">Require parameter review</div>
                </div>
              </div>

              {costingResult.blockedCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 leading-normal text-[11px] flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Heads up:</span> {costingResult.blockedCount} confirmed items could not be costed. Please go to the <strong>Survey Details</strong> screen to resolve these issues manually.
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button 
                onClick={() => setCostingResult(null)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW ENGINEERING PROJECT */}
      {isCreateNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh] md:max-h-none">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider font-sans">
                  Create New Engineering Project
                </h3>
              </div>
              <button 
                onClick={() => setIsCreateNewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh] md:max-h-none">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Required */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs text-blue-700 uppercase tracking-wider border-b border-blue-50 pb-1">
                    Required Details
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Project Name *
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. SPAM Buaran III"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Client Name *
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. PT Bestindo Putra Mandiri"
                      value={newProjClient}
                      onChange={(e) => setNewProjClient(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Target Contract PO Value (IDR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">Rp</span>
                      <input 
                        type="number"
                        placeholder="e.g. 15000000000"
                        value={newProjPOValue}
                        onChange={(e) => setNewProjPOValue(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Survey Date *
                      </label>
                      <input 
                        type="date"
                        value={newProjDate}
                        onChange={(e) => setNewProjDate(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Lead Engineer *
                      </label>
                      <input 
                        type="text"
                        placeholder="Lead Engineer"
                        value={newProjEngineer}
                        onChange={(e) => setNewProjEngineer(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Location & Optional */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs text-blue-700 uppercase tracking-wider border-b border-blue-50 pb-1">
                    Location & Site Specs
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Province *
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Jakarta"
                        value={newProjProvince}
                        onChange={(e) => setNewProjProvince(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        City / Regency *
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Jakarta Timur"
                        value={newProjCity}
                        onChange={(e) => setNewProjCity(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        District *
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Kramat Jati"
                        value={newProjDistrict}
                        onChange={(e) => setNewProjDistrict(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1 text-slate-400">
                        Site Area (Optional)
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Site Zone 3B"
                        value={newProjArea}
                        onChange={(e) => setNewProjArea(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1 text-slate-400">
                        Duration (Months)
                      </label>
                      <input 
                        type="number"
                        placeholder="e.g. 12"
                        value={newProjDuration}
                        onChange={(e) => setNewProjDuration(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1 text-slate-400">
                        Remote Location?
                      </label>
                      <select
                        value={newProjRemoteFlag}
                        onChange={(e) => setNewProjRemoteFlag(e.target.value as 'Yes' | 'No')}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800 shadow-xs bg-white"
                      >
                        <option value="No">No (Standard Base)</option>
                        <option value="Yes">Yes (Remote Multiplier)</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateNewModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-150 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newProjName.trim() || !newProjClient.trim()) {
                    showToast('Please specify Project and Client names.', 'error');
                    return;
                  }

                  const blankProjectId = `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                  const newProjObj: Project = {
                    id: blankProjectId,
                    name: newProjName.trim(),
                    client: newProjClient.trim(),
                    location: `${newProjDistrict.trim() || 'Site'}, ${newProjCity.trim() || 'Location'}`,
                    projectType: 'Water Pipeline Costing',
                    surveyDate: newProjDate,
                    surveyEngineer: newProjEngineer.trim() || 'engineering@bpm.co.id',
                    poValue: Number(newProjPOValue) || 0,
                    status: 'Draft',
                    pipeSegments: [],
                    appurtenances: [],
                    structures: [],
                    lastUpdated: new Date().toISOString()
                  };

                  // Store optional extended fields on project metadata safely
                  (newProjObj as any).siteArea = newProjArea.trim();
                  (newProjObj as any).durationMonths = Number(newProjDuration) || 12;
                  (newProjObj as any).isRemote = newProjRemoteFlag === 'Yes';
                  (newProjObj as any).province = newProjProvince.trim();
                  (newProjObj as any).city = newProjCity.trim();
                  (newProjObj as any).district = newProjDistrict.trim();

                  // Append to projects list
                  const nextProjectsList = [...projects, newProjObj];
                  setProjects(nextProjectsList);
                  localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextProjectsList));

                  // Reset form fields
                  setNewProjName('');
                  setNewProjClient('');
                  setNewProjPOValue('0');
                  setNewProjArea('');
                  setNewProjDate(new Date().toISOString().split('T')[0]);
                  setNewProjEngineer('engineering@bpm.co.id');
                  setNewProjDuration('12');
                  setNewProjRemoteFlag('No');

                  // Close modal & auto-load sandbox environment
                  setIsCreateNewModalOpen(false);
                  loadProjectData(blankProjectId, nextProjectsList);
                  setActivePage('dashboard');
                  showToast(`Successfully created project "${newProjObj.name}"!`, 'success');
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl transition shadow-md cursor-pointer"
              >
                Create Project
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM PROJECT SWITCH WITH UNSAVED CHANGES */}
      {switchProjectTargetId && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-650 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-650" />
              </div>
              <h3 className="font-bold text-sm text-slate-850 uppercase tracking-wider font-sans">
                Unsaved Changes!
              </h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">
                You have unsaved edits in your current active project <strong>{activeProject?.name || 'Active Project'}</strong>. 
                Would you like to save before switching?
              </p>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSwitchProjectTargetId(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Switch without saving (discard changes)
                  const target = switchProjectTargetId;
                  setSwitchProjectTargetId(null);
                  loadProjectData(target);
                  setActivePage('dashboard');
                  showToast('Changes discarded.', 'info');
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition cursor-pointer text-center"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save first, then switch
                  const target = switchProjectTargetId;
                  setSwitchProjectTargetId(null);
                  saveProjectData(activeProjectId);
                  loadProjectData(target);
                  setActivePage('dashboard');
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl transition shadow-md cursor-pointer text-center"
              >
                Save & Switch
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
