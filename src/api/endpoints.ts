import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  Product,
  FindProductsRequest,
  AttributeType,
  CreateAttributeTypeRequest,
  CreateAttributeTypeResponse,
  FindAttributeTypesRequest,
  ProductType,
  FindProductTypesRequest,
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
  CreateShiftRequest,
  CreateShiftResponse,
  UpdateShiftRequest,
  Shift,
  FindShiftsRequest,
  Expense,
  CreateExpenseRequest,
  CreateExpenseResponse,
  UpdateExpenseRequest,
  FindExpensesRequest,
  ExpenseType,
  CreateExpenseTypeRequest,
  CreateExpenseTypeResponse,
  UpdateExpenseTypeRequest,
  FindExpenseTypesRequest,
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
  find: (params: FindProductTypesRequest): Promise<PaginatedResponse<ProductType>> =>
    apiClient.get('/product-types', { params }).then(res => res.data),
};

// Attribute Type endpoints
export const attributeTypeApi = {
  create: (data: CreateAttributeTypeRequest): Promise<CreateAttributeTypeResponse> =>
    apiClient.post('/attribute-types', data).then(res => res.data),

  find: (params: FindAttributeTypesRequest): Promise<PaginatedResponse<AttributeType>> =>
    apiClient.get('/attribute-types', { params }).then(res => res.data),

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/attribute-types/${id}`).then(res => res.data),
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

  getImageUrl: (id: number): string => {
    if (!id || id === null || id === undefined) {
      return '';
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://plantin-api.up.railway.app';
    return `${API_BASE_URL}/files/${id}/download`;
  },

  delete: (id: number): Promise<void> =>
    apiClient.delete(`/files/${id}`).then(res => res.data),
};

// Shift endpoints
export const shiftApi = {
  create: (data: CreateShiftRequest): Promise<CreateShiftResponse> =>
    apiClient.post('/shifts', data).then(res => res.data),
  
  find: (params: FindShiftsRequest): Promise<PaginatedResponse<Shift>> =>
    apiClient.get('/shifts', { params }).then(res => res.data),
    
  getById: (id: number): Promise<Shift> =>
    apiClient.get(`/shifts/${id}`).then(res => res.data),
    
  update: (id: number, data: UpdateShiftRequest): Promise<Shift> =>
    apiClient.put(`/shifts/${id}`, data).then(res => res.data),
    
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/shifts/${id}`).then(res => res.data),
};

// Expense Type endpoints
export const expenseTypeApi = {
  create: (data: CreateExpenseTypeRequest): Promise<CreateExpenseTypeResponse> =>
    apiClient.post('/expense-types', data).then(res => res.data),
  
  find: (params: FindExpenseTypesRequest): Promise<PaginatedResponse<ExpenseType>> =>
    apiClient.get('/expense-types', { params }).then(res => res.data),
    
  getById: (id: number): Promise<ExpenseType> =>
    apiClient.get(`/expense-types/${id}`).then(res => res.data),
    
  update: (id: number, data: UpdateExpenseTypeRequest): Promise<ExpenseType> =>
    apiClient.put(`/expense-types/${id}`, data).then(res => res.data),
    
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/expense-types/${id}`).then(res => res.data),
};

// Expense endpoints
export const expenseApi = {
  create: (data: CreateExpenseRequest): Promise<CreateExpenseResponse> =>
    apiClient.post('/expenses', data).then(res => res.data),
  
  find: (params: FindExpensesRequest): Promise<PaginatedResponse<Expense>> => {
    // Convert array params to comma-separated strings for backend
    const queryParams: any = { ...params };
    if (params.created_by_ids && params.created_by_ids.length > 0) {
      queryParams.created_by_ids = params.created_by_ids.join(',');
    }
    if (params.payment_method_ids && params.payment_method_ids.length > 0) {
      queryParams.payment_method_ids = params.payment_method_ids.join(',');
    }
    if (params.expense_type_ids && params.expense_type_ids.length > 0) {
      queryParams.expense_type_ids = params.expense_type_ids.join(',');
    }
    return apiClient.get('/expenses', { params: queryParams }).then(res => res.data);
  },
    
  getById: (id: number): Promise<Expense> =>
    apiClient.get(`/expenses/${id}`).then(res => res.data),
    
  update: (id: number, data: UpdateExpenseRequest): Promise<Expense> =>
    apiClient.put(`/expenses/${id}`, data).then(res => res.data),
    
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/expenses/${id}`).then(res => res.data),
}; 