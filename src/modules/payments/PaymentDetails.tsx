import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Edit, Trash2, IndianRupee, FileText, Download, Printer, AlertCircle, CheckCircle } from 'lucide-react';
import { paymentsService } from '@/services/paymentsService';
import { db } from '@/services/database';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { Payment, Invoice } from '@/types/extended';
import { useToastStore } from '@/store/toastStore';
import jsPDF from 'jspdf';
import { NotoSansBase64 } from '@/utils/notoSansBase64';

export function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToastStore();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(()=>{ load(); }, [id]);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const p = await paymentsService.getPaymentById(Number(id));
      if (!p) { error('Payment not found'); navigate('/payments'); return; }
      setPayment(p);
      
      // Load linked invoice if exists
      if (p.invoiceId) {
        const inv = await db.invoices.get(p.invoiceId);
        if (inv) {
          setInvoice(inv);
          setInvoiceNumber(inv.invoiceNumber || '');
        }
      }
    } catch (err) {
      console.error(err);
      error('Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!payment || !invoice) return;
    try {
      const pdf = generatePaymentReceipt();
      const pdfUrl = pdf.output('bloburi');
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => printWindow.print(), 250);
        });
      }
    } catch (err) {
      console.error(err);
      error('Failed to print receipt');
    }
  };

  const handleDownloadReceipt = () => {
    if (!payment || !invoice) return;
    try {
      const pdf = generatePaymentReceipt();
      pdf.save(`Payment-Receipt-${payment.paymentId}.pdf`);
      success('Receipt downloaded');
    } catch (err) {
      console.error(err);
      error('Failed to download receipt');
    }
  };

  const generatePaymentReceipt = () => {
    if (!payment || !invoice) throw new Error('Missing payment or invoice data');

    const invoiceAmountPaid = invoice.amountPaid ?? 0;
    const invoiceBalanceAmount = invoice.balanceAmount ?? Math.max(invoice.grandTotal - invoiceAmountPaid, 0);

    const pdf = new jsPDF('portrait', 'mm', 'A4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const printableWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Embed NotoSans font for ₹ symbol
    pdf.addFileToVFS('NotoSans.ttf', NotoSansBase64);
    pdf.addFont('NotoSans.ttf', 'NotoSans', 'normal');
    pdf.setFont('NotoSans');

    // Helper function to set bold text
    const setBold = () => pdf.setFont('NotoSans', 'bold');
    const setNormal = () => pdf.setFont('NotoSans', 'normal');

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(30, 64, 175); // Blue
    setBold();
    pdf.text('PAYMENT RECEIPT', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // Gray
    setNormal();
    pdf.text('Transaction Confirmation', margin, yPosition);
    yPosition += 12;

    // Receipt metadata header
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    
    // Left column
    setBold();
    pdf.text('Receipt ID:', margin, yPosition);
    setNormal();
    pdf.text(payment.paymentId, margin + 30, yPosition);
    
    // Right column
    const rightColX = margin + printableWidth / 2;
    setBold();
    pdf.text('Date:', rightColX, yPosition);
    setNormal();
    pdf.text(formatDate(payment.paymentDate), rightColX + 20, yPosition);
    
    yPosition += 8;
    setBold();
    pdf.text('Payment Mode:', margin, yPosition);
    setNormal();
    pdf.text(payment.paymentMode, margin + 30, yPosition);
    
    setBold();
    pdf.text('Status:', rightColX, yPosition);
    setNormal();
    pdf.text(payment.status, rightColX + 20, yPosition);
    
    yPosition += 8;
    if (payment.referenceNumber) {
      setBold();
      pdf.text('Reference:', margin, yPosition);
      setNormal();
      pdf.text(payment.referenceNumber, margin + 30, yPosition);
      yPosition += 8;
    }

    yPosition += 4;

    // Invoice details section
    pdf.setFontSize(11);
    setBold();
    pdf.setTextColor(30, 41, 59);
    pdf.text('LINKED INVOICE', margin, yPosition);
    yPosition += 7;

    // Box around invoice details
    pdf.setDrawColor(226, 232, 240); // Light gray
    pdf.rect(margin, yPosition - 6, printableWidth, 28);

    pdf.setFontSize(10);
    setBold();
    pdf.setTextColor(70, 78, 84);
    pdf.text('Invoice:', margin + 3, yPosition);
    setNormal();
    pdf.text(invoiceNumber, margin + 30, yPosition);
    
    setBold();
    pdf.text('Total:', rightColX, yPosition);
    setNormal();
    pdf.text(formatCurrency(invoice.grandTotal), rightColX + 20, yPosition);
    
    yPosition += 7;
    setBold();
    pdf.text('Paid:', margin + 3, yPosition);
    setNormal();
    pdf.text(formatCurrency(invoiceAmountPaid), margin + 30, yPosition);
    
    setBold();
    pdf.text('Balance:', rightColX, yPosition);
    setNormal();
    const balanceText = invoiceBalanceAmount > 0 ? formatCurrency(invoiceBalanceAmount) : '₹0.00';
    pdf.text(balanceText, rightColX + 20, yPosition);
    
    yPosition += 10;

    // Payment amount section - highlighted
    pdf.setFontSize(11);
    setBold();
    pdf.setTextColor(30, 41, 59);
    pdf.text('PAYMENT DETAILS', margin, yPosition);
    yPosition += 7;

    // Highlight box for amount
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.rect(margin, yPosition - 6, printableWidth, 22, 'F');

    pdf.setFontSize(28);
    setBold();
    pdf.setTextColor(255, 255, 255);
    pdf.text(formatCurrency(payment.amount), margin + 5, yPosition + 8);

    yPosition += 25;

    // Payment confirmation
    if (payment.status === 'Received') {
      pdf.setFontSize(10);
      pdf.setTextColor(22, 163, 74); // Green
      setBold();
      pdf.text('✓ Payment Confirmed', margin, yPosition);
      yPosition += 8;
    } else if (payment.status === 'Bounced') {
      pdf.setFontSize(10);
      pdf.setTextColor(220, 38, 38); // Red
      setBold();
      pdf.text('✗ Payment Bounced', margin, yPosition);
      yPosition += 8;
    }

    if (payment.remarks) {
      yPosition += 4;
      pdf.setFontSize(10);
      setBold();
      pdf.setTextColor(70, 78, 84);
      pdf.text('Remarks:', margin, yPosition);
      yPosition += 5;
      setNormal();
      pdf.setTextColor(100, 116, 139);
      const noteLines = pdf.splitTextToSize(payment.remarks || '', printableWidth - 5);
      pdf.text(noteLines, margin + 3, yPosition);
      yPosition += noteLines.length * 4 + 2;
    }

    // Footer
    yPosition = pageHeight - margin - 15;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    
    yPosition += 5;
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184); // Gray
    setNormal();
    pdf.text('This is an auto-generated payment receipt. For inquiries, please contact support.', margin, yPosition);
    
    yPosition += 5;
    pdf.text(`Generated on ${new Date().toLocaleString('en-IN')}`, margin, yPosition);

    return pdf;
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await paymentsService.deletePayment(Number(id));
      success('Payment deleted');
      navigate('/payments');
    } catch (err) {
      console.error(err);
      error('Failed to delete payment');
    }
  };

  const formatCurrency = (n: number | undefined | null) => {
    if (!n || isNaN(n)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };
  const formatDate = (d: Date | string | undefined) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return 'Invalid date'; }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading payment...</div></div>;
  if (!payment) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Payment not found</div></div>;

  const isPaymentConfirmed = payment.status === 'Received';
  const isPaymentBounced = payment.status === 'Bounced';

  const invoiceAmountPaid = invoice?.amountPaid ?? 0;
  const invoiceBalanceAmount = invoice ? (invoice.balanceAmount ?? Math.max(invoice.grandTotal - invoiceAmountPaid, 0)) : 0;
  const invoicePaidPercent = invoice && invoice.grandTotal > 0
    ? Math.min((invoiceAmountPaid / invoice.grandTotal) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{payment.paymentId}</h1>
            {isPaymentConfirmed && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Confirmed
              </span>
            )}
            {isPaymentBounced && (
              <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Bounced
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{formatDate(payment.paymentDate)} • {payment.paymentMode}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {payment.invoiceId && (
            <Button variant="secondary" size="sm" onClick={()=>navigate(`/invoices/${payment.invoiceId}`)}>
              <FileText className="w-4 h-4 mr-2"/>
              Back to Invoice
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={()=>navigate(`/payments/${id}/edit`)}><Edit className="w-4 h-4 mr-2"/>Edit</Button>
          <Button variant="secondary" size="sm" onClick={handlePrintReceipt} disabled={!invoice}><Printer className="w-4 h-4 mr-2"/>Print</Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadReceipt} disabled={!invoice}><Download className="w-4 h-4 mr-2"/>Download</Button>
          <Button variant="danger" size="sm" onClick={()=>setDeleteModal(true)}><Trash2 className="w-4 h-4 mr-2"/>Delete</Button>
        </div>
      </div>

      {/* Payment Amount Card */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-baseline gap-3">
          <span className="text-gray-600 font-medium">Payment Amount:</span>
          <div className="text-5xl font-bold text-gray-900 flex items-center">
            <IndianRupee className="w-12 h-12 text-blue-600 mr-2"/>
            {formatCurrency(payment.amount)}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Info Card */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4"/>
            Payment Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-medium text-gray-900">{payment.paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">{formatDate(payment.paymentDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-medium text-gray-900">{payment.paymentMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 text-xs rounded border font-medium ${
                payment.status === 'Received' ? 'bg-green-50 text-green-700 border-green-200' :
                payment.status === 'Bounced' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-orange-50 text-orange-700 border-orange-200'
              }`}>{payment.status}</span>
            </div>
            {payment.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium text-gray-900 break-all">{payment.referenceNumber}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Invoice Context Card */}
        {invoice && (
          <Card className="p-6 border-blue-200 bg-blue-50">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4"/>
              Linked Invoice
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice:</span>
                <Link to={`/invoices/${payment.invoiceId}`} className="font-medium text-blue-600 hover:text-blue-700">
                  {invoiceNumber} →
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Total:</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoiceAmountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance Remaining:</span>
                <span className={`font-bold ${invoiceBalanceAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(invoiceBalanceAmount)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-300 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{width: `${invoicePaidPercent}%`}}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {Math.round(invoicePaidPercent)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Notes Section */}
      {payment.remarks && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4"/>
            Remarks
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200">
            {payment.remarks}
          </p>
        </Card>
      )}

      <ConfirmModal
        isOpen={deleteModal}
        onClose={()=>setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This will adjust linked invoice balances."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
