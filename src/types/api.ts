// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// Product types
export interface CreateProductRequest {
  name: string;
  description?: string;
  code?: string;
  type_id: number;
  price?: number;
  stock?: number;
  picture_id?: number;
  attributes?: Array<{
    product_type_attribute_id: number;
    value: string;
  }>;
}

export interface CreateProductResponse {
  id: number;
}

export interface ProductAttributeValue {
  id?: number;
  name: string;
  value?: string;
}

export interface ProductTypeAttribute {
  id: number;
  name: string;
  product_type_id: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  code?: string;
  type_id: number;
  type_name: string;
  is_active: boolean;
  created_at: string;
  created_by_id: number;
  created_by_username: string;
  picture_id?: number;
  current_price: number;
  current_stock: number;
  attributes?: ProductAttributeValue[];
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  code?: string;
  type_id: number;
  current_price?: number;
  current_stock?: number;
  is_active?: boolean;
  attributes?: Array<{
    product_type_attribute_id: number;
    value: string;
  }>;
}

export interface FindProductsRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  type_ids?: number[];
  is_active?: boolean;
}

// Payment Method types
export interface CreatePaymentMethodRequest {
  name: string;
  discount?: number;
  is_active?: boolean;
}

export interface CreatePaymentMethodResponse {
  id: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  discount?: number;
  is_active: boolean;
  created_at: string;
  created_by_id: number;
  created_by_username: string;
}

export interface UpdatePaymentMethodRequest {
  name: string;
  discount?: number;
  is_active?: boolean;
}

export interface FindPaymentMethodsRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  is_active?: boolean;
}

// Product Type interfaces
export interface ProductType {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  created_at: string;
  created_by_id: number;
  created_by_username: string;
}

export interface CreateProductTypeRequest {
  name: string;
  description?: string;
  parent_id?: number;
  attributes?: CreateProductTypeAttributeRequest[];
}

export interface UpdateProductTypeRequest {
  name: string;
  description?: string;
  parent_id?: number;
  attributes?: UpdateProductTypeAttributeRequest[];
}

export interface UpdateProductTypeAttributeRequest {
  id?: number;
  name: string;
}

export interface CreateProductTypeAttributeRequest {
  name: string;
}

export interface CreateProductTypeResponse {
  id: number;
}

export interface FindProductTypesRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Sale types
export interface CreateSaleItemRequest {
  product_id: number;
  quantity: number;
  price?: number;
}

export interface CreateSalePaymentMethodRequest {
  payment_method_id: number;
  amount: number;
  discount?: number;
}

export interface CreateSaleRequest {
  description?: string;
  sale_items: CreateSaleItemRequest[];
  price?: number;
  user_id?: number;
  date?: string;
  payment_methods: CreateSalePaymentMethodRequest[];
}

export interface CreateSaleResponse {
  id: number;
}

export interface SalePaymentMethod {
  id: number;
  payment_method_id: number;
  payment_method_name: string;
  amount: number;
  discount: number;
  discount_percentage: number;
}

export interface Sale {
  id: number;
  time: string;
  created_by_id: number;
  created_by_username: string;
  total_price: number;
  payment_methods: SalePaymentMethod[];
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface FindSalesRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  created_by_ids?: number[];
  payment_method_ids?: number[];
  product_ids?: number[];
  min_time?: string;
  max_time?: string;
  min_total_price?: number;
  max_total_price?: number;
}

// Pagination types
export interface PaginationInfo {
  page: number;
  size: number;
  total_pages: number;
  total_items: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
} 