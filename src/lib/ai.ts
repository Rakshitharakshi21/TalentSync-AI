// Server-side only AI utility for OpenRouter calls

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callAI(
  messages: AIMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://talentsync-ai.app',
      'X-Title': 'TalentSync AI',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export function parseAIJSON<T>(response: string): T {
  // Try to extract JSON from the response
  let cleaned = response.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find JSON in the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}
