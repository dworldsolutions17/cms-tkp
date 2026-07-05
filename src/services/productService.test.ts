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

import { productService } from './productService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('productService', () => {
  describe('getAll', () => {
    it('should fetch products with default params', async () => {
      mockGet.mockResolvedValue({ data: { data: [{ id: 1, name: 'Toy' }], meta: { total: 1 } } });
      const result = await productService.getAll({ page: 1, limit: 10 });
      expect(mockGet).toHaveBeenCalledWith('/products', { params: { page: 1, limit: 10 } });
      expect(result).toHaveProperty('data');
    });

    it('should pass search param', async () => {
      mockGet.mockResolvedValue({ data: { data: [], meta: { total: 0 } } });
      await productService.getAll({ page: 1, limit: 10, search: 'toy' });
      expect(mockGet).toHaveBeenCalledWith('/products', { params: { page: 1, limit: 10, search: 'toy' } });
    });
  });

  describe('getById', () => {
    it('should fetch product by id', async () => {
      mockGet.mockResolvedValue({ data: { id: 1, name: 'Toy', price: 999 } });
      const result = await productService.getById(1);
      expect(mockGet).toHaveBeenCalledWith('/products/1');
      expect(result.name).toBe('Toy');
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      mockPost.mockResolvedValue({ data: { id: 2, name: 'New Toy' } });
      const result = await productService.create({ name: 'New Toy', price: 500 } as any);
      expect(mockPost).toHaveBeenCalledWith('/products', { name: 'New Toy', price: 500 });
      expect(result.name).toBe('New Toy');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      mockPut.mockResolvedValue({ data: { id: 1, name: 'Updated' } });
      const result = await productService.update(1, { name: 'Updated' });
      expect(mockPut).toHaveBeenCalledWith('/products/1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockDelete.mockResolvedValue({ data: { success: true } });
      const result = await productService.delete(1);
      expect(mockDelete).toHaveBeenCalledWith('/products/1');
      expect(result.success).toBe(true);
    });
  });
});
