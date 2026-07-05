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

import { categoryService } from './categoryService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('categoryService', () => {
  it('should fetch all categories', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 1, name: 'Toys', slug: 'toys' }] } });
    const result = await categoryService.getAll();
    expect(mockGet).toHaveBeenCalledWith('/categories');
    expect(result).toHaveProperty('data');
  });

  it('should fetch category by id', async () => {
    mockGet.mockResolvedValue({ data: { id: 1, name: 'Toys' } });
    const result = await categoryService.getById(1);
    expect(mockGet).toHaveBeenCalledWith('/categories/1');
    expect(result.name).toBe('Toys');
  });

  it('should create a category', async () => {
    mockPost.mockResolvedValue({ data: { id: 2, name: 'Baby Care' } });
    const result = await categoryService.create({ name: 'Baby Care' });
    expect(mockPost).toHaveBeenCalledWith('/categories', { name: 'Baby Care' });
    expect(result.name).toBe('Baby Care');
  });

  it('should update a category', async () => {
    mockPut.mockResolvedValue({ data: { id: 1, name: 'Updated Toys' } });
    const result = await categoryService.update(1, { name: 'Updated Toys' });
    expect(mockPut).toHaveBeenCalledWith('/categories/1', { name: 'Updated Toys' });
    expect(result.name).toBe('Updated Toys');
  });

  it('should delete a category', async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });
    const result = await categoryService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/categories/1');
    expect(result.success).toBe(true);
  });
});
