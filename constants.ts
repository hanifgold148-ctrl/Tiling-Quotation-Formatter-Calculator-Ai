
import { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  // Pricing & Calculation
  wallTilePrice: 5600,
  floorTilePrice: 6500,
  sittingRoomTilePrice: 6800,
  externalWallTilePrice: 6500,
  stepTilePrice: 6500,
  
  // New Granular Defaults
  bedroomTilePrice: 6500,
  toiletWallTilePrice: 5600,
  toiletFloorTilePrice: 6500,
  kitchenWallTilePrice: 5600,
  kitchenFloorTilePrice: 6500,

  cementPrice: 10000,
  whiteCementPrice: 15000,
  sharpSandPrice: 50000,
  workmanshipRate: 1700,
  wastageFactor: 1.10, // 10% wastage
  
  // New: Size-based pricing defaults
  tilePricesBySize: [
    { size: '60x60', price: 6500 },
    { size: '30x60', price: 5600 },
    { size: '40x40', price: 5000 },
    { size: '30x30', price: 4500 },
    { size: '60x120', price: 12000 },
    { size: '25x40', price: 5600 },
  ],
  
  // Coverage Defaults (m2 per carton)
  wallTileM2PerCarton: 1.5,
  floorTileM2PerCarton: 1.5,
  sittingRoomTileM2PerCarton: 1.5,
  roomTileM2PerCarton: 1.5,
  externalWallTileM2PerCarton: 1.5,
  stepTileM2PerCarton: 1.5,
  toiletWallTileM2PerCarton: 1.5,
  toiletFloorTileM2PerCarton: 1.5,
  kitchenWallTileM2PerCarton: 1.5,
  kitchenFloorTileM2PerCarton: 1.5,

  // Default Tile Sizes (User Request)
  defaultToiletWallSize: '25x40',
  defaultToiletFloorSize: '40x40',
  defaultRoomFloorSize: '40x40',
  defaultSittingRoomSize: '60x60',
  defaultKitchenWallSize: '25x40',
  defaultKitchenFloorSize: '40x40',

  taxPercentage: 7.5,

  // Display Options
  showTermsAndConditions: true,
  showUnitPrice: true,
  showSubtotal: true,
  // showConfidence: false, // Feature removed from UI
  showMaintenance: true,
  showTileSize: true,
  showTax: false,
  showChecklistDefault: true,
  showMaterialsDefault: true,
  showAdjustmentsDefault: true,
  showDeposit: true,

  // Branding & Company
  companyName: 'HANIFGOLD TILING EXPERTS',
  companySlogan: 'Perfect finish. Every tile. Every time.',
  companyAddress: '7 Unity Street, Phase 2 Arigbanwo, Mowe',
  companyEmail: 'hanofihamod094@gmail.com',
  companyPhone: '08063131498',
  documentTitle: 'QUOTATION',
  companyLogo: '',
  companySignature: '',
  accentColor: '#0EA5E9',
  headerLayout: 'modern',
  footerText: 'Thank you for your business! | www.hanifgold.com',

  // Customization
  customMaterialUnits: ['bags', 'kg', 'pcs', 'litres', 'gallons', 'rolls', 'sheets'],
  defaultTermsAndConditions: '1. 50% advance payment is required to commence work.\n2. All materials remain the property of HANIFGOLD TILING EXPERTS until payment is made in full.\n3. This quotation is valid for a period of 30 days from the date of issue.\n4. Any additional work not specified in this quotation will be subject to a separate charge.',
  defaultExpenseCategories: ['Materials', 'Fuel', 'Tools', 'Labor', 'Transportation', 'Marketing', 'Subcontractors', 'Other'],
  addCheckmateDefault: true,
  defaultDepositPercentage: 50,
  
  // Invoicing
  invoicePrefix: 'INV',
  defaultBankDetails: 'Bank Name: Your Bank\nAccount Name: Your Company Name\nAccount Number: 1234567890',
  defaultInvoiceNotes: 'Thank you for your business. Please make payments to the account details above.',
  paymentUrl: '',
  showQRCode: true,
};


export const EXAMPLE_INPUT = `FLAT 1
TW 85m2 60x60
TF 12m2 40x40
KW 95m2 30x60
KF 14m2 60x60
SR 60m2 80x80
PASS 29m2
Step 14m2
EXT 14m2
Cement 60 bags
White Cement 50kg

FLAT 2
TW 45m2
TF 8m2`;
