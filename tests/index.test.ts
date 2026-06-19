import request from 'supertest';
import app from '../src/index';

describe('TypeScript-Search-Ranker', () => {
  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/v1/rank', async () => {
    const res = await request(app).post('/api/v1/rank').send({
      query: 'golang performance',
      documents: [
        { id: '1', text: 'golang is fast and has great performance' },
        { id: '2', text: 'python is easy to use' }
      ]
    });
    expect(res.status).toBe(200);
    expect(res.body.results[0].id).toBe('1');
  });

});
