import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { settingsService, CompanySettings as CompanySettingsType } from '../../../services/settingsService';

const CompanySettings: React.FC = () => {
  const [form, setForm] = useState<CompanySettingsType>({
    companyName: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', businessType: 'Solar EPC'
  });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    (async()=>{
      const existing = await settingsService.getCompanySettings();
      if (existing) setForm(existing);
    })();
  },[]);

  const save = async ()=>{
    setSaving(true);
    await settingsService.updateCompanySettings(form);
    setSaving(false);
  };

  const set = (k: keyof CompanySettingsType, v: any)=> setForm(prev=>({ ...prev, [k]: v }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="px-3 py-2 border rounded-lg" placeholder="Company Name" value={form.companyName} onChange={e=>set('companyName', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg" placeholder="Email" value={form.email} onChange={e=>set('email', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg" placeholder="Phone" value={form.phone} onChange={e=>set('phone', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg" placeholder="Website" value={form.website || ''} onChange={e=>set('website', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg md:col-span-2" placeholder="Address" value={form.address} onChange={e=>set('address', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg" placeholder="City" value={form.city} onChange={e=>set('city', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg" placeholder="State" value={form.state} onChange={e=>set('state', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg" placeholder="Pincode" value={form.pincode} onChange={e=>set('pincode', e.target.value)} />
        <input className="px-3 py-2 border rounded-lg" placeholder="Business Type" value={form.businessType} onChange={e=>set('businessType', e.target.value)} />
      </div>
      <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <Save className="w-4 h-4" /> {saving? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

export default CompanySettings;
