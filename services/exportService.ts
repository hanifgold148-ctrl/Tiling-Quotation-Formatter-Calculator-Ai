
import { QuotationData, InvoiceData, Settings, Tile } from '../types';
import { calculateTotals } from './calculationService';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper to generate QR code data URL
const generateQrCodeDataUrl = async (text: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const QRCode = (window as any).QRCode;
        if (!QRCode) {
            return reject(new Error("QRCode library is not loaded."));
        }
        QRCode.toDataURL(text, { width: 120, margin: 1, errorCorrectionLevel: 'H' }, (err: any, url: string) => {
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        });
    });
};

/**
 * Draws the "Letterhead" elements: Logo, Company Info.
 * Returns the Y position where the header ends.
 */
const drawCompanyHeader = (doc: any, settings: Settings) => {
  const { companyLogo, companyName, companySlogan, companyAddress, companyEmail, companyPhone, headerLayout } = settings;
  const PAGE_MARGIN = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let currentY = 20;
  
  // -- LOGO & COMPANY INFO --
  
  if (headerLayout === 'modern') {
      // Modern: Logo & Info on Left, restricted width to prevent overlap with Right Title
      let logoWidth = 0;
      if (companyLogo) {
          const img = new Image();
          img.src = companyLogo;
          const aspectRatio = img.width / img.height;
          let imgHeight = 22;
          let imgWidth = imgHeight * aspectRatio;
          
          // Cap width if it's too wide
          if (imgWidth > 40) {
              imgWidth = 40;
              imgHeight = imgWidth / aspectRatio;
          }

          doc.addImage(img, 'PNG', PAGE_MARGIN, currentY, imgWidth, imgHeight);
          logoWidth = imgWidth + 5; // Spacing after logo
      }
      
      const textStartX = PAGE_MARGIN + logoWidth;
      const maxTextWidth = (pageWidth / 2) - textStartX - 5; // Limit to left half minus margin

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor('#1F2937'); // Dark Gray
      const nameLines = doc.splitTextToSize(companyName, maxTextWidth);
      doc.text(nameLines, textStartX, currentY + 6);
      const nameHeight = nameLines.length * 7; // Approx height per line
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#B8860B'); // Gold
      const sloganLines = doc.splitTextToSize(companySlogan, maxTextWidth);
      doc.text(sloganLines, textStartX, currentY + 6 + nameHeight - 2); // Adjust Y based on name lines
      const sloganHeight = sloganLines.length * 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#6B7280'); // Gray
      
      const addressY = currentY + 6 + nameHeight + sloganHeight;
      const addressLines = doc.splitTextToSize(companyAddress, maxTextWidth);
      doc.text(addressLines, textStartX, addressY);
      
      const contactY = addressY + (addressLines.length * 3.5);
      doc.text(`${companyEmail} | ${companyPhone}`, textStartX, contactY);

      return Math.max(currentY + 25, contactY + 5); // Return bottom Y (ensure min height)
      
  } else if (headerLayout === 'classic') {
      // Classic: Centered Logo & Info
      let logoHeightUsed = 0;
      if (companyLogo) {
          const img = new Image();
          img.src = companyLogo;
          const aspectRatio = img.width / img.height;
          let imgHeight = 25;
          let imgWidth = imgHeight * aspectRatio;
          
          doc.addImage(img, 'PNG', (pageWidth - imgWidth) / 2, currentY, imgWidth, imgHeight);
          logoHeightUsed = imgHeight + 5;
          currentY += logoHeightUsed;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor('#1F2937');
      doc.text(companyName, pageWidth / 2, currentY + 5, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#6B7280');
      doc.text(companySlogan, pageWidth / 2, currentY + 10, { align: 'center' });
      doc.text(`${companyAddress} | ${companyEmail} | ${companyPhone}`, pageWidth / 2, currentY + 15, { align: 'center' });
      
      return currentY + 25;
  } else {
      // Minimalist: Just Text Left
       const maxTextWidth = (pageWidth / 2) - PAGE_MARGIN;
       doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor('#1F2937');
      const nameLines = doc.splitTextToSize(companyName, maxTextWidth);
      doc.text(nameLines, PAGE_MARGIN, currentY + 6);
      const nameHeight = nameLines.length * 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#6B7280');
      const addressLines = doc.splitTextToSize(companyAddress, maxTextWidth);
      doc.text(addressLines, PAGE_MARGIN, currentY + 6 + nameHeight);
      const addressHeight = addressLines.length * 3.5;

      doc.text(`${companyEmail} | ${companyPhone}`, PAGE_MARGIN, currentY + 6 + nameHeight + addressHeight + 2);
      
      return Math.max(currentY + 25, currentY + 6 + nameHeight + addressHeight + 10);
  }
};

const drawFooter = (doc: any, settings: Settings) => {
    const pageCount = doc.internal.getNumberOfPages();
    const PAGE_MARGIN = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const goldColor = '#B8860B';
    doc.setFontSize(8);
    doc.setTextColor('#6B7280');

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(goldColor);
        doc.setLineWidth(0.5);
        doc.line(PAGE_MARGIN, pageHeight - 18, pageWidth - PAGE_MARGIN, pageHeight - 18);
        
        if (settings.footerText) {
            doc.text(settings.footerText, pageWidth / 2, pageHeight - 12, { align: 'center' });
        }
        
        const pageStr = `Page ${i} of ${pageCount}`;
        doc.text(pageStr, pageWidth - PAGE_MARGIN, pageHeight - 12, { align: 'right' });
    }
};


const createPdfDocument = (data: QuotationData | any, settings: Settings): Promise<any> => {
  return new Promise((resolve, reject) => {
    const jspdf = (window as any).jspdf?.jsPDF;
    if (!jspdf) {
        return reject(new Error("jsPDF library is not loaded."));
    }
    const doc = new jspdf({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    // Calculate summary totals for use in the PDF
    const summary = calculateTotals(data, settings);

    const primaryColor = '#B8860B'; // Gold accent
    const textColor = '#1F2937';
    const PAGE_MARGIN = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageContentWidth = pageWidth - PAGE_MARGIN * 2;
    
    const showMaterials = data.showMaterials ?? true;
    const showAdjustments = data.showAdjustments ?? true;
    const showBankDetails = data.showBankDetails ?? true;
    const showTerms = data.showTerms ?? settings.showTermsAndConditions;
    const showMaintenance = data.showMaintenance ?? settings.showMaintenance;
    const showTax = data.showTax ?? settings.showTax;
    const showWorkmanship = data.showWorkmanship ?? true;
    const showCostSummary = data.showCostSummary ?? true;

    // --- DRAW PAGE 1 HEADER ---
    // We draw the company info left, and Title block right.
    // We calculate where the company info ends (lastY), but we also need to account for the Title block height.
    let leftHeaderBottomY = drawCompanyHeader(doc, settings);

    // --- DOCUMENT TITLE & DATE BLOCK (The "Perfect" Right Side) ---
    const headerTopY = 20; 
    const rightColX = pageWidth - PAGE_MARGIN;
    const maxTitleWidth = 85; // Max width for title column to prevent overlap with left side
    
    let rightHeaderBottomY = headerTopY;

    if (settings.headerLayout !== 'classic') {
        // Modern/Minimalist: Float Title Right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        
        // Document Title (e.g. QUOTATION FOR...)
        const titleText = settings.documentTitle.toUpperCase();
        const titleLines = doc.splitTextToSize(titleText, maxTitleWidth);
        
        // Align right manually for multiline text since 'align: right' aligns relative to x point
        doc.text(titleLines, rightColX, headerTopY + 8, { align: 'right' });
        
        const titleHeight = titleLines.length * 9; // Approx height based on font size

        // Date Block
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor('#4B5563'); // Slate 600
        
        let metaY = headerTopY + 8 + titleHeight - 2; // Start meta below title
        doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, rightColX, metaY, { align: 'right' });
        
        if (data.invoiceNumber) {
            metaY += 5;
            doc.text(`Invoice #: ${data.invoiceNumber}`, rightColX, metaY, { align: 'right' });
        }
        if (data.dueDate) {
             metaY += 5;
            doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, rightColX, metaY, { align: 'right' });
        }
        rightHeaderBottomY = metaY + 5;

    } else {
        // Classic: Centered Title below the line (handled after line draw)
        // Just set this to 0 effectively so line logic uses leftHeaderBottomY
        rightHeaderBottomY = leftHeaderBottomY; 
    }
    
    // The divider line should be below the tallest header column
    let lastY = Math.max(leftHeaderBottomY, rightHeaderBottomY) + 2;

    // Draw Divider Line
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.line(PAGE_MARGIN, lastY, pageWidth - PAGE_MARGIN, lastY);
    lastY += 10;

    // For Classic layout, draw centered title NOW, below the line
    if (settings.headerLayout === 'classic') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor);
        const titleLines = doc.splitTextToSize(settings.documentTitle.toUpperCase(), pageContentWidth);
        doc.text(titleLines, pageWidth / 2, lastY, { align: 'center' });
        const titleHeight = titleLines.length * 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor('#4B5563');
        doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, pageWidth / 2, lastY + titleHeight + 2, { align: 'center' });
        lastY += titleHeight + 15;
    }

    const generatePdfContent = () => {
      
      // "Billed To" Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor('#9CA3AF'); // Light Gray label
      doc.text('BILLED TO', PAGE_MARGIN, lastY);
      
      lastY += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(textColor);
      
      const clientName = data.clientDetails.showClientName ? (data.clientDetails.clientName || 'Client Name') : '';
      doc.text(clientName, PAGE_MARGIN, lastY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor('#4B5563'); // Slate 600
      
      let clientY = lastY + 5;
      if (data.clientDetails.showProjectName && data.clientDetails.projectName) {
          doc.text(data.clientDetails.projectName, PAGE_MARGIN, clientY);
          clientY += 5;
      }
      if (data.clientDetails.showClientAddress && data.clientDetails.clientAddress) {
          doc.text(data.clientDetails.clientAddress, PAGE_MARGIN, clientY);
          clientY += 5;
      }
      if (data.clientDetails.showClientPhone && data.clientDetails.clientPhone) {
          doc.text(data.clientDetails.clientPhone, PAGE_MARGIN, clientY);
          clientY += 5;
      }
      
      lastY = clientY + 10;

      // Group tiles by their 'group' property
      const groupedTiles: Record<string, Tile[]> = {};
      (data.tiles || []).forEach((tile: Tile) => {
        const groupName = tile.group || 'General';
        if (!groupedTiles[groupName]) groupedTiles[groupName] = [];
        groupedTiles[groupName].push(tile);
      });

      // Tile Groups Table Generation
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text("Tile Details & Cost Summary", PAGE_MARGIN, lastY);
      lastY += 6;

      Object.entries(groupedTiles).forEach(([groupName, tiles]) => {
          if (lastY > doc.internal.pageSize.getHeight() - 40) {
              doc.addPage();
              lastY = drawCompanyHeader(doc, settings); // This won't redraw title in modern mode, which is fine for subsequent pages
              doc.setDrawColor(primaryColor);
              doc.line(PAGE_MARGIN, lastY, pageWidth - PAGE_MARGIN, lastY);
              lastY += 10;
          }

          // Only show group header if it's not "General" or if there are multiple groups
          if (groupName !== 'General' || Object.keys(groupedTiles).length > 1) {
              doc.setFontSize(11);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(textColor);
              doc.setFillColor('#F3F4F6');
              doc.rect(PAGE_MARGIN, lastY, pageContentWidth, 8, 'F'); // Gray background for group header
              doc.text(groupName, PAGE_MARGIN + 3, lastY + 5.5);
              lastY += 8;
          }

          const tileHeaders = [['Category', 'm²', 'Cartons', 'Tile Type']];
          if (settings.showTileSize) tileHeaders[0].splice(3, 0, 'Size');
          if (settings.showUnitPrice) tileHeaders[0].push('Unit Price');
          if (settings.showSubtotal) tileHeaders[0].push('Subtotal');
          
          const tileBody = tiles.map(t => {
            const row = [t.category, t.sqm.toFixed(2), t.cartons, t.tileType];
            if (settings.showTileSize) row.splice(3, 0, t.size || 'N/A');
            if (settings.showUnitPrice) row.push(formatCurrency(t.unitPrice));
            if (settings.showSubtotal) row.push(formatCurrency(t.cartons * t.unitPrice));
            return row;
          });
          
          // Calculate group total for footer
          const groupTotal = tiles.reduce((sum, t) => sum + (t.cartons * t.unitPrice), 0);
          const tileFooter = settings.showSubtotal ? [[
               { content: `${groupName} Total:`, colSpan: tileHeaders[0].length - 1, styles: { halign: 'right', fontStyle: 'bold' } },
               { content: formatCurrency(groupTotal), styles: { fontStyle: 'bold' } }
          ]] : undefined;

          doc.autoTable({ 
              startY: lastY, 
              head: tileHeaders, 
              body: tileBody,
              foot: tileFooter, 
              theme: 'grid', 
              headStyles: { fillColor: '#0F172A', textColor: '#FFFFFF', fontStyle: 'bold' }, 
              footStyles: { fillColor: '#F8FAFC', textColor: '#1F2937' },
              styles: { fontSize: 9, cellPadding: 3 },
              columnStyles: { 0: { fontStyle: 'bold' } } // Category bold
          });
          lastY = (doc as any).lastAutoTable.finalY + 8;
      });


      // Materials table
      if (showMaterials && data.materials && data.materials.length > 0) {
          if (lastY > doc.internal.pageSize.getHeight() - 40) {
              doc.addPage();
              lastY = drawCompanyHeader(doc, settings) + 10;
          }
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor);
          doc.text("Other Materials", PAGE_MARGIN, lastY);
          lastY += 5;

          const materialHeaders = [['Item', 'Quantity']];
          if (settings.showUnitPrice) materialHeaders[0].push('Unit Price');
          if (settings.showSubtotal) materialHeaders[0].push('Total');
          const materialBody = data.materials.map((m: any) => {
            const row = [m.item, `${m.quantity} ${m.unit}`];
            if (settings.showUnitPrice) row.push(formatCurrency(m.unitPrice));
            if (settings.showSubtotal) row.push(formatCurrency(m.quantity * m.unitPrice));
            return row;
          });
          
          doc.autoTable({ 
              startY: lastY, 
              head: materialHeaders, 
              body: materialBody, 
              theme: 'grid', 
              headStyles: { fillColor: '#0F172A', textColor: '#FFFFFF' }, 
              styles: { fontSize: 9, cellPadding: 3 } 
          });
          lastY = (doc as any).lastAutoTable.finalY + 10;
      }
      
      const checkAndAddPage = () => {
          if (lastY > doc.internal.pageSize.getHeight() - 60) {
              doc.addPage();
              lastY = drawCompanyHeader(doc, settings) + 10;
          }
      }

      // Checklist & Totals
      checkAndAddPage();
      
      // Use two columns for Checklist and Totals
      const finalSectionY = lastY;
      let leftColumnY = finalSectionY;
      
      if (data.showChecklist && data.checklist && data.checklist.length > 0) {
        doc.autoTable({ 
            startY: finalSectionY, 
            head: [['Project Checklist']], 
            body: data.checklist.map((item: any) => [{ content: `[${item.checked ? 'x' : ' '}] ${item.item}` }]), 
            theme: 'striped', 
            headStyles: { fillColor: '#475569', textColor: '#FFFFFF' }, // Slate 600
            styles: { fontSize: 9 }, 
            tableWidth: pageContentWidth / 2 - 5, 
            margin: { left: PAGE_MARGIN }
        });
        leftColumnY = (doc as any).lastAutoTable.finalY;
      }

      // Totals - Only if showCostSummary is enabled
      if (showCostSummary) {
          const totalsBody = [
            ['Tiles Cost', formatCurrency(summary.totalTileCost)],
          ];
          
          if (showMaterials) {
              totalsBody.push(['Materials Cost', formatCurrency(summary.totalMaterialCost)]);
          }

          if (showWorkmanship) {
              totalsBody.push([`Workmanship\n(${formatCurrency(data.workmanshipRate)}/m² × ${summary.totalSqm.toFixed(2)}m²)`, formatCurrency(summary.workmanshipCost)]);
          }

          if (showMaintenance && (data.maintenance > 0)) totalsBody.push(['Maintenance', formatCurrency(data.maintenance)]);
          if (data.profitPercentage) totalsBody.push([`Profit (${data.profitPercentage}%)`, formatCurrency(summary.profitAmount)]);
          totalsBody.push(['Subtotal', formatCurrency(summary.subtotal)]);
          if (showAdjustments && summary.totalAdjustments !== 0) totalsBody.push(['Adjustments', formatCurrency(summary.totalAdjustments)]);
          if (showTax && settings.taxPercentage > 0) totalsBody.push([`Tax (${settings.taxPercentage}%)`, formatCurrency(summary.taxAmount)]);
          
          // Spacer
          totalsBody.push(['', '']); 
          
          totalsBody.push(['Grand Total', formatCurrency(summary.grandTotal)]);
          if (data.depositPercentage && summary.depositAmount > 0) {
            totalsBody.push([`Deposit Required (${data.depositPercentage}%)`, formatCurrency(summary.depositAmount)]);
          }

          doc.autoTable({
            startY: finalSectionY, 
            body: totalsBody, 
            theme: 'plain', 
            tableWidth: pageContentWidth / 2 - 5, 
            margin: { left: pageContentWidth / 2 + PAGE_MARGIN + 5 },
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'normal' }, 1: { halign: 'right', fontStyle: 'bold' } },
            didParseCell: (hookData: any) => {
                const rows = totalsBody.length;
                // Grand Total Styling
                if (hookData.row.index === rows - (data.depositPercentage && summary.depositAmount > 0 ? 2 : 2)) { 
                    hookData.cell.styles.fillColor = primaryColor;
                    hookData.cell.styles.textColor = '#FFFFFF';
                    hookData.cell.styles.fontSize = 12;
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.halign = hookData.column.index === 1 ? 'right' : 'left';
                }
                // Deposit Styling
                if (hookData.row.index === rows - 1 && data.depositPercentage && summary.depositAmount > 0) { 
                    hookData.cell.styles.fillColor = '#F0FDF4'; // Green 50
                    hookData.cell.styles.textColor = '#166534'; // Green 800
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
          });
          lastY = Math.max(leftColumnY, (doc as any).lastAutoTable.finalY);
      } else {
          lastY = leftColumnY;
      }
      
      lastY += 10;

      // Bank Details (Full Detail Requirement)
      if (showBankDetails && settings.defaultBankDetails) {
          checkAndAddPage();
          
          // Draw a light box for bank details
          doc.setFillColor('#F9FAFB'); // Gray 50
          doc.setDrawColor('#E5E7EB'); // Gray 200
          doc.roundedRect(PAGE_MARGIN, lastY, pageContentWidth, 35, 3, 3, 'FD');
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor);
          doc.text('PAYMENT INFORMATION', PAGE_MARGIN + 5, lastY + 8);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColor);
          const bankLines = doc.splitTextToSize(settings.defaultBankDetails, pageContentWidth - 10);
          doc.text(bankLines, PAGE_MARGIN + 5, lastY + 15);
          
          lastY += 45;
      }

      if (showTerms && data.termsAndConditions) {
        checkAndAddPage();
        doc.setFontSize(8);
        doc.setTextColor('#9CA3AF'); // Light gray
        doc.setFont('helvetica', 'bold');
        doc.text('TERMS & CONDITIONS:', PAGE_MARGIN, lastY);
        
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'normal');
        const termsLines = doc.splitTextToSize(data.termsAndConditions, pageContentWidth);
        doc.text(termsLines, PAGE_MARGIN, lastY + 5);
        
        lastY += (termsLines.length * 3) + 10;
      }
      
      // Digital Signature Logic
      if (settings.companySignature) {
          const signatureHeight = 25;
          // Check for page break
          if (lastY + signatureHeight + 30 > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              lastY = drawCompanyHeader(doc, settings) + 20;
          } else {
              lastY += 10;
          }
          
          const sigY = lastY;
          const sigX = pageWidth - PAGE_MARGIN - 50; // Right aligned
          
          doc.addImage(settings.companySignature, 'PNG', sigX, sigY, 50, 25);
          
          doc.setDrawColor(150, 150, 150); // Gray line
          doc.setLineWidth(0.1);
          doc.line(sigX, sigY + 28, sigX + 50, sigY + 28);
          
          doc.setFontSize(8);
          doc.setTextColor('#6B7280');
          doc.text("Authorized Signature", sigX + 25, sigY + 32, { align: 'center' });
      }
      
      drawFooter(doc, settings);
      resolve(doc);
    };

    generatePdfContent();
  });
};

