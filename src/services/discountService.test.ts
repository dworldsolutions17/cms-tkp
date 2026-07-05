import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./api', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

import { discountService } from './discountService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('discountService', () => {
  it('should fetch all discounts', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 1, code: 'SAVE10' }], meta: { total: 1 } } });
    const result = await discountService.getAll({ page: 1, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/discounts', { params: { page: 1, limit: 10 } });
    expect(result).toHaveProperty('data');
  });

  it('should find discount by code', async () => {
    mockGet.mockResolvedValue({ data: { id: 1, code: 'SAVE10', type: 'percentage', value: 10 } });
    const result = await discountService.getByCode('SAVE10');
    expect(mockGet).toHaveBeenCalledWith('/discounts/code/SAVE10');
    expect(result.code).toBe('SAVE10');
  });

  it('should create a discount', async () => {
    mockPost.mockResolvedValue({ data: { id: 1, code: 'NEW20' } });
    const result = await discountService.create({ code: 'NEW20', type: 'percentage', value: 20 } as any);
    expect(mockPost).toHaveBeenCalledWith('/discounts', expect.any(Object));
    expect(result.code).toBe('NEW20');
  });

  it('should update a discount', async () => {
    mockPut.mockResolvedValue({ data: { id: 1, code: 'SAVE10', value: 15 } });
    const result = await discountService.update(1, { value: 15 });
    expect(mockPut).toHaveBeenCalledWith('/discounts/1', { value: 15 });
    expect(result.value).toBe(15);
  });

  it('should delete a discount', async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });
    const result = await discountService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/discounts/1');
    expect(result.success).toBe(true);
  });
});
