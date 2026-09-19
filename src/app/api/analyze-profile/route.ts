import { NextRequest, NextResponse } from 'next/server';
import { callAI, parseAIJSON } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    // Fetch all employee data
    const [profileRes, skillsRes, projectsRes, expRes, certRes, learnRes] = await Promise.all([
      supabase.from('employee_profiles').select('*, profiles!inner(full_name, email)').eq('id', employeeId).single(),
      supabase.from('skills').select('*').eq('employee_id', employeeId),
      supabase.from('projects').select('*').eq('employee_id', employeeId),
      supabase.from('experience').select('*').eq('employee_id', employeeId),
      supabase.from('certifications').select('*').eq('employee_id', employeeId),
      supabase.from('learning_activities').select('*').eq('employee_id', employeeId),
    ]);

    const profile = profileRes.data;
    const skills = skillsRes.data || [];
    const projects = projectsRes.data || [];
    const experience = expRes.data || [];
    const certifications = certRes.data || [];
    const learning = learnRes.data || [];

    if (!profile) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build context
    const context = `
Employee: ${profile.profiles?.full_name}
Current Role: ${profile.job_title || profile.current_role || 'Not specified'}
Department: ${profile.department}
Experience: ${profile.years_experience} years
Summary: ${profile.summary}

Skills: ${skills.map(s => `${s.name} (${s.proficiency})`).join(', ')}

Projects: ${projects.map(p => `${p.name}: ${p.description} [Technologies: ${p.technologies?.join(', ')}] [Role: ${p.role_in_project}] [Achievements: ${p.key_achievements}]`).join('\n')}

Work Experience: ${experience.map(e => `${e.title} at ${e.company}: ${e.description} [Technologies: ${e.technologies?.join(', ')}]`).join('\n')}

Certifications: ${certifications.map(c => `${c.name} by ${c.issuer}`).join(', ')}

Learning Activities: ${learning.map(l => `${l.title} (${l.provider}) - ${l.status} [Skills: ${l.skills_learned?.join(', ')}]`).join('\n')}
`.trim();

    // Run all analyses in parallel
    const [talentDnaRes, hiddenCapRes, skillAdjRes, careerRoadmapRes] = await Promise.all([
      // 1. Talent DNA
      callAI([
        {
          role: 'system',
          content: 'You are a talent intelligence analyst. Analyze employee capabilities and return structured JSON.'
        },
        {
          role: 'user',
          content: `Analyze this employee's capability profile and create their Talent DNA. Return JSON with:
{
  "dimensions": [
    {
      "name": "capability dimension name (e.g., AI/ML, Software Engineering, Data, Cloud, Leadership, etc.)",
      "level": number 0-100 based on evidence strength,
      "evidence": ["specific evidence items from their profile"],
      "description": "brief description of capability in this dimension"
    }
  ],
  "summary": "overall talent summary",
  "emerging_capabilities": ["capabilities that are starting to form based on recent activities"]
}

Only include dimensions where there is actual evidence. Do not fabricate capabilities.
Base levels on evidence strength: multiple projects/experience = high, some skills/learning = medium, minimal = low.

${context}`
        }
      ], { jsonMode: true }),

      // 2. Hidden Capabilities
      callAI([
        {
          role: 'system',
          content: 'You are a talent intelligence analyst specializing in discovering hidden capabilities from professional profiles. You identify capabilities that are NOT obvious from someone\'s current job title.'
        },
        {
          role: 'user',
          content: `Analyze this employee and discover HIDDEN capabilities - capabilities that are NOT obvious from their current job title "${profile.job_title || profile.current_role || 'their current role'}".

Look at the COMBINATION of their skills, projects, experience, learning, and certifications to infer capabilities that transcend their current title.

Return JSON:
{
  "capabilities": [
    {
      "capability": "hidden capability name",
      "confidence": "high" | "medium" | "low",
      "evidence": ["specific evidence items that support this inference"],
      "potential_roles": ["roles this capability could enable"],
      "description": "why this capability was inferred and how the evidence connects"
    }
  ]
}

Every capability MUST have specific evidence from their profile. Do NOT fabricate or assume capabilities without evidence.

${context}`
        }
      ], { jsonMode: true }),

      // 3. Skill Adjacency
      callAI([
        {
          role: 'system',
          content: 'You are a skill adjacency analyst. You understand how skills connect and what adjacent capabilities they enable.'
        },
        {
          role: 'user',
          content: `Analyze this employee's skills and identify adjacent capabilities and potential roles.

Skills are connected: Python + SQL + Pandas → Data Engineering; React + Node.js + APIs → Full Stack Engineering.

Return JSON:
{
  "current_skills": ["list of current skills"],
  "adjacent_capabilities": [
    {
      "capability": "adjacent capability name",
      "based_on": ["skills this is based on"],
      "description": "how these skills connect to this capability"
    }
  ],
  "potential_roles": [
    {
      "role": "potential role name",
      "readiness": "ready_now" | "near_ready" | "development_needed",
      "explanation": "why this role is achievable and what's needed"
    }
  ]
}

${context}`
        }
      ], { jsonMode: true }),

      // 4. Career Roadmap
      callAI([
        {
          role: 'system',
          content: 'You are a career development strategist. Create actionable career roadmaps based on actual employee capabilities.'
        },
        {
          role: 'user',
          content: `Create a personalized career roadmap for this employee based on their actual profile.

Return JSON:
{
  "current_state": {
    "role": "current role",
    "strengths": ["key strengths based on evidence"]
  },
  "now": {
    "title": "immediate focus area",
    "actions": ["specific actions to take now"],
    "skills_to_strengthen": ["skills to deepen"]
  },
  "next": {
    "title": "next career step",
    "actions": ["actions for next phase"],
    "skills_to_build": ["new skills to develop"],
    "timeline": "estimated timeline"
  },
  "then": {
    "title": "longer-term target",
    "target_role": "target role title",
    "requirements": ["what's needed for this role"],
    "timeline": "estimated timeline"
  }
}

Base everything on actual profile data. Do not give generic advice.

${context}`
        }
      ], { jsonMode: true }),
    ]);

    // Parse responses
    const talentDna = parseAIJSON(talentDnaRes);
    const hiddenCapabilities = parseAIJSON(hiddenCapRes);
    const skillAdjacency = parseAIJSON(skillAdjRes);
    const careerRoadmap = parseAIJSON(careerRoadmapRes);

    // Save/update insights in database
    const insightsToSave = [
      { type: 'talent_dna', data: talentDna },
      { type: 'hidden_capabilities', data: hiddenCapabilities },
      { type: 'skill_adjacency', data: skillAdjacency },
      { type: 'career_roadmap', data: careerRoadmap },
    ];

    for (const insight of insightsToSave) {
      // Check if exists
      const { data: existing } = await supabase
        .from('ai_insights')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('type', insight.type)
        .single();

      if (existing) {
        await supabase
          .from('ai_insights')
          .update({ data: insight.data, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ai_insights')
          .insert({ employee_id: employeeId, type: insight.type, data: insight.data });
      }
    }

    return NextResponse.json({
      success: true,
      talent_dna: talentDna,
      hidden_capabilities: hiddenCapabilities,
      skill_adjacency: skillAdjacency,
      career_roadmap: careerRoadmap,
    });
  } catch (error: any) {
    console.error('Profile analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
