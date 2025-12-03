
export interface Adjustment {
  description: string;
  amount: number;
}

export interface Tile {
  category: string;
  cartons: number;
  sqm: number;
  tileType: 'Wall' | 'Floor' | 'External Wall' | 'Step' | 'Unknown';
  unitPrice: number;
  // confidence: number; // Removed as per user request to hide debug info
  size?: string;
  group?: string; // New: e.g., "Flat 1", "BQ", "General"
}

export interface Material {
  item: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  // confidence: number; // Removed as per user request to hide debug info
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface ClientDetails {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  projectName: string;
  showClientName: boolean;
  showClientAddress: boolean;
  showClientPhone: boolean;
  showProjectName: boolean;
  clientId?: string;
}

export interface ChecklistItem {
    item: string;
    checked: boolean;
}

export interface QuotationData {
  id: string;
  date: number; // timestamp
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Invoiced';
  clientDetails: ClientDetails;
  tiles: Tile[];
  materials: Material[];
  workmanshipRate: number;
  maintenance: number;
  profitPercentage: number | null;
  // This field is for user-provided terms and will be populated by the AI
  termsAndConditions?: string;
  invoiceId?: string;
  isBulkGenerated?: boolean;
  checklist?: ChecklistItem[];
  addCheckmate?: boolean;
  showChecklist?: boolean;
  showMaterials?: boolean;
  showAdjustments?: boolean;
  adjustments: Adjustment[];
  depositPercentage: number | null;
  
  // New granular visibility controls per quotation
  showBankDetails?: boolean;
  showTerms?: boolean;
  showWorkmanship?: boolean;
  showMaintenance?: boolean;
  showTax?: boolean;
  showCostSummary?: boolean;
}

export interface InvoiceData {
  id: string;
  quotationId: string;
  invoiceNumber: string;
  invoiceDate: number; // timestamp
  dueDate: number; // timestamp
  status: 'Unpaid' | 'Paid' | 'Overdue';
  clientDetails: ClientDetails;
  tiles: Tile[];
  materials: Material[];
  workmanshipRate: number;
  maintenance: number;
  profitPercentage: number | null;
  paymentTerms: string;
  bankDetails: string;
  invoiceNotes: string;
  paymentDate?: number;
  showMaterials?: boolean;
  showAdjustments?: boolean;
}

export interface Expense {
  id: string;
  date: number; // timestamp
  category: string;
  description: string;
  amount: number;
  quotationId?: string; // Optional link to a project
}


export interface Settings {
  // Pricing & Calculation
  wallTilePrice: number;
  floorTilePrice: number;
  sittingRoomTilePrice: number;
  externalWallTilePrice: number;
  stepTilePrice: number;
  
  // New Granular Prices
  bedroomTilePrice: number;
  toiletWallTilePrice: number;
  toiletFloorTilePrice: number;
  kitchenWallTilePrice: number;
  kitchenFloorTilePrice: number;

  cementPrice: number;
  whiteCementPrice: number;
  sharpSandPrice: number;
  workmanshipRate: number;
  wastageFactor: number; // e.g., 1.10 for 10%
  
  // New: Size-based pricing rules
  tilePricesBySize: { size: string; price: number }[];

  // Coverage Rates (m2 per carton)
  wallTileM2PerCarton: number;
  floorTileM2PerCarton: number;
  sittingRoomTileM2PerCarton: number;
  roomTileM2PerCarton: number;
  externalWallTileM2PerCarton: number;
  stepTileM2PerCarton: number;
  // New specific areas
  toiletWallTileM2PerCarton: number;
  toiletFloorTileM2PerCarton: number;
  kitchenWallTileM2PerCarton: number;
  kitchenFloorTileM2PerCarton: number;
  
  // New: Default Tile Sizes per Area
  defaultToiletWallSize: string;
  defaultToiletFloorSize: string;
  defaultRoomFloorSize: string;
  defaultSittingRoomSize: string;
  defaultKitchenWallSize: string;
  defaultKitchenFloorSize: string;

  taxPercentage: number;
  
  // Display Options
  showTermsAndConditions: boolean;
  showUnitPrice: boolean;
  showSubtotal: boolean;
  // showConfidence: boolean; // Removed as per user request
  showMaintenance: boolean;
  showTileSize: boolean;
  showTax: boolean;
  showChecklistDefault: boolean;
  showMaterialsDefault: boolean;
  showAdjustmentsDefault: boolean;
  showDeposit: boolean;

  // Branding & Company
  companyName: string;
  companySlogan: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  documentTitle: string;
  companyLogo: string; // Base64 encoded image
  companySignature: string; // Base64 encoded image for signature
  accentColor: string;
  headerLayout: 'modern' | 'classic' | 'minimalist';
  footerText: string;


  // Customization
  customMaterialUnits: string[];
  defaultTermsAndConditions: string;
  defaultExpenseCategories: string[];
  addCheckmateDefault: boolean;
  defaultDepositPercentage: number;
  
  // Invoicing
  invoicePrefix: string;
  defaultBankDetails: string;
  defaultInvoiceNotes: string;
  paymentUrl: string;
  showQRCode: boolean;
}
