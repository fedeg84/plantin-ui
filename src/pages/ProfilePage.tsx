import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/endpoints';
import { UpdateUserRequest, User } from '../types/api';
import { Save, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ProfileImageUpload from '../components/ProfileImageUpload';

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  password: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getUser } = useAuthStore();
  const [profileImageId, setProfileImageId] = useState<number | null>(null);
  
  // Get current user from token
  const currentUser = getUser();
  const userId = currentUser?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId!),
    enabled: !!userId,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => userApi.update(userId!, data),
    onSuccess: () => {
      // Invalidate the users list cache and specific user cache
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      alert('Perfil actualizado correctamente');
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil: ' + (error.response?.data?.detail || error.message));
    },
  });

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('username', user.username);
      setProfileImageId(user.picture_id || null);
    }
  }, [user, setValue]);

  const onSubmit = (data: ProfileFormData) => {
    // Only include password if it's provided
    const updateData: UpdateUserRequest = {
      name: data.name,
      username: data.username,
      role: user!.role, // Keep the same role
      is_active: user!.is_active, // Keep the same active status
      picture_id: profileImageId,
    };
    
    if (data.password && data.password.trim()) {
      updateData.password = data.password;
    }
    
    updateUserMutation.mutate(updateData);
  };

  if (!userId) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          No se pudo obtener la información del usuario actual.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error al cargar el perfil: {error.message}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Usuario no encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-600 mt-1">Actualiza tu información personal</p>
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
                currentImageId={profileImageId}
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
                placeholder="Ingrese su nombre completo"
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
                placeholder="Ingrese su nombre de usuario"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña (Opcional)
              </label>
              <input
                type="password"
                id="password"
                {...register('password')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Deje en blanco para mantener la actual"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Solo complete este campo si desea cambiar su contraseña
              </p>
            </div>

            {/* Current Info Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Información Actual</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Rol:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || updateUserMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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

export default ProfilePage;
