import { describe, expect, it } from 'vitest';
import { isLocalRuntime } from '../runtimeEnvironment';

describe('runtimeEnvironment', () => {
  it.each([
    'localhost',
    'app.localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '192.168.0.10',
    '10.0.0.5',
    '172.16.0.5',
    '172.31.255.10',
  ])('identifica %s como ambiente local', (hostname) => {
    expect(isLocalRuntime(hostname)).toBe(true);
  });

  it.each(['agenda-front-wheat.vercel.app', 'agenda-front.onrender.com', 'example.com', '172.32.0.1'])(
    'identifica %s como ambiente publico',
    (hostname) => {
      expect(isLocalRuntime(hostname)).toBe(false);
    },
  );
});
