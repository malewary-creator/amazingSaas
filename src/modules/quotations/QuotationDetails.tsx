/**
 * Quotation Details Component
 * Professional quotation preview with all details
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Download,
  FileText
} from 'lucide-react';
import { quotationsService } from '@/services/quotationsService';
import type { QuotationStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { QuotationPDFExport } from './QuotationPDFExport';
import { useToastStore } from '@/store/toastStore';

export function QuotationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToastStore();

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [acceptModal, setAcceptModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await quotationsService.getQuotationWithDetails(parseInt(id));
      if (!data) {
        error('Quotation not found');
        navigate('/quotations');
        return;
      }
      setQuotation(data);
    } catch (err) {
      console.error('Error loading quotation:', err);
      error('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await quotationsService.deleteQuotation(parseInt(id));
      success('Quotation deleted successfully');
      navigate('/quotations');
    } catch (err) {
      console.error('Error deleting quotation:', err);
      error('Failed to delete quotation');
    }
  };

  const handleSend = async () => {
    if (!id) return;
    
    try {
      await quotationsService.sendQuotation(parseInt(id));
      success('Quotation sent to customer');
      setSendModal(false);
      loadQuotation();
    } catch (err) {
      console.error('Error sending quotation:', err);
      error('Failed to send quotation');
    }
  };

  const handleAccept = async () => {
    if (!id) return;
    
    try {
      await quotationsService.acceptQuotation(parseInt(id));
      success('Quotation accepted');
      setAcceptModal(false);
      loadQuotation();
    } catch (err) {
      console.error('Error accepting quotation:', err);
      error('Failed to accept quotation');
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      error('Please provide a rejection reason');
      return;
    }
    
    try {
      await quotationsService.rejectQuotation(parseInt(id), rejectionReason);
      success('Quotation rejected');
      setRejectModal(false);
      setRejectionReason('');
      loadQuotation();
    } catch (err) {
      console.error('Error rejecting quotation:', err);
      error('Failed to reject quotation');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: QuotationStatus): string => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Sent':
        return 'bg-blue-100 text-blue-700';
      case 'Accepted':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Expired':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading quotation...</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Quotation not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Details</h1>
            <p className="text-gray-600 mt-1">{quotation.quotationNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {quotation.status === 'Draft' && (
            <>
              <Link to={`/quotations/${id}/edit`}>
                <Button variant="secondary">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={() => setSendModal(true)}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </>
          )}
          {quotation.status === 'Sent' && (
            <>
              <Button variant="success" onClick={() => setAcceptModal(true)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button variant="danger" onClick={() => setRejectModal(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          <QuotationPDFExport quotation={quotation} variant="button" showPreview={true} />
          <Button variant="secondary" onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="danger" onClick={() => setDeleteModal(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="p-6 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                  quotation.status
                )}`}
              >
                {quotation.status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-gray-600">Quotation Date</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatDate(quotation.quotationDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="font-medium text-gray-900 mt-1">
                {quotation.validityDate ? formatDate(quotation.validityDate) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Grand Total</p>
              <p className="font-bold text-xl text-gray-900 mt-1">
                {formatCurrency(quotation.grandTotal)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Professional Quotation Document */}
      <Card className="p-8 print:shadow-none">
        {/* Company Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">SHINE SOLAR</h1>
          <p className="text-gray-600">Solar Energy Solutions Provider</p>
          <p className="text-sm text-gray-500 mt-1">
            Address Line 1, City, State - PIN | Phone: +91-XXXXXXXXXX | Email: info@shinesolar.com
          </p>
        </div>

        {/* Quotation Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">QUOTATION</h2>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Quotation No:</span> {quotation.quotationNumber}
                </p>
                <p>
                  <span className="font-semibold">Date:</span> {formatDate(quotation.quotationDate)}
                </p>
                <p>
                  <span className="font-semibold">Valid Until:</span>{' '}
                  {quotation.validityDate ? formatDate(quotation.validityDate) : 'N/A'}
                </p>
                {quotation.leadId && (
                  <p>
                    <span className="font-semibold">Lead ID:</span> {quotation.leadId}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="text-right">
              <h3 className="font-bold text-gray-900 mb-2">Bill To:</h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{quotation.customerName || 'N/A'}</p>
                {quotation.customerAddress && (
                  <>
                    {quotation.customerAddress.houseNo && (
                      <p>{quotation.customerAddress.houseNo}</p>
                    )}
                    {quotation.customerAddress.area && <p>{quotation.customerAddress.area}</p>}
                    <p>
                      {quotation.customerCity}, {quotation.customerState}
                    </p>
                    {quotation.customerAddress.pincode && (
                      <p>PIN: {quotation.customerAddress.pincode}</p>
                    )}
                  </>
                )}
                {quotation.customerMobile && <p>Mobile: {quotation.customerMobile}</p>}
                {quotation.customerEmail && <p>Email: {quotation.customerEmail}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* System Details */}
        {(quotation.systemSize || quotation.systemType) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">System Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {quotation.systemSize && (
                <div>
                  <span className="text-gray-600">System Size:</span>
                  <p className="font-semibold">{quotation.systemSize} kW</p>
                </div>
              )}
              {quotation.systemType && (
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-semibold">{quotation.systemType}</p>
                </div>
              )}
              {quotation.panelBrand && (
                <div>
                  <span className="text-gray-600">Panel Brand:</span>
                  <p className="font-semibold">{quotation.panelBrand}</p>
                </div>
              )}
              {quotation.inverterBrand && (
                <div>
                  <span className="text-gray-600">Inverter Brand:</span>
                  <p className="font-semibold">{quotation.inverterBrand}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-3 py-2 text-left font-semibold">S.No</th>
                <th className="px-3 py-2 text-left font-semibold">Item Description</th>
                <th className="px-3 py-2 text-center font-semibold">HSN</th>
                <th className="px-3 py-2 text-center font-semibold">Qty</th>
                <th className="px-3 py-2 text-center font-semibold">Unit</th>
                <th className="px-3 py-2 text-right font-semibold">Rate</th>
                <th className="px-3 py-2 text-right font-semibold">Disc%</th>
                <th className="px-3 py-2 text-right font-semibold">Taxable</th>
                <th className="px-3 py-2 text-center font-semibold">GST%</th>
                <th className="px-3 py-2 text-right font-semibold">GST Amt</th>
                <th className="px-3 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="px-3 py-2">{item.lineNumber}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.itemName}</div>
                    {item.description && (
                      <div className="text-xs text-gray-600">{item.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">{item.hsn || '-'}</td>
                  <td className="px-3 py-2 text-center">{item.quantity}</td>
                  <td className="px-3 py-2 text-center">{item.unit}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right">{item.discount || 0}%</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.taxableAmount)}</td>
                  <td className="px-3 py-2 text-center">{item.gstRate}%</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.gstAmount)}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
            </div>

            {quotation.discountPercent > 0 && (
              <div className="flex justify-between text-sm py-1 text-green-600">
                <span>Discount ({quotation.discountPercent}%):</span>
                <span>- {formatCurrency(quotation.discountAmount || 0)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm py-1 border-t pt-2">
              <span className="text-gray-700">Taxable Amount:</span>
              <span className="font-medium">{formatCurrency(quotation.taxableAmount)}</span>
            </div>

            {quotation.igst > 0 ? (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-700">IGST:</span>
                <span className="font-medium">{formatCurrency(quotation.igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">CGST:</span>
                  <span className="font-medium">{formatCurrency(quotation.cgst || 0)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">SGST:</span>
                  <span className="font-medium">{formatCurrency(quotation.sgst || 0)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-700">Total GST:</span>
              <span className="font-medium">{formatCurrency(quotation.totalGST)}</span>
            </div>

            {quotation.roundOff !== 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-700">Round Off:</span>
                <span className="font-medium">{formatCurrency(quotation.roundOff || 0)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold py-2 border-t-2 border-gray-900">
              <span>Grand Total:</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-300">
          {quotation.paymentTerms && (
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Payment Terms</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">{quotation.paymentTerms}</p>
            </div>
          )}
          {quotation.deliveryTerms && (
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Delivery Terms</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {quotation.deliveryTerms}
              </p>
            </div>
          )}
          {quotation.warrantyTerms && (
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Warranty Terms</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {quotation.warrantyTerms}
              </p>
            </div>
          )}
        </div>

        {quotation.termsAndConditions && (
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {quotation.termsAndConditions}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              {quotation.preparedByName && (
                <p>
                  <span className="font-semibold">Prepared by:</span> {quotation.preparedByName}
                </p>
              )}
              {quotation.sentDate && (
                <p>
                  <span className="font-semibold">Sent on:</span> {formatDate(quotation.sentDate)}
                </p>
              )}
              {quotation.acceptedDate && (
                <p className="text-green-600">
                  <span className="font-semibold">Accepted on:</span>{' '}
                  {formatDate(quotation.acceptedDate)}
                </p>
              )}
            </div>
            <div className="text-center">
              <div className="mb-12"></div>
              <div className="border-t-2 border-gray-900 pt-2">
                <p className="font-semibold">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Rejection Reason (if rejected) */}
      {quotation.status === 'Rejected' && quotation.rejectionReason && (
        <Card className="p-6 bg-red-50 border-red-200 no-print">
          <h3 className="font-bold text-red-900 mb-2">Rejection Reason</h3>
          <p className="text-red-800">{quotation.rejectionReason}</p>
        </Card>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />

      <ConfirmModal
        isOpen={sendModal}
        onClose={() => setSendModal(false)}
        onConfirm={handleSend}
        title="Send Quotation"
        message="Are you sure you want to send this quotation to the customer?"
        confirmText="Send"
        confirmVariant="primary"
      />

      <ConfirmModal
        isOpen={acceptModal}
        onClose={() => setAcceptModal(false)}
        onConfirm={handleAccept}
        title="Accept Quotation"
        message="Are you sure you want to mark this quotation as accepted?"
        confirmText="Accept"
        confirmVariant="primary"
      />

      {/* Reject Modal with Reason */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Quotation</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this quotation:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setRejectModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
