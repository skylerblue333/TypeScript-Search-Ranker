import express from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

// BM25-inspired search ranking engine for document retrieval

const searchSchema = z.object({
  query: z.string().min(1),
  documents: z.array(z.object({ id: z.string(), text: z.string() }))
});

function score(query: string, text: string): number {
  const terms = query.toLowerCase().split(' ');
  const words = text.toLowerCase().split(' ');
  return terms.reduce((acc, t) => acc + words.filter(w => w === t).length, 0);
}

app.post('/api/v1/rank', (req, res) => {
  try {
    const { query, documents } = searchSchema.parse(req.body);
    const ranked = documents
      .map(doc => ({ ...doc, score: score(query, doc.text) }))
      .sort((a, b) => b.score - a.score);
    res.json({ query, results: ranked });
  } catch (e) {
    res.status(400).json({ error: 'Invalid search request' });
  }
});


app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'TypeScript-Search-Ranker', version: '3.0.0' });
});

if (require.main === module) {
  app.listen(8080, () => console.log('TypeScript-Search-Ranker running on :8080'));
}

export default app;
