import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Percent, Paintbrush, DatabaseBackup, Rocket } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { seedService } from '@/services/seedService';
import { toast } from '@/store/toastStore';

const SettingsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<{ company?: string; gst?: number; theme?: string; records?: number }>({});
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    (async () => {
      const company = await settingsService.getCompanySettings();
      const tax = await settingsService.getTaxSettings();
      const theme = await settingsService.getAppearanceSettings();
      const meta = await settingsService.getBackupMetadata();
      setSummary({
        company: company?.companyName || 'Not set',
        gst: tax?.defaultGSTRate || 0,
        theme: theme?.theme || 'light',
        records: meta.recordCount,
      });
      settingsService.initializeDefaultGSTRates();
    })();
  }, []);

  const Card: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: ()=>void }>=({icon,title,desc,onClick})=> (
    <button onClick={onClick} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{desc}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600">Seed demo data for testing across modules.</p>
        </div>
        <button
          onClick={async ()=>{
            if (seeding) return;
            const confirmSeed = window.confirm('Seed demo data? This will add sample records.');
            if (!confirmSeed) return;
            try {
              setSeeding(true);
              const stats = await seedService.seedDemoData({ reset: false });
              toast.success('Demo data seeded successfully');
              const meta = await settingsService.getBackupMetadata();
              setSummary((s)=>({ ...s, records: meta.recordCount }));
            } catch (err) {
              toast.error('Failed to seed demo data');
              console.error(err);
            } finally {
              setSeeding(false);
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${seeding ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
          disabled={seeding}
          aria-busy={seeding}
        >
          <Rocket className="w-4 h-4" />
          {seeding ? 'Seeding…' : 'Seed Demo Data'}
        </button>
        <button
          onClick={async ()=>{
            if (seeding) return;
            const confirmReset = window.confirm('Reset & seed demo data? This will CLEAR existing records and re-seed.');
            if (!confirmReset) return;
            try {
              setSeeding(true);
              const stats = await seedService.seedDemoData({ reset: true });
              toast.success('Database reset and demo data seeded successfully');
              const meta = await settingsService.getBackupMetadata();
              setSummary((s)=>({ ...s, records: meta.recordCount }));
            } catch (err) {
              toast.error('Failed to reset & seed demo data');
              console.error(err);
            } finally {
              setSeeding(false);
            }
          }}
          className={`ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${seeding ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
          disabled={seeding}
          aria-busy={seeding}
        >
          <DatabaseBackup className="w-4 h-4" />
          {seeding ? 'Resetting…' : 'Reset & Seed'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card icon={<Building2 className="w-6 h-6 text-gray-700" />} title="Company Settings" desc={`Company: ${summary.company}`}
          onClick={()=>navigate('/settings/company')} />
        <Card icon={<Percent className="w-6 h-6 text-gray-700" />} title="Tax & GST" desc={`Default GST: ${summary.gst}%`}
          onClick={()=>navigate('/settings/tax')} />
        <Card icon={<Paintbrush className="w-6 h-6 text-gray-700" />} title="Appearance" desc={`Theme: ${summary.theme}`}
          onClick={()=>navigate('/settings/appearance')} />
        <Card icon={<DatabaseBackup className="w-6 h-6 text-gray-700" />} title="Backup & Restore" desc={`${summary.records || 0} records`} 
          onClick={()=>navigate('/settings/backup')} />
      </div>
    </div>
  );
};

export default SettingsDashboard;
