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
  type_id?: number;
  price?: number;
  stock?: number;
  picture_id?: number;
  attributes?: ProductAttributeInput[];
}

export interface ProductAttributeInput {
  attribute_type_id: number;
  value: string;
}

export interface CreateProductResponse {
  id: number;
}

export interface ProductAttribute {
  id?: number;
  attribute_type_id: number;
  attribute_type_name: string;
  value: string;
  created_at?: string;
  created_by_id?: number;
  created_by_username?: string;
}

export interface AttributeType {
  id: number;
  name: string;
  created_at: string;
  created_by_id?: number;
  created_by_username?: string;
}

export interface CreateAttributeTypeRequest {
  name: string;
}

export interface CreateAttributeTypeResponse {
  id: number;
}

export interface FindAttributeTypesRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  code?: string;
  type_id?: number;
  type_name?: string;
  is_active: boolean;
  created_at: string;
  created_by_id: number;
  created_by_username: string;
  picture_id?: number;
  current_price: number;
  current_stock: number;
  attributes?: ProductAttribute[];
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  code?: string;
  type_id?: number;
  current_price?: number;
  current_stock?: number;
  is_active?: boolean;
  attributes?: ProductAttributeInput[];
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
}

export interface UpdateProductTypeRequest {
  name: string;
  description?: string;
  parent_id?: number;
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
  /** Al actualizar venta: id del sale_item; omitir en líneas nuevas. */
  id?: number;
  product_id: number;
  quantity: number;
  price?: number;
}

export interface CreateSalePaymentMethodRequest {
  /** Presente al actualizar una venta: id del sale_payment_method; omitir o null para una línea nueva. */
  id?: number | null;
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

// User types
export interface CreateUserRequest {
  name: string;
  username: string;
  password: string;
  picture_id?: number;
  role: 'ADMIN' | 'USER';
}

export interface UpdateUserRequest {
  name: string;
  username: string;
  password?: string;
  picture_id?: number;
  role: 'ADMIN' | 'USER';
  is_active?: boolean;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  is_active: boolean;
  created_at: string;
  picture_id?: number;
}

export interface FindUsersRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  role?: 'ADMIN' | 'USER';
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Shift types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ShiftUser {
  id: number;
  username: string;
  name: string;
}

export interface CreateShiftRequest {
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  user_ids: number[];  // Changed from user_id to user_ids
}

export interface CreateShiftResponse {
  id: number;
}

export interface UpdateShiftRequest {
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  user_ids?: number[];  // Changed from user_id to user_ids
}

export interface Shift {
  id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  users: ShiftUser[];  // Changed from single user_id/username to array of users
  created_at: string;
  created_by_username?: string;
}

export interface FindShiftsRequest {
  search?: string;
  user_id?: number;
  day_of_week?: DayOfWeek;
  page?: number;
  size?: number;
  sort_by?: 'day_of_week' | 'start_time' | 'end_time' | 'user' | 'created_at' | 'created_by';
  sort_order?: 'asc' | 'desc';
}

// Expense Type types
export interface ExpenseType {
  id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
  created_at: string;
  created_by_id?: number;
  created_by_username?: string;
}

export interface CreateExpenseTypeRequest {
  name: string;
  parent_id?: number | null;
}

export interface CreateExpenseTypeResponse {
  id: number;
}

export interface UpdateExpenseTypeRequest {
  name: string;
}

export interface FindExpenseTypesRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Expense types
export interface Expense {
  id: number;
  description?: string;
  amount: number;
  date: string; // YYYY-MM-DD format (solo fecha)
  created_date: string; // ISO datetime string (fecha y hora de creación)
  created_by_id?: number;
  created_by_username?: string;
  payment_method_id?: number;
  payment_method_name?: string;
  expense_type_id?: number;
  expense_type_name?: string;
}

export interface CreateExpenseRequest {
  description?: string;
  amount: number;
  date: string; // YYYY-MM-DD format (solo fecha)
  payment_method_id: number;
  expense_type_id: number;
}

export interface CreateExpenseResponse {
  id: number;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount: number;
  date: string; // YYYY-MM-DD format (solo fecha)
  payment_method_id: number;
  expense_type_id: number;
}

export interface FindExpensesRequest {
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  created_by_ids?: number[];
  payment_method_ids?: number[];
  expense_type_ids?: number[];
  min_date?: string; // YYYY-MM-DD format
  max_date?: string; // YYYY-MM-DD format
  min_amount?: number;
  max_amount?: number;
} 