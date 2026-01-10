import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Cog, Building2, Percent, Paintbrush, DatabaseBackup } from 'lucide-react';
import { CompanySettings, TaxSettings, AppearanceSettings, BackupSettings } from './components';
import SettingsDashboard from './SettingsDashboard.tsx';

function SettingsModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Cog className="w-6 h-6 text-gray-700" /> Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <nav className="space-y-1">
              <NavLink to="/settings" end className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>
                <Cog className="w-4 h-4" /> Dashboard
              </NavLink>
              <NavLink to="company" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>
                <Building2 className="w-4 h-4" /> Company
              </NavLink>
              <NavLink to="tax" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>
                <Percent className="w-4 h-4" /> Tax & GST
              </NavLink>
              <NavLink to="appearance" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>
                <Paintbrush className="w-4 h-4" /> Appearance
              </NavLink>
              <NavLink to="backup" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive?'bg-gray-100 text-gray-900':'text-gray-700 hover:bg-gray-50'}`}>
                <DatabaseBackup className="w-4 h-4" /> Backup & Restore
              </NavLink>
            </nav>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <Routes>
            <Route index element={<SettingsDashboard />} />
            <Route path="company" element={<CompanySettings />} />
            <Route path="tax" element={<TaxSettings />} />
            <Route path="appearance" element={<AppearanceSettings />} />
            <Route path="backup" element={<BackupSettings />} />
            <Route path="*" element={<Navigate to="/settings" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default SettingsModule;
