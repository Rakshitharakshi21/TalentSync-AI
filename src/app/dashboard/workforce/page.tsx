'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  Users, Plus, Loader2, Search, ChevronRight, Sparkles,
  User, Briefcase, Code, Award, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function WorkforcePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [empDetails, setEmpDetails] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const { data } = await supabase
        .from('employee_profiles')
        .select('*, profiles!inner(full_name, email)')
        .order('created_at', { ascending: false });
      setEmployees(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function selectEmployee(emp: any) {
    setSelectedEmployee(emp);
    const [skillsRes, projectsRes, expRes, certRes, learnRes, insightsRes] = await Promise.all([
      supabase.from('skills').select('*').eq('employee_id', emp.id),
      supabase.from('projects').select('*').eq('employee_id', emp.id),
      supabase.from('experience').select('*').eq('employee_id', emp.id),
      supabase.from('certifications').select('*').eq('employee_id', emp.id),
      supabase.from('learning_activities').select('*').eq('employee_id', emp.id),
      supabase.from('ai_insights').select('*').eq('employee_id', emp.id),
    ]);
    setEmpDetails({
      skills: skillsRes.data || [],
      projects: projectsRes.data || [],
      experience: expRes.data || [],
      certifications: certRes.data || [],
      learning: learnRes.data || [],
      insights: insightsRes.data || [],
    });
  }

  async function analyzeEmployee(empId: string) {
    setAnalyzing(empId);
    try {
      const res = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      toast.success('AI analysis complete!');
      if (selectedEmployee?.id === empId) selectEmployee(selectedEmployee);
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setAnalyzing(null);
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    if (!searchFilter) return true;
    const s = searchFilter.toLowerCase();
    const roleStr = emp.job_title || emp.current_role || '';
    return (
      emp.profiles?.full_name?.toLowerCase().includes(s) ||
      roleStr.toLowerCase().includes(s) ||
      emp.department?.toLowerCase().includes(s)
    );
  });

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
            <Users className="w-6 h-6 text-primary-600" />
            Workforce
          </h1>
          <p className="section-subtitle">Employee capability profiles and talent intelligence</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state card py-20">
          <Users className="w-12 h-12 text-surface-300 mb-4" />
          <h3 className="text-lg font-semibold text-surface-900">No employees yet</h3>
          <p className="text-surface-500 mt-2 max-w-md">
            Employees will appear here after they create their profiles. Share the platform link for employees to sign up.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Employee list */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                className="input-field pl-9"
                placeholder="Search employees..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <div className="space-y-1 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    selectedEmployee?.id === emp.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-surface-50 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary-700">
                      {emp.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{emp.profiles?.full_name}</p>
                    <p className="text-xs text-surface-500 truncate">{emp.job_title || emp.current_role || 'No role'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Employee details */}
          <div className="lg:col-span-2">
            {!selectedEmployee ? (
              <div className="empty-state card py-20">
                <User className="w-10 h-10 text-surface-300 mb-3" />
                <p className="text-surface-500">Select an employee to view their profile</p>
              </div>
            ) : (
              <div className="card p-6 space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary-700">
                        {selectedEmployee.profiles?.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-surface-900">{selectedEmployee.profiles?.full_name}</h2>
                      <p className="text-surface-500">{selectedEmployee.job_title || selectedEmployee.current_role || 'No role'} • {selectedEmployee.department || 'No dept'}</p>
                      <p className="text-xs text-surface-400">{selectedEmployee.years_experience || 0} years experience</p>
                    </div>
                  </div>
                  <button
                    onClick={() => analyzeEmployee(selectedEmployee.id)}
                    disabled={analyzing === selectedEmployee.id}
                    className="btn-primary"
                  >
                    {analyzing === selectedEmployee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {analyzing === selectedEmployee.id ? 'Analyzing...' : 'Run AI Analysis'}
                  </button>
                </div>

                {selectedEmployee.summary && (
                  <p className="text-sm text-surface-600">{selectedEmployee.summary}</p>
                )}

                {empDetails && (
                  <>
                    {/* Skills */}
                    {empDetails.skills.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-surface-900 mb-2 flex items-center gap-2">
                          <Code className="w-4 h-4 text-emerald-600" /> Skills ({empDetails.skills.length})
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {empDetails.skills.map((s: any, i: number) => (
                            <span key={i} className={`badge ${
                              s.proficiency === 'expert' ? 'badge-primary' :
                              s.proficiency === 'advanced' ? 'badge-emerald' :
                              s.proficiency === 'intermediate' ? 'badge-amber' : 'badge-surface'
                            }`}>{s.name}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {empDetails.projects.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-surface-900 mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-600" /> Projects ({empDetails.projects.length})
                        </h3>
                        <div className="space-y-2">
                          {empDetails.projects.map((p: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-surface-50 border border-surface-100">
                              <p className="text-sm font-medium text-surface-900">{p.name}</p>
                              <p className="text-xs text-surface-500 mt-0.5">{p.description}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.technologies?.map((t: string, j: number) => (
                                  <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">{t}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Insights */}
                    {empDetails.insights.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-surface-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary-600" /> AI Insights
                        </h3>
                        {empDetails.insights.map((insight: any, i: number) => (
                          <div key={i} className="mb-3">
                            <p className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-1">
                              {insight.type?.replace('_', ' ')}
                            </p>
                            {insight.type === 'hidden_capabilities' && insight.data?.capabilities && (
                              <div className="space-y-2">
                                {insight.data.capabilities.map((cap: any, j: number) => (
                                  <div key={j} className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-surface-900">{cap.capability}</span>
                                      <span className={`badge ${
                                        cap.confidence === 'high' ? 'badge-emerald' : 'badge-amber'
                                      }`}>{cap.confidence}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {cap.evidence?.map((e: string, k: number) => (
                                        <span key={k} className="evidence-tag">{e}</span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
