import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('math works correctly', () => {
    expect(2 + 2).toBe(4);
  });

  it('strings concatenate correctly', () => {
    expect('Hello' + ' World').toBe('Hello World');
  });

  it('arrays have correct length', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
  });
});