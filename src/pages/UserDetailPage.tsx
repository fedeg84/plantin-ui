import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { userApi } from '../api/endpoints';
import { ArrowLeft, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import UserAvatar from '../components/UserAvatar';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = parseInt(id!);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId),
    enabled: !!userId,
  });

  const getRoleBadge = (role: string) => {
    const isAdmin = role === 'ADMIN';
    return (
      <span className={cn(
        'px-3 py-1 text-sm font-medium rounded-full',
        isAdmin 
          ? 'bg-red-100 text-red-800' 
          : 'bg-blue-100 text-blue-800'
      )}>
        {isAdmin ? 'Administrador' : 'Usuario'}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={cn(
        'px-3 py-1 text-sm font-medium rounded-full',
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      )}>
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Cargando usuario...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error al cargar el usuario: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Usuario no encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Panel de Admin
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <Link
                    to="/admin/users"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    Usuarios
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-sm font-medium text-gray-500">Detalles</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/users"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalles del Usuario</h1>
              <p className="text-gray-600 mt-1">Información completa del usuario</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/users/${user.id}/edit`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Información del Usuario</h2>
          </div>
          
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Foto de Perfil</dt>
                <dd className="mt-1">
                  <UserAvatar 
                    pictureId={user.picture_id} 
                    username={user.username} 
                    size="large"
                  />
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">{getStatusBadge(user.is_active)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre de Usuario</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Rol</dt>
                <dd className="mt-1">{getRoleBadge(user.role)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
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
        </div>

        {/* Additional sections can be added here */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500">
              Esta sección puede mostrar la actividad reciente del usuario, como ventas realizadas, productos creados, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
