import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { shiftApi, userApi } from '../api/endpoints';
import { X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import WeeklyShiftsCalendar from '../components/WeeklyShiftsCalendar';
import TimePickerSelect from '../components/TimePickerSelect';
import { SearchableMultiSelect } from '../components/SearchableMultiSelect';
import type { DayOfWeek, Shift } from '../types/api';
import { getApiErrorMessage } from '../utils/apiErrors';
import { useConfirm } from '../hooks/useConfirm';

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
  const [onlyThisWeek, setOnlyThisWeek] = useState(false);
  const [onlyThisWeekCreate, setOnlyThisWeekCreate] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirm();

  // Get users for filter and form
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.find({ size: 100 }),
  });

  // Fetch all shifts for the calendar
  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['shifts', 'all'],
    queryFn: () => shiftApi.find({ size: 100, effective_for_current_week: true }),
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
      setOnlyThisWeek(false);
    }
  }, [editShiftData, setValueEdit]);

  const createMutation = useMutation({
    mutationFn: ({ data, only_this_week }: { data: ShiftForm; only_this_week: boolean }) =>
      shiftApi.create({
        ...data,
        start_time: `${data.start_time}:00`,
        end_time: `${data.end_time}:00`,
        only_this_week,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Turno creado exitosamente');
      resetCreate();
      setOnlyThisWeekCreate(false);
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Error al crear el turno'));
      console.error('Error creating shift:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, only_this_week }: { id: number; data: ShiftForm; only_this_week: boolean }) =>
      shiftApi.update(id, {
        ...data,
        start_time: `${data.start_time}:00`,
        end_time: `${data.end_time}:00`,
        only_this_week,
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
      toast.error(getApiErrorMessage(error, 'Error al actualizar el turno'));
      console.error('Error updating shift:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: number; restore?: boolean }) => shiftApi.delete(id),
    onSuccess: (_, { restore }) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success(restore ? 'Turno restaurado correctamente' : 'Turno eliminado correctamente');
      setShowEditForm(false);
      setEditingShift(null);
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar el turno'));
      console.error('Error deleting shift:', error);
    },
  });

  const onSubmitCreate = (data: ShiftForm) => {
    createMutation.mutate({ data, only_this_week: onlyThisWeekCreate });
  };

  const onSubmitEdit = (data: ShiftForm) => {
    if (editingShift) {
      const applyWeeklyOverride = onlyThisWeek && !editShiftData?.replaces_shift_id;
      updateMutation.mutate({
        id: editingShift,
        data,
        only_this_week: applyWeeklyOverride,
      });
    }
  };

  const handleCreateShiftClick = (day: DayOfWeek) => {
    resetCreate({
      day_of_week: day,
      start_time: '09:00',
      end_time: '17:00',
      user_ids: [],
    });
    setOnlyThisWeekCreate(false);
    setShowCreateForm(true);
  };

  const handleShiftClick = (shift: Shift) => {
    setEditingShift(shift.id);
    setShowEditForm(true);
  };

  const handleDeleteShift = async (id: number, usernames: string) => {
    const confirmed = await confirm({
      title: 'Eliminar turno',
      message: `¿Estás seguro de que quieres eliminar este turno de ${usernames}?`,
      confirmLabel: 'Eliminar',
    });
    if (confirmed) {
      deleteMutation.mutate({ id, restore: false });
    }
  };

  const handleRestoreShift = async (id: number, isReplacement: boolean) => {
    const message = isReplacement
      ? '¿Restaurar el turno habitual? Se eliminará el cambio de esta semana.'
      : '¿Eliminar este turno? Solo aplicaba para esta semana.';
    const confirmed = await confirm({
      title: isReplacement ? 'Restaurar turno' : 'Eliminar turno',
      message,
      confirmLabel: isReplacement ? 'Restaurar' : 'Eliminar',
      variant: isReplacement ? 'primary' : 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate({ id, restore: isReplacement });
    }
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
      <div>
        <h1 className="page-title">Turnos de Trabajo</h1>
      </div>

      {/* Weekly Calendar */}
      <div className="card p-6">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando turnos...</p>
          </div>
        ) : (
          <WeeklyShiftsCalendar
            shifts={shifts}
            onShiftClick={handleShiftClick}
            onAddShiftClick={handleCreateShiftClick}
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
                      setOnlyThisWeekCreate(false);
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

                <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyThisWeekCreate}
                    onChange={(e) => setOnlyThisWeekCreate(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>
                    Solo esta semana
                    <span className="block text-xs text-gray-500 mt-0.5">
                      El turno se mostrará únicamente hasta el domingo de esta semana.
                    </span>
                  </span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetCreate();
                      setOnlyThisWeekCreate(false);
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
                    {!editShiftData.replaces_shift_until_date && (
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
                    )}
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

                {editShiftData.replaces_shift_until_date ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="flex-1">Este turno aplica solo para esta semana.</p>
                    <button
                      type="button"
                      onClick={() =>
                        editingShift &&
                        handleRestoreShift(editingShift, !!editShiftData.replaces_shift_id)
                      }
                      disabled={deleteMutation.isPending}
                      className="btn-secondary text-xs px-2.5 py-1 shrink-0 disabled:opacity-50"
                    >
                      {deleteMutation.isPending
                        ? editShiftData.replaces_shift_id
                          ? 'Restaurando...'
                          : 'Eliminando...'
                        : editShiftData.replaces_shift_id
                          ? 'Restaurar turno'
                          : 'Eliminar turno'}
                    </button>
                  </div>
                ) : (
                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyThisWeek}
                      onChange={(e) => setOnlyThisWeek(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      Solo esta semana
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Crea un cambio temporal sin modificar el turno habitual a partir del lunes.
                      </span>
                    </span>
                  </label>
                )}

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
      {ConfirmDialog}
    </div>
  );
}
