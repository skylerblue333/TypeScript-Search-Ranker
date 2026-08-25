import express from 'express';
import { z } from 'zod';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '512kb' }));

const MAX_DOCUMENTS = 500;
const MAX_TEXT_LENGTH = 20_000;
const MAX_QUERY_LENGTH = 256;

const documentSchema = z.object({
  id: z.string().trim().min(1).max(128),
  text: z.string().max(MAX_TEXT_LENGTH),
}).strict();

const searchSchema = z.object({
  query: z.string().trim().min(1).max(MAX_QUERY_LENGTH),
  documents: z.array(documentSchema).max(MAX_DOCUMENTS),
  limit: z.number().int().min(1).max(100).default(20),
}).strict();

export type SearchDocument = z.infer<typeof documentSchema>;

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase('en-US')
    .split(/[^\p{L}\p{N}_-]+/u)
    .map((term) => term.trim())
    .filter(Boolean);
}

export function score(query: string, text: string): number {
  const queryTerms = tokenize(query);
  const words = tokenize(text);
  if (queryTerms.length === 0 || words.length === 0) return 0;

  const frequencies = new Map<string, number>();
  for (const word of words) frequencies.set(word, (frequencies.get(word) ?? 0) + 1);

  const uniqueQueryTerms = [...new Set(queryTerms)];
  const matches = uniqueQueryTerms.reduce((total, term) => total + (frequencies.get(term) ?? 0), 0);
  const coverage = uniqueQueryTerms.filter((term) => frequencies.has(term)).length / uniqueQueryTerms.length;
  const lengthPenalty = 1 / Math.sqrt(Math.max(words.length, 1));
  return Number((matches * 0.7 + coverage * 3 + lengthPenalty).toFixed(6));
}

export function rank(query: string, documents: SearchDocument[], limit: number) {
  return documents
    .map((document, index) => ({
      id: document.id,
      text: document.text,
      score: score(query, document.text),
      index,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index || left.id.localeCompare(right.id))
    .slice(0, limit)
    .map(({ index: _index, ...result }) => result);
}

app.post('/api/v1/rank', (req, res) => {
  const parsed = searchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_SEARCH_REQUEST', details: parsed.error.flatten() });
    return;
  }

  const { query, documents, limit } = parsed.data;
  res.json({
    query,
    total_documents: documents.length,
    returned: Math.min(limit, documents.length),
    results: rank(query, documents, limit),
  });
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'sky-search-ranker' });
});

app.get('/readyz', (_req, res) => {
  res.json({ status: 'ready', max_documents: MAX_DOCUMENTS, max_results: 100 });
});

app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: 'INVALID_REQUEST_BODY' });
});

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT ?? '8080', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ event: 'server_started', service: 'sky-search-ranker', port })));
}

export default app;
