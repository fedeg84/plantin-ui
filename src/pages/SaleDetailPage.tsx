import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, DollarSign, Clock, User } from 'lucide-react';
import { saleApi } from '../api/endpoints';
import toast from 'react-hot-toast';

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const saleId = parseInt(id!);

  // Fetch sale details
  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => saleApi.getById(saleId),
    enabled: !!saleId,
  });

  // Delete sale mutation
  const deleteSaleMutation = useMutation({
    mutationFn: saleApi.delete,
    onSuccess: () => {
      toast.success('Venta eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      navigate('/sales');
    },
    onError: (error) => {
      console.error('Error deleting sale:', error);
      toast.error('Error al eliminar la venta');
      setIsDeleting(false);
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      deleteSaleMutation.mutate(saleId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Error al cargar la venta</p>
          <button
            onClick={() => navigate('/sales')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Volver a ventas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/sales')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Venta #{sale.id}
            </h1>
            <p className="text-gray-600">Detalles de la venta</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/sales/${sale.id}/edit`)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      {/* Sale Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Amount */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(sale.total_price)}
              </p>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fecha y Hora</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDateTime(sale.time)}
              </p>
            </div>
          </div>
        </div>

        {/* Created By */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Creada por</p>
              <p className="text-sm font-semibold text-gray-900">
                {sale.created_by_username}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Productos</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {sale.items.map((item, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Código: {item.product.code || 'Sin código'}
                  </p>
                  {item.product.description && (
                    <p className="text-sm text-gray-500">
                      {item.product.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      {sale.payment_methods && sale.payment_methods.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Métodos de Pago</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sale.payment_methods.map((payment, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.payment_method_name}
                    </p>
                                         {payment.discount_percentage > 0 && (
                       <p className="text-sm text-gray-500">
                         Descuento: {payment.discount_percentage}% (-{formatCurrency(payment.discount)})
                       </p>
                     )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
