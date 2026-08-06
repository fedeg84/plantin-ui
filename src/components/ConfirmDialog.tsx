interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClassName =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-6 text-center">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={isLoading ? undefined : onCancel}
        />
        <div className="relative inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="btn-secondary w-full sm:w-auto disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex w-full sm:w-auto items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmClassName}`}
            >
              {isLoading ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
