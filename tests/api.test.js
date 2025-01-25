// src/tests/api.test.js
const request = require('supertest');
const app = require('../src/server');

describe('Auth API', () => {
  let authToken;

  test('Should register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
        phone: '+1234567890',
        username: `testuser${Date.now()}`,
        type: 'tenant'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  test('Should login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });
});