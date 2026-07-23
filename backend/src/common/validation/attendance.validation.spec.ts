import { dateRangeQuerySchema, getListSchema } from './attendance.validation';

describe('attendance date validation', () => {
  it('accepts ISO date strings without coercing them to Date objects', () => {
    const result = dateRangeQuerySchema.validate({ from: '2026-07-23', to: '2026-07-24' });

    expect(result.error).toBeUndefined();
    expect(typeof result.value.from).toBe('string');
    expect(typeof result.value.to).toBe('string');
    expect(result.value.from).toBe('2026-07-23');
    expect(result.value.to).toBe('2026-07-24');
  });

  it('accepts ISO 8601 datetime strings and normalizes them to date-only values', () => {
    const result = getListSchema.validate({ from: '2026-07-23T00:00:00.000Z', to: '2026-07-24T00:00:00.000Z' });

    expect(result.error).toBeUndefined();
    expect(result.value.from).toBe('2026-07-23');
    expect(result.value.to).toBe('2026-07-24');
  });
});
