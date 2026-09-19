import { NextRequest, NextResponse } from 'next/server';
import { callAI, parseAIJSON } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const { employeeId, targetRole } = await req.json();

    if (!employeeId || !targetRole) {
      return NextResponse.json({ error: 'Employee ID and target role required' }, { status: 400 });
    }

    const [profileRes, skillsRes, projectsRes, expRes, certRes, learnRes] = await Promise.all([
      supabase.from('employee_profiles').select('*, profiles!inner(full_name)').eq('id', employeeId).single(),
      supabase.from('skills').select('*').eq('employee_id', employeeId),
      supabase.from('projects').select('*').eq('employee_id', employeeId),
      supabase.from('experience').select('*').eq('employee_id', employeeId),
      supabase.from('certifications').select('*').eq('employee_id', employeeId),
      supabase.from('learning_activities').select('*').eq('employee_id', employeeId),
    ]);

    const profile = profileRes.data;
    const skills = skillsRes.data || [];

    const context = `
Employee: ${profile?.profiles?.full_name}
Current Role: ${profile?.job_title || profile?.current_role || 'Not specified'}
Skills: ${skills.map((s: any) => `${s.name} (${s.proficiency})`).join(', ')}
Projects: ${(projectsRes.data || []).map((p: any) => `${p.name} [${p.technologies?.join(', ')}]`).join('; ')}
Experience: ${(expRes.data || []).map((e: any) => `${e.title} at ${e.company}`).join('; ')}
Certifications: ${(certRes.data || []).map((c: any) => c.name).join(', ')}
Learning: ${(learnRes.data || []).map((l: any) => `${l.title} (${l.status})`).join(', ')}
`.trim();

    const response = await callAI([
      {
        role: 'system',
        content: 'You are a skill gap analyst. Perform detailed gap analysis between an employee\'s current capabilities and a target role.'
      },
      {
        role: 'user',
        content: `Perform a skill gap analysis for this employee targeting the role: "${targetRole}"

Return JSON:
{
  "target_role": "${targetRole}",
  "already_have": [{"skill": "skill name", "evidence": "specific evidence from their profile"}],
  "partially_developed": [{"skill": "skill name", "current_level": "where they are", "needed_level": "where they need to be"}],
  "need_to_develop": [{"skill": "skill name", "priority": "high|medium|low", "recommendations": ["specific courses, projects, or activities"]}],
  "overall_readiness": "ready_now" | "near_ready" | "development_needed",
  "estimated_timeline": "estimated time to become ready",
  "recommended_path": "brief description of recommended development path"
}

${context}`
      }
    ], { jsonMode: true });

    const analysis = parseAIJSON(response);
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Skill gap error:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
