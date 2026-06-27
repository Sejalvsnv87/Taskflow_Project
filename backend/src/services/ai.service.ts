import { env } from '../config/env';

export interface EstimateSuggestion {
  estimatedEffort: string;
  suggestedDueDate: string;
  reasoning: string;
  isMock?: boolean;
}

export interface ParsedTask {
  title: string;
  description: string;
  priority: 'low' | 'med' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string | null;
  estimatedEffort: string | null;
}

const MOCK_ESTIMATE: EstimateSuggestion = {
  estimatedEffort: 'M (4-8 hours)',
  suggestedDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  reasoning: 'Based on typical task complexity, this appears to be a medium-effort task achievable within a few days.',
  isMock: true,
};

async function callGeminiJson<T>(prompt: string, schema: Record<string, unknown>): Promise<T> {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': env.geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      };
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const finishReason = data?.candidates?.[0]?.finishReason;

      if (!text) throw new Error('Empty response from Gemini');
      if (finishReason === 'MAX_TOKENS') {
        throw new Error('Response truncated by token limit');
      }

      return parseGeminiJson<T>(text);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error('Gemini request failed');
}

function parseGeminiJson<T>(text: string): T {
  const attempts = [
    text.trim(),
    text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(),
  ];

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // try next parse strategy
    }
  }

  throw new SyntaxError(`Invalid JSON from Gemini: ${text.slice(0, 120)}...`);
}

export async function suggestEstimate(title: string, description?: string): Promise<EstimateSuggestion> {
  if (!env.geminiApiKey) {
    return { ...MOCK_ESTIMATE, reasoning: 'AI unavailable (no API key configured). Showing sample estimate.' };
  }

  const prompt = `Analyze this task and suggest an effort estimate and due date.

Task Title: ${title}
Task Description: ${description || 'No description provided'}

Today's date is ${new Date().toISOString().split('T')[0]}. Keep reasoning to 1-2 sentences.`;

  try {
    const parsed = await callGeminiJson<{
      estimatedEffort: string;
      suggestedDueDate: string;
      reasoning: string;
    }>(prompt, {
      type: 'object',
      properties: {
        estimatedEffort: { type: 'string' },
        suggestedDueDate: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['estimatedEffort', 'suggestedDueDate', 'reasoning'],
    });

    return {
      estimatedEffort: parsed.estimatedEffort || MOCK_ESTIMATE.estimatedEffort,
      suggestedDueDate: parsed.suggestedDueDate || MOCK_ESTIMATE.suggestedDueDate,
      reasoning: parsed.reasoning || 'Estimate generated based on task analysis.',
    };
  } catch (error) {
    console.error('AI estimate failed:', error);
    return {
      ...MOCK_ESTIMATE,
      reasoning: 'AI service temporarily unavailable. Showing fallback estimate.',
      isMock: true,
    };
  }
}

export async function parseNaturalLanguageTask(input: string): Promise<ParsedTask> {
  const fallback: ParsedTask = {
    title: input.slice(0, 200),
    description: input,
    priority: 'med',
    status: 'todo',
    dueDate: null,
    estimatedEffort: null,
  };

  if (!env.geminiApiKey) {
    return fallback;
  }

  const prompt = `Parse this natural language task input into structured task data.

Input: "${input}"

Infer priority from urgency words. Parse dates like "tomorrow", "next Friday", "by end of month". Today is ${new Date().toISOString().split('T')[0]}.`;

  try {
    const parsed = await callGeminiJson<{
      title: string;
      description: string;
      priority: string;
      dueDate: string | null;
      estimatedEffort: string | null;
    }>(prompt, {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'med', 'high'] },
        dueDate: { type: 'string', nullable: true },
        estimatedEffort: { type: 'string', nullable: true },
      },
      required: ['title', 'description', 'priority'],
    });

    return {
      title: String(parsed.title || fallback.title).slice(0, 200),
      description: String(parsed.description || fallback.description),
      priority: ['low', 'med', 'high'].includes(parsed.priority)
        ? (parsed.priority as 'low' | 'med' | 'high')
        : 'med',
      status: 'todo',
      dueDate: parsed.dueDate || null,
      estimatedEffort: parsed.estimatedEffort || null,
    };
  } catch (error) {
    console.error('Natural language parse failed:', error);
    return fallback;
  }
}

export async function suggestSubtasks(title: string, description?: string): Promise<string[]> {
  if (!env.geminiApiKey) {
    return ['Research and plan', 'Implement core functionality', 'Test and review'];
  }

  const prompt = `Break this task into 3-5 actionable subtasks.

Task: ${title}
Description: ${description || 'No description'}`;

  try {
    const parsed = await callGeminiJson<{ subtasks: string[] }>(prompt, {
      type: 'object',
      properties: {
        subtasks: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['subtasks'],
    });

    if (Array.isArray(parsed.subtasks)) {
      return parsed.subtasks.map(String).slice(0, 5);
    }
    return ['Research and plan', 'Implement core functionality', 'Test and review'];
  } catch (error) {
    console.error('Subtask suggestion failed:', error);
    return ['Research and plan', 'Implement core functionality', 'Test and review'];
  }
}
