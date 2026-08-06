import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Check, Plus, Edit } from 'lucide-react';
import { productTypeApi } from '../api/endpoints';
import type { ProductType } from '../types/api';
import { navigateWithReturn } from '../utils/navigation';

export type ProductTypePickerSelection =
  | { status: 'unset' }
  | { status: 'none' }
  | { status: 'type'; productType: ProductType };

interface HierarchicalProductType {
  id: number;
  name: string;
  description?: string;
  children: HierarchicalProductType[];
}

function filterProductTypesBySearch(
  types: HierarchicalProductType[],
  q: string
): HierarchicalProductType[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return types;
  const walk = (nodes: HierarchicalProductType[]): HierarchicalProductType[] => {
    const out: HierarchicalProductType[] = [];
    for (const n of nodes) {
      const children = walk(n.children);
      const selfMatch =
        n.name.toLowerCase().includes(needle) ||
        (n.description?.toLowerCase().includes(needle) ?? false);
      if (selfMatch || children.length > 0) {
        out.push({ ...n, children });
      }
    }
    return out;
  };
  return walk(types);
}

function buildHierarchy(types: ProductType[]): HierarchicalProductType[] {
  const typeMap = new Map<number, HierarchicalProductType>();
  const rootTypes: HierarchicalProductType[] = [];

  types.forEach((type) => {
    typeMap.set(type.id, {
      id: type.id,
      name: type.name,
      description: type.description,
      children: [],
    });
  });

  types.forEach((type) => {
    const hierarchicalType = typeMap.get(type.id)!;
    if (type.parent_id) {
      const parent = typeMap.get(type.parent_id);
      if (parent) parent.children.push(hierarchicalType);
    } else {
      rootTypes.push(hierarchicalType);
    }
  });

  return rootTypes;
}

type ProductTypePickerProps = {
  selection: ProductTypePickerSelection;
  onSelect: (selection: ProductTypePickerSelection) => void;
  showSelectedBanner?: boolean;
  showCreateButton?: boolean;
  showEditTypeButton?: boolean;
  title?: string;
};

export default function ProductTypePicker({
  selection,
  onSelect,
  showSelectedBanner = true,
  showCreateButton = true,
  showEditTypeButton = false,
  title = 'Tipo de producto',
}: ProductTypePickerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [typeSearch, setTypeSearch] = useState('');

  const { data: productTypes, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['product-types', { size: 1000 }],
    queryFn: () =>
      productTypeApi.find({
        size: 1000,
        sort_by: 'name',
        sort_order: 'asc',
      }),
  });

  const hierarchicalTypes = useMemo(
    () => (productTypes ? buildHierarchy(productTypes.items) : []),
    [productTypes]
  );

  const visibleHierarchy = useMemo(
    () => filterProductTypesBySearch(hierarchicalTypes, typeSearch),
    [hierarchicalTypes, typeSearch]
  );

  const toggleExpanded = (typeId: number) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) newSet.delete(typeId);
      else newSet.add(typeId);
      return newSet;
    });
  };

  const selectNoType = () => {
    onSelect({ status: 'none' });
  };

  const selectProductType = (type: HierarchicalProductType) => {
    const actualProductType = productTypes?.items.find((pt) => pt.id === type.id);
    const productType =
      actualProductType ??
      ({
        id: type.id,
        name: type.name,
        description: type.description,
        created_by_id: 0,
        created_by_username: '',
        created_at: '',
      } satisfies ProductType);

    onSelect({ status: 'type', productType });
  };

  const renderTypeItem = (type: HierarchicalProductType, level: number = 0) => {
    const isExpanded = expandedTypes.has(type.id);
    const hasChildren = type.children.length > 0;
    const isSelected = selection.status === 'type' && selection.productType.id === type.id;

    return (
      <div key={type.id} className="border-t border-gray-200">
        <div
          className={`flex items-center justify-between p-3 min-h-[48px] hover:bg-gray-50 cursor-pointer border-l-4 ${
            isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent'
          } ${level > 0 ? 'ml-4 sm:ml-6' : ''}`}
          onClick={() => selectProductType(type)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectProductType(type);
            }
          }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(type.id);
                }}
                className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-gray-200 rounded-md"
              >
                <ChevronRight
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">{type.name}</div>
              {type.description && <div className="text-xs text-gray-500">{type.description}</div>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSelected && <Check className="h-4 w-4 text-primary-600" />}
            {showEditTypeButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateWithReturn(navigate, location, `/product-types/${type.id}/edit`);
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200 ml-3">
            {type.children.map((child) => renderTypeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        {showCreateButton && (
          <button
            type="button"
            onClick={() => navigateWithReturn(navigate, location, '/product-types/create')}
            className="inline-flex justify-center items-center min-h-[44px] px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo tipo
          </button>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="product-type-search" className="label">
          Buscar tipo
        </label>
        <input
          id="product-type-search"
          type="search"
          className="input text-base"
          placeholder="Ej.: maceta, planta…"
          value={typeSearch}
          onChange={(e) => setTypeSearch(e.target.value)}
        />
      </div>

      {showSelectedBanner && selection.status !== 'unset' && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-md text-sm text-primary-900">
          <span className="font-medium">Tipo seleccionado:</span>{' '}
          {selection.status === 'none' ? 'Sin tipo' : selection.productType.name}
        </div>
      )}

      <div className="border border-gray-200 rounded-md max-h-[min(24rem,70vh)] overflow-y-auto">
        <div
          className={`flex items-center justify-between p-3 min-h-[48px] hover:bg-gray-50 cursor-pointer border-l-4 ${
            selection.status === 'none' ? 'border-primary-500 bg-primary-50' : 'border-transparent'
          }`}
          onClick={selectNoType}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectNoType();
            }
          }}
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-6" />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">Sin tipo</div>
              <div className="text-xs text-gray-500">El producto no tendrá tipo asignado</div>
            </div>
          </div>
          {selection.status === 'none' && <Check className="h-4 w-4 text-primary-600" />}
        </div>

        {isLoadingTypes ? (
          <div className="p-4 text-center text-gray-500 border-t border-gray-200">Cargando tipos…</div>
        ) : visibleHierarchy.length === 0 ? (
          <div className="p-4 text-center text-gray-500 border-t border-gray-200">
            {typeSearch.trim() ? 'Sin tipos que coincidan con la búsqueda' : 'Sin tipos disponibles'}
          </div>
        ) : (
          visibleHierarchy.map((type) => renderTypeItem(type))
        )}
      </div>
    </div>
  );
}
