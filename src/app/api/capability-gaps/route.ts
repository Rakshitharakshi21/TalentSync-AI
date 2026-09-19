import { NextRequest, NextResponse } from 'next/server';
import { callAI, parseAIJSON } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const { targetCapability } = await req.json();

    if (!targetCapability) {
      return NextResponse.json({ error: 'Target capability required' }, { status: 400 });
    }

    // Fetch all employees with their data
    const { data: employees } = await supabase
      .from('employee_profiles')
      .select('*, profiles!inner(full_name)');

    if (!employees?.length) {
      return NextResponse.json({
        target: targetCapability,
        summary: 'No employee data available for gap analysis.',
        required_capabilities: [],
        recommendations: ['Add employee profiles to enable capability gap analysis.'],
      });
    }

    // Build context from all employees
    const employeeContexts = [];
    for (const emp of employees) {
      const [skillsRes, projectsRes, insightsRes] = await Promise.all([
        supabase.from('skills').select('*').eq('employee_id', emp.id),
        supabase.from('projects').select('*').eq('employee_id', emp.id),
        supabase.from('ai_insights').select('*').eq('employee_id', emp.id),
      ]);

      employeeContexts.push({
        name: emp.profiles?.full_name,
        role: emp.job_title || emp.current_role,
        skills: (skillsRes.data || []).map((s: any) => s.name),
        projects: (projectsRes.data || []).map((p: any) => `${p.name} [${p.technologies?.join(', ')}]`),
        hiddenCapabilities: insightsRes.data
          ?.find((i: any) => i.type === 'hidden_capabilities')
          ?.data?.capabilities?.map((c: any) => c.capability) || [],
      });
    }

    const response = await callAI([
      {
        role: 'system',
        content: 'You are an organizational capability analyst. Identify capability gaps relative to a target role or capability area.'
      },
      {
        role: 'user',
        content: `Analyze the organizational capability gap for: "${targetCapability}"

Current workforce:
${employeeContexts.map(e => `
${e.name} (${e.role})
Skills: ${e.skills.join(', ')}
Projects: ${e.projects.join('; ')}
Hidden Capabilities: ${e.hiddenCapabilities.join(', ')}
`).join('\n---\n')}

Return JSON:
{
  "target": "${targetCapability}",
  "summary": "summary of organizational readiness",
  "required_capabilities": [
    {"capability": "name", "status": "present|partial|missing", "employees_with": number}
  ],
  "ready_employees": [{"name": "employee name", "reason": "why they're ready"}],
  "near_ready_employees": [{"name": "employee name", "reason": "why near ready", "development_needed": "what they need"}],
  "recommendations": ["strategic recommendations for closing gaps"]
}

Only reference ACTUAL employees from the data. Do not fabricate.`
      }
    ], { jsonMode: true });

    const analysis = parseAIJSON(response);
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Capability gap error:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
