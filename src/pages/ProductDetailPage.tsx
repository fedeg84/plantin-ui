import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2,
  Package,
  User,
  Calendar,
} from 'lucide-react';
import { productApi } from '../api/endpoints';
import type { UpdateProductRequest } from '../types/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import BackButton from '../components/BackButton';
import MoneyInput from '../components/MoneyInput';
import { formatDateTimeLocal } from '../utils/datetime';
import ProductTypeSelector from '../components/ProductTypeSelector';
import ProductAttributesEditor, {
  ProductAttributeFormRow,
  toProductAttributesPayload,
} from '../components/ProductAttributesEditor';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  code: z.string().optional(),
  type_id: z.number().optional(),
  current_price: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
  current_stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
  is_active: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirm();
  const productId = parseInt(id!, 10);
  const [attributeRows, setAttributeRows] = useState<ProductAttributeFormRow[]>([]);
  const [typeDisplayName, setTypeDisplayName] = useState<string>('');
  const [originalStock, setOriginalStock] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const productName = watch('name');

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(productId),
    enabled: !!id,
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) =>
      productApi.update(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['restock-products'] });
    },
    onError: () => {
      toast.error('Error al actualizar el producto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productApi.delete(productId),
    onSuccess: () => {
      toast.success('Producto eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['restock-products'] });
      navigate('/products');
    },
    onError: () => {
      toast.error('Error al eliminar el producto');
    },
  });

  useEffect(() => {
    if (!product) return;

    setValue('name', product.name);
    setValue('description', product.description || '');
    setValue('code', product.code || '');
    setValue('current_price', product.current_price);
    setValue('current_stock', product.current_stock);
    setValue('is_active', product.is_active);
    setOriginalStock(product.current_stock);

    if (product.type_id) {
      setValue('type_id', product.type_id);
      setTypeDisplayName(product.type_name ?? '');
    } else {
      setValue('type_id', undefined);
      setTypeDisplayName('');
    }

    setAttributeRows(
      (product.attributes ?? []).map((attr) => ({
        key: String(attr.id ?? crypto.randomUUID()),
        attribute_type_id: attr.attribute_type_id,
        attribute_type_name: attr.attribute_type_name,
        value: attr.value ?? '',
      }))
    );
  }, [product, setValue]);

  const handleTypeChange = (typeId: number, productType?: { name: string }) => {
    if (typeId > 0) {
      setValue('type_id', typeId);
      setTypeDisplayName(productType?.name ?? '');
    } else {
      setValue('type_id', undefined);
      setTypeDisplayName('');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: `¿Estás seguro de que querés eliminar el producto "${product.name}"?`,
      confirmLabel: 'Eliminar',
    });
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  const onSubmit = (data: ProductForm) => {
    const attributes = toProductAttributesPayload(attributeRows);
    const requestData: UpdateProductRequest = {
      name: data.name,
      description: data.description,
      code: data.code ?? '',
      current_price: data.current_price ?? 0,
      current_stock: data.current_stock ?? 0,
      is_active: data.is_active ?? true,
      attributes,
    };

    if (data.type_id) {
      requestData.type_id = data.type_id;
    }

    updateProductMutation.mutate({ id: productId, data: requestData });
  };

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="text-gray-600">Cargando producto…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Producto no encontrado</h3>
          <p className="text-gray-600 mb-4">El producto que buscás no existe o fue eliminado.</p>
          <BackButton
            fallback="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 min-h-0 hover:text-white"
          />
        </div>
      </div>
    );
  }

  const currentStock = watch('current_stock');

  const stockChangeHint =
    originalStock !== null &&
    currentStock !== undefined &&
    !Number.isNaN(currentStock) &&
    currentStock !== originalStock
      ? (() => {
          const delta = Math.abs(currentStock - originalStock);
          const verb = currentStock > originalStock ? 'sumarán' : 'restarán';
          return `Actualmente hay ${originalStock} productos en stock. Se ${verb} ${delta} productos.`;
        })()
      : null;

  const saving = isSubmitting || updateProductMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <BackButton fallback="/products" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {productName || product.name}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="inline-flex min-h-[44px] w-full md:w-auto justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4 mr-2 shrink-0" aria-hidden />
          Eliminar
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Información del producto</h2>

            <div>
              <label className="label">Nombre *</label>
              <input {...register('name')} type="text" className="input text-base" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea {...register('description')} rows={3} className="input text-base" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Código</label>
                <input {...register('code')} type="text" className="input text-base" />
              </div>
              <div>
                <label className="label">Estado</label>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value ? 1 : 0}
                      onChange={(e) => field.onChange(e.target.value === '1')}
                      className="input text-base"
                    >
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Precio y stock</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Precio de venta</label>
                <MoneyInput
                  {...register('current_price', { valueAsNumber: true })}
                  className="text-base"
                />
                {errors.current_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_price.message}</p>
                )}
              </div>
              <div>
                <label className="label">Stock</label>
                <input
                  {...register('current_stock', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  className="input text-base"
                />
                {stockChangeHint && (
                  <p className="mt-1 text-sm text-gray-600">{stockChangeHint}</p>
                )}
                {errors.current_stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_stock.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Tipo de producto</h2>
            <div>
              <label className="label">Tipo</label>
              <ProductTypeSelector
                value={watch('type_id') || 0}
                displayName={typeDisplayName}
                allowNone
                showCreateOption
                onChange={handleTypeChange}
                placeholder="Ej.: maceta, planta…"
              />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <ProductAttributesEditor value={attributeRows} onChange={setAttributeRows} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[48px] inline-flex justify-center items-center px-4 py-3 text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información del sistema</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Creado por</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {product.created_by_username}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de creación</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {formatDateTimeLocal(product.created_at, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </form>
      {ConfirmDialog}
    </div>
  );
}
