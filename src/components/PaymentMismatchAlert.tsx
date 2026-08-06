import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { paymentMethodApi } from '../api/endpoints';
import { getPaymentCompletionOptions, roundPeso } from '../utils/money';

type PaymentMismatchAlertProps = {
  productsSubtotal: number;
  paymentLines: Array<{
    payment_method_id: number;
    amount: number;
    discount?: number;
    name?: string;
  }>;
};

export default function PaymentMismatchAlert({
  productsSubtotal,
  paymentLines,
}: PaymentMismatchAlertProps) {
  const ids = useMemo(
    () => [...new Set(paymentLines.map((line) => line.payment_method_id).filter((id) => id > 0))],
    [paymentLines]
  );

  const nameQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['payment-method', id],
      queryFn: () => paymentMethodApi.getById(id),
      staleTime: 60_000,
    })),
  });

  const nameById = useMemo(() => {
    const map = new Map<number, string>();
    nameQueries.forEach((query, index) => {
      if (query.data?.name) {
        map.set(ids[index], query.data.name);
      }
    });
    return map;
  }, [nameQueries, ids]);

  const completionOptions = useMemo(() => {
    const lines = paymentLines.map((line) => ({
      ...line,
      name: line.name || nameById.get(line.payment_method_id) || '',
    }));
    return getPaymentCompletionOptions(productsSubtotal, lines).filter((line) => line.name);
  }, [paymentLines, nameById, productsSubtotal]);

  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
      <p>
        Los pagos no cuadran con el total de la venta ($
        {roundPeso(productsSubtotal).toLocaleString('es-AR')}). Complete donde corresponda.
      </p>
      {completionOptions.length > 0 && (
        <div className="mt-1.5 space-y-0.5 text-amber-800 tabular-nums">
          {completionOptions.map((line, index) => (
            <p key={line.payment_method_id ?? `${line.name}-${index}`}>
              {line.name}: {line.amount.toLocaleString('es-AR')}
              {index < completionOptions.length - 1 ? ' o,' : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
