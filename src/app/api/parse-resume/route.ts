import { NextRequest, NextResponse } from 'next/server';
import { callAI, parseAIJSON } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file content as text
    const text = await file.text();

    if (!text.trim()) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }

    // Use AI to extract structured information from resume text
    const response = await callAI([
      {
        role: 'system',
        content: `You are a resume parser. Extract structured information from the resume text provided. Return valid JSON only.`
      },
      {
        role: 'user',
        content: `Parse this resume and extract structured information. Return a JSON object with these fields:
- headline: string (professional headline/title)
- job_title: string (most recent job title)
- current_role: string (most recent job title)
- summary: string (brief professional summary)
- skills: string[] (list of technical and professional skills)
- experience: array of {company: string, title: string, description: string, technologies: string[]}
- projects: array of {name: string, description: string, technologies: string[], role_in_project: string}
- certifications: array of {name: string, issuer: string}
- education: array of {institution: string, degree: string, field: string}

Resume text:
${text.slice(0, 8000)}`
      }
    ], { jsonMode: true, temperature: 0.1 });

    const parsed = parseAIJSON(response);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Resume parse error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume' },
      { status: 500 }
    );
  }
}