export const exportToPdf = async (data: QuotationData, settings: Settings) => {
  try {
      const doc = await createPdfDocument(data, settings);
      doc.save(`${settings.documentTitle.toLowerCase()}-${data.id}.pdf`);
  } catch (error) {
      console.error("Export to PDF failed", error);
      alert("Failed to export PDF.");
  }
}

export const exportInvoiceToPdf = async (invoice: InvoiceData, settings: Settings) => {
  try {
      // Map to structure compatible with createPdfDocument
      const pdfData = {
          ...invoice,
          date: invoice.invoiceDate, // Map for date display
          adjustments: [], // Invoices don't have adjustments in current type def
          checklist: [], // Invoices don't have checklist
      };
      const pdfSettings = {
          ...settings,
          documentTitle: 'INVOICE'
      };
      
      const doc = await createPdfDocument(pdfData, pdfSettings);
      doc.save(`${settings.invoicePrefix || 'INV'}-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
      console.error("Export Invoice to PDF failed", error);
      alert("Failed to export Invoice PDF.");
  }
}


export const exportToExcel = (data: QuotationData, settings: Settings) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return alert("Excel export library not loaded.");
    const summary = calculateTotals(data, settings);
    const wb = XLSX.utils.book_new();
    
    const showMaterials = data.showMaterials ?? true;
    const showAdjustments = data.showAdjustments ?? true;
    const showCostSummary = data.showCostSummary ?? true;

    // Group tiles
    const groupedTiles: Record<string, Tile[]> = {};
    data.tiles.forEach(tile => {
        const groupName = tile.group || 'General';
        if (!groupedTiles[groupName]) groupedTiles[groupName] = [];
        groupedTiles[groupName].push(tile);
    });
    
    const tilesData: any[] = [];
    Object.entries(groupedTiles).forEach(([groupName, tiles]) => {
         if (groupName !== 'General' || Object.keys(groupedTiles).length > 1) {
             tilesData.push({ Category: `[${groupName}]` }); // Section Header row
         }
         tiles.forEach(t => {
             tilesData.push({ Category: t.category, SQM: t.sqm, Cartons: t.cartons, Size: t.size, 'Tile Type': t.tileType, 'Unit Price': t.unitPrice, Subtotal: t.cartons * t.unitPrice });
         });
         tilesData.push({}); // Spacer
    });

    const wsTiles = XLSX.utils.json_to_sheet(tilesData);
    XLSX.utils.book_append_sheet(wb, wsTiles, "Tiles");

    if (showMaterials) {
        const materialsData = data.materials.map(m => ({ Item: m.item, Quantity: m.quantity, Unit: m.unit, 'Unit Price': m.unitPrice, Total: m.quantity * m.unitPrice, }));
        const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
        XLSX.utils.book_append_sheet(wb, wsMaterials, "Materials");
    }

    // Explicitly type summaryData to allow numbers in Value
    const summaryData: { Item: string; Value: string | number }[] = [
        { Item: "Client Name", Value: data.clientDetails.clientName }, { Item: "Project Name", Value: data.clientDetails.projectName }, { Item: "Date", Value: new Date(data.date).toLocaleDateString() }, { Item: "", Value: "" },
    ];

    if (showCostSummary) {
        summaryData.push({ Item: "Tiles Cost", Value: summary.totalTileCost });
        if (showMaterials) {
            summaryData.push({ Item: "Materials Cost", Value: summary.totalMaterialCost });
        }
        
        // Respect per-quote visibility flags
        const showWorkmanship = data.showWorkmanship ?? true;
        const showMaintenance = data.showMaintenance ?? settings.showMaintenance;
        const showTax = data.showTax ?? settings.showTax;

        if (showWorkmanship) summaryData.push({ Item: "Workmanship", Value: summary.workmanshipCost });
        if (showMaintenance && data.maintenance > 0) summaryData.push({ Item: "Maintenance", Value: data.maintenance });
        summaryData.push({ Item: "Profit", Value: summary.profitAmount });
        summaryData.push({ Item: "Subtotal", Value: summary.subtotal });
        
        if (showAdjustments) {
            summaryData.push({ Item: "Adjustments", Value: summary.totalAdjustments });
        }
        
        if (showTax) summaryData.push({ Item: "Tax", Value: summary.taxAmount });
        summaryData.push({ Item: "GRAND TOTAL", Value: summary.grandTotal });
    } else {
        summaryData.push({ Item: "Cost Summary", Value: "Hidden" });
    }

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    XLSX.writeFile(wb, `${settings.documentTitle.toLowerCase()}-${data.id}.xlsx`);
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
    if (!base64) return new ArrayBuffer(0);
    try {
        const base64WithoutPrefix = base64.split(',')[1] || base64;
        const binaryString = window.atob(base64WithoutPrefix);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (e) {
        console.error("Error converting base64 to buffer", e);
        return new ArrayBuffer(0);
    }
};

export const exportToWord = async (data: QuotationData, settings: Settings) => {
    const docx = (window as any).docx;
    const saveAs = (window as any).saveAs;
    if (!docx || !saveAs) return alert("Word export library not loaded.");
    const { Paragraph, TextRun, Packer, Document, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle, HeadingLevel, ImageRun, PageNumber, ShadingType, VerticalAlign } = docx;

    const summary = calculateTotals(data, settings);
    const goldColor = "B8860B";
    const secondaryColor = "0F172A";
    
    const showMaterials = data.showMaterials ?? true;
    const showAdjustments = data.showAdjustments ?? true;
    const showTerms = data.showTerms ?? settings.showTermsAndConditions;
    const showMaintenance = data.showMaintenance ?? settings.showMaintenance;
    const showTax = data.showTax ?? settings.showTax;
    const showWorkmanship = data.showWorkmanship ?? true;
    const showCostSummary = data.showCostSummary ?? true;

    let logoImageRun: any | undefined = undefined;
    if (settings.companyLogo) {
        try {
            const imageBuffer = base64ToBuffer(settings.companyLogo);
            logoImageRun = new ImageRun({ 
                data: imageBuffer, 
                transformation: { width: 60, height: 60 } // Constrain logo to avoid table blowouts
            });
        } catch (e) { console.error("Failed to process logo for DOCX export", e); }
    }
    
    // --- HEADER TABLE ---
    // Designed to prevent overlap: Logo cell (15%), Info Cell (55%), Meta Cell (30%)
    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, 
        columnWidths: [15, 55, 30], 
        borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: goldColor }, top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
        rows: [new TableRow({ children: [
            // Logo Cell
            new TableCell({ 
                children: [logoImageRun ? new Paragraph({ children: [logoImageRun] }) : new Paragraph("")],
                verticalAlign: VerticalAlign.CENTER 
            }),
            // Company Info Cell
            new TableCell({ 
                children: [ 
                    new Paragraph({ text: settings.companyName, style: "companyNameHeading" }), 
                    new Paragraph({ text: settings.companySlogan, style: "companySlogan" }), 
                    new Paragraph({ text: `${settings.companyAddress} | ${settings.companyEmail} | ${settings.companyPhone}`, style: "companyContact" }), 
                ], 
                verticalAlign: VerticalAlign.CENTER 
            }),
            // Meta Data Cell
            new TableCell({ 
                children: [ 
                    new Paragraph({ text: settings.documentTitle.toUpperCase(), style: "documentTitleHeading", alignment: AlignmentType.RIGHT }), 
                    new Paragraph({ text: `Date: ${new Date(data.date).toLocaleDateString()}`, alignment: AlignmentType.RIGHT }), 
                ], 
                verticalAlign: VerticalAlign.CENTER 
            }),
        ] })],
    });

    const children = [
        new Paragraph({ text: "BILLED TO", style: "sectionHeading" }),
        new Paragraph({ children: [new TextRun({ text: data.clientDetails.clientName, bold: true, size: 24 })] }),
        new Paragraph(data.clientDetails.projectName), new Paragraph(data.clientDetails.clientAddress), new Paragraph(data.clientDetails.clientPhone),
        new Paragraph({ text: "Tile Details & Cost Summary", style: "sectionHeading" }),
    ];
    
    // Group tiles
    const groupedTiles: Record<string, Tile[]> = {};
    data.tiles.forEach(tile => {
        const groupName = tile.group || 'General';
        if (!groupedTiles[groupName]) groupedTiles[groupName] = [];
        groupedTiles[groupName].push(tile);
    });

    Object.entries(groupedTiles).forEach(([groupName, tiles]) => {
        if (groupName !== 'General' || Object.keys(groupedTiles).length > 1) {
            children.push(new Paragraph({ text: groupName, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
        }
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [ "Category", "m²", "Cartons", ...(settings.showTileSize ? ["Size"] : []), "Tile Type", ...(settings.showUnitPrice ? ["Unit Price"] : []), ...(settings.showSubtotal ? ["Subtotal"] : [])].map(text => new TableCell({ children: [new Paragraph({ text, bold: true, color: "FFFFFF" })], shading: { type: ShadingType.SOLID, fill: secondaryColor } })), tableHeader: true }),
                ...tiles.map(t => new TableRow({ children: [ new TableCell({ children: [new Paragraph(t.category)] }), new TableCell({ children: [new Paragraph({ text: t.sqm.toFixed(2), alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: String(t.cartons), alignment: AlignmentType.RIGHT })] }), ...(settings.showTileSize ? [new TableCell({ children: [new Paragraph(t.size || "N/A")] })] : []), new TableCell({ children: [new Paragraph(t.tileType)] }), ...(settings.showUnitPrice ? [new TableCell({ children: [new Paragraph({ text: formatCurrency(t.unitPrice), alignment: AlignmentType.RIGHT })] })] : []), ...(settings.showSubtotal ? [new TableCell({ children: [new Paragraph({ text: formatCurrency(t.cartons * t.unitPrice), alignment: AlignmentType.RIGHT })] })] : []) ] })),
            ],
        }));
        children.push(new Paragraph("")); // Spacer
    });
    
    if (showMaterials) {
        children.push(new Paragraph({ text: "Other Materials", style: "sectionHeading" }));
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                 new TableRow({ children: ["Item", "Quantity", ...(settings.showUnitPrice ? ["Unit Price"] : []), ...(settings.showSubtotal ? ["Total"] : [])].map(text => new TableCell({ children: [new Paragraph({ text, bold: true, color: "FFFFFF" })], shading: { type: ShadingType.SOLID, fill: secondaryColor } })), tableHeader: true }),
                ...data.materials.map(m => new TableRow({ children: [ new TableCell({ children: [new Paragraph(m.item)] }), new TableCell({ children: [new Paragraph({ text: `${m.quantity} ${m.unit}`, alignment: AlignmentType.RIGHT })] }), ...(settings.showUnitPrice ? [new TableCell({ children: [new Paragraph({ text: formatCurrency(m.unitPrice), alignment: AlignmentType.RIGHT })] })] : []), ...(settings.showSubtotal ? [new TableCell({ children: [new Paragraph({ text: formatCurrency(m.quantity * m.unitPrice), alignment: AlignmentType.RIGHT })] })] : []) ] })),
            ],
        }));
    }
    
    // Cost Summary Table Rows
    let costRows: any[] = [];
    
    if (showCostSummary) {
        costRows = [
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Tiles Cost")] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(summary.totalTileCost), alignment: AlignmentType.RIGHT })] })] }),
        ];
        
        if (showMaterials) {
            costRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Materials Cost")] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(summary.totalMaterialCost), alignment: AlignmentType.RIGHT })] })] }));
        }
        
        if (showWorkmanship) {
            costRows.push(new TableRow({ children: [ new TableCell({ children: [ new Paragraph("Workmanship"), new Paragraph({ children: [ new TextRun({ text: `(${formatCurrency(data.workmanshipRate)}/m² × ${summary.totalSqm.toFixed(2)}m²)`, size: 18, italics: true, color: "808080" }) ] }) ] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(summary.workmanshipCost), alignment: AlignmentType.RIGHT })], verticalAlign: VerticalAlign.CENTER }) ] }));
        }
        
        if (showMaintenance && data.maintenance > 0) costRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph("Maintenance")] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(data.maintenance), alignment: AlignmentType.RIGHT })] })] }));
        if (data.profitPercentage) costRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph(`Profit (${data.profitPercentage}%)`)] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(summary.profitAmount), alignment: AlignmentType.RIGHT })] })] }));
        
        costRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Subtotal", bold: true })] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(summary.subtotal), alignment: AlignmentType.RIGHT, bold: true })] })] }));
        
        if (showTax && settings.taxPercentage > 0) costRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph(`Tax (${settings.taxPercentage}%)`)] }), new TableCell({ children: [new Paragraph({ text: formatCurrency(summary.taxAmount), alignment: AlignmentType.RIGHT })] })] }));
        
        costRows.push(new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Grand Total", style: "grandTotalText" })], shading: { type: ShadingType.SOLID, fill: goldColor } }), new TableCell({ children: [new Paragraph({ text: formatCurrency(summary.grandTotal), style: "grandTotalText", alignment: AlignmentType.RIGHT })], shading: { type: ShadingType.SOLID, fill: goldColor } }) ], }));
    } else {
        costRows = [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Cost Summary Hidden", italics: true })] }), new TableCell({ children: [new Paragraph("")] })] })];
    }

    children.push(new Paragraph(""));
    children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [50, 50],
         borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
        rows: [ new TableRow({ children: [
            new TableCell({ children: [ new Paragraph({ text: "Project Checklist", style: "sectionHeading" }), ...((data.showChecklist && data.checklist && data.checklist.length > 0) ? data.checklist.map(item => new Paragraph({ text: `${item.checked ? 'x' : ' '}] ${item.item}`, bullet: { level: 0 } })) : [new Paragraph("No checklist items.")]) ]}),
            new TableCell({ children: [
                new Paragraph({ text: "Cost Summary", style: "sectionHeading" }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE }, borders: { insideHorizontal: { style: BorderStyle.DOTTED, size: 1, color: "BFBFBF" } },
                    rows: costRows,
                }),
            ]}),
        ] })]
    }));

    if (showTerms && data.termsAndConditions) {
        children.push(new Paragraph({ text: "Terms & Conditions", style: "sectionHeading" }));
        children.push(new Paragraph(data.termsAndConditions));
    }

    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "companyNameHeading", name: "Company Name", run: { size: 28, bold: true, color: "1F2937", font: "Arial" }, paragraph: { spacing: { after: 40 } } },
                { id: "companySlogan", name: "Company Slogan", run: { size: 16, italics: true, color: goldColor, font: "Arial" }, paragraph: { spacing: { after: 40 } } },
                { id: "companyContact", name: "Company Contact", run: { size: 14, color: "6B7280", font: "Arial" } },
                { id: "documentTitleHeading", name: "Doc Title", run: { size: 28, bold: true, color: goldColor, font: "Arial" } },
                { id: "sectionHeading", name: "Section Heading", run: { size: 24, bold: true, color: goldColor, font: "Arial" }, paragraph: { spacing: { before: 240, after: 120 } } },
                { id: "grandTotalText", name: "Grand Total", run: { size: 24, bold: true, color: "FFFFFF", font: "Arial" } },
            ],
        },
        sections: [{
            headers: { default: new docx.Header({ children: [headerTable] }) },
            footers: {
                default: new docx.Footer({
                    children: [new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: goldColor } },
                        rows: [new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ text: settings.footerText, alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] }), new TextRun(" of "), new TextRun({ children: [PageNumber.TOTAL_PAGES] })] })] }),
                        ] })],
                    })],
                }),
            },
            children: children,
        }],
    });
    
    Packer.toBlob(doc).then(blob => { saveAs(blob, `${settings.documentTitle.toLowerCase()}-${data.id}.docx`); });
};


export const exportToCsv = (data: QuotationData, settings: Settings) => {
    const saveAs = (window as any).saveAs;
    if (!saveAs) return alert("File saving library not loaded.");
    
    const showMaterials = data.showMaterials ?? true;
    
    let csvContent = "Section,Item,Quantity,Unit,Unit Price,Total\n";

    data.tiles.forEach(t => {
        const row = [`Tiles - ${t.group || 'General'}`, `"${t.category}"`, t.cartons, "cartons", t.unitPrice, t.cartons * t.unitPrice].join(",");
        csvContent += row + "\n";
    });

    if (showMaterials) {
        data.materials.forEach(m => {
            const row = ["Materials", `"${m.item}"`, m.quantity, m.unit, m.unitPrice, m.quantity * m.unitPrice].join(",");
            csvContent += row + "\n";
        });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${settings.documentTitle.toLowerCase()}-${data.id}.csv`);
};

