import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attributeTypeApi } from '../api/endpoints';
import { AttributeType } from '../types/api';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

interface AttributeTypeSelectorProps {
  value?: number;
  selectedName?: string;
  onChange: (attributeTypeId: number, attributeType?: AttributeType) => void;
  excludeIds?: number[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export default function AttributeTypeSelector({
  value,
  selectedName,
  onChange,
  excludeIds = [],
  placeholder = 'Seleccionar tipo de atributo',
  error,
  disabled = false,
}: AttributeTypeSelectorProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAttributeType, setSelectedAttributeType] = useState<AttributeType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: attributeTypes, isLoading, isFetching } = useQuery({
    queryKey: ['attribute-types', { search, size: 50 }],
    queryFn: () =>
      attributeTypeApi.find({
        search: search.trim() || undefined,
        size: 50,
        sort_by: 'name',
        sort_order: 'asc',
      }),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => attributeTypeApi.create({ name }),
    onSuccess: (response, name) => {
      const created: AttributeType = {
        id: response.id,
        name,
        created_at: new Date().toISOString(),
      };
      queryClient.invalidateQueries({ queryKey: ['attribute-types'] });
      setSelectedAttributeType(created);
      onChange(created.id, created);
      setIsOpen(false);
      setSearch('');
      toast.success(`Tipo de atributo "${name}" creado`);
    },
    onError: () => {
      toast.error('No se pudo crear el tipo de atributo');
    },
  });

  useEffect(() => {
    if (value && selectedName) {
      setSelectedAttributeType({ id: value, name: selectedName, created_at: '' });
    } else if (!value) {
      setSelectedAttributeType(null);
    }
  }, [value, selectedName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const visibleItems =
    attributeTypes?.items.filter((item) => !excludeIds.includes(item.id)) ?? [];

  const trimmedSearch = search.trim();
  const showCreateOption =
    trimmedSearch.length > 0 &&
    !isLoading &&
    !isFetching &&
    !visibleItems.some((item) => item.name.toLowerCase() === trimmedSearch.toLowerCase());

  const handleSelect = (attributeType: AttributeType) => {
    setSelectedAttributeType(attributeType);
    onChange(attributeType.id, attributeType);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreate = () => {
    if (!trimmedSearch || createMutation.isPending) return;
    createMutation.mutate(trimmedSearch);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'input w-full text-left flex items-center justify-between min-h-[44px]',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          !selectedAttributeType && 'text-gray-500',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <span className="truncate">
          {selectedAttributeType ? selectedAttributeType.name : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[16rem] bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar tipos de atributo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {isLoading || isFetching ? (
              <div className="p-3 text-center text-sm text-gray-500">Buscando…</div>
            ) : visibleItems.length === 0 && !showCreateOption ? (
              <div className="p-3 text-center text-sm text-gray-500">
                {trimmedSearch ? 'Sin resultados' : 'Escribí para buscar tipos de atributo'}
              </div>
            ) : (
              visibleItems.map((attributeType) => (
                <button
                  key={attributeType.id}
                  type="button"
                  onClick={() => handleSelect(attributeType)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                    value === attributeType.id && 'bg-primary-50 text-primary-900'
                  )}
                >
                  <span className="font-medium text-sm">{attributeType.name}</span>
                </button>
              ))
            )}

            {showCreateOption && (
              <div className="border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-gray-900 truncate">
                    Crear &quot;{trimmedSearch}&quot;
                  </span>
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white shrink-0">
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
