'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Route, Loader2, RefreshCw, ArrowDown, CheckCircle2, Target, Lightbulb, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CareerPathPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [skillAdjacency, setSkillAdjacency] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Skill gap
  const [targetRole, setTargetRole] = useState('');
  const [gapAnalysis, setGapAnalysis] = useState<any>(null);
  const [analyzingGap, setAnalyzingGap] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const { data: ep } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (ep) {
        setEmployeeId(ep.id);
        const [roadmapRes, adjRes] = await Promise.all([
          supabase.from('ai_insights').select('*').eq('employee_id', ep.id).eq('type', 'career_roadmap').single(),
          supabase.from('ai_insights').select('*').eq('employee_id', ep.id).eq('type', 'skill_adjacency').single(),
        ]);
        if (roadmapRes.data) setRoadmap(roadmapRes.data.data);
        if (adjRes.data) setSkillAdjacency(adjRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    if (!employeeId) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setRoadmap(data.career_roadmap);
      setSkillAdjacency(data.skill_adjacency);
      toast.success('Career path generated!');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function analyzeGap() {
    if (!employeeId || !targetRole.trim()) return;
    setAnalyzingGap(true);
    try {
      const res = await fetch('/api/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, targetRole }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setGapAnalysis(data);
      toast.success('Gap analysis complete!');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setAnalyzingGap(false);
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
        <Route className="w-12 h-12 text-surface-300 mb-4" />
        <h3 className="text-lg font-semibold text-surface-900">Create your profile first</h3>
        <p className="text-surface-500 mt-2">Add your skills and experience to generate career paths.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Route className="w-6 h-6 text-blue-600" />
            Career Pathfinder
          </h1>
          <p className="section-subtitle">Your personalized career development roadmap</p>
        </div>
        <button onClick={runAnalysis} disabled={analyzing} className="btn-secondary">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {analyzing ? 'Generating...' : roadmap ? 'Regenerate' : 'Generate Path'}
        </button>
      </div>

      {/* Career Roadmap */}
      {roadmap ? (
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-6">Your Career Roadmap</h3>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200" />

            {/* Current */}
            <div className="relative flex gap-5 pb-8">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white">
                <CheckCircle2 className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 card p-5 bg-primary-50/50 border-primary-200">
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">Current</p>
                <h4 className="font-semibold text-surface-900">{roadmap.current_state?.role}</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {roadmap.current_state?.strengths?.map((s: string, i: number) => (
                    <span key={i} className="badge-primary">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Now */}
            <div className="relative flex gap-5 pb-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white">
                <Lightbulb className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 card p-5">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Now — {roadmap.now?.title}</p>
                <div className="space-y-2 mt-2">
                  {roadmap.now?.actions?.map((a: string, i: number) => (
                    <p key={i} className="text-sm text-surface-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      {a}
                    </p>
                  ))}
                </div>
                {roadmap.now?.skills_to_strengthen?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-surface-500 mb-1">Strengthen</p>
                    <div className="flex flex-wrap gap-1.5">
                      {roadmap.now.skills_to_strengthen.map((s: string, i: number) => (
                        <span key={i} className="badge-emerald">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next */}
            <div className="relative flex gap-5 pb-8">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 card p-5">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Next — {roadmap.next?.title}</p>
                {roadmap.next?.timeline && (
                  <p className="text-xs text-surface-400 mb-2">Timeline: {roadmap.next.timeline}</p>
                )}
                <div className="space-y-2 mt-2">
                  {roadmap.next?.actions?.map((a: string, i: number) => (
                    <p key={i} className="text-sm text-surface-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      {a}
                    </p>
                  ))}
                </div>
                {roadmap.next?.skills_to_build?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-surface-500 mb-1">Build</p>
                    <div className="flex flex-wrap gap-1.5">
                      {roadmap.next.skills_to_build.map((s: string, i: number) => (
                        <span key={i} className="badge-amber">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Then */}
            <div className="relative flex gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 card p-5 bg-gradient-to-r from-primary-50 to-transparent border-primary-200">
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">Then — {roadmap.then?.title}</p>
                <h4 className="font-semibold text-lg text-surface-900">{roadmap.then?.target_role}</h4>
                {roadmap.then?.timeline && (
                  <p className="text-xs text-surface-400 mt-1">Timeline: {roadmap.then.timeline}</p>
                )}
                {roadmap.then?.requirements?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-surface-500 mb-1">Requirements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {roadmap.then.requirements.map((r: string, i: number) => (
                        <span key={i} className="badge-primary">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state card py-16">
          <Route className="w-12 h-12 text-surface-300 mb-4" />
          <h3 className="text-lg font-semibold text-surface-900">No career roadmap yet</h3>
          <p className="text-surface-500 mt-2 max-w-md">Generate your personalized career path based on your actual capabilities.</p>
          <button onClick={runAnalysis} disabled={analyzing} className="btn-primary mt-6">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
            Generate Career Path
          </button>
        </div>
      )}

      {/* Skill Adjacency */}
      {skillAdjacency && (
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Skill Adjacency — Potential Roles</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillAdjacency.potential_roles?.map((role: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-surface-200 bg-surface-50/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-surface-900">{role.role}</h4>
                  <span className={`badge ${
                    role.readiness === 'ready_now' ? 'badge-emerald' :
                    role.readiness === 'near_ready' ? 'badge-amber' : 'badge-rose'
                  }`}>
                    {role.readiness?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-surface-600">{role.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Gap Analysis */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Skill Gap Analysis</h3>
        <p className="text-sm text-surface-500 mb-4">Enter a target role to see what you need to develop</p>
        <div className="flex gap-3 mb-6">
          <input
            className="input-field flex-1"
            placeholder="e.g., AI Product Engineer, Data Scientist, Engineering Manager"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyzeGap()}
          />
          <button onClick={analyzeGap} disabled={analyzingGap || !targetRole.trim()} className="btn-primary">
            {analyzingGap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            Analyze Gap
          </button>
        </div>

        {gapAnalysis && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <span className={`badge text-sm px-3 py-1 ${
                gapAnalysis.overall_readiness === 'ready_now' ? 'badge-emerald' :
                gapAnalysis.overall_readiness === 'near_ready' ? 'badge-amber' : 'badge-rose'
              }`}>
                {gapAnalysis.overall_readiness?.replace('_', ' ')}
              </span>
              {gapAnalysis.estimated_timeline && (
                <span className="text-sm text-surface-500">Est. timeline: {gapAnalysis.estimated_timeline}</span>
              )}
            </div>

            {/* Already have */}
            {gapAnalysis.already_have?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">✓ Already Have</h4>
                <div className="space-y-2">
                  {gapAnalysis.already_have.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-surface-900">{item.skill}</span>
                        <span className="text-xs text-surface-500 ml-2">— {item.evidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partially developed */}
            {gapAnalysis.partially_developed?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">⚠ Partially Developed</h4>
                <div className="space-y-2">
                  {gapAnalysis.partially_developed.map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                      <span className="text-sm font-medium text-surface-900">{item.skill}</span>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Current: {item.current_level} → Needed: {item.needed_level}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Need to develop */}
            {gapAnalysis.need_to_develop?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">✕ Need to Develop</h4>
                <div className="space-y-2">
                  {gapAnalysis.need_to_develop.map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-rose-50/50 border border-rose-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-surface-900">{item.skill}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          item.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                          item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-surface-100 text-surface-600'
                        }`}>{item.priority} priority</span>
                      </div>
                      {item.recommendations?.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {item.recommendations.map((r: string, j: number) => (
                            <li key={j} className="text-xs text-surface-600 flex items-start gap-1.5">
                              <span className="text-rose-400 mt-0.5">→</span> {r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
