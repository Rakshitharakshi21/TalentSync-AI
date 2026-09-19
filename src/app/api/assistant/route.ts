import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const { message, employeeId, conversationHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Build context from employee data if available
    let context = '';
    if (employeeId) {
      const [profileRes, skillsRes, projectsRes, expRes, certRes, learnRes, insightsRes] = await Promise.all([
        supabase.from('employee_profiles').select('*, profiles!inner(full_name, email)').eq('id', employeeId).single(),
        supabase.from('skills').select('*').eq('employee_id', employeeId),
        supabase.from('projects').select('*').eq('employee_id', employeeId),
        supabase.from('experience').select('*').eq('employee_id', employeeId),
        supabase.from('certifications').select('*').eq('employee_id', employeeId),
        supabase.from('learning_activities').select('*').eq('employee_id', employeeId),
        supabase.from('ai_insights').select('*').eq('employee_id', employeeId),
      ]);

      const profile = profileRes.data;
      const skills = skillsRes.data || [];
      const projects = projectsRes.data || [];
      const experience = expRes.data || [];
      const certifications = certRes.data || [];
      const learning = learnRes.data || [];
      const insights = insightsRes.data || [];

      const talentDna = insights.find((i: any) => i.type === 'talent_dna');
      const hiddenCaps = insights.find((i: any) => i.type === 'hidden_capabilities');
      const skillAdj = insights.find((i: any) => i.type === 'skill_adjacency');
      const roadmap = insights.find((i: any) => i.type === 'career_roadmap');

      context = `
EMPLOYEE CONTEXT:
Name: ${profile?.profiles?.full_name}
Current Role: ${profile?.job_title || profile?.current_role || 'Not specified'}
Department: ${profile?.department}
Experience: ${profile?.years_experience} years
Summary: ${profile?.summary}

Skills: ${skills.map((s: any) => `${s.name} (${s.proficiency})`).join(', ')}

Projects: ${projects.map((p: any) => `${p.name}: ${p.description} [${p.technologies?.join(', ')}]`).join('\n')}

Work Experience: ${experience.map((e: any) => `${e.title} at ${e.company}: ${e.description}`).join('\n')}

Certifications: ${certifications.map((c: any) => `${c.name} by ${c.issuer}`).join(', ')}

Learning: ${learning.map((l: any) => `${l.title} (${l.provider}) - ${l.status}`).join('\n')}

${talentDna ? `TALENT DNA: ${JSON.stringify(talentDna.data)}` : ''}
${hiddenCaps ? `HIDDEN CAPABILITIES: ${JSON.stringify(hiddenCaps.data)}` : ''}
${skillAdj ? `SKILL ADJACENCY: ${JSON.stringify(skillAdj.data)}` : ''}
${roadmap ? `CAREER ROADMAP: ${JSON.stringify(roadmap.data)}` : ''}
`.trim();
    }

    // Also fetch available opportunities
    const { data: opportunities } = await supabase.from('opportunities').select('*').eq('status', 'open');

    const messages = [
      {
        role: 'system' as const,
        content: `You are TalentSync AI Career Assistant - a context-aware career intelligence assistant.

You have access to the employee's complete profile, AI-generated insights (Talent DNA, Hidden Capabilities, Skill Adjacency, Career Roadmap), and available internal opportunities.

GUIDELINES:
- Use the employee's ACTUAL data to give specific, personalized advice
- Reference specific skills, projects, and experiences
- When discussing hidden capabilities, explain the evidence
- When recommending roles, connect them to actual capabilities
- Be direct and actionable
- Do NOT give generic career advice when specific data is available
- Format responses with clear structure using markdown

${context ? `\n${context}` : '\nNo employee context available. Provide general career guidance.'}

${opportunities?.length ? `\nAVAILABLE INTERNAL OPPORTUNITIES:\n${opportunities.map((o: any) => `- ${o.title} (${o.type}): ${o.description} | Required: ${o.required_skills?.join(', ')}`).join('\n')}` : ''}
`
      },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await callAI(messages, { temperature: 0.5, maxTokens: 2048 });

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Assistant error:', error);
    return NextResponse.json(
      { error: error.message || 'Assistant failed' },
      { status: 500 }
    );
  }
}