export const exportAnalyticsToCsv = (metrics: any) => {
    const saveAs = (window as any).saveAs;
    if (!saveAs) return alert("File saving library not loaded.");
    const rows = [
        ['Analytics Summary'], [], ['Metric', 'Value'],
        ['Total Quoted Value', formatCurrency(metrics.totalQuoted)],
        ['Quotations Sent', String(metrics.totalQuotations)],
        ['Acceptance Rate', `${(metrics.acceptanceRate || 0).toFixed(1)}%`],
        [],
        ['Invoices Generated', String(metrics.invoicesGenerated)],
        ['Paid This Month', formatCurrency(metrics.paidThisMonth)],
    ];

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, "Analytics_Summary.csv");
};

export const exportHistoryToCsv = (quotations: QuotationData[], settings: Settings) => {
  const saveAs = (window as any).saveAs;
  if (!saveAs) return alert("File saving library not loaded.");
  const rows: (string|number)[][] = [];
  
  const headers = [ 'Quotation ID', 'Date', 'Client Name', 'Project Name', 'Status', 'Total Amount', 'Invoice ID' ];
  rows.push(headers);
  
  quotations.forEach(q => {
    rows.push([ q.id, new Date(q.date).toISOString().split('T')[0], `"${q.clientDetails.clientName}"`, `"${q.clientDetails.projectName}"`, q.status, calculateTotals(q, settings).grandTotal, q.invoiceId || 'N/A' ]);
  });
  
  const csvContent = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, "Quotation_History.csv");
};

export const exportQuotesToZip = async (quotations: QuotationData[], settings: Settings) => {
    const JSZip = (window as any).JSZip;
    const saveAs = (window as any).saveAs;
    if (!JSZip || !saveAs) return alert("Zip library not loaded.");

    const zip = new JSZip();
    const folder = zip.folder("Quotations");

    // Generate PDF blobs for each quotation
    // Note: We reuse createPdfDocument but need to get blob from doc
    // jspdf doc.output('blob') returns a blob
    
    const promises = quotations.map(async (q) => {
        try {
             const doc = await createPdfDocument(q, settings);
             const blob = doc.output('blob');
             folder.file(`${q.clientDetails.clientName.replace(/[^a-z0-9]/gi, '_')}_${q.id.substring(0,6)}.pdf`, blob);
        } catch (e) {
            console.error(`Failed to zip quote ${q.id}`, e);
        }
    });

    await Promise.all(promises);
    
    zip.generateAsync({ type: "blob" }).then(function(content: Blob) {
        saveAs(content, "Hanifgold_Quotations.zip");
    });
};
