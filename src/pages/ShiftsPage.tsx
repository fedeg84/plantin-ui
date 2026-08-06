import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { shiftApi, userApi } from '../api/endpoints';
import { Plus, Clock, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import WeeklyShiftsCalendar from '../components/WeeklyShiftsCalendar';
import TimePickerSelect from '../components/TimePickerSelect';
import { SearchableMultiSelect } from '../components/SearchableMultiSelect';
import type { DayOfWeek, Shift } from '../types/api';

const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const shiftSchema = z.object({
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time: z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, 'Debe ser un horario válido con intervalos de 15 minutos'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, 'Debe ser un horario válido con intervalos de 15 minutos'),
  user_ids: z.array(z.number()).min(1, 'Debe seleccionar al menos un usuario'),
}).refine((data) => data.start_time < data.end_time, {
  message: 'La hora de inicio debe ser anterior a la hora de fin',
  path: ['end_time'],
});

type ShiftForm = z.infer<typeof shiftSchema>;

export default function ShiftsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingShift, setEditingShift] = useState<number | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // Get users for filter and form
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.find({ size: 100 }),
  });

  // Fetch all shifts for the calendar
  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['shifts', 'all'],
    queryFn: () => shiftApi.find({ size: 100 }),
  });

  const shifts = shiftsData?.items || [];

  // Forms for shifts
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
    setValue: setValueCreate,
    formState: { errors: errorsCreate },
  } = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      start_time: '09:00',
      end_time: '17:00',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
  });

  const { data: editShiftData } = useQuery({
    queryKey: ['shift', editingShift],
    queryFn: () => shiftApi.getById(editingShift!),
    enabled: !!editingShift,
  });

  useEffect(() => {
    if (editShiftData) {
      setValueEdit('day_of_week', editShiftData.day_of_week);
      setValueEdit('start_time', editShiftData.start_time.substring(0, 5));
      setValueEdit('end_time', editShiftData.end_time.substring(0, 5));
      setValueEdit('user_ids', editShiftData.users.map(u => u.id));
    }
  }, [editShiftData, setValueEdit]);

  const createMutation = useMutation({
    mutationFn: (data: ShiftForm) => shiftApi.create({
      ...data,
      start_time: `${data.start_time}:00`,
      end_time: `${data.end_time}:00`,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno creado exitosamente');
      resetCreate();
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear el turno');
      console.error('Error creating shift:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShiftForm }) =>
      shiftApi.update(id, {
        ...data,
        start_time: `${data.start_time}:00`,
        end_time: `${data.end_time}:00`,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', id] });
      toast.success('Turno actualizado exitosamente');
      resetEdit();
      setShowEditForm(false);
      setEditingShift(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar el turno');
      console.error('Error updating shift:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shiftApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno eliminado correctamente');
      setShowEditForm(false);
      setEditingShift(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar el turno');
      console.error('Error deleting shift:', error);
    },
  });

  const onSubmitCreate = (data: ShiftForm) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: ShiftForm) => {
    if (editingShift) {
      updateMutation.mutate({ id: editingShift, data });
    }
  };

  const handleShiftClick = (shift: Shift) => {
    setEditingShift(shift.id);
    setShowEditForm(true);
  };

  const handleDeleteShift = (id: number, usernames: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar este turno de ${usernames}?`)) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turnos de Trabajo</h1>
          <p className="text-gray-600 mt-1">
            Administra los horarios de trabajo del equipo
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Turno
        </button>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white shadow rounded-lg p-6">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando turnos...</p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin turnos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando el primer turno.
            </p>
          </div>
        ) : (
          <WeeklyShiftsCalendar
            shifts={shifts}
            onShiftClick={handleShiftClick}
            selectedUserIds={selectedUserIds}
            onToggleUser={handleToggleUser}
          />
        )}
      </div>

      {/* Create Shift Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateForm(false)} />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Crear Nuevo Turno
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetCreate();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div>
                  <label className="label">Usuarios *</label>
                  <SearchableMultiSelect
                    options={users?.items.map((user) => ({
                      value: user.id,
                      label: `${user.username} - ${user.name}`
                    })) || []}
                    selectedValues={watchCreate('user_ids') || []}
                    onChange={(values) => setValueCreate('user_ids', values)}
                    placeholder="Seleccionar usuarios..."
                  />
                  {errorsCreate.user_ids && (
                    <p className="mt-1 text-sm text-red-600">{errorsCreate.user_ids.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Día de la Semana *</label>
                  <select
                    {...registerCreate('day_of_week')}
                    className="input"
                  >
                    <option value="">Seleccionar día</option>
                    {Object.entries(DAY_NAMES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errorsCreate.day_of_week && (
                    <p className="mt-1 text-sm text-red-600">{errorsCreate.day_of_week.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TimePickerSelect
                    label="Hora Inicio *"
                    value={watchCreate('start_time') || '09:00'}
                    onChange={(value) => setValueCreate('start_time', value)}
                    error={errorsCreate.start_time?.message}
                  />

                  <TimePickerSelect
                    label="Hora Fin *"
                    value={watchCreate('end_time') || '17:00'}
                    onChange={(value) => setValueCreate('end_time', value)}
                    error={errorsCreate.end_time?.message}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetCreate();
                    }}
                    className="btn-secondary flex-1"
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear Turno'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {showEditForm && editShiftData && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowEditForm(false);
              setEditingShift(null);
            }} />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Turno
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (editingShift && editShiftData) {
                          const usernames = editShiftData.users.map(u => u.username).join(', ');
                          handleDeleteShift(editingShift, usernames);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-150"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingShift(null);
                        resetEdit();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Usuarios *</label>
                  <SearchableMultiSelect
                    options={users?.items.map((user) => ({
                      value: user.id,
                      label: `${user.username} - ${user.name}`
                    })) || []}
                    selectedValues={watchEdit('user_ids') || []}
                    onChange={(values) => setValueEdit('user_ids', values)}
                    placeholder="Seleccionar usuarios..."
                  />
                  {errorsEdit.user_ids && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.user_ids.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Día de la Semana *</label>
                  <select
                    {...registerEdit('day_of_week')}
                    className="input"
                  >
                    <option value="">Seleccionar día</option>
                    {Object.entries(DAY_NAMES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errorsEdit.day_of_week && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.day_of_week.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TimePickerSelect
                    label="Hora Inicio *"
                    value={watchEdit('start_time') || '09:00'}
                    onChange={(value) => setValueEdit('start_time', value)}
                    error={errorsEdit.start_time?.message}
                  />

                  <TimePickerSelect
                    label="Hora Fin *"
                    value={watchEdit('end_time') || '17:00'}
                    onChange={(value) => setValueEdit('end_time', value)}
                    error={errorsEdit.end_time?.message}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingShift(null);
                      resetEdit();
                    }}
                    className="btn-secondary flex-1"
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Turno'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
