import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { settingsService, TaxSettings as TaxSettingsType, GSTRate } from '../../../services/settingsService';

const TaxSettings: React.FC = () => {
  const [tax, setTax] = useState<TaxSettingsType>({
    enableGST: true,
    gstNumber: '',
    panNumber: '',
    defaultGSTRate: 18,
    includeGSTInPrice: false,
    tdsApplicable: false,
    tdsRate: 0,
  });
  const [rates, setRates] = useState<GSTRate[]>([]);
  const [newRate, setNewRate] = useState<GSTRate>({ rate: 18, description: '', applicableFor: '', isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    (async()=>{
      const existing = await settingsService.getTaxSettings();
      if (existing) setTax(existing);
      await settingsService.initializeDefaultGSTRates();
      const allRates = await settingsService.getGSTRates();
      setRates(allRates);
    })();
  },[]);

  const saveTax = async ()=>{
    setSaving(true);
    await settingsService.updateTaxSettings(tax);
    setSaving(false);
  };

  const addRate = async ()=>{
    await settingsService.addGSTRate({ rate: newRate.rate, description: newRate.description, applicableFor: newRate.applicableFor, isActive: true });
    setRates(await settingsService.getGSTRates());
    setNewRate({ rate: 18, description: '', applicableFor: '', isActive: true });
  };

  const removeRate = async (id?: number)=>{
    if (!id) return;
    await settingsService.deleteGSTRate(id);
    setRates(await settingsService.getGSTRates());
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Tax & GST Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tax.enableGST} onChange={e=>setTax({...tax, enableGST: e.target.checked})} />
            <span className="text-sm text-gray-700">Enable GST</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tax.includeGSTInPrice} onChange={e=>setTax({...tax, includeGSTInPrice: e.target.checked})} />
            <span className="text-sm text-gray-700">Include GST in item price</span>
          </label>
          <input className="px-3 py-2 border rounded-lg" placeholder="GST Number" value={tax.gstNumber} onChange={e=>setTax({...tax, gstNumber: e.target.value})} />
          <input className="px-3 py-2 border rounded-lg" placeholder="PAN Number" value={tax.panNumber} onChange={e=>setTax({...tax, panNumber: e.target.value})} />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">Default GST Rate</span>
            <select className="px-3 py-2 border rounded-lg" value={tax.defaultGSTRate} onChange={e=>setTax({...tax, defaultGSTRate: Number(e.target.value)})}>
              {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tax.tdsApplicable} onChange={e=>setTax({...tax, tdsApplicable: e.target.checked})} />
            <span className="text-sm text-gray-700">TDS Applicable</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">TDS Rate</span>
            <input type="number" className="px-3 py-2 border rounded-lg w-28" value={tax.tdsRate} onChange={e=>setTax({...tax, tdsRate: Number(e.target.value)})} />
          </div>
        </div>
        <button onClick={saveTax} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">GST Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="px-3 py-2 border rounded-lg" placeholder="Description" value={newRate.description} onChange={e=>setNewRate({...newRate, description: e.target.value})} />
          <input className="px-3 py-2 border rounded-lg" placeholder="Applicable For" value={newRate.applicableFor} onChange={e=>setNewRate({...newRate, applicableFor: e.target.value})} />
          <select className="px-3 py-2 border rounded-lg" value={newRate.rate} onChange={e=>setNewRate({...newRate, rate: Number(e.target.value)})}>
            {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        <button onClick={addRate} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Rate
        </button>

        <div className="mt-4 divide-y">
          {rates.map((rate)=> (
            <div key={rate.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{rate.rate}% - {rate.description}</div>
                <div className="text-sm text-gray-600">{rate.applicableFor}</div>
              </div>
              <button onClick={()=>removeRate(rate.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaxSettings;
