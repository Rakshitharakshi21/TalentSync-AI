'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Radar, Sparkles, Loader2, Search, RefreshCw, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TalentRadarPage() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      if (userRole === 'hr') {
        const { data } = await supabase
          .from('employee_profiles')
          .select('*, profiles!inner(full_name, email)');
        setEmployees(data || []);

        // Load all hidden capabilities
        const allInsights: any[] = [];
        for (const emp of (data || [])) {
          const { data: insight } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('employee_id', emp.id)
            .eq('type', 'hidden_capabilities')
            .single();
          if (insight) {
            allInsights.push({
              employee: emp,
              ...insight.data,
            });
          }
        }
        setResults(allInsights);
      } else {
        // Employee view - show own hidden capabilities
        const { data: ep } = await supabase
          .from('employee_profiles')
          .select('*, profiles!inner(full_name)')
          .eq('user_id', user!.id)
          .single();

        if (ep) {
          const { data: insight } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('employee_id', ep.id)
            .eq('type', 'hidden_capabilities')
            .single();

          if (insight) {
            setResults([{ employee: ep, ...insight.data }]);
          }
          setSelectedEmployee(ep);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function searchTalent() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/talent-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
      toast.success(`Found ${data.results?.length || 0} results`);
    } catch (e: any) {
      toast.error(e.message || 'Search failed');
    } finally {
      setSearching(false);
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
          <Radar className="w-6 h-6 text-emerald-600" />
          Hidden Talent Radar
        </h1>
        <p className="section-subtitle">Surface capabilities that traditional job titles don&apos;t reveal</p>
      </div>

      {userRole === 'hr' && (
        <div className="card p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
              <input
                className="input-field pl-10"
                placeholder="Search for a capability, role, or skill (e.g., 'AI Product Engineers', 'React + Python')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTalent()}
              />
            </div>
            <button onClick={searchTalent} disabled={searching} className="btn-primary">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              Search Talent
            </button>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="empty-state card py-20">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
            <Radar className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">No hidden capabilities discovered yet</h3>
          <p className="text-surface-500 mt-2 max-w-md">
            {userRole === 'hr'
              ? 'Run AI Analysis on employee profiles to discover hidden capabilities, then search for specific talents here.'
              : 'Run AI Analysis on your profile to discover your hidden capabilities.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {results.map((result: any, i: number) => (
            <div key={i} className="card p-6">
              {/* Employee header */}
              {userRole === 'hr' && result.employee && (
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {result.employee.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900">{result.employee.profiles?.full_name}</p>
                    <p className="text-sm text-surface-500">{result.employee.job_title || result.employee.current_role || 'No role set'}</p>
                  </div>
                </div>
              )}

              {/* Hidden capabilities */}
              <div className="space-y-4">
                {(result.capabilities || []).map((cap: any, j: number) => (
                  <div key={j} className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                        <h4 className="font-semibold text-surface-900">{cap.capability}</h4>
                      </div>
                      <span className={`badge ${
                        cap.confidence === 'high' ? 'badge-emerald' :
                        cap.confidence === 'medium' ? 'badge-amber' : 'badge-surface'
                      }`}>
                        {cap.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">{cap.description}</p>

                    <div className="mb-3">
                      <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">Evidence</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cap.evidence?.map((e: string, k: number) => (
                          <span key={k} className="evidence-tag">{e}</span>
                        ))}
                      </div>
                    </div>

                    {cap.potential_roles?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">Potential Roles</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cap.potential_roles.map((role: string, k: number) => (
                            <span key={k} className="badge-primary">{role}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
