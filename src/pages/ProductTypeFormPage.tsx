import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  GripVertical,
  Package
} from 'lucide-react';
import { productTypesApi } from '../api/productTypes';
import { 
  ProductType, 
  CreateProductTypeRequest, 
  UpdateProductTypeRequest,
  CreateProductTypeAttributeRequest,
  UpdateProductTypeAttributeRequest
} from '../types/api';
import toast from 'react-hot-toast';

interface AttributeFormData {
  id?: number;
  name: string;
}

export default function ProductTypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [parentTypes, setParentTypes] = useState<ProductType[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: undefined as number | undefined
  });

  const [attributes, setAttributes] = useState<AttributeFormData[]>([]);

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
      
      // Populate form data
      setFormData({
        name: data.name,
        description: data.description || '',
        parent_id: data.parent_id || undefined
      });

      // Populate attributes
      if (data.attributes) {
        setAttributes(data.attributes.map(attr => ({
          id: attr.id,
          name: attr.name
        })));
      }
    } catch (error) {
      console.error('Error loading product type:', error);
      toast.error('Error al cargar el tipo de producto');
      navigate('/product-types');
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

    // Validate attributes
    const validAttributes = attributes.filter(attr => attr.name.trim());
    const hasDuplicates = validAttributes.some((attr, index) => 
      validAttributes.findIndex(a => a.name === attr.name) !== index
    );

    if (hasDuplicates) {
      toast.error('No puede haber atributos con el mismo nombre');
      return;
    }

    try {
      setSaving(true);

      const attributesData: CreateProductTypeAttributeRequest[] = validAttributes.map((attr) => ({
        name: attr.name.trim()
      }));

      if (isEditing && productType) {
        const updateAttributesData: UpdateProductTypeAttributeRequest[] = validAttributes.map((attr) => ({
          id: attr.id,
          name: attr.name.trim()
        }));
        
        const updateData: UpdateProductTypeRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id,
          attributes: updateAttributesData
        };
        await productTypesApi.update(productType.id, updateData);
        toast.success('Tipo de producto actualizado correctamente');
      } else {
        const createData: CreateProductTypeRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id,
          attributes: attributesData
        };
        const response = await productTypesApi.create(createData);
        toast.success('Tipo de producto creado correctamente');
        navigate(`/product-types/${response.id}`);
        return;
      }

      navigate('/product-types');
    } catch (error) {
      console.error('Error saving product type:', error);
      toast.error('Error al guardar el tipo de producto');
    } finally {
      setSaving(false);
    }
  };

  const addAttribute = () => {
    const newAttribute: AttributeFormData = {
      name: ''
    };
    setAttributes([...attributes, newAttribute]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof AttributeFormData, value: any) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = {
      ...updatedAttributes[index],
      [field]: value
    };
    setAttributes(updatedAttributes);
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Cargando tipo de producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/product-types"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Modifica la información del tipo de producto' : 'Crea un nuevo tipo de producto'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: Planta Interior"
                required
              />
            </div>
            <div>
              <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Padre
              </label>
              <select
                id="parent_id"
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  parent_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sin tipo padre</option>
                {parentTypes
                  .filter(pt => !isEditing || pt.id !== productType?.id)
                  .map(pt => (
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe este tipo de producto..."
              />
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Atributos</h2>
            <button
              type="button"
              onClick={addAttribute}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Atributo
            </button>
          </div>

          {attributes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin atributos</h3>
              <p className="text-gray-600 mb-4">Agrega atributos para definir las características de este tipo de producto.</p>
              <button
                type="button"
                onClick={addAttribute}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Atributo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {attributes.map((attribute, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                      title="Arrastrar para reordenar"
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>
                    
                    <div className="flex-1 flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={attribute.name}
                          onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ej: Color, Tamaño..."
                          required
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeAttribute(index)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar atributo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/product-types"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Actualizar' : 'Crear'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 