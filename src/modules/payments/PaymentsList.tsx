import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Eye, IndianRupee, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { paymentsService } from '@/services/paymentsService';
import type { Payment, PaymentMode, PaymentStatus } from '@/types/extended';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

export function PaymentsList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filtered, setFiltered] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<PaymentMode | 'All'>('All');
  const [status, setStatus] = useState<PaymentStatus | 'All'>('All');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id?: number }>({ isOpen: false });
  const [stats, setStats] = useState({
    totalCollected: 0,
    receivedCount: 0,
    pendingCount: 0,
    bouncedCount: 0,
  });
  const { success, error } = useToastStore();

  useEffect(() => { load(); }, []);
  useEffect(() => { applyFilters(); }, [payments, search, mode, status]);
  useEffect(() => { calculateStats(); }, [payments]);

  const load = async () => {
    try {
      setLoading(true);
      const list = await paymentsService.getPayments();
      setPayments(list);
    } catch (err) {
      console.error(err);
      error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let f = [...payments];
    if (search) {
      const t = search.toLowerCase();
      f = f.filter(p => p.paymentId?.toLowerCase().includes(t) || p.referenceNumber?.toLowerCase().includes(t));
    }
    if (mode !== 'All') f = f.filter(p => p.paymentMode === mode);
    if (status !== 'All') f = f.filter(p => p.status === status);
    setFiltered(f);
  };

  const calculateStats = () => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const received = payments.filter(p => p.status === 'Received').length;
    const pending = payments.filter(p => p.status === 'Due' || p.status === 'Not Due' || p.status === 'Partially Received').length;
    const bounced = payments.filter(p => p.status === 'Bounced').length;
    setStats({ totalCollected: total, receivedCount: received, pendingCount: pending, bouncedCount: bounced });
  };

  const formatCurrency = (n: number | undefined | null) => {
    if (!n || isNaN(n)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
  };
  const formatDate = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await paymentsService.deletePayment(deleteModal.id);
      success('Payment deleted');
      setDeleteModal({ isOpen: false });
      load();
    } catch (err) {
      console.error(err);
      error('Failed to delete payment');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading payments...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-gray-600">Track receipts and invoice collections</p>
        </div>
        <Link to="/payments/new"><Button><Plus className="w-4 h-4 mr-2"/>New Payment</Button></Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalCollected)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">All payments combined</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Received</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.receivedCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">Successful payments</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingCount}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">Awaiting receipt</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bounced</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.bouncedCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600 transform rotate-180" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">Failed transactions</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <input className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Search by Payment ID or Reference" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <select className="pl-10 pr-8 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500" value={mode} onChange={e=>setMode(e.target.value as PaymentMode | 'All')}>
              <option>All</option>
              <option>Cash</option><option>UPI</option><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Finance</option><option>Card</option>
            </select>
          </div>
          <div>
            <select className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500" value={status} onChange={e=>setStatus(e.target.value as PaymentStatus | 'All')}>
              <option>All</option>
              <option>Not Due</option><option>Due</option><option>Partially Received</option><option>Received</option><option>Bounced</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <IndianRupee className="w-12 h-12 mb-3 text-gray-300"/>
                    <p className="text-lg font-medium">No payments found</p>
                    <p className="text-sm mt-1">{search || mode !== 'All' || status !== 'All' ? 'Try adjusting your filters' : 'Record your first payment to get started'}</p>
                  </div>
                </td></tr>
              ) : filtered.map(p => {
                const getStatusColor = (st: PaymentStatus) => {
                  switch(st) {
                    case 'Received': return 'bg-green-50 text-green-700 border-green-200';
                    case 'Partially Received': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    case 'Due': return 'bg-orange-50 text-orange-700 border-orange-200';
                    case 'Bounced': return 'bg-red-50 text-red-700 border-red-200';
                    default: return 'bg-gray-50 text-gray-700 border-gray-200';
                  }
                };
                return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{p.paymentId}</div>
                    {p.referenceNumber && <div className="text-xs text-gray-500 mt-0.5">Ref: {p.referenceNumber}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(p.paymentDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{p.paymentMode}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded border font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.invoiceId ? (<Link to={`/invoices/${p.invoiceId}`} className="text-blue-600 hover:text-blue-700 font-medium">View Invoice</Link>) : <span className="text-gray-400">—</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <Link to={`/payments/${p.id}`} className="text-blue-600 hover:text-blue-700 text-sm flex items-center font-medium"><Eye className="w-4 h-4 mr-1"/>View</Link>
                      <button onClick={()=>setDeleteModal({ isOpen: true, id: p.id })} className="text-red-600 hover:text-red-700 text-sm flex items-center font-medium"><Trash2 className="w-4 h-4 mr-1"/>Delete</button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={()=>setDeleteModal({ isOpen: false })}
        onConfirm={handleDelete}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This will adjust linked invoice balances."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
