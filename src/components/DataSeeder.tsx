import React, { useState } from 'react';
import { seedHRData } from '@/utils/seedHRData';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const DataSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await seedHRData();
      setMessage({
        type: 'success',
        text: 'HR data seeded successfully! Check the console for details.',
      });
    } catch (error: any) {
      console.error('Seeding error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error seeding data. Check console for details.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Seed HR Data</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Click the button below to populate the database with dummy employee, attendance, leave, and expense data for testing.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 font-semibold mb-2">This will create:</p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4">
            <li>• 5 employees (different categories)</li>
            <li>• Salary configurations for all employees</li>
            <li>• Attendance records for last 10 working days</li>
            <li>• 2 leave applications (1 pending, 1 approved)</li>
            <li>• ~20 expense records (recent ones pending approval)</li>
          </ul>
        </div>

        {message && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
                {message.text}
              </p>
              {message.type === 'success' && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-emerald-800">Visit these pages:</p>
                  <a
                    href="/employees"
                    className="block text-sm text-emerald-700 hover:text-emerald-900 underline"
                  >
                    → Employees List
                  </a>
                  <a
                    href="/employees/attendance/checkin"
                    className="block text-sm text-emerald-700 hover:text-emerald-900 underline"
                  >
                    → Attendance Check-in
                  </a>
                  <a
                    href="/employees/leaves"
                    className="block text-sm text-emerald-700 hover:text-emerald-900 underline"
                  >
                    → Leave Management
                  </a>
                  <a
                    href="/expenses"
                    className="block text-sm text-emerald-700 hover:text-emerald-900 underline"
                  >
                    → Daily Expenses
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Seeding Data...
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              Seed HR Data
            </>
          )}
        </button>

        {loading && (
          <p className="text-sm text-gray-500 text-center mt-3">
            This may take a few seconds. Please wait...
          </p>
        )}
      </div>
    </div>
  );
};
