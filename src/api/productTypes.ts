import { apiClient } from './client';
import {
  ProductType,
  CreateProductTypeRequest,
  UpdateProductTypeRequest,
  FindProductTypesRequest,
  CreateProductTypeResponse,
  PaginatedResponse
} from '../types/api';

export const productTypesApi = {
  // Get all product types with pagination and filters
  find: async (params: FindProductTypesRequest = {}): Promise<PaginatedResponse<ProductType>> => {
    const response = await apiClient.get('/product-types', { params });
    return response.data;
  },

  // Get a single product type by ID
  get: async (id: number): Promise<ProductType> => {
    const response = await apiClient.get(`/product-types/${id}`);
    return response.data;
  },

  // Create a new product type
  create: async (data: CreateProductTypeRequest): Promise<CreateProductTypeResponse> => {
    const response = await apiClient.post('/product-types', data);
    return response.data;
  },

  // Update an existing product type
  update: async (id: number, data: UpdateProductTypeRequest): Promise<void> => {
    await apiClient.put(`/product-types/${id}`, data);
  },

  // Delete a product type
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/product-types/${id}`);
  }
}; 