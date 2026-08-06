import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
};

export function useConfirm() {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setState({ options: opts, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const ConfirmDialogElement = (
    <ConfirmDialog
      open={!!state}
      title={state?.options.title}
      message={state?.options.message ?? ''}
      confirmLabel={state?.options.confirmLabel}
      cancelLabel={state?.options.cancelLabel}
      variant={state?.options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogElement };
}
