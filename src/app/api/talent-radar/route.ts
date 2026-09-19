import { NextRequest, NextResponse } from 'next/server';
import { callAI, parseAIJSON } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Fetch all employees with their data
    const { data: employees } = await supabase
      .from('employee_profiles')
      .select('*, profiles!inner(full_name, email)');

    if (!employees?.length) {
      return NextResponse.json({ results: [] });
    }

    // For each employee, gather their full context
    const employeeContexts: any[] = [];
    for (const emp of employees) {
      const [skillsRes, projectsRes, expRes, certRes, learnRes, insightsRes] = await Promise.all([
        supabase.from('skills').select('*').eq('employee_id', emp.id),
        supabase.from('projects').select('*').eq('employee_id', emp.id),
        supabase.from('experience').select('*').eq('employee_id', emp.id),
        supabase.from('certifications').select('*').eq('employee_id', emp.id),
        supabase.from('learning_activities').select('*').eq('employee_id', emp.id),
        supabase.from('ai_insights').select('*').eq('employee_id', emp.id),
      ]);

      employeeContexts.push({
        employee: emp,
        skills: skillsRes.data || [],
        projects: projectsRes.data || [],
        experience: expRes.data || [],
        certifications: certRes.data || [],
        learning: learnRes.data || [],
        insights: insightsRes.data || [],
      });
    }

    // Use AI to find matching talent
    const employeesSummary = employeeContexts.map((ctx) => `
Employee: ${ctx.employee.profiles?.full_name}
Current Role: ${ctx.employee.job_title || ctx.employee.current_role || 'Not specified'}
Department: ${ctx.employee.department}
Skills: ${ctx.skills.map((s: any) => s.name).join(', ')}
Projects: ${ctx.projects.map((p: any) => `${p.name} [${p.technologies?.join(', ')}]`).join('; ')}
Experience: ${ctx.experience.map((e: any) => `${e.title} at ${e.company}`).join('; ')}
Certifications: ${ctx.certifications.map((c: any) => c.name).join(', ')}
Learning: ${ctx.learning.map((l: any) => l.title).join(', ')}
${ctx.insights.find((i: any) => i.type === 'hidden_capabilities') ?
  `Hidden Capabilities: ${JSON.stringify(ctx.insights.find((i: any) => i.type === 'hidden_capabilities')?.data?.capabilities?.map((c: any) => c.capability))}` : ''}
`).join('\n---\n');

    const response = await callAI([
      {
        role: 'system',
        content: 'You are a talent radar system. Find employees who match a capability search, especially those with HIDDEN capabilities relevant to the search. Focus on discovering talent that their current job title does not reveal.'
      },
      {
        role: 'user',
        content: `Search query: "${query}"

Find employees who match this query based on their skills, projects, experience, learning, AND hidden capabilities.
Prioritize discovering talent whose current title does NOT obviously match but whose actual capabilities do.

Available employees:
${employeesSummary}

Return JSON:
{
  "results": [
    {
      "employee_name": "name",
      "current_role": "their current role",
      "capabilities": [
        {
          "capability": "relevant capability",
          "confidence": "high" | "medium" | "low",
          "evidence": ["specific evidence"],
          "potential_roles": ["roles they could fill"],
          "description": "why this person matches"
        }
      ]
    }
  ]
}

Only include employees with actual relevant evidence. Do not fabricate matches.`
      }
    ], { jsonMode: true });

    const parsed = parseAIJSON<any>(response);

    // Enrich results with employee IDs
    const enrichedResults = (parsed.results || []).map((r: any) => {
      const emp = employeeContexts.find(
        (ctx) => ctx.employee.profiles?.full_name === r.employee_name
      );
      return {
        employee: emp?.employee ? {
          ...emp.employee,
          profiles: emp.employee.profiles,
        } : null,
        capabilities: r.capabilities,
      };
    }).filter((r: any) => r.employee);

    return NextResponse.json({ results: enrichedResults });
  } catch (error: any) {
    console.error('Talent radar error:', error);
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
