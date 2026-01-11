/**
 * Invoice Details Component
 * Display GST-compliant invoice with payment tracking
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Edit, 
  Trash2, 
  Download, 
  Send, 
  Calendar,
  User,
  Building,
  Plus,
  RefreshCw
} from 'lucide-react';
import { invoicesService } from '@/services/invoicesService';
import { db } from '@/services/database';
import { settingsService, type CompanySettings } from '@/services/settingsService';
import type { Invoice, InvoiceItem } from '@/types/extended';
import type { Customer, Project } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotoSansBase64 } from '@/utils/notoSansBase64';

export function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToastStore();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [paymentsSummary, setPaymentsSummary] = useState<{ totalReceived: number; lastPaymentDate?: Date } | null>(null);
  const [recentPayments, setRecentPayments] = useState<Array<{ id: number; paymentDate: Date; paymentMode: string; amount: number; referenceNumber?: string }>>([]);

  useEffect(() => {
    loadInvoiceDetails();
  }, [id]);

  useEffect(() => {
    (async () => {
      const company = await settingsService.getCompanySettings();
      if (company) setCompanySettings(company);
    })();
  }, []);

  // Reload invoice details when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (id) {
        loadInvoiceDetails();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id]);

  const loadInvoiceDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const inv = await db.invoices.get(Number(id));
      if (!inv) {
        error('Invoice not found');
        navigate('/invoices');
        return;
      }

      setInvoice(inv);

      // Payments summary for this invoice
      const pmts = await db.payments.where('invoiceId').equals(Number(id)).toArray();
      if (pmts.length > 0) {
        const totalReceived = pmts.reduce((sum, p) => sum + p.amount, 0);
        const lastPaymentDate = pmts.sort((a,b)=> new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0].paymentDate as Date;
        setPaymentsSummary({ totalReceived, lastPaymentDate });
        const recent = pmts
          .sort((a,b)=> new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          .slice(0, 5)
          .map(p => ({ id: p.id!, paymentDate: p.paymentDate as Date, paymentMode: p.paymentMode as string, amount: p.amount, referenceNumber: p.referenceNumber }));
        setRecentPayments(recent);
      } else {
        setPaymentsSummary({ totalReceived: 0 });
        setRecentPayments([]);
      }

      // Load line items
      const items = await db.invoiceItems.where('invoiceId').equals(Number(id)).toArray();
      setLineItems(items);

      // Load customer
      const cust = await db.customers.get(inv.customerId);
      setCustomer(cust || null);

      // Load project if applicable
      if (inv.projectId) {
        const proj = await db.projects.get(inv.projectId);
        setProject(proj || null);
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await invoicesService.deleteInvoice(Number(id));
      success('Invoice deleted successfully');
      navigate('/invoices');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      error('Failed to delete invoice');
    }
  };

  const generateInvoicePDF = (): jsPDF => {
    if (!invoice) return new jsPDF('p', 'mm', 'a4');
    const inv = invoice;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.addFileToVFS('NotoSans.ttf', NotoSansBase64);
    doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
    doc.addFont('NotoSans.ttf', 'NotoSans', 'bold');
    doc.setFont('NotoSans');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setLineHeightFactor(1.3);

    // === PREMIUM HEADER (Left: Company, Right: Invoice Meta) ===
    const companyName = companySettings?.companyName || 'Shine Electrical & Solar';
    const companyTagline = companySettings?.businessType || 'Professional Solar EPC • Installation • Maintenance';
    const companyPhone = companySettings?.phone || '+91 XXXXX XXXXX';
    const companyEmail = companySettings?.email || 'info@shinesolar.com';
    const companyAddress = companySettings?.address || 'Mumbai, India';
    const companyGSTIN = inv.companyGSTIN || 'Not Provided';
    const hasLogo = Boolean(companySettings?.logo);

    // LEFT SIDE: Company Details
    if (companySettings?.logo) {
      try {
        const imgType = companySettings.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(companySettings.logo, imgType as any, margin, y - 2, 20, 20, undefined, 'FAST');
      } catch (err) {
        console.warn('Failed to render logo in invoice PDF', err);
      }
    }

    const textOffset = hasLogo ? 24 : 0;

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Corporate blue
    doc.text(companyName, margin + textOffset, y);
    
    // Tagline (Smaller, Muted)
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // Muted gray
    doc.text(companyTagline, margin + textOffset, y + 6);
    
    // Company GSTIN
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text(`GSTIN: ${companyGSTIN}`, margin + textOffset, y + 11);

    // Address and contact
    doc.text(`${companyAddress}`, margin + textOffset, y + 16);
    doc.text(`Phone: ${companyPhone}  |  Email: ${companyEmail}`, margin + textOffset, y + 20);
    
    // RIGHT SIDE: Invoice Meta (Clean, no box)
    const rightX = pageWidth - margin;
    const labelX = rightX - 55;
    const valueX = rightX - 5;
    let metaY = y;
    
    // "TAX INVOICE" (Top-right, bold)
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.text('TAX INVOICE', rightX, metaY, { align: 'right' });
    
    // Spacing after title
    metaY += 8;
    
    // Invoice No
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('Invoice No', labelX, metaY);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(30, 64, 175);
    doc.text(inv.invoiceNumber, valueX, metaY, { align: 'right' });
    metaY += 6;
    
    // Date
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('Date', labelX, metaY);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(30, 64, 175);
    doc.text(formatDate(inv.invoiceDate), valueX, metaY, { align: 'right' });
    metaY += 6;
    
    // Due Date
    if (inv.dueDate) {
      doc.setFont('NotoSans', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Due Date', labelX, metaY);
      doc.setFont('NotoSans', 'normal');
      doc.setTextColor(30, 64, 175);
      doc.text(formatDate(inv.dueDate), valueX, metaY, { align: 'right' });
      metaY += 6;
    }

    // Set Y to clear all header content with proper buffer
    // metaY now points to where the last header line ended
    // Add at least 12 units of gap for breathing room
    y = metaY + 12;
    
    // Horizontal divider under header
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setDrawColor(200, 210, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);

    y += 10;  // Additional space after divider

    // === BILL TO & SUPPLY DETAILS (Two Clear Columns) ===
    const columnSeparator = pageWidth / 2;
    
    // BILL TO heading
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text('BILL TO', margin, y);
    
    // SUPPLY DETAILS heading
    doc.text('SUPPLY DETAILS', columnSeparator + 5, y);
    
    // Underlines for headings
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 1, margin + 40, y + 1);
    doc.line(columnSeparator + 5, y + 1, columnSeparator + 65, y + 1);

    y += 7;
    const leftX = margin;
    const billToRightX = columnSeparator + 5;
    
    // BILL TO content
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    let yLeft = y;
    
    if (customer?.name) {
      doc.setFont('NotoSans', 'bold');
      doc.text('Name:', leftX, yLeft);
      doc.setFont('NotoSans', 'normal');
      doc.setTextColor(17, 24, 39);
      doc.text(customer.name, leftX + 20, yLeft);
      yLeft += 5;
    }
    
    if (customer?.address) {
      const addr = customer.address;
      const addressText = [addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
      if (addressText) {
        doc.setFont('NotoSans', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text('Address:', leftX, yLeft);
        doc.setFont('NotoSans', 'normal');
        doc.setTextColor(17, 24, 39);
        const lines = doc.splitTextToSize(addressText, contentWidth / 2 - 25);
        lines.forEach((line: string, idx: number) => {
          doc.text(line, leftX + 20, yLeft + idx * 4);
        });
        yLeft += lines.length * 4 + 1;
      }
    }
    
    if (customer?.mobile) {
      doc.setFont('NotoSans', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Phone:', leftX, yLeft);
      doc.setFont('NotoSans', 'normal');
      doc.setTextColor(17, 24, 39);
      doc.text(customer.mobile, leftX + 20, yLeft);
      yLeft += 5;
    }
    
    if (customer?.email) {
      doc.setFont('NotoSans', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Email:', leftX, yLeft);
      doc.setFont('NotoSans', 'normal');
      doc.setTextColor(17, 24, 39);
      doc.text(customer.email, leftX + 20, yLeft);
      yLeft += 5;
    }
    
    if (inv.customerGSTIN) {
      doc.setFont('NotoSans', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('GSTIN:', leftX, yLeft);
      doc.setFont('NotoSans', 'normal');
      doc.setTextColor(17, 24, 39);
      doc.text(inv.customerGSTIN, leftX + 20, yLeft);
      yLeft += 5;
    }

    // SUPPLY DETAILS content
    let yRight = y;
    doc.setTextColor(55, 65, 81);
    
    if (project?.projectId) {
      doc.setFont('NotoSans', 'bold');
      doc.text('Project ID:', billToRightX, yRight);
      doc.setFont('NotoSans', 'normal');
      doc.setTextColor(17, 24, 39);
      doc.text(project.projectId, billToRightX + 28, yRight);
      yRight += 5;
    }
    
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('Place of Supply:', billToRightX, yRight);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(inv.placeOfSupply || 'N/A', billToRightX + 28, yRight);
    yRight += 5;
    
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('GST Type:', billToRightX, yRight);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(inv.gstType || 'Intra-state', billToRightX + 28, yRight);
    yRight += 5;

    y = Math.max(yLeft, yRight) + 8;

    // === ITEMS TABLE ===
    const tableData = lineItems.map((item, idx) => {
      const qty = item.quantity || 0;
      const rate = item.unitPrice || 0;
      const discPct = item.discount || 0;
      const gross = qty * rate;
      const discAmt = Math.round((gross * discPct) / 100);
      const taxable = gross - discAmt;
      const gstAmt = Math.round((taxable * (item.gstRate || 0)) / 100);
      const total = taxable + gstAmt;
      return [
        (idx + 1).toString(),
        item.itemName || '',
        String(item.hsnCode || item.sacCode || '-'),
        `${qty} ${item.unit || ''}`.trim(),
        formatCurrency(rate),
        discPct > 0 ? `${discPct}%` : '-',
        formatCurrency(taxable),
        `${item.gstRate || 0}%`,
        formatCurrency(gstAmt),
        formatCurrency(total),
      ];
    });

    // Calculate printable width to ensure all columns fit
    const printableWidth = pageWidth - margin * 2;
    
    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Taxable', 'GST%', 'GST Amt', 'Total']],
      body: tableData,
      margin: { top: y, left: margin, right: margin },
      tableWidth: printableWidth,
      theme: 'grid',
      styles: {
        font: 'NotoSans',
        fontSize: 8,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
        halign: 'center',
        valign: 'middle',
        overflow: 'visible',
        cellWidth: 'wrap',
        lineWidth: 0.15,
        textColor: [17, 24, 39],
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [17, 24, 39],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        font: 'NotoSans',
      },
      // Centered columns with balanced widths (sum = 176mm < 180mm)
      columnStyles: {
        0: { cellWidth: 6,  halign: 'center' },     // #
        1: { cellWidth: 40, halign: 'left'   },     // Description
        2: { cellWidth: 14, halign: 'center' },     // HSN
        3: { cellWidth: 14, halign: 'center' },     // Qty
        4: { cellWidth: 18, halign: 'center' },     // Rate
        5: { cellWidth: 12, halign: 'center' },     // Disc%
        6: { cellWidth: 20, halign: 'center' },     // Taxable
        7: { cellWidth: 12, halign: 'center' },     // GST%
        8: { cellWidth: 20, halign: 'center' },     // GST Amt
        9: { cellWidth: 20, halign: 'center' },     // Total
      },
      didDrawPage: function(data) {
        const pageSize = doc.internal.pageSize;
        const pHeight = pageSize.getHeight();
        doc.setFont('NotoSans', 'normal');
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${(doc as any).internal.pages.length - 1}` , pageWidth / 2, pHeight - 8, { align: 'center' });
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // === TOTALS SECTION (Boxed Panel on Right) ===
    const totalsBoxWidth = 78;
    const totalsBoxX = pageWidth - margin - totalsBoxWidth;
    const totalsBoxY = y;
    // Read all three values:
    const subtotal = inv.subtotal || 0;
    const taxableAmount = inv.taxableAmount || subtotal;
    const gstTotal = inv.totalGST || 0;
    const grandTotal = inv.grandTotal || taxableAmount + gstTotal;
    
    // Box background
    doc.setFillColor(245, 245, 250);
    doc.rect(totalsBoxX, totalsBoxY, totalsBoxWidth, 38, 'F');
    
    // Box border (stronger)
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.rect(totalsBoxX, totalsBoxY, totalsBoxWidth, 38);
    
    let totalsY = totalsBoxY + 6;
    const totalsLabelX = totalsBoxX + 4;
    const totalsValueX = totalsBoxX + totalsBoxWidth - 4;
    
    // Subtotal
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text('Subtotal:', totalsLabelX, totalsY);
    doc.setTextColor(30, 64, 175);
    doc.text(formatCurrency(subtotal), totalsValueX, totalsY, { align: 'right' });
    totalsY += 6;

    // Taxable Amount
    doc.setTextColor(55, 65, 81);
    doc.text('Taxable Amount:', totalsLabelX, totalsY);
    doc.setTextColor(30, 64, 175);
    doc.text(formatCurrency(taxableAmount), totalsValueX, totalsY, { align: 'right' });
    totalsY += 6;
    
    // Divider line
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    doc.line(totalsLabelX, totalsY, totalsValueX, totalsY);
    totalsY += 5;
    
    // GRAND TOTAL (Dominant - larger and bolder)
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 64, 175);
    doc.text('GRAND TOTAL:', totalsLabelX, totalsY);
    doc.setFontSize(14);
    doc.text(formatCurrency(grandTotal), totalsValueX, totalsY, { align: 'right' });

    // Payment details and signature
    const footerY = Math.max(totalsBoxY + 44, y + 25);
    
    // Payment Details heading (Corporate style)
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text('Payment Details', margin, footerY);
    
    // Underline for Payment Details
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY + 1.5, margin + 40, footerY + 1.5);
    
    // Payment info
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('Account Name: Shine Electrical & Solar', margin, footerY + 6);
    doc.text('Bank: HDFC Bank | A/C: 123456789012 | IFSC: HDFC0000123', margin, footerY + 11);
    doc.text('UPI: shinesolar@hdfcbank', margin, footerY + 16);

    // Signature section (right side) - Corporate style
    const signatureX = pageWidth - margin - 65;
    const signatureY = footerY + 12;
    
    // Signature label
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text('Authorized Signatory', signatureX + 32.5, signatureY, { align: 'center' });
    
    // Signature line (professional)
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(signatureX, signatureY + 8, signatureX + 65, signatureY + 8);

    return doc;
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      const doc = generateInvoicePDF();
      doc.save(`${invoice.invoiceNumber}.pdf`);
      success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      error('Failed to download invoice');
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice || !customer) return;
    try {
      // Generate PDF (not attached automatically, but for future use)
      generateInvoicePDF();
      // Try to open email client or show dialog
      if (customer?.email) {
        const subject = `Invoice ${invoice.invoiceNumber}`;
        const body = `Dear ${customer.name},\n\nPlease find attached the invoice for your recent purchase.\n\nTotal Amount Due: ${formatCurrency(invoice.grandTotal)}\n\nThank you for your business!`;
        const mailtoLink = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        success('Email client opened. Please attach the invoice PDF.');
      } else {
        error('Customer email not available');
      }
    } catch (err) {
      console.error('Error sending invoice:', err);
      error('Failed to send invoice');
    }
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    const value = Number(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Invoice not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
          <p className="text-gray-600 mt-1">{invoice.invoiceType}</p>
        </div>
        <div className="flex space-x-3">
          {invoice.status === 'Draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/invoices/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={loadInvoiceDetails}
            title="Refresh invoice data"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/payments/new?invoiceId=${id}`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSendInvoice}>
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Invoice Display */}
      <Card className="p-8">
        {/* Company Header */}
        <div className="border-b pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Shine Solar</h2>
              <p className="text-gray-600 mt-1">Solar Energy Solutions</p>
              <p className="text-sm text-gray-500 mt-2">
                GSTIN: {invoice.companyGSTIN || 'Not Provided'}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                invoice.status === 'Paid'
                  ? 'bg-green-100 text-green-700'
                  : invoice.status === 'Overdue'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {invoice.status}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Customer Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <User className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{customer?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{customer?.mobile}</p>
                  {customer?.email && (
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  )}
                </div>
              </div>
              {invoice.customerGSTIN && (
                <p className="text-sm text-gray-600 ml-6">GSTIN: {invoice.customerGSTIN}</p>
              )}
              <p className="text-sm text-gray-600 ml-6">
                Place of Supply: {invoice.placeOfSupply}
              </p>
            </div>
          </div>

          {/* Right Column - Invoice Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Info</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{formatDate(invoice.invoiceDate)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Due Date:</span>
                  <span className="ml-2 font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              {project && (
                <div className="flex items-center text-sm">
                  <Building className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Project:</span>
                  <span className="ml-2 font-medium">{project.projectId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">HSN/SAC</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Disc</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Taxable</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">GST%</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">GST Amt</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.lineNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.hsnCode || item.sacCode || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {item.discount ? `-${formatCurrency(item.discount)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(item.taxableAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.gstRate}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
          <div>
            {/* Payment Info */}
            {invoice.paymentTerms && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Payment Terms
                </h3>
                <p className="text-sm text-gray-600">{invoice.paymentTerms}</p>
              </div>
            )}
            
            {/* Payment Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Payment Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.amountPaid || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance Due:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(invoice.balanceAmount || 0)}
                  </span>
                </div>
                {paymentsSummary && (
                  <div className="text-xs text-gray-600">
                    <div>Total Received (all payments): {formatCurrency(paymentsSummary.totalReceived)}</div>
                    {paymentsSummary.lastPaymentDate && (
                      <div>Last Payment: {formatDate(paymentsSummary.lastPaymentDate)}</div>
                    )}
                  </div>
                )}
                {invoice.balanceAmount !== undefined && invoice.balanceAmount > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.round(((invoice.amountPaid || 0) / invoice.grandTotal) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(((invoice.amountPaid || 0) / invoice.grandTotal) * 100)}% paid
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Taxable Amount:</span>
                <span className="font-medium">{formatCurrency(invoice.taxableAmount)}</span>
              </div>
              
              {invoice.cgst && invoice.cgst > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST:</span>
                    <span className="font-medium">{formatCurrency(invoice.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST:</span>
                    <span className="font-medium">{formatCurrency(invoice.sgst || 0)}</span>
                  </div>
                </>
              )}
              
              {invoice.igst && invoice.igst > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGST:</span>
                  <span className="font-medium">{formatCurrency(invoice.igst)}</span>
                </div>
              )}
              
              {invoice.tcs && invoice.tcs > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TCS:</span>
                  <span className="font-medium">{formatCurrency(invoice.tcs)}</span>
                </div>
              )}
              
              {invoice.roundOff !== undefined && invoice.roundOff !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Round Off:</span>
                  <span className="font-medium">
                    {invoice.roundOff >= 0 ? '+' : ''}{formatCurrency(invoice.roundOff)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t-2 pt-2">
                <span className="text-gray-900">Grand Total:</span>
                <span className="text-gray-900 flex items-center">
                  {formatCurrency(invoice.grandTotal)}
                </span>
              </div>
              
              {invoice.grandTotalInWords && (
                <div className="text-sm text-gray-600 italic border-t pt-2">
                  {invoice.grandTotalInWords}
                </div>
              )}
            </div>
            {recentPayments.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Recent Payments</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-600">Date</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-600">Mode</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-600">Amount</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-600">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentPayments.map(p => (
                        <tr key={p.id}>
                          <td className="px-3 py-2">{formatDate(p.paymentDate)}</td>
                          <td className="px-3 py-2">{p.paymentMode}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(p.amount)}</td>
                          <td className="px-3 py-2">{p.referenceNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        {invoice.termsAndConditions && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Terms & Conditions
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {invoice.termsAndConditions}
            </p>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
