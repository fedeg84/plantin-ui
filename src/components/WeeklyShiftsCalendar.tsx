import { useMemo } from 'react';
import { Clock, User as UserIcon } from 'lucide-react';
import type { Shift, DayOfWeek } from '../types/api';

interface WeeklyShiftsCalendarProps {
  shifts: Shift[];
  onShiftClick?: (shift: Shift) => void;
  selectedUserIds?: number[];
  onToggleUser?: (userId: number) => void;
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const DAYS_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Generate a consistent color for each user based on their ID
const getUserColor = (userId: number): { bg: string; border: string; text: string } => {
  const colors = [
    { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
    { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
    { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
    { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
    { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
    { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900' },
    { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' },
    { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900' },
    { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
    { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900' },
  ];
  return colors[userId % colors.length];
};

export default function WeeklyShiftsCalendar({ shifts, onShiftClick, selectedUserIds = [], onToggleUser }: WeeklyShiftsCalendarProps) {
  // Get unique users for legend
  const users = useMemo(() => {
    const uniqueUsers = new Map<number, { id: number; username: string }>();
    shifts.forEach((shift) => {
      // Add all users from the shift's users array
      shift.users.forEach((user) => {
        if (!uniqueUsers.has(user.id)) {
          uniqueUsers.set(user.id, { id: user.id, username: user.username });
        }
      });
    });
    return Array.from(uniqueUsers.values());
  }, [shifts]);

  const filteredShifts = useMemo(() => {
    if (selectedUserIds.length === 0) return shifts;
    // Filter shifts that include any of the selected users
    return shifts.filter((shift) => shift.users.some(user => selectedUserIds.includes(user.id)));
  }, [shifts, selectedUserIds]);

  const filteredShiftsByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, Shift[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    filteredShifts.forEach((shift) => {
      grouped[shift.day_of_week].push(shift);
    });

    Object.keys(grouped).forEach((day) => {
      grouped[day as DayOfWeek].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  }, [filteredShifts]);

  return (
    <div className="space-y-4">
      {/* Users Legend */}
      <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-200">
        <div className="flex items-center text-sm font-medium text-gray-700 mr-2">
          <UserIcon className="h-4 w-4 mr-2" />
          Usuarios:
        </div>
        {users.map((user) => {
          const color = getUserColor(user.id);
          const isSelected = selectedUserIds.length === 0 || selectedUserIds.includes(user.id);
          const isFiltered = selectedUserIds.length > 0;
          return (
            <div
              key={user.id}
              onClick={() => onToggleUser?.(user.id)}
              className={`flex items-center space-x-2 cursor-pointer px-2 py-1 rounded transition-colors ${
                isFiltered && !isSelected
                  ? 'opacity-30 hover:opacity-50'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 ${color.bg} ${color.border} ${isSelected && isFiltered ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`} />
              <span className={`text-sm ${isSelected && isFiltered ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                {user.username}
              </span>
              {isFiltered && isSelected && (
                <span className="text-xs text-primary-600">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {DAYS_ORDER.map((day) => {
          const dayShifts = filteredShiftsByDay[day];
          return (
            <div key={day} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Day Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">{DAY_NAMES[day]}</h3>
              </div>

              {/* Shifts List */}
              <div className="p-3 space-y-2 min-h-[100px]">
                {dayShifts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Clock className="h-8 w-8 mb-2" />
                    <p className="text-xs">Sin turnos</p>
                  </div>
                ) : (
                  dayShifts.map((shift) => {
                    // Use color from first user for consistency
                    const color = shift.users.length > 0 ? getUserColor(shift.users[0].id) : getUserColor(0);
                    return (
                      <div
                        key={shift.id}
                        onClick={() => onShiftClick?.(shift)}
                        className={`${color.bg} ${color.border} ${color.text} border-l-4 p-3 rounded cursor-pointer hover:shadow-md transition-shadow duration-150`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-semibold">
                            {shift.users.map(u => u.username).join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State for Filtered View */}
      {selectedUserIds.length > 0 && filteredShifts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No hay turnos para los usuarios seleccionados</p>
        </div>
      )}
    </div>
  );
}

