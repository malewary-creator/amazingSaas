/**
 * Core Type Definitions for Shine Solar Management System
 */

// ==================== COMMON TYPES ====================

export type Status = 'active' | 'inactive' | 'deleted';

export interface BaseEntity {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  houseNo?: string;
  area?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  landmark?: string;
  locationMapLink?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ==================== USER MANAGEMENT ====================

export interface User extends BaseEntity {
  email: string;
  mobile: string;
  password?: string; // Hash stored
  name: string;
  role: number; // Role ID
  branchId?: number;
  profilePhoto?: string; // Base64 or file path
  status: Status;
  lastLogin?: Date;
}

export interface Role extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  status: Status;
}

export interface Permission {
  id?: number;
  roleId: number;
  module: string; // 'leads', 'projects', 'invoices', etc.
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';
  allowed: boolean;
}

// ==================== CUSTOMER & LEAD ====================

export type LeadSource = 'Referral' | 'Walk-in' | 'Social Media' | 'Website' | 'Advertisement' | 'Other';
export type LeadStatus = 'New' | 'In-progress' | 'Converted' | 'Lost' | 'On-hold';

export interface Customer extends BaseEntity {
  customerId?: string; // Auto-generated: CUST001
  name: string;
  mobile: string;
  secondaryMobile?: string;
  email?: string;
  address: Address;
  profilePhoto?: string;
}

export interface Lead extends BaseEntity {
  leadId: string; // Auto-generated: LEAD-2025-001
  customerId: number;
  source: LeadSource;
  sourceDetails?: string; // If 'Other' or referral name
  status: LeadStatus;
  assignedTo?: number; // User ID (Sales Executive)
  lostReason?: string;
  
  // Electricity connection details
  discomName?: string; // MSEDCL, BEST, etc.
  consumerNumber?: string;
  meterType?: 'Single Phase' | 'Three Phase';
  sanctionedLoad?: number; // in kW
  avgMonthlyBill?: number; // in ₹
  electricityBillFile?: string; // File path or base64

  // Requirements
  requiredSystemSize?: number; // in kW
  systemType?: 'On-grid' | 'Off-grid' | 'Hybrid';
  roofType?: 'RCC' | 'Sheet' | 'Tile' | 'Ground';
  tentativeBudget?: number;
  expectedSavings?: string;
  installationReason?: string;

  branchId?: number;
  followUpDate?: Date;
  remarks?: string;
}

export type DocumentType = 
  | 'Electricity Bill'
  | 'Aadhaar Card Front'
  | 'Aadhaar Card Back'
  | 'PAN Card'
  | 'Bank Passbook'
  | 'Cancelled Cheque'
  | 'Other';

export interface CustomerDocument extends BaseEntity {
  customerId: number;
  documentType: DocumentType;
  documentName?: string; // If 'Other'
  filePath: string; // Local file path or IndexedDB blob ID
  fileSize?: number; // in bytes
  fileType?: string; // image/jpeg, application/pdf
  uploadedBy?: number; // User ID
  uploadedAt: Date;
  remarks?: string;
}

// ==================== SURVEY ====================

export type SurveyStatus = 'Pending' | 'Assigned' | 'In-progress' | 'Completed' | 'Revisit Required';

export interface Survey extends BaseEntity {
  leadId: number;
  assignedTo: number; // Survey Engineer User ID
  status: SurveyStatus;
  surveyDate?: Date;
  preferredTime?: string;

  // Roof measurements
  roofLength?: number; // in meters
  roofWidth?: number; // in meters
  usableArea?: number; // in sq meters
  roofType?: string;
  roofCondition?: string;
  buildingHeight?: number; // Number of floors

  // Shadow analysis
  shadowAnalysis?: {
    morningNotes?: string;
    noonNotes?: string;
    eveningNotes?: string;
    nearbyObstructions?: string; // Buildings, trees, poles
  };

  // Structural notes
  structureType?: 'Simple' | 'Elevated' | 'Special';
  civilWorkRequired?: boolean;
  civilWorkNotes?: string;

  // Cable routing
  panelToInverterDistance?: number; // in meters
  inverterToDBDistance?: number; // in meters
  cableRouteNotes?: string;

