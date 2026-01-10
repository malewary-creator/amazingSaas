import React, { useState } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { settingsService } from '../../../services/settingsService';

const BackupSettings: React.FC = () => {
  const [backupContent, setBackupContent] = useState<string>('');
  const [restoring, setRestoring] = useState(false);

  const createBackup = async ()=>{
    const json = await settingsService.createBackup();
    setBackupContent(json);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shine-solar-backup-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = async ()=>{
    if (!backupContent) return alert('Paste backup JSON into the text area first.');
    try {
      setRestoring(true);
      await settingsService.restoreBackup(backupContent);
      alert('Backup restored successfully');
    } catch (e:any) {
      alert(e.message || 'Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Backup & Restore</h2>
        <p className="text-sm text-gray-600">Create a full system backup or restore from a previous backup file.</p>
        <div className="flex items-center gap-3">
          <button onClick={createBackup} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Backup
          </button>
          <button onClick={restoreBackup} disabled={restoring} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Upload className="w-4 h-4" /> {restoring? 'Restoring...' : 'Restore Backup'}
          </button>
        </div>
        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          Restoring a backup will overwrite current data. Ensure you have the correct file.
        </div>
        <textarea value={backupContent} onChange={e=>setBackupContent(e.target.value)} rows={10} className="w-full px-3 py-2 border rounded-lg font-mono" placeholder="Paste backup JSON here to restore" />
      </div>
    </div>
  );
};

export default BackupSettings;
