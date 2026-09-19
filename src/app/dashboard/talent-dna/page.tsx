'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Sparkles, Loader2, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TalentDNAPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [talentDna, setTalentDna] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const { data: ep } = await supabase
        .from('employee_profiles')
        .select('*, profiles!inner(full_name)')
        .eq('user_id', user!.id)
        .single();

      if (ep) {
        setEmployeeId(ep.id);
        setProfile(ep);
        const { data: insight } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('employee_id', ep.id)
          .eq('type', 'talent_dna')
          .single();

        if (insight) setTalentDna(insight.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    if (!employeeId) {
      toast.error('Create your profile first');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setTalentDna(data.talent_dna);
      toast.success('Talent DNA generated!');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
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

  if (!employeeId) {
    return (
      <div className="empty-state card py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
          <Sparkles className="w-8 h-8 text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900">Create your profile first</h3>
        <p className="text-surface-500 mt-2">Add your skills, projects, and experience to generate your Talent DNA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-600" />
            Talent DNA
          </h1>
          <p className="section-subtitle">Your professional capability profile derived from actual evidence</p>
        </div>
        <button onClick={runAnalysis} disabled={analyzing} className="btn-secondary">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {analyzing ? 'Analyzing...' : talentDna ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {!talentDna ? (
        <div className="empty-state card py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">No Talent DNA yet</h3>
          <p className="text-surface-500 mt-2 max-w-md">
            Click &ldquo;Generate&rdquo; to analyze your profile and create your capability DNA.
          </p>
          <button onClick={runAnalysis} disabled={analyzing} className="btn-primary mt-6">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Talent DNA
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-2">Capability Summary</h3>
            <p className="text-surface-600">{talentDna.summary}</p>
          </div>

          {/* Capability Dimensions */}
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 mb-6">Capability Dimensions</h3>
            <div className="space-y-6">
              {talentDna.dimensions?.map((dim: any, i: number) => (
                <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-900">{dim.name}</span>
                      <span className="text-xs text-surface-400">Evidence-derived level</span>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">{dim.level}/100</span>
                  </div>
                  <div className="capability-bar">
                    <div
                      className={`capability-fill ${
                        dim.level >= 75 ? 'bg-primary-500' :
                        dim.level >= 50 ? 'bg-emerald-500' :
                        dim.level >= 25 ? 'bg-amber-500' : 'bg-surface-400'
                      }`}
                      style={{ width: `${dim.level}%` }}
                    />
                  </div>
                  <p className="text-sm text-surface-500 mt-1.5">{dim.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dim.evidence?.map((e: string, j: number) => (
                      <span key={j} className="evidence-tag">{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging Capabilities */}
          {talentDna.emerging_capabilities?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                Emerging Capabilities
              </h3>
              <p className="text-sm text-surface-500 mb-4">Capabilities starting to form based on your recent activities</p>
              <div className="flex flex-wrap gap-2">
                {talentDna.emerging_capabilities.map((cap: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">{cap}</span>
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
