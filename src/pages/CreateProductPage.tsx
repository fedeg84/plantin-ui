import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Check, Plus } from 'lucide-react';
import { productApi, productTypeApi } from '../api/endpoints';
import { ProductType, ProductTypeAttribute } from '../types/api';
import toast from 'react-hot-toast';

const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  code: z.string().optional(),
  type_id: z.number().min(1, 'El tipo de producto es requerido'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
  attributes: z.array(z.object({
    product_type_attribute_id: z.number(),
    value: z.string()
  })).optional(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

interface HierarchicalProductType {
  id: number;
  name: string;
  description?: string;
  children: HierarchicalProductType[];
  isSelected?: boolean;
}

export default function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [selectedProductTypeAttributes, setSelectedProductTypeAttributes] = useState<ProductTypeAttribute[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [attributeValues, setAttributeValues] = useState<Record<number, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      price: 0,
      stock: 0,
    }
  });

  // Fetch all product types
  const { data: productTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['product-types', { size: 1000 }],
    queryFn: () => productTypeApi.find({ 
      size: 1000,
      sort_by: 'name',
      sort_order: 'asc'
    }),
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      toast.success('Producto creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast.error('Error al crear el producto');
    }
  });

  // Build hierarchical structure
  const buildHierarchy = (types: ProductType[]): HierarchicalProductType[] => {
    const typeMap = new Map<number, HierarchicalProductType>();
    const rootTypes: HierarchicalProductType[] = [];

    // Create all types
    types.forEach(type => {
      typeMap.set(type.id, {
        id: type.id,
        name: type.name,
        description: type.description,
        children: [],
        isSelected: false
      });
    });

    // Build hierarchy
    types.forEach(type => {
      const hierarchicalType = typeMap.get(type.id)!;
      if (type.parent_id) {
        const parent = typeMap.get(type.parent_id);
        if (parent) {
          parent.children.push(hierarchicalType);
        }
      } else {
        rootTypes.push(hierarchicalType);
      }
    });

    return rootTypes;
  };

  // Get full hierarchy name for a product type
  const getHierarchyName = (typeId: number, types: ProductType[]): string => {
    const type = types.find(t => t.id === typeId);
    if (!type) return '';
    
    const hierarchy: string[] = [type.name];
    let currentType = type;
    
    // Traverse up the hierarchy
    while (currentType.parent_id) {
      const parent = types.find(t => t.id === currentType.parent_id);
      if (parent) {
        hierarchy.unshift(parent.name);
        currentType = parent;
      } else {
        break;
      }
    }
    
    return hierarchy.join(' ');
  };

  const hierarchicalTypes = productTypes ? buildHierarchy(productTypes.items) : [];

  const toggleExpanded = (typeId: number) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  const selectProductType = async (type: HierarchicalProductType) => {
    // Clear previous selection
    const clearSelection = (types: HierarchicalProductType[]) => {
      types.forEach(t => {
        t.isSelected = false;
        clearSelection(t.children);
      });
    };
    clearSelection(hierarchicalTypes);

    // Set new selection
    type.isSelected = true;
    
    // Find the actual product type
    const actualProductType = productTypes?.items.find(pt => pt.id === type.id);
    
    if (actualProductType) {
      setSelectedProductType(actualProductType);
      
      // Auto-generate name from hierarchy
      const hierarchyName = getHierarchyName(type.id, productTypes?.items || []);
      setValue('name', hierarchyName);
      
      // Load attributes separately (including parent attributes for product creation)
      try {
        console.log('Fetching attributes for product type:', type.id);
        const attributes = await productTypeApi.getAttributes(type.id, true); // Include parent attributes
        console.log('Attributes received:', attributes);
        setSelectedProductTypeAttributes(attributes.items);
      } catch (error) {
        console.error('Error fetching attributes:', error);
        setSelectedProductTypeAttributes([]);
      }
    } else {
      // Fallback if product type not found
      setSelectedProductType({
        id: type.id,
        name: type.name,
        description: type.description,
        parent_id: undefined,
        parent_name: undefined,
        created_by_id: 0,
        created_by_username: '',
        created_at: ''
      });
    }
    
    setValue('type_id', type.id);
    
    // Clear attribute values when changing product type
    setAttributeValues({});
  };

  const renderTypeItem = (type: HierarchicalProductType, level: number = 0) => {
    const isExpanded = expandedTypes.has(type.id);
    const hasChildren = type.children.length > 0;
    const isSelected = selectedProductType?.id === type.id;

    return (
      <div key={type.id}>
        <div 
          className={`
            flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-l-4
            ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent'}
            ${level > 0 ? 'ml-6' : ''}
          `}
          onClick={() => selectProductType(type)}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(type.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ChevronRight 
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} 
                />
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <div className="flex-1">
              <div className="font-medium text-sm">{type.name}</div>
              {type.description && (
                <div className="text-xs text-gray-500">{type.description}</div>
              )}
            </div>
          </div>
          
          {isSelected && (
            <Check className="h-4 w-4 text-primary-600" />
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200 ml-3">
            {type.children.map(child => renderTypeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleAttributeChange = (attributeId: number, value: string) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  const onSubmit = (data: CreateProductForm) => {
    // Transform attribute values to the correct format
    const attributesArray = Object.entries(attributeValues).map(([attributeId, value]) => ({
      product_type_attribute_id: parseInt(attributeId),
      value: value
    }));

    const requestData = {
      ...data,
      attributes: attributesArray.length > 0 ? attributesArray : undefined
    };
    createProductMutation.mutate(requestData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Producto</h1>
            <p className="text-gray-600">Completa la información del producto</p>
          </div>
        </div>
      </div>

      {/* Product Type Selector - First Step */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Paso 1: Seleccionar Tipo de Producto *</h2>
          <button
            type="button"
            onClick={() => navigate('/product-types/create')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Tipo
          </button>
        </div>
        
        {selectedProductType && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-md">
            <div className="text-sm text-primary-900">
              <span className="font-medium">Tipo seleccionado:</span> {selectedProductType.name}
            </div>
            {selectedProductType.description && (
              <div className="text-xs text-primary-700 mt-1">
                {selectedProductType.description}
              </div>
            )}
          </div>
        )}

        {errors.type_id && (
          <p className="mb-4 text-sm text-red-600">{errors.type_id.message}</p>
        )}

        <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
          {isLoadingTypes ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
              Cargando tipos de producto...
            </div>
          ) : hierarchicalTypes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No hay tipos de producto disponibles
            </div>
          ) : (
            <div>
              {hierarchicalTypes.map(type => renderTypeItem(type))}
            </div>
          )}
        </div>
      </div>

      {/* Product Information Form - Second Step */}
      {selectedProductType && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Paso 2: Información del Producto</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                {...register('name')}
                type="text"
                className="input"
                placeholder="El nombre se genera automáticamente, pero puedes editarlo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input"
                placeholder="Descripción del producto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Código</label>
                <input
                  {...register('code')}
                  type="text"
                  className="input"
                  placeholder="SKU-001"
                />
              </div>

              <div>
                <label className="label">Precio</label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Stock</label>
              <input
                {...register('stock', { valueAsNumber: true })}
                type="number"
                className="input"
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
              )}
            </div>

            {/* Product Attributes */}
            {selectedProductTypeAttributes && selectedProductTypeAttributes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Atributos del Producto</h3>
                <div className="space-y-3">
                  {selectedProductTypeAttributes.map((attribute) => (
                    <div key={attribute.id}>
                      <label className="label">{attribute.name}</label>
                      <input
                        type="text"
                        className="input"
                        placeholder={`Ingrese el valor para ${attribute.name}`}
                        value={attributeValues[attribute.id] || ''}
                        onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 