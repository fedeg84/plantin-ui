import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../api/endpoints';
import { UpdateUserRequest } from '../types/api';
import { Save } from 'lucide-react';
import BackButton from '../components/BackButton';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/apiErrors';
import { useConfirm } from '../hooks/useConfirm';
import ProfileImageUpload from '../components/ProfileImageUpload';

const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'USER']),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const EditUserPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirm();
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id!);
  const [profileImageId, setProfileImageId] = useState<number | null>(null);
  
  const {
    register,
    handleSubmit,
    getValues,
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
    onError: (error: unknown) => {
      console.error('Error updating user:', error);
      toast.error(getApiErrorMessage(error, 'Error al actualizar el usuario'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) => {
      const data = getValues();
      return userApi.update(userId, {
        name: data.name,
        username: data.username,
        role: data.role,
        is_active: isActive,
        picture_id: profileImageId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: (error: unknown) => {
      console.error('Error updating user status:', error);
      toast.error(getApiErrorMessage(error, 'Error al cambiar el estado del usuario'));
    },
  });

  const handleToggleActive = async () => {
    if (!user) return;
    const action = user.is_active ? 'desactivar' : 'activar';
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase()}${action.slice(1)} usuario`,
      message: `¿Estás seguro de que quieres ${action} este usuario?`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
    });
    if (confirmed) {
      toggleActiveMutation.mutate(!user.is_active);
    }
  };

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('username', user.username);
      setValue('role', user.role);
      setProfileImageId(user.picture_id || null);
    }
  }, [user, setValue]);

  const onSubmit = (data: UpdateUserFormData) => {
    // Only include password if it's provided
    const updateData: UpdateUserRequest = {
      name: data.name,
      username: data.username,
      role: data.role,
      is_active: user?.is_active,
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
          <BackButton fallback="/admin/users" className="min-h-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
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

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={toggleActiveMutation.isPending || updateUserMutation.isPending}
                className={`inline-flex items-center justify-center px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                  user.is_active
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {toggleActiveMutation.isPending
                  ? 'Guardando...'
                  : user.is_active
                    ? 'Desactivar usuario'
                    : 'Activar usuario'}
              </button>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updateUserMutation.isPending || toggleActiveMutation.isPending}
                  className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting || updateUserMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {ConfirmDialog}
    </div>
  );
};

export default EditUserPage;
