import { useEffect, useState } from 'react';
import type { PaymentStage } from '@/types/extended';
import { Card } from '@/components/ui/Card';

export interface PaymentScheduleStage {
  stage: PaymentStage;
  percentage?: number;
  amount?: number;
  dueDate?: string; // ISO date for input
  status: 'Due' | 'Received' | 'Partial';
}

export interface PaymentScheduleValue {
  termsName?: string;
  stages: PaymentScheduleStage[];
}

const PRESETS: { name: string; stages: { stage: PaymentStage; percentage: number }[] }[] = [
  { name: '40-50-10', stages: [
    { stage: 'Booking', percentage: 40 },
    { stage: 'Installation', percentage: 50 },
    { stage: 'Final', percentage: 10 },
  ]},
  { name: '30-65-5', stages: [
    { stage: 'Booking', percentage: 30 },
    { stage: 'Installation', percentage: 65 },
    { stage: 'Final', percentage: 5 },
  ]},
  { name: '50-50', stages: [
    { stage: 'Booking', percentage: 50 },
    { stage: 'Final', percentage: 50 },
  ]},
];

export function ProjectPaymentScheduleEditor({
  value,
  onChange,
  projectValue,
}: {
  value?: PaymentScheduleValue;
  onChange: (v?: PaymentScheduleValue) => void;
  projectValue: number;
}) {
  const [schedule, setSchedule] = useState<PaymentScheduleValue | undefined>(value);

  useEffect(() => {
    setSchedule(value);
  }, [value]);

  const applyPreset = (presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    const stages: PaymentScheduleStage[] = preset.stages.map(s => ({
      stage: s.stage,
      percentage: s.percentage,
      amount: Math.round(((s.percentage || 0) / 100) * (projectValue || 0)),
      status: 'Due',
    }));
    const newVal: PaymentScheduleValue = { termsName: preset.name, stages };
    setSchedule(newVal);
    onChange(newVal);
  };

  const updateStage = (idx: number, patch: Partial<PaymentScheduleStage>) => {
    if (!schedule) return;
    const stages = [...schedule.stages];
    stages[idx] = { ...stages[idx], ...patch };
    // Recompute amount if percentage changed
    if (patch.percentage !== undefined) {
      stages[idx].amount = Math.round(((patch.percentage || 0) / 100) * (projectValue || 0));
    }
    const newVal = { ...schedule, stages };
    setSchedule(newVal);
    onChange(newVal);
  };

  const clearSchedule = () => {
    setSchedule(undefined);
    onChange(undefined);
  };

  const totalPercent = schedule?.stages.reduce((sum, s) => sum + (s.percentage || 0), 0) || 0;

  return (
    <Card title="Payment Schedule">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={schedule?.termsName || ''}
            onChange={(e) => applyPreset(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Select preset...</option>
            {PRESETS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearSchedule}
            className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
          <div className={`ml-auto text-sm ${totalPercent === 100 ? 'text-green-700' : 'text-orange-700'}`}>Total: {totalPercent}%</div>
        </div>

        {schedule?.stages && schedule.stages.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left">Stage</th>
                  <th className="px-3 py-2 text-right">Percent</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Due Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {schedule.stages.map((s, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">{s.stage}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={s.percentage || 0}
                        onChange={(e)=>updateStage(idx, { percentage: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">₹{(s.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={s.dueDate || ''}
                        onChange={(e)=>updateStage(idx, { dueDate: e.target.value })}
                        className="px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={s.status}
                        onChange={(e)=>updateStage(idx, { status: e.target.value as any })}
                        className="px-2 py-1 border rounded"
                      >
                        <option>Due</option>
                        <option>Partial</option>
                        <option>Received</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
