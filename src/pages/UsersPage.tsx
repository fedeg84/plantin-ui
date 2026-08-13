import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/endpoints';
import { User, FindUsersRequest } from '../types/api';
import { Plus, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { formatDateLocal } from '../utils/datetime';
import UserAvatar from '../components/UserAvatar';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<FindUsersRequest>({
    page: 0,
    size: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', searchParams],
    queryFn: () => userApi.find(searchParams),
  });

  const handleSearch = (search: string) => {
    setSearchParams(prev => ({ ...prev, search, page: 0 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleSort = (sortBy: string) => {
    setSearchParams(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openUser = (id: number) => navigate(`/admin/users/${id}/edit`);

  const getRoleBadge = (role: string) => {
    const isAdmin = role === 'ADMIN';
    return (
      <span className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
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
        'px-2 py-1 text-xs font-medium rounded-full',
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      )}>
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar usuarios: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
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
                <span className="text-sm font-medium text-gray-500">Usuarios</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
        </div>
        <Link
          to="/admin/users/create"
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avatar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('username')}>
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                  Fecha Creación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usersData?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usersData?.items.map((user: User) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 cursor-pointer ${!user.is_active ? 'opacity-50 bg-gray-50' : ''}`}
                    onClick={() => openUser(user.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UserAvatar 
                        pictureId={user.picture_id} 
                        username={user.username} 
                        size="small"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${user.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${user.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.is_active)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${user.is_active ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatDateLocal(user.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData && usersData.pagination.total_pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(searchParams.page! - 1)}
                disabled={searchParams.page === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(searchParams.page! + 1)}
                disabled={searchParams.page === usersData.pagination.total_pages - 1}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {usersData.pagination.page * usersData.pagination.size + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min((usersData.pagination.page + 1) * usersData.pagination.size, usersData.pagination.total_items)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{usersData.pagination.total_items}</span>{' '}
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(searchParams.page! - 1)}
                    disabled={searchParams.page === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: usersData.pagination.total_pages }, (_, i) => i).map((pageIndex) => (
                    <button
                      key={pageIndex}
                      onClick={() => handlePageChange(pageIndex)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageIndex === searchParams.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageIndex + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(searchParams.page! + 1)}
                    disabled={searchParams.page === usersData.pagination.total_pages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="card p-4 text-center text-gray-500">
            Cargando usuarios...
          </div>
        ) : usersData?.items.length === 0 ? (
          <div className="card p-4 text-center text-gray-500">
            No se encontraron usuarios
          </div>
        ) : (
          usersData?.items.map((user: User) => (
            <div
              key={user.id}
              className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${!user.is_active ? 'opacity-50' : ''}`}
              onClick={() => openUser(user.id)}
            >
              <div className="flex items-center space-x-3">
                <UserAvatar 
                  pictureId={user.picture_id} 
                  username={user.username} 
                  size="medium" 
                />
                <div>
                  <h3 className={`text-lg font-medium ${user.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {user.name}
                  </h3>
                  <p className={`text-sm ${user.is_active ? 'text-gray-500' : 'text-gray-400'}`}>
                    @{user.username}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Rol:</span>
                  {getRoleBadge(user.role)}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Estado:</span>
                  {getStatusBadge(user.is_active)}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Creado:</span>
                  <span className={`text-sm ${user.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {formatDateLocal(user.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {usersData && usersData.pagination.total_pages > 1 && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(searchParams.page! - 1)}
                disabled={searchParams.page === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <span className="text-sm text-gray-700">
                Página {searchParams.page! + 1} de {usersData.pagination.total_pages}
              </span>
              
              <button
                onClick={() => handlePageChange(searchParams.page! + 1)}
                disabled={searchParams.page === usersData.pagination.total_pages - 1}
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
};

export default UsersPage;
