import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../api/endpoints';
import type { CreateProductRequest } from '../types/api';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import MoneyInput from '../components/MoneyInput';
import ProductTypePicker, { ProductTypePickerSelection } from '../components/ProductTypePicker';
import ProductAttributesEditor, {
  ProductAttributeFormRow,
  toProductAttributesPayload,
} from '../components/ProductAttributesEditor';

const stockLoadSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  code: z.string().optional(),
  type_id: z.number().optional(),
  quantity_to_add: z.number().min(0, 'La cantidad no puede ser negativa'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

type StockLoadForm = z.infer<typeof stockLoadSchema>;

export default function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [typeSelection, setTypeSelection] = useState<ProductTypePickerSelection>({ status: 'unset' });
  const [attributeRows, setAttributeRows] = useState<ProductAttributeFormRow[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockLoadForm>({
    resolver: zodResolver(stockLoadSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      type_id: undefined,
      quantity_to_add: 0,
      price: 0,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      toast.success('Producto registrado correctamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
    onError: () => {
      toast.error('Error al registrar el producto');
    },
  });

  const handleTypeSelection = (selection: ProductTypePickerSelection) => {
    setTypeSelection(selection);
    if (selection.status === 'type') {
      setValue('name', selection.productType.name);
      setValue('type_id', selection.productType.id);
    } else if (selection.status === 'none') {
      setValue('type_id', undefined);
    }
  };

  const onSubmit = (data: StockLoadForm) => {
    if (typeSelection.status === 'unset') {
      toast.error('Seleccioná un tipo de producto o "Sin tipo"');
      return;
    }

    const attributes = toProductAttributesPayload(attributeRows);
    const payload: CreateProductRequest = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      code: data.code?.trim() || undefined,
      price: data.price,
      stock: data.quantity_to_add ?? 0,
      attributes: attributes.length > 0 ? attributes : undefined,
    };

    if (typeSelection.status === 'type') {
      payload.type_id = typeSelection.productType.id;
    }

    createProductMutation.mutate(payload);
  };

  const mutationPending = createProductMutation.isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <BackButton fallback="/products" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carga de stock</h1>
          <p className="text-gray-600">Registrá un producto con tipo, atributos y stock inicial.</p>
        </div>
      </div>

      <ProductTypePicker
        selection={typeSelection}
        onSelect={handleTypeSelection}
        title="Paso 1: Tipo de producto"
      />

      {typeSelection.status !== 'unset' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Paso 2: Datos del producto</h2>

            <div>
              <label className="label">Nombre *</label>
              <input {...register('name')} type="text" className="input text-base" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea {...register('description')} rows={2} className="input text-base" />
            </div>

            <div>
              <label className="label">Código</label>
              <input
                {...register('code')}
                type="text"
                className="input text-base"
                placeholder="Opcional; si no cargás, se asigna uno automático"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Cantidad (stock inicial)</label>
                <input
                  {...register('quantity_to_add', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  className="input text-base"
                />
              </div>
              <div>
                <label className="label">Precio de venta</label>
                <MoneyInput
                  {...register('price', { valueAsNumber: true })}
                  className="text-base"
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <ProductAttributesEditor value={attributeRows} onChange={setAttributeRows} />
          </div>

          <button
            type="submit"
            disabled={mutationPending}
            className="w-full min-h-[48px] inline-flex justify-center items-center px-4 py-3 text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {mutationPending ? 'Guardando…' : 'Registrar producto'}
          </button>
        </form>
      )}
    </div>
  );
}
