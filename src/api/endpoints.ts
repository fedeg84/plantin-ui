import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  Product,
  FindProductsRequest,
  ProductTypeAttribute,
  CreatePaymentMethodRequest,
  CreatePaymentMethodResponse,
  UpdatePaymentMethodRequest,
  PaymentMethod,
  FindPaymentMethodsRequest,
  CreateSaleRequest,
  CreateSaleResponse,
  Sale,
  FindSalesRequest,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  FindUsersRequest,
  PaginatedResponse,
} from '../types/api';

// Auth endpoints
export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiClient.post('/auth/login', data).then(res => res.data),
};

// Product endpoints
export const productApi = {
  create: (data: CreateProductRequest): Promise<CreateProductResponse> =>
    apiClient.post('/products', data).then(res => res.data),
  
  find: (params: FindProductsRequest): Promise<PaginatedResponse<Product>> =>
    apiClient.get('/products', { params }).then(res => res.data),
    
  getById: (id: number): Promise<Product> =>
    apiClient.get(`/products/${id}`).then(res => res.data),
    
  update: (id: number, data: UpdateProductRequest): Promise<Product> =>
    apiClient.put(`/products/${id}`, data).then(res => res.data),
    
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/products/${id}`).then(res => res.data),
};

// Product Type endpoints
export const productTypeApi = {
  find: (params: any): Promise<PaginatedResponse<any>> =>
    apiClient.get('/product-types', { params }).then(res => res.data),
    
  getAttributes: (productTypeId: number, withParentAttributes: boolean = false): Promise<PaginatedResponse<ProductTypeAttribute>> =>
    apiClient.get(`/product-types/${productTypeId}/attributes`, { 
      params: { with_parent_attributes: withParentAttributes }
    }).then(res => res.data),
};

// Payment Method endpoints
export const paymentMethodApi = {
  create: (data: CreatePaymentMethodRequest): Promise<CreatePaymentMethodResponse> =>
    apiClient.post('/payment-method', data).then(res => res.data),
  
  find: (params: FindPaymentMethodsRequest): Promise<PaginatedResponse<PaymentMethod>> =>
    apiClient.get('/payment-method', { params }).then(res => res.data),
    
  getById: (id: number): Promise<PaymentMethod> =>
    apiClient.get(`/payment-method/${id}`).then(res => res.data),
    
  update: (id: number, data: UpdatePaymentMethodRequest): Promise<PaymentMethod> =>
    apiClient.put(`/payment-method/${id}`, data).then(res => res.data),
};

// Sale endpoints
export const saleApi = {
  create: (data: CreateSaleRequest): Promise<CreateSaleResponse> =>
    apiClient.post('/sales', data).then(res => res.data),
  
  find: (params: FindSalesRequest): Promise<PaginatedResponse<Sale>> =>
    apiClient.get('/sales', { params }).then(res => res.data),
    
  getById: (id: number): Promise<Sale> =>
    apiClient.get(`/sales/${id}`).then(res => res.data),
    
  update: (id: number, data: CreateSaleRequest): Promise<Sale> =>
    apiClient.put(`/sales/${id}`, data).then(res => res.data),
    
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/sales/${id}`).then(res => res.data),
};

// User endpoints
export const userApi = {
  create: (data: CreateUserRequest): Promise<{ id: number }> =>
    apiClient.post('/users', data).then(res => res.data),
  
  find: (params: FindUsersRequest): Promise<PaginatedResponse<User>> =>
    apiClient.get('/users', { params }).then(res => res.data),
    
  getById: (id: number): Promise<User> =>
    apiClient.get(`/users/${id}`).then(res => res.data),
    
  update: (id: number, data: UpdateUserRequest): Promise<User> =>
    apiClient.put(`/users/${id}`, data).then(res => res.data),
    
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/users/${id}`).then(res => res.data),
};

// File endpoints
export const fileApi = {
  upload: (file: File, name?: string): Promise<{ id: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }
    return apiClient.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  getMetadata: (id: number): Promise<{ id: number; name: string; path: string; created_at: string; created_by: string }> =>
    apiClient.get(`/files/${id}`).then(res => res.data),

  download: (id: number): Promise<string> =>
    apiClient.get(`/files/${id}/download`, { responseType: 'blob' })
      .then(res => URL.createObjectURL(res.data)),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/files/${id}`).then(res => res.data),
}; 