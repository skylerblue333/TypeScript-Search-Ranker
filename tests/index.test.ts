import request from 'supertest';
import app, { rank, score } from '../src/index';

describe('Sky Search Ranker', () => {
  it('reports health and readiness', async () => {
    expect((await request(app).get('/healthz')).body).toEqual({ status: 'ok', service: 'sky-search-ranker' });
    expect((await request(app).get('/readyz')).status).toBe(200);
  });

  it('ranks matching documents deterministically', async () => {
    const res = await request(app).post('/api/v1/rank').send({
      query: 'golang performance',
      limit: 2,
      documents: [
        { id: '1', text: 'golang is fast and has great performance performance' },
        { id: '2', text: 'python is easy to use' },
        { id: '3', text: 'golang services' },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.results.map((result: { id: string }) => result.id)).toEqual(['1', '3']);
    expect(res.body.returned).toBe(2);
  });

  it('preserves source order for exact score ties', () => {
    const results = rank('missing', [
      { id: 'z', text: 'alpha beta' },
      { id: 'a', text: 'gamma delta' },
    ], 2);
    expect(results.map((result) => result.id)).toEqual(['z', 'a']);
  });

  it('rejects oversized and malformed requests', async () => {
    const tooMany = Array.from({ length: 501 }, (_, index) => ({ id: String(index), text: 'x' }));
    expect((await request(app).post('/api/v1/rank').send({ query: 'x', documents: tooMany })).status).toBe(400);
    expect((await request(app).post('/api/v1/rank').send({ query: '', documents: [] })).status).toBe(400);
  });

  it('returns stable finite scores', () => {
    expect(score('alpha alpha', 'alpha beta alpha')).toBeGreaterThan(0);
    expect(Number.isFinite(score('x', ''))).toBe(true);
  });
});
