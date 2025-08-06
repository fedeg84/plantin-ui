import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package,
  User,
  Calendar,
  Tag,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { productTypesApi } from '../api/productTypes';
import { ProductType } from '../types/api';
import toast from 'react-hot-toast';

export default function ProductTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProductType(parseInt(id));
    }
  }, [id]);

  const loadProductType = async (productTypeId: number) => {
    try {
      setLoading(true);
      const data = await productTypesApi.get(productTypeId);
      setProductType(data);
    } catch (error) {
      console.error('Error loading product type:', error);
      toast.error('Error al cargar el tipo de producto');
      navigate('/product-types');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productType) return;

    if (!confirm(`¿Estás seguro de que quieres eliminar el tipo de producto "${productType.name}"?`)) {
      return;
    }

    try {
      await productTypesApi.delete(productType.id);
      toast.success('Tipo de producto eliminado correctamente');
      navigate('/product-types');
    } catch (error) {
      console.error('Error deleting product type:', error);
      toast.error('Error al eliminar el tipo de producto');
    }
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

  if (!productType) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tipo de producto no encontrado</h3>
          <p className="text-gray-600 mb-4">El tipo de producto que buscas no existe o ha sido eliminado.</p>
          <Link
            to="/product-types"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Link>
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
            <h1 className="text-2xl font-bold text-gray-900">{productType.name}</h1>
            <p className="text-gray-600">Detalles del tipo de producto</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/product-types/${productType.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{productType.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo Padre</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {productType.parent_name || 'Ninguno'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {productType.description || 'Sin descripción'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Attributes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Atributos</h2>
            {productType.attributes && productType.attributes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo de Dato
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requerido
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orden
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productType.attributes.map((attribute) => (
                      <tr key={attribute.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{attribute.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {attribute.data_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attribute.is_required ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attribute.display_order}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin atributos</h3>
                <p className="text-gray-600">Este tipo de producto no tiene atributos definidos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{productType.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Creado por</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {productType.created_by_username}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de creación</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {new Date(productType.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <Link
                to={`/product-types/${productType.id}/edit`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Tipo
              </Link>
              <Link
                to="/products"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <Package className="h-4 w-4 mr-2" />
                Ver Productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 