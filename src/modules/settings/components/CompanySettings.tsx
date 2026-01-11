import React, { useEffect, useState } from 'react';
import { Save, Upload, XCircle } from 'lucide-react';
import { settingsService, CompanySettings as CompanySettingsType } from '../../../services/settingsService';
import { useToastStore } from '@/store/toastStore';

const CompanySettings: React.FC = () => {
  const [form, setForm] = useState<CompanySettingsType>({
    companyName: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', businessType: 'Solar EPC'
  });
  const [saving, setSaving] = useState(false);
  const { error, success } = useToastStore();

  useEffect(()=>{
    (async()=>{
      const existing = await settingsService.getCompanySettings();
      if (existing) setForm(existing);
    })();
  },[]);

  const save = async ()=>{
    try {
      setSaving(true);
      await settingsService.updateCompanySettings(form);
      success('Company settings saved');
    } catch (err) {
      console.error('Failed to save company settings', err);
      error('Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      error('Logo must be an image');
      return;
    }
    const maxSizeKb = 500;
    if (file.size / 1024 > maxSizeKb) {
      error(`Logo too large. Keep it under ${maxSizeKb}KB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      set('logo', result);
      success('Logo ready to save');
    };
    reader.onerror = () => error('Failed to read logo file');
    reader.readAsDataURL(file);
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
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">Shop/Company Logo</label>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e)=>handleLogoChange(e.target.files?.[0] || null)}
              />
            </label>
            {form.logo && (
              <div className="flex items-center gap-3">
                <img src={form.logo} alt="Logo preview" className="h-12 w-12 rounded border object-contain bg-white" />
                <button
                  type="button"
                  onClick={()=>set('logo', '')}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4" /> Remove
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">PNG/JPEG up to 500KB</p>
          </div>
        </div>
      </div>
      <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <Save className="w-4 h-4" /> {saving? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

export default CompanySettings;
