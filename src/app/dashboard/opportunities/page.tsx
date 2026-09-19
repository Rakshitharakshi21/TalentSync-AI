'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  Briefcase, Plus, X, Save, Loader2, Users, Search, ChevronDown,
  ChevronRight, Sparkles, CheckCircle2, AlertCircle, CircleDot
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OpportunitiesPage() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [matching, setMatching] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<Record<string, any[]>>({});

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('full_time');
  const [department, setDepartment] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [requiredYears, setRequiredYears] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });
      setOpportunities(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createOpportunity() {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('opportunities').insert({
        created_by: user!.id,
        title,
        description,
        type,
        department,
        required_skills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_skills: preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
        required_experience_years: requiredYears,
        status: 'open',
      });
      if (error) throw error;
      toast.success('Opportunity created!');
      setShowCreate(false);
      resetForm();
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle(''); setDescription(''); setType('full_time');
    setDepartment(''); setRequiredSkills(''); setPreferredSkills('');
    setRequiredYears(0);
  }

  async function runMatching(opportunityId: string) {
    setMatching(opportunityId);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      });
      if (!res.ok) throw new Error('Matching failed');
      const data = await res.json();
      setMatchResults(prev => ({ ...prev, [opportunityId]: data.matches || [] }));
      toast.success(`Found ${data.matches?.length || 0} matches`);
    } catch (e: any) {
      toast.error(e.message || 'Matching failed');
    } finally {
      setMatching(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-600" />
            {userRole === 'hr' ? 'Internal Opportunities' : 'Discover Opportunities'}
          </h1>
          <p className="section-subtitle">
            {userRole === 'hr'
              ? 'Create opportunities and match internal talent'
              : 'Find internal opportunities that match your capabilities'}
          </p>
        </div>
        {userRole === 'hr' && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Opportunity
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-6 border-primary-200 animate-fade-in">
          <h3 className="font-semibold text-surface-900 mb-4">Create New Opportunity</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Title</label>
              <input className="input-field" placeholder="e.g., Senior AI Engineer" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="full_time">Full Time Role</option>
                <option value="project">Project</option>
                <option value="temporary">Temporary Assignment</option>
                <option value="team">Team Position</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input-field" placeholder="e.g., Engineering" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div>
              <label className="label">Required Experience (years)</label>
              <input type="number" className="input-field" min="0" value={requiredYears} onChange={(e) => setRequiredYears(parseInt(e.target.value) || 0)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field min-h-[80px]" placeholder="Describe the role, responsibilities, and what you're looking for..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="label">Required Skills (comma-separated)</label>
              <input className="input-field" placeholder="e.g., Python, Machine Learning, LLMs" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} />
            </div>
            <div>
              <label className="label">Preferred Skills (comma-separated)</label>
              <input className="input-field" placeholder="e.g., RAG, LangChain, MLOps" value={preferredSkills} onChange={(e) => setPreferredSkills(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={createOpportunity} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Opportunities list */}
      {opportunities.length === 0 ? (
        <div className="empty-state card py-20">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
            <Briefcase className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">No opportunities yet</h3>
          <p className="text-surface-500 mt-2 max-w-md">
            {userRole === 'hr'
              ? 'Create your first internal opportunity to start matching talent.'
              : 'No internal opportunities are currently available. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="card">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-surface-900">{opp.title}</h3>
                      <span className={`badge ${
                        opp.type === 'full_time' ? 'badge-primary' :
                        opp.type === 'project' ? 'badge-emerald' :
                        opp.type === 'temporary' ? 'badge-amber' : 'badge-surface'
                      }`}>
                        {opp.type?.replace('_', ' ')}
                      </span>
                      <span className={`badge ${opp.status === 'open' ? 'badge-emerald' : 'badge-surface'}`}>
                        {opp.status}
                      </span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">{opp.description}</p>
                    {opp.department && (
                      <p className="text-xs text-surface-500 mb-2">Department: {opp.department}</p>
                    )}
                    <div className="flex flex-wrap gap-4">
                      {opp.required_skills?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-surface-500 mb-1">Required</p>
                          <div className="flex flex-wrap gap-1">
                            {opp.required_skills.map((s: string, i: number) => (
                              <span key={i} className="badge-rose">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {opp.preferred_skills?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-surface-500 mb-1">Preferred</p>
                          <div className="flex flex-wrap gap-1">
                            {opp.preferred_skills.map((s: string, i: number) => (
                              <span key={i} className="badge-surface">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {userRole === 'hr' && (
                    <button
                      onClick={() => runMatching(opp.id)}
                      disabled={matching === opp.id}
                      className="btn-primary ml-4 flex-shrink-0"
                    >
                      {matching === opp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                      {matching === opp.id ? 'Matching...' : 'Find Matches'}
                    </button>
                  )}
                </div>
              </div>

              {/* Match results */}
              {matchResults[opp.id]?.length > 0 && (
                <div className="border-t border-surface-100 p-6 bg-surface-50/50">
                  <h4 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    Internal Talent Matches
                  </h4>
                  <div className="space-y-3">
                    {matchResults[opp.id].map((match: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl border border-surface-200 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary-700">
                                {match.employee?.name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-surface-900">{match.employee?.name}</p>
                              <p className="text-sm text-surface-500">{match.employee?.job_title || match.employee?.current_role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {match.alignment === 'strong' && (
                              <span className="badge-emerald flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Strong Alignment
                              </span>
                            )}
                            {match.alignment === 'partial' && (
                              <span className="badge-amber flex items-center gap-1">
                                <CircleDot className="w-3 h-3" />
                                Partial Alignment
                              </span>
                            )}
                            {match.alignment === 'development_needed' && (
                              <span className="badge-rose flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Development Needed
                              </span>
                            )}
                            <span className="text-xs text-surface-400">
                              AI-generated similarity: {match.similarity_score}%
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-surface-600 mb-3">{match.explanation}</p>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          {match.matching_skills?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Matching Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {match.matching_skills.map((s: string, j: number) => (
                                  <span key={j} className="badge-emerald">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {match.missing_skills?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-rose-500 uppercase tracking-wider mb-1">Missing Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {match.missing_skills.map((s: string, j: number) => (
                                  <span key={j} className="badge-rose">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {match.recommendations?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-1">Recommendations</p>
                              <ul className="space-y-1">
                                {match.recommendations.map((r: string, j: number) => (
                                  <li key={j} className="text-surface-600 flex items-start gap-1.5">
                                    <ChevronRight className="w-3 h-3 mt-1 flex-shrink-0 text-primary-400" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