  // Earthing
  existingEarthing?: boolean;
  newEarthingRequired?: boolean;
  earthingNotes?: string;

  // Safety
  ladderAccess?: boolean;
  parapetWall?: boolean;
  safetyNotes?: string;

  // General
  surveyRemarks?: string;
  revisitReason?: string;
}

export type PhotoType = 
  | 'Roof Wide Angle'
  | 'Meter Panel'
  | 'DB Panel'
  | 'Inverter Location'
  | 'Street View'
  | 'Shadow Analysis'
  | 'Other';

export interface SurveyPhoto {
  id?: number;
  surveyId: number;
  photoType: PhotoType;
  photoName?: string;
  filePath: string; // Local storage or blob ID
  fileSize?: number;
  capturedAt: Date;
  capturedBy?: number; // User ID
  notes?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ==================== ITEMS & MATERIAL MASTER ====================

export type ItemCategory = 
  | 'Panel'
  | 'Inverter'
  | 'Structure'
  | 'Cable'
  | 'Earthing'
  | 'Protection Device'
  | 'Junction Box'
  | 'Accessory'
  | 'Service'
  | 'Other';

export interface Item extends BaseEntity {
  itemCode: string; // Auto: ITEM001
  category: ItemCategory;
  name: string;
  brand?: string;
  model?: string;
  specification?: string;
  
  // For panels
  wattage?: number; // 450W, 550W
  panelWarrantyYears?: number;
  
  // For inverters
  capacity?: number; // in kW
  inverterType?: 'String' | 'Hybrid' | 'Micro' | 'Off-grid';
  phaseType?: 'Single Phase' | 'Three Phase';
  inverterWarrantyYears?: number;
  
  // For structures
  structureMaterial?: 'Mild Steel' | 'Aluminium' | 'GI';
  mountingType?: 'Roof' | 'Ground' | 'Shed';
  tiltAdjustable?: boolean;
  
  // For cables
  cableSize?: string; // 4 sq mm, 6 sq mm
  cableType?: 'DC' | 'AC';
  
  // Common
  unit: string; // Nos, Meter, Set, etc.
  hsn?: string; // HSN/SAC code for GST
  gstRate?: number; // 5, 12, 18, 28
  
  // Pricing
  purchasePrice?: number;
  sellingPrice?: number;
  mrp?: number;
  
  // Stock
  currentStock?: number;
  reorderLevel?: number;
  
