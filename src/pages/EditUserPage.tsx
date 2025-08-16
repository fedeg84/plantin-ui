import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../api/endpoints';
import { UpdateUserRequest } from '../types/api';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileImageUpload from '../components/ProfileImageUpload';

const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'USER']),
  is_active: z.boolean(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const EditUserPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id!);
  const [profileImageId, setProfileImageId] = useState<number | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId),
    enabled: !!userId,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => userApi.update(userId, data),
    onSuccess: () => {
      // Invalidate the users list cache
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Invalidate the specific user cache
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      navigate('/admin/users');
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      alert('Error al actualizar el usuario: ' + (error.response?.data?.detail || error.message));
    },
  });

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('username', user.username);
      setValue('role', user.role);
      setValue('is_active', user.is_active);
      setProfileImageId(user.picture_id || null);
    }
  }, [user, setValue]);

  const onSubmit = (data: UpdateUserFormData) => {
    // Only include password if it's provided
    const updateData: UpdateUserRequest = {
      name: data.name,
      username: data.username,
      role: data.role,
      is_active: data.is_active,
      picture_id: profileImageId || undefined,
    };
    
    if (data.password && data.password.trim()) {
      updateData.password = data.password;
    }
    
    updateUserMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Cargando usuario...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Usuario no encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
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
                  <span className="text-sm font-medium text-gray-500">Editar</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/users"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
            <p className="text-gray-600 mt-1">Modifica la información del usuario</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Foto de Perfil (Opcional)
              </label>
              <ProfileImageUpload
                currentImageId={profileImageId || undefined}
                onImageChange={setProfileImageId}
                disabled={isSubmitting || updateUserMutation.isPending}
              />
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingrese el nombre completo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Usuario *
              </label>
              <input
                type="text"
                id="username"
                {...register('username')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingrese el nombre de usuario"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña (Dejar vacío para mantener la actual)
              </label>
              <input
                type="password"
                id="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dejar vacío para mantener la contraseña actual"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Role Field */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                id="role"
                {...register('role')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="USER">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Active Status Field */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Usuario Activo</span>
              </label>
              {errors.is_active && (
                <p className="mt-1 text-sm text-red-600">{errors.is_active.message}</p>
              )}
            </div>



            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || updateUserMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSubmitting || updateUserMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;
