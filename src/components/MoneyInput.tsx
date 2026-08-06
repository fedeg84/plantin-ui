import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  FocusEvent,
  InputHTMLAttributes,
  Ref,
  MutableRefObject,
} from 'react';
import { cn } from '../utils/cn';

export type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((item) => {
      if (typeof item === 'function') {
        item(node);
      } else if (item && typeof item === 'object') {
        (item as MutableRefObject<T | null>).current = node;
      }
    });
  };
}

function toDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number' && (Number.isNaN(value) || value === 0)) return '';
  if (value === '0') return '';
  return String(value);
}

const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { className, value, onChange, onBlur, onFocus, ...props },
  ref
) {
  const { ref: fieldRef, ...inputProps } = props as MoneyInputProps & {
    ref?: Ref<HTMLInputElement>;
  };
  const isFocused = useRef(false);
  const [display, setDisplay] = useState(() => toDisplayValue(value));

  useEffect(() => {
    if (!isFocused.current) {
      setDisplay(toDisplayValue(value));
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const normalized = e.target.value.replace(',', '.');
    if (normalized !== '' && !/^\d*\.?\d*$/.test(normalized)) return;
    setDisplay(e.target.value);
    onChange?.(e);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    isFocused.current = true;
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    isFocused.current = false;
    onBlur?.(e);

    // Controlled usage passes `value`; react-hook-form `register()` does not.
    if (value !== undefined && value !== null) {
      setDisplay(toDisplayValue(value));
      return;
    }

    const normalized = e.target.value.replace(',', '.').trim();
    if (normalized === '') {
      setDisplay('');
      return;
    }

    const parsed = parseFloat(normalized);
    setDisplay(Number.isNaN(parsed) ? '' : String(parsed));
  };

  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        aria-hidden
      >
        $
      </span>
      <input
        {...inputProps}
        ref={mergeRefs(ref, fieldRef)}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn('input pl-7', className)}
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
});

export default MoneyInput;
