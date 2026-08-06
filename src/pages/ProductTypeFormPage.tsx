import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { productTypesApi } from '../api/productTypes';
import {
  ProductType,
  CreateProductTypeRequest,
  UpdateProductTypeRequest,
} from '../types/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import BackButton from '../components/BackButton';
import { goBack } from '../utils/navigation';

export default function ProductTypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm, ConfirmDialog } = useConfirm();
  const isEditing = !!id;
  const fallback = '/products/types';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [parentTypes, setParentTypes] = useState<ProductType[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: undefined as number | undefined,
  });

  useEffect(() => {
    loadParentTypes();
    if (isEditing && id) {
      loadProductType(parseInt(id));
    }
  }, [isEditing, id]);

  const loadParentTypes = async () => {
    try {
      const response = await productTypesApi.find({ size: 100 });
      setParentTypes(response.items);
    } catch (error) {
      console.error('Error loading parent types:', error);
    }
  };

  const loadProductType = async (productTypeId: number) => {
    try {
      setLoading(true);
      const data = await productTypesApi.get(productTypeId);
      setProductType(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        parent_id: data.parent_id || undefined,
      });
    } catch (error) {
      console.error('Error loading product type:', error);
      toast.error('Error al cargar el tipo de producto');
      goBack(navigate, location, fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);

      if (isEditing && productType) {
        const updateData: UpdateProductTypeRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id,
        };
        await productTypesApi.update(productType.id, updateData);
        toast.success('Tipo de producto actualizado correctamente');
      } else {
        const createData: CreateProductTypeRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id,
        };
        await productTypesApi.create(createData);
        toast.success('Tipo de producto creado correctamente');
      }

      goBack(navigate, location, fallback);
    } catch (error) {
      console.error('Error saving product type:', error);
      toast.error('Error al guardar el tipo de producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Eliminar tipo de producto',
      message: '¿Estás seguro de que quieres eliminar este tipo de producto?',
      confirmLabel: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await productTypesApi.delete(parseInt(id));
      toast.success('Tipo de producto eliminado correctamente');
      navigate(fallback);
    } catch (error) {
      console.error('Error deleting product type:', error);
      toast.error('Error al eliminar el tipo de producto');
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Cargando tipo de producto…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <BackButton fallback={fallback} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar tipo de producto' : 'Nuevo tipo de producto'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              placeholder="Ej: Planta interior"
              required
            />
          </div>
          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo padre
            </label>
            <select
              id="parent_id"
              value={formData.parent_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parent_id: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="input w-full"
            >
              <option value="">Sin tipo padre</option>
              {parentTypes
                .filter((pt) => !isEditing || pt.id !== productType?.id)
                .map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input w-full"
            />
          </div>
        </div>

        <div className={`flex flex-col-reverse sm:flex-row gap-3 ${isEditing ? 'sm:justify-between' : 'sm:justify-end'}`}>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </button>
          )}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <BackButton
              fallback={fallback}
              label="Cancelar"
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 min-h-0"
              showIcon={false}
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando…' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </form>
      {ConfirmDialog}
    </div>
  );
}
