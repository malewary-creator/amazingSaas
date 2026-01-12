import React, { useEffect, useState } from 'react';
import { 
  Moon, 
  Sun, 
  Palette, 
  Type, 
  Check,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import { useToastStore } from '@/store/toastStore';

// Predefined color palettes for quick selection
const COLOR_PALETTES = [
  { name: 'Blue', color: '#3b82f6', description: 'Professional Blue' },
  { name: 'Purple', color: '#8b5cf6', description: 'Creative Purple' },
  { name: 'Orange', color: '#f97316', description: 'Energetic Orange' },
  { name: 'Green', color: '#10b981', description: 'Fresh Green' },
  { name: 'Red', color: '#ef4444', description: 'Vibrant Red' },
  { name: 'Indigo', color: '#6366f1', description: 'Deep Indigo' },
];

// Font size presets with visual representation
const FONT_SIZES = [
  { value: 'small', label: 'Small', size: '14px', preview: 'Compact' },
  { value: 'medium', label: 'Medium', size: '16px', preview: 'Balanced' },
  { value: 'large', label: 'Large', size: '18px', preview: 'Readable' },
];

interface PreviewState {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

const AppearanceSettings: React.FC = () => {
  const { appearance: current, setAppearance } = useTheme();
  const { success, error } = useToastStore();
  const [preview, setPreview] = useState<PreviewState>(current);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'theme' | 'colors' | 'typography'>('theme');

  useEffect(() => {
    setPreview(current);
    setHasChanges(false);
  }, [current]);

  // Check if there are unsaved changes
  useEffect(() => {
    const changed = 
      preview.theme !== current.theme ||
      preview.primaryColor !== current.primaryColor ||
      preview.fontSize !== current.fontSize ||
      preview.compactMode !== current.compactMode;
    setHasChanges(changed);
  }, [preview, current]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await setAppearance({
        theme: preview.theme,
        primaryColor: preview.primaryColor,
        fontSize: preview.fontSize,
        compactMode: preview.compactMode,
      });
      success('Appearance preferences saved successfully');
    } catch (err) {
      console.error('Failed to update appearance', err);
      error('Failed to save appearance preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreview(current);
    setHasChanges(false);
  };

  const effectiveTheme: 'light' | 'dark' = preview.theme === 'auto'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preview.theme;

  const getPreviewBackgroundColor = () => {
    if (effectiveTheme === 'dark') {
      return 'bg-slate-950';
    }
    return 'bg-white border border-gray-200';
  };

  const getPreviewTextColor = () => {
    return effectiveTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border border-blue-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-slate-700 rounded-lg">
            <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customize the look and feel of your application
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
            {['theme', 'colors', 'typography'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'theme' && <Sun className="w-4 h-4 inline mr-2" />}
                {tab === 'colors' && <Palette className="w-4 h-4 inline mr-2" />}
                {tab === 'typography' && <Type className="w-4 h-4 inline mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Theme Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'light', icon: Sun, label: 'Light', description: 'Clean and bright' },
                    { value: 'dark', icon: Moon, label: 'Dark', description: 'Easy on the eyes' },
                  ].map(({ value, icon: Icon, label, description }) => (
                    <button
                      key={value}
                      onClick={() => setPreview({ ...preview, theme: value as 'light' | 'dark' })}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        preview.theme === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-400'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-5 h-5 ${preview.theme === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-left">{description}</p>
                      {preview.theme === value && (
                        <Check className="absolute top-3 right-3 w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Mode */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={preview.compactMode}
                    onChange={(e) => setPreview({ ...preview, compactMode: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Compact Mode</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Reduce spacing for a more condensed layout</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Primary Color
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Choose a color palette or pick a custom color
                </p>

                {/* Color Presets Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {COLOR_PALETTES.map(({ name, color, description }) => (
                    <button
                      key={color}
                      onClick={() => setPreview({ ...preview, primaryColor: color })}
                      className={`group p-3 rounded-lg border-2 transition-all ${
                        preview.primaryColor === color
                          ? 'border-gray-900 dark:border-white shadow-lg'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600'
                      }`}
                    >
                      <div
                        className="w-full h-12 rounded-md mb-2 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: color }}
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">{description}</div>
                      </div>
                      {preview.primaryColor === color && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-gray-900 dark:text-white" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Custom Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={preview.primaryColor}
                      onChange={(e) => setPreview({ ...preview, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={preview.primaryColor}
                      onChange={(e) => {
                        if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
                          setPreview({ ...preview, primaryColor: e.target.value });
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono dark:bg-slate-800 dark:text-white"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Font Size
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {FONT_SIZES.map(({ value, label, size, preview: previewText }) => (
                    <button
                      key={value}
                      onClick={() => setPreview({ ...preview, fontSize: value as 'small' | 'medium' | 'large' })}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        preview.fontSize === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-400'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`font-semibold text-gray-900 dark:text-white mb-1 ${value === 'small' ? 'text-sm' : value === 'large' ? 'text-lg' : 'text-base'}`}
                      >
                        {label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{size}</div>
                      <div className={`text-xs text-gray-500 dark:text-gray-500 ${value === 'small' ? 'text-xs' : value === 'large' ? 'text-sm' : 'text-xs'}`}>
                        {previewText}
                      </div>
                      {preview.fontSize === value && (
                        <Check className="mx-auto mt-2 w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className={`px-4 py-2 rounded-lg border font-medium text-sm transition-all ${
                hasChanges && !saving
                  ? 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                hasChanges && !saving
                  ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Live Preview</h3>
            </div>

            {/* Preview Card */}
            <div
              className={`rounded-lg p-6 space-y-4 ${getPreviewBackgroundColor()}`}
              style={{
                backgroundColor: preview.theme === 'dark' ? '#0f172a' : '#f8fafc',
              }}
            >
              {/* Primary Color Swatch */}
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-2">Primary Color</div>
                <div
                  className="h-12 rounded-lg shadow-md transition-colors border-2"
                  style={{
                    backgroundColor: preview.primaryColor,
                    borderColor: preview.primaryColor,
                  }}
                />
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-mono text-center">
                  {preview.primaryColor}
                </div>
              </div>

              {/* Typography Preview */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-3">Font Size Preview</div>
                <div className="space-y-2">
                  <div
                    className={`${getPreviewTextColor()} font-semibold`}
                    style={{
                      fontSize: preview.fontSize === 'small' ? '14px' : preview.fontSize === 'large' ? '18px' : '16px',
                    }}
                  >
                    Heading Text
                  </div>
                  <div
                    className={`${getPreviewTextColor()}`}
                    style={{
                      fontSize: preview.fontSize === 'small' ? '12px' : preview.fontSize === 'large' ? '16px' : '14px',
                    }}
                  >
                    Body text sample
                  </div>
                </div>
              </div>

              {/* Button Preview */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-3">Button Style</div>
                <button
                  className="w-full py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: preview.primaryColor }}
                >
                  Sample Button
                </button>
              </div>

              {/* Mode Badge */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Mode</div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      preview.theme === 'dark'
                        ? 'bg-slate-700 text-gray-200'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {preview.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </div>
                </div>
              </div>

              {/* Compact Mode Indicator */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Layout</div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      preview.compactMode
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {preview.compactMode ? '📦 Compact' : '📐 Standard'}
                  </div>
                </div>
              </div>
            </div>

            {/* Changes Indicator */}
            {hasChanges && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  💾 You have unsaved changes. Click "Save Preferences" to apply.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
