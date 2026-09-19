'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Sparkles, Radar, Route, Briefcase, Users, ArrowRight, Map, Plus,
  User, Target, Lightbulb, TrendingUp, ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user, userRole } = useAuth();

  if (userRole === 'hr') return <HRDashboard />;
  return <EmployeeDashboard />;
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [profileExists, setProfileExists] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        setProfileExists(true);
        setProfile(ep);

        const [skillsRes, insightsRes] = await Promise.all([
          supabase.from('skills').select('*').eq('employee_id', ep.id),
          supabase.from('ai_insights').select('*').eq('employee_id', ep.id),
        ]);

        setSkills(skillsRes.data || []);
        setInsights(insightsRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const talentDna = insights.find((i: any) => i.type === 'talent_dna');
  const hiddenCapabilities = insights.find((i: any) => i.type === 'hidden_capabilities');
  const skillAdjacency = insights.find((i: any) => i.type === 'skill_adjacency');
  const careerRoadmap = insights.find((i: any) => i.type === 'career_roadmap');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="card p-8 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white border-0">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Your career is bigger than your current job title.
          </h1>
          <p className="mt-3 text-primary-100 text-lg">
            Discover hidden capabilities, explore new opportunities, and build your career path.
          </p>
          {!profileExists && (
            <Link href="/dashboard/profile" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors">
              <Plus className="w-4 h-4" />
              Create Your Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {!profileExists ? (
        <div className="empty-state card py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
            <User className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">No profile yet</h3>
          <p className="text-surface-500 mt-2 max-w-md">
            Create your profile to unlock Talent Intelligence. Add your skills, projects, and experience to discover hidden capabilities.
          </p>
          <Link href="/dashboard/profile" className="btn-primary mt-6">
            <Plus className="w-4 h-4" />
            Create Profile
          </Link>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{skills.length}</p>
                  <p className="text-xs text-surface-500">Skills</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">
                    {hiddenCapabilities?.data?.capabilities?.length || 0}
                  </p>
                  <p className="text-xs text-surface-500">Hidden Capabilities</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">
                    {talentDna?.data?.dimensions?.length || 0}
                  </p>
                  <p className="text-xs text-surface-500">Talent Dimensions</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">
                    {skillAdjacency?.data?.potential_roles?.length || 0}
                  </p>
                  <p className="text-xs text-surface-500">Potential Roles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick access cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            <QuickCard
              href="/dashboard/talent-dna"
              icon={Sparkles}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
              title="Talent DNA"
              desc={talentDna ? 'View your capability profile' : 'Analyze your capabilities'}
              hasData={!!talentDna}
            />
            <QuickCard
              href="/dashboard/talent-radar"
              icon={Radar}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              title="Hidden Talent Radar"
              desc={hiddenCapabilities ? `${hiddenCapabilities.data?.capabilities?.length || 0} hidden capabilities found` : 'Discover hidden capabilities'}
              hasData={!!hiddenCapabilities}
            />
            <QuickCard
              href="/dashboard/opportunities"
              icon={Briefcase}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              title="Opportunities"
              desc="Explore internal opportunities"
              hasData={false}
            />
            <QuickCard
              href="/dashboard/capability-map"
              icon={Map}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
              title="Capability Map"
              desc="Visualize your capability network"
              hasData={!!talentDna}
            />
            <QuickCard
              href="/dashboard/career-path"
              icon={Route}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              title="Career Pathfinder"
              desc={careerRoadmap ? 'View your career roadmap' : 'Build your career path'}
              hasData={!!careerRoadmap}
            />
            <QuickCard
              href="/dashboard/assistant"
              icon={Target}
              iconBg="bg-rose-50"
              iconColor="text-rose-500"
              title="AI Career Assistant"
              desc="Ask about your career potential"
              hasData={false}
            />
          </div>

          {/* Hidden capabilities preview */}
          {hiddenCapabilities?.data?.capabilities?.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                    <Radar className="w-4.5 h-4.5 text-emerald-600" />
                    Hidden Capabilities Discovered
                  </h3>
                  <p className="text-sm text-surface-500 mt-0.5">Capabilities beyond your current job title</p>
                </div>
                <Link href="/dashboard/talent-radar" className="btn-ghost text-sm">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {hiddenCapabilities.data.capabilities.slice(0, 3).map((cap: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900">{cap.capability}</p>
                      <p className="text-sm text-surface-500 mt-0.5">{cap.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {cap.evidence?.slice(0, 4).map((e: string, j: number) => (
                          <span key={j} className="evidence-tag">{e}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`badge ${
                      cap.confidence === 'high' ? 'badge-emerald' :
                      cap.confidence === 'medium' ? 'badge-amber' : 'badge-surface'
                    }`}>
                      {cap.confidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HRDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const [empRes, oppRes] = await Promise.all([
        supabase.from('employee_profiles').select('*, profiles!inner(full_name, email)'),
        supabase.from('opportunities').select('*').eq('status', 'open'),
      ]);
      setEmployees(empRes.data || []);
      setOpportunities(oppRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="card p-8 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-950 text-white border-0">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Discover the capabilities already inside your organization.
          </h1>
          <p className="mt-3 text-surface-300 text-lg">
            Analyze workforce capabilities, discover hidden talent, and create internal mobility paths.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{employees.length}</p>
              <p className="text-xs text-surface-500">Employees</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{opportunities.length}</p>
              <p className="text-xs text-surface-500">Open Opportunities</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Radar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">—</p>
              <p className="text-xs text-surface-500">Run Talent Radar to discover</p>
            </div>
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state card py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
            <Users className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">No talent data yet</h3>
          <p className="text-surface-500 mt-2 max-w-md">
            Add your first employee to unlock Talent Intelligence. Employee profiles power all capability analysis.
          </p>
          <Link href="/dashboard/workforce" className="btn-primary mt-6">
            <Plus className="w-4 h-4" />
            Add Employees
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          <QuickCard
            href="/dashboard/workforce"
            icon={Users}
            iconBg="bg-primary-50"
            iconColor="text-primary-600"
            title="Workforce"
            desc={`${employees.length} employee profiles`}
            hasData={employees.length > 0}
          />
          <QuickCard
            href="/dashboard/talent-radar"
            icon={Radar}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            title="Hidden Talent Radar"
            desc="Surface hidden capabilities"
            hasData={false}
          />
          <QuickCard
            href="/dashboard/opportunities"
            icon={Briefcase}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            title="Opportunities"
            desc={opportunities.length > 0 ? `${opportunities.length} open positions` : 'Create internal opportunities'}
            hasData={opportunities.length > 0}
          />
          <QuickCard
            href="/dashboard/capability-map"
            icon={Map}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            title="Capability Map"
            desc="Visualize organizational capabilities"
            hasData={false}
          />
          <QuickCard
            href="/dashboard/capability-gaps"
            icon={Target}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            title="Capability Gaps"
            desc="Identify organizational gaps"
            hasData={false}
          />
          <QuickCard
            href="/dashboard/assistant"
            icon={Sparkles}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            title="AI Assistant"
            desc="Workforce intelligence assistant"
            hasData={false}
          />
        </div>
      )}

      {/* Recent employees */}
      {employees.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Recent Employees</h3>
            <Link href="/dashboard/workforce" className="btn-ghost text-sm">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {employees.slice(0, 5).map((emp: any) => (
              <div key={emp.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-700">
                    {emp.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{emp.profiles?.full_name}</p>
                  <p className="text-xs text-surface-500 truncate">{emp.job_title || emp.current_role || 'No role set'}</p>
                </div>
                <span className="badge-surface">{emp.department || 'No dept'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickCard({ href, icon: Icon, iconBg, iconColor, title, desc, hasData }: {
  href: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  hasData: boolean;
}) {
  return (
    <Link href={href} className="card-hover p-5 group">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{title}</p>
          <p className="text-sm text-surface-500 mt-0.5">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all mt-1" />
      </div>
    </Link>
  );
}