  status: Status;
  remarks?: string;
}

export interface BOM extends BaseEntity {
  projectId: number;
  itemId: number;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  taxableAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
  remarks?: string;
}

// ==================== PROJECT MATERIAL ASSIGNMENTS ====================

export interface ProjectMaterial extends BaseEntity {
  projectId: number;
  itemId: number;
  quantity: number;
  unit: string;
  date: Date;
  status: 'Planned' | 'Sent' | 'Installed' | 'Returned';
  brand?: string;
  referenceNumber?: string;
  remarks?: string;
}

// ==================== QUOTATION ====================

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface Quotation extends BaseEntity {
  quotationNumber: string; // Auto: QUO-2025-001
  leadId: number;
  customerId: number;
  status: QuotationStatus;
  quotationDate: Date;
  validityDate: Date;
  
  // 1. HEADER/CLIENT BLOCK
  companyName?: string;
  clientName?: string;
  projectPurpose?: 'Residential' | 'Commercial' | 'Industrial';
  systemSize?: number; // kW
  phase?: '1ph' | '3ph';
  siteLocation?: string;
  
  // 2. SITE SPECIFICATION
  siteState?: string;
  roofType?: 'Roof' | 'Ground' | 'Tin Shed' | 'RCC';
  latitude?: number;
  longitude?: number;
  solarRadiation?: number; // kWh/m²/day
  
  // 3. SOLAR SYSTEM SPECIFICATION
  systemType?: 'On-grid' | 'Off-grid' | 'Hybrid';
  dcCapacity?: number; // kW
  moduleTechnology?: string; // e.g., "Mono PERC", "Polycrystalline"
  inverterType?: string; // e.g., "String Inverter", "Hybrid Inverter"
  mountingStructure?: string; // e.g., "Elevated GI Structure"
  safetyDevices?: string; // e.g., "DC SPD, AC SPD, Earthing"
  powerEvacuation?: string; // e.g., "Net Metering"
  projectScheme?: string; // e.g., "Subsidy / Non-subsidy"
  panelBrand?: string;
  inverterBrand?: string;
  
  // 4. DEVELOPER DETAILS
  developerName?: string;
  offerValidityDays?: number;
  
  // 5. MONTHLY SOLAR DATA (JAN-DEC) - kWh/m²/day for each month
  monthlySolarData?: {
    jan?: number;
    feb?: number;
    mar?: number;
    apr?: number;
    may?: number;
    jun?: number;
    jul?: number;
    aug?: number;
    sep?: number;
    oct?: number;
    nov?: number;
    dec?: number;
  };
  
  // 7. OFFER & PRICING
  plantCapacity?: number; // kW
  priceBasis?: string; // e.g., "Per KW", "Lump Sum"
  basePrice?: number;
  gstPercent?: number;
  subtotal: number;
  discountAmount?: number;
  discountPercent?: number;
  taxableAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalGST: number;
  roundOff?: number;
  grandTotal: number;
  
  // 8. PAYMENT SCHEDULE (structured)
  paymentSchedule?: {
    percentage: number;
    condition: string;
  }[];
  
  // Terms
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  termsAndConditions?: string;
  
  branchId?: number;
  preparedBy?: number; // User ID
  approvedBy?: number;
  sentDate?: Date;
  acceptedDate?: Date;
  rejectionReason?: string;
  remarks?: string;
}

// 6. TECHNICAL DETAILS (Line Items with Make/Brand)
export interface QuotationItem {
  id?: number;
  quotationId: number;
  itemId: number;
  lineNumber: number;
  component: string; // Renamed from itemName for clarity
  specification: string; // Renamed from description
  quantity: number;
  make?: string; // Brand/Make of the component
  unit: string;
  hsn?: string;
  unitPrice: number;
  discount?: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

// ==================== PROJECT ====================

export type ProjectStatus = 
  | 'Planning'
  | 'Material Procurement'
  | 'In Progress'
  | 'Installation'
  | 'Testing'
  | 'Completed'
  | 'On-hold'
  | 'Cancelled';

export type StageStatus = 'Pending' | 'In-progress' | 'Completed' | 'Skipped';

import type { PaymentStage } from './extended';

export interface Project extends BaseEntity {
  projectId: string; // Auto: PROJ-2025-001
  leadId: number;
  customerId: number;
  quotationId?: number;
  
  status: ProjectStatus;
  startDate?: Date;
  targetDate?: Date;
  completionDate?: Date;
  
  // System details
  systemSize: number; // kW
  systemType: 'On-grid' | 'Off-grid' | 'Hybrid';
  caseType: 'Cash' | 'Finance';
  
  // Financial
  projectValue: number;
  totalPaid?: number;
  balanceAmount?: number;
  paymentSchedule?: {
    termsName?: string;
    stages: {
      stage: PaymentStage;
      percentage?: number;
      amount?: number;
      dueDate?: Date;
      status: 'Due' | 'Received' | 'Partial';
    }[];
  };
  
  // Team
  projectManager?: number; // User ID
  installationTeam?: number[]; // User IDs
  
  branchId?: number;
  remarks?: string;
  cancellationReason?: string;
}

export type StageName = 
  | 'Material Planning'
  | 'Material Purchase/Booking'
  | 'Material Delivered to Site'
  | 'Structure Installation'
  | 'Panel Installation'
  | 'Inverter & Wiring'
  | 'Earthing & SPD'
  | 'Testing & Commissioning'
  | 'Documentation & Handover'
  | 'Net Meter Application';

export interface ProjectStage {
  id?: number;
  projectId: number;
  stageName: StageName;
  stageOrder: number;
  status: StageStatus;
  startDate?: Date;
  endDate?: Date;
  assignedTo?: number; // User ID
  photos?: string[]; // File paths
  comments?: string;
  completedBy?: number;
  completedAt?: Date;
}

// Re-export extended types
export * from './extended';

