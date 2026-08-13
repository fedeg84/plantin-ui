import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { goBack } from '../utils/navigation';
import { cn } from '../utils/cn';

type BackButtonProps = {
  fallback: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
};

export default function BackButton({
  fallback,
  label = '',
  className,
  showIcon = true,
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <button
      type="button"
      onClick={() => goBack(navigate, location, fallback)}
      aria-label={label || 'Volver'}
      title={label || 'Volver'}
      className={cn(
        'inline-flex min-h-[44px] items-center rounded-xl px-1 text-stone-600 hover:text-stone-900 touch-manipulation',
        className
      )}
    >
      {showIcon && <ArrowLeft className={cn('h-5 w-5 shrink-0', label && 'mr-2')} aria-hidden />}
      {label}
    </button>
  );
}
