import { Clock } from 'lucide-react';
import { forwardRef } from 'react';

interface TimePickerSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

const TimePickerSelect = forwardRef<HTMLDivElement, TimePickerSelectProps>(
  ({ value, onChange, error, label }, ref) => {
    // Parse the value (HH:MM format)
    const [hour = '09', minute = '00'] = value ? value.split(':') : ['09', '00'];

    // Generate hours (00-23)
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    
    // Generate minutes in 15-minute intervals
    const minutes = ['00', '15', '30', '45'];

    const handleHourChange = (newHour: string) => {
      onChange(`${newHour}:${minute}`);
    };

    const handleMinuteChange = (newMinute: string) => {
      onChange(`${hour}:${newMinute}`);
    };

    return (
      <div ref={ref}>
        {label && <label className="label">{label}</label>}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex gap-2 pl-10">
            {/* Hour Select */}
            <div className="flex-1">
              <select
                value={hour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="input text-center font-medium text-lg"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 text-center mt-1">Hora</p>
            </div>

            {/* Separator */}
            <div className="flex items-center justify-center pt-2">
              <span className="text-2xl font-bold text-gray-400">:</span>
            </div>

            {/* Minute Select */}
            <div className="flex-1">
              <select
                value={minute}
                onChange={(e) => handleMinuteChange(e.target.value)}
                className="input text-center font-medium text-lg"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 text-center mt-1">Minutos</p>
            </div>
          </div>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

TimePickerSelect.displayName = 'TimePickerSelect';

export default TimePickerSelect;

