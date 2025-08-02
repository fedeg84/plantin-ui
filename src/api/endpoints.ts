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
};

// Product Type endpoints
export const productTypeApi = {
  find: (params: any): Promise<PaginatedResponse<any>> =>
    apiClient.get('/product-types', { params }).then(res => res.data),
    
  getAttributes: (productTypeId: number): Promise<ProductTypeAttribute[]> =>
    apiClient.get(`/product-types/${productTypeId}/attributes`).then(res => res.data),
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
}; 