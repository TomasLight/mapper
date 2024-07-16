import { test, expect, vi } from 'vitest';
import { MapFunction } from './Mapper';

class Class1 {}
class Class2 {}

test('constructor', () => {
  const fn = vi.fn();

  const result = new MapFunction(Class1, Class2, fn);

  expect(result.sourceKey).toBe(Class1);
  expect(result.destinationKey).toBe(Class2);
  expect(result.map).toBe(fn);
});
