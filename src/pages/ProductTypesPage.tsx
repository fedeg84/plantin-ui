import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Package,
  Tags,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { productTypesApi } from '../api/productTypes';
import { ProductType, FindProductTypesRequest } from '../types/api';
import toast from 'react-hot-toast';
import { navigateWithReturn } from '../utils/navigation';
import { formatDateLocal } from '../utils/datetime';

export default function ProductTypesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      const params: FindProductTypesRequest = {
        search: searchTerm || undefined,
        page: currentPage,
        size: 10,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await productTypesApi.find(params);
      setProductTypes(response.items);
      setTotalPages(response.pagination.total_pages);
      setTotalItems(response.pagination.total_items);
    } catch (error) {
      console.error('Error loading product types:', error);
      toast.error('Error al cargar los tipos de producto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductTypes();
  }, [currentPage, sortBy, sortOrder]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      setCurrentPage(0);
      loadProductTypes();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const openProductType = (productTypeId: number) => {
    navigate(`/product-types/${productTypeId}/edit`);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigateWithReturn(navigate, location, '/product-types/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tipo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Product Types Table - Hidden on mobile */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando tipos de producto...</p>
          </div>
        ) : productTypes.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tipos de producto</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No se encontraron tipos de producto con esa búsqueda.' : 'Comienza creando tu primer tipo de producto.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => navigateWithReturn(navigate, location, '/product-types/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Tipo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Nombre
                        {sortBy === 'name' && (
                          <span className="ml-1">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Padre
                    </th>
                    
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado por
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productTypes.map((productType) => (
                    <tr 
                      key={productType.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => openProductType(productType.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{productType.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {productType.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {productType.parent_name || '-'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{productType.created_by_username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateLocal(productType.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                     <div>
                     <p className="text-sm text-gray-700">
                       Mostrando <span className="font-medium">{currentPage * 10 + 1}</span> a{' '}
                       <span className="font-medium">
                         {Math.min((currentPage + 1) * 10, totalItems)}
                       </span>{' '}
                       de <span className="font-medium">{totalItems}</span> resultados
                     </p>
                   </div>
                  <div>
                                         <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                       <button
                         onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                         disabled={currentPage === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                                             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                         const page = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                        return (
                                                   <button
                           key={page}
                           onClick={() => setCurrentPage(page)}
                           className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                             currentPage === page
                               ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                               : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                           }`}
                         >
                           {page + 1}
                         </button>
                        );
                      })}
                                             <button
                         onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                         disabled={currentPage === totalPages - 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Product Types Cards - Hidden on desktop */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2">Cargando tipos de producto...</p>
          </div>
        ) : productTypes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Tags className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin tipos de producto</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron tipos de producto con ese criterio de búsqueda.' : 'Comienza creando tu primer tipo de producto.'}
            </p>
          </div>
        ) : (
          productTypes.map((productType) => (
            <div 
              key={productType.id} 
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openProductType(productType.id)}
            >
              <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {productType.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {productType.description}
                  </p>
                </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Creado por:</span>
                  <span className="text-sm text-gray-900">
                    {productType.created_by_username}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Fecha de creación:</span>
                  <span className="text-sm text-gray-900">
                    {formatDateLocal(productType.created_at)}
                  </span>
                </div>
                
                {/* Attributes would be loaded separately if needed */}
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <span className="text-sm text-gray-700">
                Página {currentPage + 1} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 