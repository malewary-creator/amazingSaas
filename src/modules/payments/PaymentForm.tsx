import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { paymentsService } from '@/services/paymentsService';
import { db } from '@/services/database';
import type { Payment, PaymentMode, PaymentStatus } from '@/types/extended';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/toastStore';

export function PaymentForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToastStore();

  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<{ id: number; invoiceNumber: string; grandTotal: number; amountPaid?: number; balanceAmount?: number }[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<{ grandTotal: number; amountPaid: number; balanceAmount: number } | null>(null);
  const [formData, setFormData] = useState({
    invoiceId: 0,
    customerId: 0,
    projectId: 0,
    amount: 0,
    paymentMode: 'Cash' as PaymentMode,
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
    status: 'Received' as PaymentStatus,
  });

  useEffect(() => { loadInvoices(); if (id) loadPayment(); }, [id]);
  useEffect(() => {
    const invIdParam = searchParams.get('invoiceId');
    if (invIdParam) {
      setFormData(prev => ({ ...prev, invoiceId: Number(invIdParam) }));
    }
  }, [searchParams]);

  const loadInvoices = async () => {
    const list = await db.invoices.toArray();
    setInvoices(list.map(i=>({ 
      id: i.id!, 
      invoiceNumber: i.invoiceNumber!, 
      grandTotal: i.grandTotal, 
      amountPaid: i.amountPaid || 0,
      balanceAmount: i.balanceAmount || i.grandTotal
    })));
  };

  const handleInvoiceChange = (invoiceId: number) => {
    setFormData({ ...formData, invoiceId });
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setSelectedInvoice({ 
        grandTotal: inv.grandTotal, 
        amountPaid: inv.amountPaid || 0, 
        balanceAmount: inv.balanceAmount || inv.grandTotal 
      });
      // Auto-suggest amount as remaining balance
      if (!formData.amount || formData.amount === 0) {
        setFormData(prev => ({ ...prev, amount: inv.balanceAmount || 0 }));
      }
    } else {
      setSelectedInvoice(null);
    }
  };

  const loadPayment = async () => {
    const payment = id ? await paymentsService.getPaymentById(Number(id)) : undefined;
    if (!payment) return;
    setFormData({
      invoiceId: payment.invoiceId || 0,
      customerId: payment.customerId || 0,
      projectId: payment.projectId || 0,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      referenceNumber: payment.referenceNumber || '',
  notes: (payment as any).notes || '',
      status: payment.status,
    });
  };

  const validate = (): boolean => {
    if (!paymentsService.validateAmount(formData.amount)) { error('Enter a valid amount'); return false; }
    if (!paymentsService.validateMode(formData.paymentMode)) { error('Select a valid payment mode'); return false; }
    if (formData.invoiceId && selectedInvoice) {
      // Use the balance from selectedInvoice which already accounts for existing payments
      if (formData.amount > selectedInvoice.balanceAmount) {
        error(`Payment amount (${formatCurrency(formData.amount)}) exceeds invoice balance (${formatCurrency(selectedInvoice.balanceAmount)})`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const payload: Omit<Payment, 'id' | 'paymentId' | 'createdAt' | 'updatedAt'> = {
        invoiceId: formData.invoiceId || undefined,
        customerId: formData.customerId || undefined,
        projectId: formData.projectId || undefined,
        amount: formData.amount,
        paymentMode: formData.paymentMode,
        paymentDate: new Date(formData.paymentDate),
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
        branchId: undefined,
      } as any;

      if (id) {
        await paymentsService.updatePayment(Number(id), payload as Partial<Payment>);
        success('Payment updated');
        navigate(`/payments/${id}`);
      } else {
        const newId = await paymentsService.createPayment(payload);
        success('Payment recorded');
        navigate(`/payments/${newId}`);
      }
    } catch (err) {
      console.error(err);
      error('Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number | undefined | null) => {
    if (!n || isNaN(n)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Edit Payment' : 'New Payment'}</h1>
          <p className="text-gray-600">Record a payment and link to invoice</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={()=>navigate('/payments')}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}><Save className="w-4 h-4 mr-2"/>Save</Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-1">Invoice (optional)</label>
            <select className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" value={formData.invoiceId || ''} onChange={e=>handleInvoiceChange(Number(e.target.value))}>
              <option value="">None - Standalone Payment</option>
              {invoices.map(i=> <option key={i.id} value={i.id}>{i.invoiceNumber} - Balance: {formatCurrency(i.balanceAmount || 0)}</option>)}
            </select>
            {formData.invoiceId && selectedInvoice && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div><span className="text-gray-600">Total:</span> <span className="font-medium">{formatCurrency(selectedInvoice.grandTotal)}</span></div>
                  <div><span className="text-gray-600">Paid:</span> <span className="font-medium text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</span></div>
                  <div><span className="text-gray-600">Balance:</span> <span className="font-medium text-orange-600">{formatCurrency(selectedInvoice.balanceAmount)}</span></div>
                </div>
              </div>
            )}
            {formData.invoiceId ? (
              <div className="text-xs text-gray-500 mt-1">
                Linked: <Link to={`/invoices/${formData.invoiceId}`} className="text-blue-600 hover:underline">View Invoice Details</Link>
              </div>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input type="date" className="w-full px-3 py-2 border rounded" value={formData.paymentDate} onChange={e=>setFormData({ ...formData, paymentDate: e.target.value })}/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mode *</label>
            <select className="w-full px-3 py-2 border rounded" value={formData.paymentMode} onChange={e=>setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}>
              <option>Cash</option><option>UPI</option><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Finance</option><option>Card</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount *</label>
            <input type="number" min={0} step={0.01} className="w-full px-3 py-2 border rounded" value={formData.amount} onChange={e=>setFormData({ ...formData, amount: Number(e.target.value) })}/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reference No.</label>
            <input type="text" className="w-full px-3 py-2 border rounded" value={formData.referenceNumber} onChange={e=>setFormData({ ...formData, referenceNumber: e.target.value })} placeholder="Txn/UTR/Cheque"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select className="w-full px-3 py-2 border rounded" value={formData.status} onChange={e=>setFormData({ ...formData, status: e.target.value as PaymentStatus })}>
              <option>Received</option><option>Partially Received</option><option>Due</option><option>Not Due</option><option>Bounced</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full px-3 py-2 border rounded" rows={3} value={formData.notes} onChange={e=>setFormData({ ...formData, notes: e.target.value })}/>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end space-x-3 z-10">
        <Button variant="secondary" onClick={()=>navigate('/payments')}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}><Save className="w-4 h-4 mr-2"/>Save</Button>
      </div>
    </div>
  );
}
