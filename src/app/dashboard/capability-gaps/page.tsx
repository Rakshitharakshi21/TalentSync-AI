'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Target, Loader2, Search, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CapabilityGapsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targetCapability, setTargetCapability] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [gapData, setGapData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const { data } = await supabase.from('employee_profiles').select('*, profiles!inner(full_name)');
      setEmployees(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeGaps() {
    if (!targetCapability.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/capability-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCapability }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setGapData(data);
      toast.success('Gap analysis complete!');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title flex items-center gap-2">
          <Target className="w-6 h-6 text-rose-500" />
          Capability Gap Map
        </h1>
        <p className="section-subtitle">Identify organizational capability gaps for any target role or skill area</p>
      </div>

      <div className="card p-5">
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Enter a target capability or role (e.g., 'AI Product Engineering', 'Data Engineering')"
            value={targetCapability}
            onChange={(e) => setTargetCapability(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyzeGaps()}
          />
          <button onClick={analyzeGaps} disabled={analyzing || !targetCapability.trim()} className="btn-primary">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analyze Gaps
          </button>
        </div>
      </div>

      {employees.length === 0 && (
        <div className="empty-state card py-16">
          <Target className="w-12 h-12 text-surface-300 mb-4" />
          <h3 className="text-lg font-semibold text-surface-900">Add employee profiles first</h3>
          <p className="text-surface-500 mt-2">Gap analysis requires employee data to compare against.</p>
        </div>
      )}

      {gapData && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-2">
              Organizational Gap: {gapData.target}
            </h3>
            <p className="text-sm text-surface-500 mb-6">{gapData.summary}</p>

            {/* Required capabilities */}
            {gapData.required_capabilities?.length > 0 && (
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-semibold text-surface-900">Required Capabilities</h4>
                {gapData.required_capabilities.map((cap: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-surface-200">
                    {cap.status === 'present' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                    {cap.status === 'partial' && <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                    {cap.status === 'missing' && <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-surface-900">{cap.capability}</span>
                      {cap.employees_with && (
                        <span className="text-xs text-surface-500 ml-2">
                          ({cap.employees_with} employee{cap.employees_with !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    <span className={`badge ${
                      cap.status === 'present' ? 'badge-emerald' :
                      cap.status === 'partial' ? 'badge-amber' : 'badge-rose'
                    }`}>
                      {cap.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {gapData.recommendations?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-900 mb-2">Recommendations</h4>
                <ul className="space-y-1.5">
                  {gapData.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm text-surface-600 flex items-start gap-2">
                      <span className="text-primary-400 mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Ready employees */}
          {gapData.ready_employees?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-emerald-600 mb-3">Ready Now</h3>
              <div className="space-y-2">
                {gapData.ready_employees.map((emp: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-emerald-700">{emp.name?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{emp.name}</p>
                      <p className="text-xs text-surface-500">{emp.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Near ready */}
          {gapData.near_ready_employees?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-amber-600 mb-3">Near Ready</h3>
              <div className="space-y-2">
                {gapData.near_ready_employees.map((emp: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-amber-700">{emp.name?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{emp.name}</p>
                      <p className="text-xs text-surface-500">{emp.reason}</p>
                      {emp.development_needed && (
                        <p className="text-xs text-amber-600 mt-0.5">Development: {emp.development_needed}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
