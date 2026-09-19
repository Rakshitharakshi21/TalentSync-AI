'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  User, Briefcase, Code, GraduationCap, Award, BookOpen, Plus, X, Save,
  Upload, FileText, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [analyzing, setAnalyzing] = useState(false);

  // Profile data
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [department, setDepartment] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [location, setLocation] = useState('');

  // Skills
  const [skills, setSkills] = useState<{ id?: string; name: string; category: string; proficiency: string }[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('technical');
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');

  // Projects
  const [projects, setProjects] = useState<any[]>([]);

  // Experience
  const [experience, setExperience] = useState<any[]>([]);

  // Certifications
  const [certifications, setCertifications] = useState<any[]>([]);

  // Learning
  const [learningActivities, setLearningActivities] = useState<any[]>([]);

  // Resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  async function loadProfile() {
    try {
      const { data: ep } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (ep) {
        setEmployeeId(ep.id);
        setHeadline(ep.headline || '');
        setSummary(ep.summary || '');
        setCurrentRole(ep.job_title || ep.current_role || '');
        setDepartment(ep.department || '');
        setYearsExperience(ep.years_experience || 0);
        setLocation(ep.location || '');

        const [skillsRes, projectsRes, expRes, certRes, learnRes] = await Promise.all([
          supabase.from('skills').select('*').eq('employee_id', ep.id),
          supabase.from('projects').select('*').eq('employee_id', ep.id),
          supabase.from('experience').select('*').eq('employee_id', ep.id),
          supabase.from('certifications').select('*').eq('employee_id', ep.id),
          supabase.from('learning_activities').select('*').eq('employee_id', ep.id),
        ]);

        setSkills(skillsRes.data || []);
        setProjects(projectsRes.data || []);
        setExperience(expRes.data || []);
        setCertifications(certRes.data || []);
        setLearningActivities(learnRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      let epId = employeeId;

      if (!epId) {
        const { data, error } = await supabase
          .from('employee_profiles')
          .insert({
            user_id: user!.id,
            headline,
            summary,
            job_title: currentRole,
            department,
            years_experience: yearsExperience,
            location,
          })
          .select()
          .single();

        if (error) throw error;
        epId = data.id;
        setEmployeeId(epId);
      } else {
        const { error } = await supabase
          .from('employee_profiles')
          .update({
            headline,
            summary,
            job_title: currentRole,
            department,
            years_experience: yearsExperience,
            location,
            updated_at: new Date().toISOString(),
          })
          .eq('id', epId);

        if (error) throw error;
      }

      // Save skills
      if (epId) {
        // Delete existing skills and re-insert
        await supabase.from('skills').delete().eq('employee_id', epId);
        if (skills.length > 0) {
          await supabase.from('skills').insert(
            skills.map((s) => ({
              employee_id: epId,
              name: s.name,
              category: s.category,
              proficiency: s.proficiency,
              source: 'manual',
            }))
          );
        }

        // Save projects
        await supabase.from('projects').delete().eq('employee_id', epId);
        if (projects.length > 0) {
          await supabase.from('projects').insert(
            projects.map((p) => ({
              employee_id: epId,
              name: p.name,
              description: p.description || '',
              role_in_project: p.role_in_project || '',
              technologies: p.technologies || [],
              start_date: p.start_date || '',
              end_date: p.end_date || null,
              key_achievements: p.key_achievements || '',
            }))
          );
        }

        // Save experience
        await supabase.from('experience').delete().eq('employee_id', epId);
        if (experience.length > 0) {
          await supabase.from('experience').insert(
            experience.map((e) => ({
              employee_id: epId,
              company: e.company,
              title: e.title,
              description: e.description || '',
              start_date: e.start_date || '',
              end_date: e.end_date || null,
              is_current: e.is_current || false,
              technologies: e.technologies || [],
            }))
          );
        }

        // Save certifications
        await supabase.from('certifications').delete().eq('employee_id', epId);
        if (certifications.length > 0) {
          await supabase.from('certifications').insert(
            certifications.map((c) => ({
              employee_id: epId,
              name: c.name,
              issuer: c.issuer || '',
              date_obtained: c.date_obtained || '',
              expiry_date: c.expiry_date || null,
              credential_id: c.credential_id || '',
            }))
          );
        }

        // Save learning activities
        await supabase.from('learning_activities').delete().eq('employee_id', epId);
        if (learningActivities.length > 0) {
          await supabase.from('learning_activities').insert(
            learningActivities.map((l) => ({
              employee_id: epId,
              title: l.title,
              provider: l.provider || '',
              type: l.type || 'course',
              status: l.status || 'completed',
              skills_learned: l.skills_learned || [],
              completion_date: l.completion_date || null,
            }))
          );
        }
      }

      toast.success('Profile saved successfully!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleResumeUpload() {
    if (!resumeFile) return;
    setResumeParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to parse resume');

      const data = await res.json();
      setResumeData(data);
      toast.success('Resume parsed! Review the extracted information below.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to parse resume');
    } finally {
      setResumeParsing(false);
    }
  }

  function applyResumeData() {
    if (!resumeData) return;

    if (resumeData.headline) setHeadline(resumeData.headline);
    if (resumeData.summary) setSummary(resumeData.summary);
    if (resumeData.job_title || resumeData.current_role) setCurrentRole(resumeData.job_title || resumeData.current_role);

    if (resumeData.skills?.length) {
      const newSkills = resumeData.skills.map((s: string) => ({
        name: s,
        category: 'technical',
        proficiency: 'intermediate',
      }));
      setSkills((prev) => [...prev, ...newSkills.filter((ns: any) => !prev.some((ps) => ps.name.toLowerCase() === ns.name.toLowerCase()))]);
    }

    if (resumeData.experience?.length) {
      setExperience((prev) => [...prev, ...resumeData.experience]);
    }

    if (resumeData.projects?.length) {
      setProjects((prev) => [...prev, ...resumeData.projects]);
    }

    if (resumeData.certifications?.length) {
      setCertifications((prev) => [...prev, ...resumeData.certifications]);
    }

    setResumeData(null);
    toast.success('Resume data applied to your profile!');
  }

  async function runAIAnalysis() {
    if (!employeeId) {
      toast.error('Save your profile first');
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
      toast.success('AI analysis complete! Check your Talent DNA and Hidden Capabilities.');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  function addSkill() {
    if (!newSkill.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkill.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    setSkills([...skills, { name: newSkill, category: newSkillCategory, proficiency: newSkillProficiency }]);
    setNewSkill('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'experience', label: 'Experience', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'resume', label: 'Resume Upload', icon: Upload },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="section-subtitle">Build your capability profile for AI-powered talent intelligence</p>
        </div>
        <div className="flex gap-3">
          <button onClick={runAIAnalysis} disabled={analyzing || !employeeId} className="btn-secondary">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
          <button onClick={saveProfile} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-surface-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-primary-700 bg-primary-50 border-b-2 border-primary-600'
                : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-6">
        {activeTab === 'basic' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label">Headline</label>
              <input className="input-field" placeholder="e.g., Full Stack Developer" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </div>
            <div>
              <label className="label">Current Role</label>
              <input className="input-field" placeholder="e.g., Software Engineer" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input-field" placeholder="e.g., Engineering" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input type="number" className="input-field" min="0" value={yearsExperience} onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input-field" placeholder="e.g., San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Summary</label>
              <textarea className="input-field min-h-[100px]" placeholder="A brief summary of your background and interests..." value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <div className="flex gap-3 mb-6">
              <input
                className="input-field flex-1"
                placeholder="Add a skill (e.g., Python, React, Project Management)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              />
              <select className="input-field w-36" value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value)}>
                <option value="technical">Technical</option>
                <option value="language">Language</option>
                <option value="framework">Framework</option>
                <option value="tool">Tool</option>
                <option value="soft_skill">Soft Skill</option>
                <option value="domain">Domain</option>
              </select>
              <select className="input-field w-36" value={newSkillProficiency} onChange={(e) => setNewSkillProficiency(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <button onClick={addSkill} className="btn-primary">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {skills.length === 0 ? (
              <div className="empty-state py-12">
                <Code className="w-10 h-10 text-surface-300 mb-3" />
                <p className="text-surface-500">No skills added yet. Add your skills above.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-50 border border-surface-200 group">
                    <span className="text-sm font-medium text-surface-800">{skill.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      skill.proficiency === 'expert' ? 'bg-primary-100 text-primary-700' :
                      skill.proficiency === 'advanced' ? 'bg-emerald-100 text-emerald-700' :
                      skill.proficiency === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                      'bg-surface-200 text-surface-600'
                    }`}>
                      {skill.proficiency}
                    </span>
                    <button
                      onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                      className="text-surface-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <button
              onClick={() => setProjects([...projects, { name: '', description: '', role_in_project: '', technologies: [], key_achievements: '', start_date: '', end_date: '' }])}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>

            {projects.length === 0 ? (
              <div className="empty-state py-12">
                <Briefcase className="w-10 h-10 text-surface-300 mb-3" />
                <p className="text-surface-500">No projects added yet.</p>
              </div>
            ) : (
              projects.map((project, i) => (
                <div key={i} className="border border-surface-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-surface-900">Project {i + 1}</h4>
                    <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-surface-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Project Name</label>
                      <input className="input-field" placeholder="Project name" value={project.name} onChange={(e) => { const p = [...projects]; p[i].name = e.target.value; setProjects(p); }} />
                    </div>
                    <div>
                      <label className="label">Your Role</label>
                      <input className="input-field" placeholder="e.g., Lead Developer" value={project.role_in_project} onChange={(e) => { const p = [...projects]; p[i].role_in_project = e.target.value; setProjects(p); }} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description</label>
                      <textarea className="input-field" placeholder="What did you build? What was the outcome?" value={project.description} onChange={(e) => { const p = [...projects]; p[i].description = e.target.value; setProjects(p); }} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Technologies (comma-separated)</label>
                      <input className="input-field" placeholder="e.g., Python, React, AWS" value={Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies} onChange={(e) => { const p = [...projects]; p[i].technologies = e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean); setProjects(p); }} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Key Achievements</label>
                      <textarea className="input-field" placeholder="Notable results or impact" value={project.key_achievements} onChange={(e) => { const p = [...projects]; p[i].key_achievements = e.target.value; setProjects(p); }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            <button
              onClick={() => setExperience([...experience, { company: '', title: '', description: '', start_date: '', end_date: '', is_current: false, technologies: [] }])}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Add Experience
            </button>

            {experience.length === 0 ? (
              <div className="empty-state py-12">
                <GraduationCap className="w-10 h-10 text-surface-300 mb-3" />
                <p className="text-surface-500">No experience added yet.</p>
              </div>
            ) : (
              experience.map((exp, i) => (
                <div key={i} className="border border-surface-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-surface-900">Experience {i + 1}</h4>
                    <button onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="text-surface-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Company</label>
                      <input className="input-field" placeholder="Company name" value={exp.company} onChange={(e) => { const x = [...experience]; x[i].company = e.target.value; setExperience(x); }} />
                    </div>
                    <div>
                      <label className="label">Title</label>
                      <input className="input-field" placeholder="Job title" value={exp.title} onChange={(e) => { const x = [...experience]; x[i].title = e.target.value; setExperience(x); }} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description</label>
                      <textarea className="input-field" placeholder="Responsibilities and achievements" value={exp.description} onChange={(e) => { const x = [...experience]; x[i].description = e.target.value; setExperience(x); }} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Technologies (comma-separated)</label>
                      <input className="input-field" placeholder="e.g., Java, Spring, AWS" value={Array.isArray(exp.technologies) ? exp.technologies.join(', ') : exp.technologies} onChange={(e) => { const x = [...experience]; x[i].technologies = e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean); setExperience(x); }} />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={exp.is_current} onChange={(e) => { const x = [...experience]; x[i].is_current = e.target.checked; setExperience(x); }} className="rounded border-surface-300" />
                        <span className="text-sm text-surface-700">Currently working here</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <button
              onClick={() => setCertifications([...certifications, { name: '', issuer: '', date_obtained: '', credential_id: '' }])}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Add Certification
            </button>

            {certifications.length === 0 ? (
              <div className="empty-state py-12">
                <Award className="w-10 h-10 text-surface-300 mb-3" />
                <p className="text-surface-500">No certifications added yet.</p>
              </div>
            ) : (
              certifications.map((cert, i) => (
                <div key={i} className="border border-surface-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-surface-900">Certification {i + 1}</h4>
                    <button onClick={() => setCertifications(certifications.filter((_, j) => j !== i))} className="text-surface-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Certification Name</label>
                      <input className="input-field" placeholder="e.g., AWS Solutions Architect" value={cert.name} onChange={(e) => { const c = [...certifications]; c[i].name = e.target.value; setCertifications(c); }} />
                    </div>
                    <div>
                      <label className="label">Issuer</label>
                      <input className="input-field" placeholder="e.g., Amazon Web Services" value={cert.issuer} onChange={(e) => { const c = [...certifications]; c[i].issuer = e.target.value; setCertifications(c); }} />
                    </div>
                    <div>
                      <label className="label">Date Obtained</label>
                      <input type="date" className="input-field" value={cert.date_obtained} onChange={(e) => { const c = [...certifications]; c[i].date_obtained = e.target.value; setCertifications(c); }} />
                    </div>
                    <div>
                      <label className="label">Credential ID</label>
                      <input className="input-field" placeholder="Optional" value={cert.credential_id} onChange={(e) => { const c = [...certifications]; c[i].credential_id = e.target.value; setCertifications(c); }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="space-y-4">
            <button
              onClick={() => setLearningActivities([...learningActivities, { title: '', provider: '', type: 'course', status: 'completed', skills_learned: [], completion_date: '' }])}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Add Learning Activity
            </button>

            {learningActivities.length === 0 ? (
              <div className="empty-state py-12">
                <BookOpen className="w-10 h-10 text-surface-300 mb-3" />
                <p className="text-surface-500">No learning activities added yet.</p>
              </div>
            ) : (
              learningActivities.map((la, i) => (
                <div key={i} className="border border-surface-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-surface-900">Learning Activity {i + 1}</h4>
                    <button onClick={() => setLearningActivities(learningActivities.filter((_, j) => j !== i))} className="text-surface-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Title</label>
                      <input className="input-field" placeholder="e.g., Machine Learning Specialization" value={la.title} onChange={(e) => { const l = [...learningActivities]; l[i].title = e.target.value; setLearningActivities(l); }} />
                    </div>
                    <div>
                      <label className="label">Provider</label>
                      <input className="input-field" placeholder="e.g., Coursera, Udemy" value={la.provider} onChange={(e) => { const l = [...learningActivities]; l[i].provider = e.target.value; setLearningActivities(l); }} />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select className="input-field" value={la.type} onChange={(e) => { const l = [...learningActivities]; l[i].type = e.target.value; setLearningActivities(l); }}>
                        <option value="course">Course</option>
                        <option value="workshop">Workshop</option>
                        <option value="bootcamp">Bootcamp</option>
                        <option value="self_study">Self Study</option>
                        <option value="conference">Conference</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="input-field" value={la.status} onChange={(e) => { const l = [...learningActivities]; l[i].status = e.target.value; setLearningActivities(l); }}>
                        <option value="completed">Completed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="planned">Planned</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Skills Learned (comma-separated)</label>
                      <input className="input-field" placeholder="e.g., TensorFlow, Neural Networks, Deep Learning" value={Array.isArray(la.skills_learned) ? la.skills_learned.join(', ') : la.skills_learned} onChange={(e) => { const l = [...learningActivities]; l[i].skills_learned = e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean); setLearningActivities(l); }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'resume' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors">
              <Upload className="w-10 h-10 text-surface-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-surface-700 mb-2">Upload your resume for AI-powered extraction</p>
              <p className="text-xs text-surface-400 mb-4">Supports PDF and TXT files</p>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="block mx-auto text-sm text-surface-500"
              />
              {resumeFile && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="text-sm text-surface-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {resumeFile.name}
                  </span>
                  <button onClick={handleResumeUpload} disabled={resumeParsing} className="btn-primary">
                    {resumeParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {resumeParsing ? 'Parsing...' : 'Parse Resume'}
                  </button>
                </div>
              )}
            </div>

            {resumeData && (
              <div className="card p-6 border-primary-200 bg-primary-50/30">
                <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-primary-600" />
                  Extracted Information — Review Before Applying
                </h3>
                <div className="space-y-3 text-sm">
                  {resumeData.headline && <p><strong>Headline:</strong> {resumeData.headline}</p>}
                  {(resumeData.job_title || resumeData.current_role) && <p><strong>Role:</strong> {resumeData.job_title || resumeData.current_role}</p>}
                  {resumeData.summary && <p><strong>Summary:</strong> {resumeData.summary}</p>}
                  {resumeData.skills?.length > 0 && (
                    <div>
                      <strong>Skills:</strong>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {resumeData.skills.map((s: string, i: number) => (
                          <span key={i} className="badge-primary">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeData.experience?.length > 0 && (
                    <div>
                      <strong>Experience:</strong>
                      {resumeData.experience.map((exp: any, i: number) => (
                        <p key={i} className="ml-4">• {exp.title} at {exp.company}</p>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={applyResumeData} className="btn-primary mt-4">
                  Apply to Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
