import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { detectCrisisSignals } from './src/utils/safety.ts';
import { getSupportMode } from './src/utils/promptEngine.ts';
import { buildProjectZipBuffer } from './src/utils/projectZip.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary + fallback free-tier Gemini models for fast, reliable responses
const MODEL_CHAIN: Array<{ model: string; thinkingLevel: ThinkingLevel }> = [
  { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
];

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Copy .env.example to .env and add your Gemini API key.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractReadableError(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { error?: { message?: string } };
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Fall through to raw string
    }
  }
  return raw;
}

function isRetryableModelError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return /\b(503|500|429|UNAVAILABLE|RESOURCE_EXHAUSTED|NOT_FOUND|high demand|overloaded)\b/i.test(text);
}

function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const readable = extractReadableError(raw);
  if (raw.includes('GEMINI_API_KEY is not configured')) {
    return { status: 503, message: raw };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 403,
      message: 'The configured Gemini API key was rejected. Please verify GEMINI_API_KEY in your .env file.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Rate limit reached on the Gemini API. Please wait a moment and try again.',
    };
  }
  if (raw.includes('503') || raw.includes('UNAVAILABLE')) {
    return {
      status: 503,
      message: 'Gemini is temporarily busy. Please try sending your message again in a few seconds.',
    };
  }
  return {
    status: 500,
    message: readable || 'MindMate could not generate a reply right now.',
  };
}

interface IncomingTurn {
  role: 'user' | 'assistant';
  content: string;
}

async function generateMindMateReply(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction: string
): Promise<{ reply: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: unknown;

  for (const entry of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: entry.model,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: entry.thinkingLevel },
          },
        });
        const text = (response.text ?? '').trim();
        if (text) {
          return { reply: text, modelUsed: entry.model };
        }
        lastError = new Error('Model returned an empty response.');
      } catch (err) {
        lastError = err;
        if (!isRetryableModelError(err)) {
          throw err;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
    }
  }

  throw lastError ?? new Error('Unable to generate a response right now.');
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, models: MODEL_CHAIN.map((m) => m.model) });
  });

  app.get('/api/download-project', async (_req, res) => {
    try {
      const zipBuffer = await buildProjectZipBuffer(__dirname);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="mindmate-project.zip"');
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Unable to create project archive.',
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, modeId } = req.body as {
        messages?: IncomingTurn[];
        modeId?: string;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'At least one message is required.' });
        return;
      }

      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
      if (!lastUserMessage.trim()) {
        res.status(400).json({ error: 'Message content cannot be empty.' });
        return;
      }

      const safety = detectCrisisSignals(lastUserMessage);
      const mode = getSupportMode(modeId ?? 'empathetic');

      const contents = messages
        .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
        .slice(-14)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content.trim() }],
        }));

      const safetyAddendum =
        safety.level === 'crisis'
          ? '\n\nURGENT SAFETY DIRECTIVE: The user may be in acute distress or crisis. Respond with deep calm care, avoid clinical diagnosis, and clearly mention 988 (US/Canada), Crisis Text Line (text HOME to 741741), and findahelpline.com.'
          : safety.level === 'elevated'
            ? '\n\nDISTRESS AWARENESS: The user is expressing elevated stress or overwhelm. Prioritize calm validation before offering any small step.'
            : '';

      const { reply, modelUsed } = await generateMindMateReply(
        contents,
        `${mode.systemInstruction}${safetyAddendum}`
      );

      res.json({ reply, safety, modelUsed });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`MindMate server running at http://0.0.0.0:${port}`);
  });
}

createServer();
