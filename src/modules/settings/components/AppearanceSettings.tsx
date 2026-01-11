import React, { useEffect, useState } from 'react';
import { Moon, Sun, Save } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import type { AppearanceSettings as AppearanceSettingsType } from '@/services/settingsService';
import { useToastStore } from '@/store/toastStore';

const AppearanceSettings: React.FC = () => {
  const { appearance: current, setAppearance } = useTheme();
  const { success, error } = useToastStore();
  const [appearance, setAppearanceState] = useState<AppearanceSettingsType>(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAppearanceState(current);
  }, [current]);

  const apply = async (next: Partial<AppearanceSettingsType>) => {
    setAppearanceState(prev => ({ ...prev, ...next }));
    try {
      setSaving(true);
      await setAppearance(next);
      success('Appearance updated');
    } catch (err) {
      console.error('Failed to update appearance', err);
      error('Failed to update appearance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700 mb-2">Theme</div>
          <div className="flex items-center gap-3">
            <button onClick={()=>apply({ theme: 'light' })} className={`px-4 py-2 rounded-lg border ${appearance.theme==='light'?'bg-gray-100 border-gray-300':'border-gray-200 hover:bg-gray-50'}`}>
              <Sun className="w-4 h-4 inline mr-2" /> Light
            </button>
            <button onClick={()=>apply({ theme: 'dark' })} className={`px-4 py-2 rounded-lg border ${appearance.theme==='dark'?'bg-gray-100 border-gray-300':'border-gray-200 hover:bg-gray-50'}`}>
              <Moon className="w-4 h-4 inline mr-2" /> Dark
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-700 mb-2">Primary Color</div>
          <input type="color" value={appearance.primaryColor} onChange={e=>apply({ primaryColor: e.target.value })} />
        </div>

        <div>
          <div className="text-sm text-gray-700 mb-2">Font Size</div>
          <select className="px-3 py-2 border rounded-lg" value={appearance.fontSize} onChange={e=>apply({ fontSize: e.target.value as any })}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={appearance.compactMode} onChange={e=>apply({ compactMode: e.target.checked })} />
          <span className="text-sm text-gray-700">Compact Mode</span>
        </label>
      </div>

      <button onClick={()=>apply({})} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <Save className="w-4 h-4" /> {saving? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

export default AppearanceSettings;
