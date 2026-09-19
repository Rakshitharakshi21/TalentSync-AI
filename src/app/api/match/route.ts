import { NextRequest, NextResponse } from 'next/server';
import { callAI, parseAIJSON } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const { opportunityId, employeeIds } = await req.json();

    if (!opportunityId) {
      return NextResponse.json({ error: 'Opportunity ID required' }, { status: 400 });
    }

    // Fetch opportunity
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Fetch employees
    let query = supabase.from('employee_profiles').select('*, profiles!inner(full_name, email)');
    if (employeeIds?.length) {
      query = query.in('id', employeeIds);
    }
    const { data: employees } = await query;

    if (!employees?.length) {
      return NextResponse.json({ error: 'No employees found' }, { status: 404 });
    }

    // For each employee, get their skills and build context
    const matches = [];

    for (const emp of employees) {
      const [skillsRes, projectsRes, expRes, certRes, learnRes] = await Promise.all([
        supabase.from('skills').select('*').eq('employee_id', emp.id),
        supabase.from('projects').select('*').eq('employee_id', emp.id),
        supabase.from('experience').select('*').eq('employee_id', emp.id),
        supabase.from('certifications').select('*').eq('employee_id', emp.id),
        supabase.from('learning_activities').select('*').eq('employee_id', emp.id),
      ]);

      const empContext = `
Employee: ${emp.profiles?.full_name}
Current Role: ${emp.job_title || emp.current_role || 'Not specified'}
Department: ${emp.department}
Experience: ${emp.years_experience} years
Skills: ${(skillsRes.data || []).map((s: any) => `${s.name} (${s.proficiency})`).join(', ')}
Projects: ${(projectsRes.data || []).map((p: any) => `${p.name}: ${p.description} [${p.technologies?.join(', ')}]`).join('; ')}
Experience: ${(expRes.data || []).map((e: any) => `${e.title} at ${e.company}`).join('; ')}
Certifications: ${(certRes.data || []).map((c: any) => c.name).join(', ')}
Learning: ${(learnRes.data || []).map((l: any) => `${l.title} (${l.status})`).join(', ')}
`.trim();

      const matchResult = await callAI([
        {
          role: 'system',
          content: 'You are a talent matching analyst. Match employees to opportunities based on actual evidence. Return structured JSON.'
        },
        {
          role: 'user',
          content: `Match this employee against this opportunity. Be honest about alignment.

OPPORTUNITY:
Title: ${opportunity.title}
Description: ${opportunity.description}
Type: ${opportunity.type}
Department: ${opportunity.department}
Required Skills: ${opportunity.required_skills?.join(', ')}
Preferred Skills: ${opportunity.preferred_skills?.join(', ')}
Required Experience: ${opportunity.required_experience_years} years

EMPLOYEE:
${empContext}

Return JSON:
{
  "alignment": "strong" | "partial" | "development_needed",
  "similarity_score": number 0-100 (AI-generated similarity estimate),
  "matching_skills": ["skills they have that match requirements"],
  "missing_skills": ["required skills they are missing"],
  "explanation": "why this person fits or doesn't fit - be specific with evidence",
  "strengths": ["specific strengths relevant to this opportunity"],
  "gaps": ["specific capability gaps"],
  "recommendations": ["what would make them ready for this role"]
}`
        }
      ], { jsonMode: true });

      const parsed = parseAIJSON<any>(matchResult);

      // Save match to database
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('employee_id', emp.id)
        .eq('opportunity_id', opportunityId)
        .single();

      const matchData = {
        employee_id: emp.id,
        opportunity_id: opportunityId,
        alignment: parsed.alignment,
        similarity_score: parsed.similarity_score,
        matching_skills: parsed.matching_skills,
        missing_skills: parsed.missing_skills,
        explanation: parsed.explanation,
        recommendations: parsed.recommendations,
      };

      if (existingMatch) {
        await supabase.from('matches').update(matchData).eq('id', existingMatch.id);
      } else {
        await supabase.from('matches').insert(matchData);
      }

      matches.push({
        employee: {
          id: emp.id,
          name: emp.profiles?.full_name,
          job_title: emp.job_title || emp.current_role,
          current_role: emp.job_title || emp.current_role,
          department: emp.department,
        },
        ...parsed,
      });
    }

    // Sort: strong first, then partial, then development_needed
    const order = { strong: 0, partial: 1, development_needed: 2 };
    matches.sort((a, b) => (order[a.alignment as keyof typeof order] || 2) - (order[b.alignment as keyof typeof order] || 2));

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error('Matching error:', error);
    return NextResponse.json(
      { error: error.message || 'Matching failed' },
      { status: 500 }
    );
  }
}
