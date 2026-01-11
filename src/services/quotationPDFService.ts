/**
 * Solar EPC Quotation PDF Generator Service
 * Generates professional, print-ready quotation PDFs with all 8 sections
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import type { Quotation, QuotationItem } from '@/types';
import { NotoSansBase64 } from '@/utils/notoSansBase64';
import { settingsService } from './settingsService';

interface PDFGeneratorOptions {
  logoPath?: string;
  companyName?: string;
  tagline?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}

interface MonthlyData {
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
}

const DEFAULT_OPTIONS: PDFGeneratorOptions = {
  companyName: 'Shine Solar & Electrical',
  tagline: 'Solar EPC & Electrical Solutions',
  companyAddress: 'Mumbai, India',
  companyPhone: '+91 XXXXX XXXXX',
  companyEmail: 'info@shinesolar.com',
  companyWebsite: 'www.shinesolar.com',
};

export class QuotationPDFService {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private yPosition: number;
  private options: PDFGeneratorOptions;

  constructor(options: Partial<PDFGeneratorOptions> = {}) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Embed Unicode font for ₹ symbol
    this.doc.addFileToVFS('NotoSans.ttf', NotoSansBase64);
    this.doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
    this.doc.addFont('NotoSans.ttf', 'NotoSans', 'bold');
    this.doc.setFont('NotoSans');

    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.margin = 15;
    this.yPosition = this.margin;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate complete quotation PDF
   */
  async generateQuotationPDF(
    quotation: Quotation & { items?: QuotationItem[] },
    filename: string = 'Quotation.pdf'
  ): Promise<void> {
    try {
      // Add header
      this.addHeader();
      this.yPosition += 10;

      // Add all 8 sections
      this.addHeaderClientDetails(quotation);
      this.addSiteSpecification(quotation);
      this.addSolarSystemSpecification(quotation);
      this.addDeveloperDetails(quotation);
      this.addMonthlySolarData(quotation.monthlySolarData);
      this.addTechnicalDetails(quotation.items || []);
      this.addOfferAndPricing(quotation);
      this.addPaymentSchedule(quotation.paymentSchedule || []);

      // Add footer
      this.addFooter();

      // Download
      this.doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate quotation PDF');
    }
  }

  /**
   * Add header with company info
   */
  private addHeader(): void {
    const headerHeight = 30;

    // Gradient-style background (light blue)
    this.doc.setFillColor(240, 249, 255);
    this.doc.rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, headerHeight, 'F');

    // Optional logo on the left
    if (this.options.logoPath) {
      try {
        const imgType = this.options.logoPath.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        const logoWidth = 24;
        const logoHeight = 24;
        this.doc.addImage(
          this.options.logoPath,
          imgType as any,
          this.margin + 2,
          this.margin + 3,
          logoWidth,
          logoHeight,
          undefined,
          'FAST'
        );
      } catch (err) {
        console.warn('Failed to render logo in quotation PDF', err);
      }
    }

    // Company name (bold, larger)
    this.doc.setFont('NotoSans', 'bold');
    this.doc.setFontSize(22);
    this.doc.setTextColor(30, 64, 175); // primary blue
    this.doc.text(this.options.companyName || 'Shine Solar & Electrical', this.pageWidth / 2, this.margin + 10, {
      align: 'center',
    });

    // Tagline
    this.doc.setFont('NotoSans', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(this.options.tagline || 'Solar EPC & Electrical Solutions', this.pageWidth / 2, this.margin + 18, {
      align: 'center',
    });

    // "QUOTATION" badge
    this.doc.setFont('NotoSans', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(22, 163, 74); // green
    this.doc.text('PROFESSIONAL QUOTATION', this.pageWidth / 2, this.margin + 25, {
      align: 'center',
    });

    // Border
    this.doc.setDrawColor(30, 64, 175);
    this.doc.setLineWidth(0.8);
    this.doc.rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, headerHeight);

    this.yPosition = this.margin + headerHeight + 8;
  }

  /**
   * SECTION 1: Header / Client Details
   */
  private addHeaderClientDetails(quotation: Quotation): void {
    const details: Array<[string, string]> = [];
    
    if (quotation.clientName) details.push(['Client Name', quotation.clientName]);
    if (quotation.projectPurpose) details.push(['Project Purpose', quotation.projectPurpose]);
    if (quotation.systemSize) details.push(['System Size (kW)', quotation.systemSize.toString()]);
    if (quotation.phase) details.push(['Phase', quotation.phase]);
    if (quotation.siteLocation) details.push(['Site Location', quotation.siteLocation]);

    if (details.length === 0) return; // Skip if no data

    this.addSectionTitle('1. CLIENT DETAILS');
    this.addLabelValueRows(details);
    this.yPosition += 5;
  }

  /**
   * SECTION 2: Proposed Site Specification
   */
  private addSiteSpecification(quotation: Quotation): void {
    const details: Array<[string, string]> = [];
    
    if (quotation.siteLocation) details.push(['Location', quotation.siteLocation]);
    if (quotation.siteState) details.push(['State', quotation.siteState]);
    if (quotation.roofType) details.push(['Type of Roof/Ground', quotation.roofType]);
    if (quotation.latitude) details.push(['Latitude', quotation.latitude.toString()]);
    if (quotation.longitude) details.push(['Longitude', quotation.longitude.toString()]);
    if (quotation.solarRadiation) details.push(['Solar Radiation (kWh/m²/day)', quotation.solarRadiation.toString()]);

    if (details.length === 0) return; // Skip if no data

    this.addSectionTitle('2. PROPOSED SITE SPECIFICATION');
    this.addLabelValueRows(details);
    this.yPosition += 4;
  }

  /**
   * SECTION 3: Solar PV System Specification
   */
  private addSolarSystemSpecification(quotation: Quotation): void {
    const details: Array<[string, string]> = [];
    
    if (quotation.dcCapacity) details.push(['DC Capacity (kW)', quotation.dcCapacity.toString()]);
    if (quotation.moduleTechnology) details.push(['Module Technology', quotation.moduleTechnology]);
    if (quotation.inverterType) details.push(['Inverter Type', quotation.inverterType]);
    if (quotation.mountingStructure) details.push(['Mounting Structure', quotation.mountingStructure]);
    if (quotation.safetyDevices) details.push(['Safety Devices', quotation.safetyDevices]);
    if (quotation.powerEvacuation) details.push(['Power Evacuation', quotation.powerEvacuation]);
    if (quotation.projectScheme) details.push(['Project Scheme', quotation.projectScheme]);

    if (details.length === 0) return; // Skip if no data

    this.addSectionTitle('3. SOLAR PV SYSTEM SPECIFICATION');
    this.addLabelValueRows(details);
    this.yPosition += 4;
  }

  /**
   * SECTION 4: Developer Details
   */
  private addDeveloperDetails(quotation: Quotation): void {
    const details: Array<[string, string]> = [];
    
    if (quotation.developerName) details.push(['Developer Name', quotation.developerName]);
    if (quotation.quotationDate) details.push(['Offer Date', new Date(quotation.quotationDate).toLocaleDateString('en-IN')]);
    if (quotation.offerValidityDays) details.push(['Offer Validity (Days)', quotation.offerValidityDays.toString()]);

    if (details.length === 0) return; // Skip if no data

    this.addSectionTitle('4. DEVELOPER DETAILS');
    this.addLabelValueRows(details);
    this.yPosition += 4;
  }

  /**
   * SECTION 5: Monthly Solar Data (JAN-DEC)
   */
  private addMonthlySolarData(monthlySolarData?: MonthlyData): void {
    this.addSectionTitle('5. MONTHLY SOLAR DATA (kWh/m²/day)');

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthlyKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

    const header = months;
    const data: string[][] = [[
      ...monthlyKeys.map((key) => (monthlySolarData?.[key]?.toFixed(2) || '-')),
    ]];

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [header],
      body: data,
      margin: this.margin,
      theme: 'grid',
      styles: {
        font: 'NotoSans',
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4,
        font: 'NotoSans',
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center',
        cellPadding: 3,
        font: 'NotoSans',
      },
      columnStyles: Object.assign(
        {},
        ...header.map((_, i) => ({
          [i]: { halign: 'center' },
        }))
      ),
      didDrawPage: () => {},
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 3;
  }

  /**
   * SECTION 6: Technical Details (Dynamic Table)
   */
  private addTechnicalDetails(items: QuotationItem[]): void {
    this.addSectionTitle('6. TECHNICAL DETAILS');

    if (items.length === 0) {
      this.doc.setFont('NotoSans', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('No technical details available', this.margin, this.yPosition);
      this.yPosition += 5;
      return;
    }

    const header = ['Component', 'Specification', 'Qty', 'Make'];
    const data = items.map((item) => [
      item.component || '—',
      item.specification || '—',
      item.quantity?.toString() || '—',
      item.make || '—',
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [header],
      body: data,
      margin: this.margin,
      theme: 'grid',
      styles: {
        font: 'NotoSans',
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5,
        font: 'NotoSans',
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
        font: 'NotoSans',
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 35 },
      },
      didDrawPage: () => {},
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 3;
  }

  /**
   * Helper: Add offer and pricing details with dominant price block
   */
  private addOfferAndPricing(quotation: Quotation): void {
    this.addSectionTitle('7. OFFER & PROJECT PRICE');

    this.checkPageBreak(85);

    // Pricing details (compact)
    const leftCol = this.margin + 5;
    const rightCol = this.pageWidth / 2 + 5;
    let detailY = this.yPosition;

    this.doc.setFont('NotoSans', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(55, 65, 81);

    // Left column details
    if (quotation.plantCapacity) {
      this.doc.setFont('NotoSans', 'bold');
      this.doc.text('Plant Capacity', leftCol, detailY);
      this.doc.setFont('NotoSans', 'normal');
      this.doc.text(':', leftCol + 50, detailY);
      this.doc.setFont('NotoSans', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(`${quotation.plantCapacity} kW`, leftCol + 55, detailY);
      this.doc.setTextColor(55, 65, 81);
      detailY += 6;
    }

    if (quotation.priceBasis) {
      this.doc.setFont('NotoSans', 'bold');
      this.doc.text('Price Basis', leftCol, detailY);
      this.doc.setFont('NotoSans', 'normal');
      this.doc.text(':', leftCol + 50, detailY);
      this.doc.setFont('NotoSans', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(quotation.priceBasis, leftCol + 55, detailY);
      this.doc.setTextColor(55, 65, 81);
      detailY += 6;
    }

    if (quotation.basePrice) {
      this.doc.setFont('NotoSans', 'bold');
      this.doc.text('Base Price', leftCol, detailY);
      this.doc.setFont('NotoSans', 'normal');
      this.doc.text(':', leftCol + 50, detailY);
      this.doc.setFont('NotoSans', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(this.formatINR(quotation.basePrice), leftCol + 55, detailY);
      this.doc.setTextColor(55, 65, 81);
      detailY += 6;
    }

    // Right column details
    detailY = this.yPosition;

    this.doc.setFont('NotoSans', 'bold');
    this.doc.text('GST', rightCol, detailY);
    this.doc.setFont('NotoSans', 'normal');
    this.doc.text(':', rightCol + 50, detailY);
    this.doc.setFont('NotoSans', 'bold');
    this.doc.setTextColor(30, 64, 175);
    this.doc.text(`${quotation.gstPercent || 0}% (${this.formatINR(quotation.totalGST)})`, rightCol + 55, detailY);
    this.doc.setTextColor(55, 65, 81);
    detailY += 6;

    if (quotation.discountPercent && quotation.discountPercent > 0) {
      this.doc.setFont('NotoSans', 'bold');
      this.doc.text('Discount', rightCol, detailY);
      this.doc.setFont('NotoSans', 'normal');
      this.doc.text(':', rightCol + 50, detailY);
      this.doc.setFont('NotoSans', 'bold');
      this.doc.setTextColor(22, 163, 74);
      this.doc.text(`${quotation.discountPercent}%`, rightCol + 55, detailY);
      this.doc.setTextColor(55, 65, 81);
      detailY += 6;
    }

    this.yPosition = Math.max(detailY, this.yPosition + 18) + 8;

    // DOMINANT TOTAL PAYABLE PRICE BOX
    const boxHeight = 28;
    const boxMargin = this.margin;
    
    // Shadow effect
    this.doc.setFillColor(200, 200, 200);
    this.doc.rect(boxMargin + 1, this.yPosition + 1, this.pageWidth - 2 * boxMargin, boxHeight, 'F');
    
    // Main box with gradient-style blue background
    this.doc.setFillColor(30, 64, 175);
    this.doc.rect(boxMargin, this.yPosition, this.pageWidth - 2 * boxMargin, boxHeight, 'F');
    
    // Strong border
    this.doc.setDrawColor(30, 64, 175);
    this.doc.setLineWidth(1.2);
    this.doc.rect(boxMargin, this.yPosition, this.pageWidth - 2 * boxMargin, boxHeight);

    // Label - TOTAL PAYABLE PRICE
    this.doc.setFont('NotoSans', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('TOTAL PAYABLE PRICE', this.pageWidth / 2, this.yPosition + 10, { align: 'center' });

    // Amount - HUGE and centered
    this.doc.setFontSize(20);
    this.doc.setFont('NotoSans', 'bold');
    this.doc.text(this.formatINR(quotation.grandTotal), this.pageWidth / 2, this.yPosition + 21, { align: 'center' });

    this.yPosition += boxHeight + 8;

    // Trust-building summary line
    this.doc.setFont('NotoSans', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(55, 65, 81);
    const summaryText = 'This quotation includes complete design, supply, installation, commissioning and net-metering support.';
    this.doc.text(summaryText, this.pageWidth / 2, this.yPosition, { align: 'center', maxWidth: this.pageWidth - 2 * this.margin - 10 });

    this.yPosition += 8;
  }

  /**
   * SECTION 8: Payment Schedule
   */
  private addPaymentSchedule(schedule: Array<{ percentage: number; condition: string }>): void {
    this.addSectionTitle('8. PAYMENT SCHEDULE');

    if (schedule.length === 0) {
      this.doc.setFont('NotoSans', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('Payment schedule will be defined based on project milestones.', this.margin, this.yPosition);
      this.yPosition += 5;
      return;
    }

    const header = ['Stage', 'Percentage (%)', 'Condition'];
    const data = schedule.map((row, idx) => [
      `Stage ${idx + 1}`,
      row.percentage?.toString() || '0',
      row.condition || '—',
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [header],
      body: data,
      margin: this.margin,
      theme: 'grid',
      styles: {
        font: 'NotoSans',
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5,
        font: 'NotoSans',
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
        font: 'NotoSans',
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 'auto' },
      },
      didDrawPage: () => {},
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 3;
  }

  /**
   * Add footer
   */
  private addFooter(): void {
    const footerY = this.pageHeight - 18;
    const pageCount = (this.doc as any).internal.pages.length - 1;

    // Line separator
    this.doc.setDrawColor(30, 64, 175);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    // Company details
    this.doc.setFont('NotoSans', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(55, 65, 81);

    const footerLines = [
      `${this.options.companyName} | ${this.options.companyAddress}`,
      `Phone: ${this.options.companyPhone} | Email: ${this.options.companyEmail}`,
      'This is a system-generated quotation. Valid for 30 days from date of issue.',
    ];

    footerLines.forEach((line, idx) => {
      this.doc.text(line, this.pageWidth / 2, footerY + idx * 3.5, { align: 'center' });
    });

    // Page number
    this.doc.setFont('NotoSans', 'bold');
    this.doc.setTextColor(30, 64, 175);
    this.doc.text(`Page ${pageCount}`, this.pageWidth - this.margin - 10, footerY);
  }

  /**
   * Helper: Add section title with strong visual hierarchy
   */
  private addSectionTitle(title: string): void {
    this.checkPageBreak(15);

    // Extra spacing before section
    this.yPosition += 3;

    this.doc.setFont('NotoSans', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(30, 64, 175);
    this.doc.text(title, this.margin, this.yPosition);

    // Strong underline
    this.doc.setDrawColor(30, 64, 175);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, this.yPosition + 2, this.pageWidth - this.margin, this.yPosition + 2);

    // Light underline shadow
    this.doc.setDrawColor(200, 210, 240);
    this.doc.setLineWidth(0.4);
    this.doc.line(this.margin, this.yPosition + 3, this.pageWidth - this.margin, this.yPosition + 3);

    this.yPosition += 10;
  }

  /**
   * Helper: Render clean label-value rows (NOT a table)
   */
  private addLabelValueRows(data: Array<[string, string]>): void {
    if (data.length === 0) return;

    this.checkPageBreak(data.length * 6 + 5);

    const labelWidth = 70;
    const startX = this.margin + 5;
    
    this.doc.setFontSize(9);
    
    data.forEach(([label, value], idx) => {
      const rowY = this.yPosition + idx * 6;
      
      // Label (semi-bold)
      this.doc.setFont('NotoSans', 'bold');
      this.doc.setTextColor(55, 65, 81);
      this.doc.text(`${label}`, startX, rowY);
      
      // Separator
      this.doc.setFont('NotoSans', 'normal');
      this.doc.text(':', startX + labelWidth, rowY);
      
      // Value (bold, blue)
      this.doc.setFont('NotoSans', 'bold');
      this.doc.setTextColor(30, 64, 175);
      this.doc.text(value, startX + labelWidth + 5, rowY);
    });

    this.yPosition += data.length * 6 + 3;
  }

  /**
   * Helper: Check if page break is needed
   */
  private checkPageBreak(neededSpace: number): void {
    if (this.yPosition + neededSpace > this.pageHeight - 20) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  /**
   * Helper: Format currency (Indian format with proper ₹ symbol)
   */
  private formatINR(amount?: number | null): string {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    const value = Number(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Get PDF as blob (for preview or custom handling)
   */
  getBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Get PDF as data URL
   */
  getDataUrl(): string {
    return this.doc.output('dataurlstring') as string;
  }
}

/**
 * Generate and download quotation PDF
 */
export async function generateQuotationPDF(
  quotation: Quotation & { items?: QuotationItem[] },
  options?: Partial<PDFGeneratorOptions>
): Promise<void> {
  const company = await settingsService.getCompanySettings();
  const branding: Partial<PDFGeneratorOptions> = {
    companyName: company?.companyName || DEFAULT_OPTIONS.companyName,
    companyAddress: company?.address || DEFAULT_OPTIONS.companyAddress,
    companyPhone: company?.phone || DEFAULT_OPTIONS.companyPhone,
    companyEmail: company?.email || DEFAULT_OPTIONS.companyEmail,
    companyWebsite: company?.website || DEFAULT_OPTIONS.companyWebsite,
    logoPath: company?.logo,
    tagline: company?.businessType || DEFAULT_OPTIONS.tagline,
  };
  const service = new QuotationPDFService({ ...branding, ...options });
  const filename = `Quotation-${quotation.clientName || 'Document'}-${new Date().getTime()}.pdf`;
  await service.generateQuotationPDF(quotation, filename);
}

/**
 * Get quotation PDF as blob for preview
 */
export async function getQuotationPDFBlob(
  quotation: Quotation & { items?: QuotationItem[] },
  options?: Partial<PDFGeneratorOptions>
): Promise<Blob> {
  const company = await settingsService.getCompanySettings();
  const branding: Partial<PDFGeneratorOptions> = {
    companyName: company?.companyName || DEFAULT_OPTIONS.companyName,
    companyAddress: company?.address || DEFAULT_OPTIONS.companyAddress,
    companyPhone: company?.phone || DEFAULT_OPTIONS.companyPhone,
    companyEmail: company?.email || DEFAULT_OPTIONS.companyEmail,
    companyWebsite: company?.website || DEFAULT_OPTIONS.companyWebsite,
    logoPath: company?.logo,
    tagline: company?.businessType || DEFAULT_OPTIONS.tagline,
  };
  const service = new QuotationPDFService({ ...branding, ...options });
  await (service as any).generateQuotationPDF(quotation);
  return service.getBlob();
}
