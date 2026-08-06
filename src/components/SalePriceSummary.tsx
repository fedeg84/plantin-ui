import { roundPeso, paymentMethodLineDiscountAmount } from '../utils/money';
import type { Product } from '../types/api';

type SaleItemRow = { product_id: number; quantity?: number };
type PaymentRow = { payment_method_id: number; amount: number; discount?: number };

type Props = {
  saleItems: SaleItemRow[];
  selectedProducts: { [key: number]: Product };
  paymentMethods: PaymentRow[];
};

export default function SalePriceSummary({ saleItems, selectedProducts, paymentMethods }: Props) {
  const productRows = saleItems
    .map((item, index) => {
      const product = selectedProducts[index];
      if (!item.product_id || !product || !item.quantity) return null;
      const qty = item.quantity;
      const unit = product.current_price;
      const lineTotal = roundPeso(unit * qty);
      return (
        <li
          key={`p-${index}`}
          className="flex justify-between gap-4 text-sm border-b border-gray-100 py-2"
        >
          <span className="text-gray-800">
            <span className="font-medium">{product.name}</span>
            <span className="text-gray-500"> · {qty} u. × ${roundPeso(unit).toLocaleString('es-AR')}</span>
          </span>
          <span className="text-gray-900 font-medium tabular-nums shrink-0">
            ${lineTotal.toLocaleString('es-AR')}
          </span>
        </li>
      );
    })
    .filter(Boolean);

  const discountRows = paymentMethods
    .map((pm, index) => {
      if (!pm.payment_method_id) return null;
      const disc = paymentMethodLineDiscountAmount(pm);
      if (disc <= 0) return null;
      const pct = pm.discount ?? 0;
      return (
        <li
          key={`d-${index}`}
          className="flex justify-between gap-4 text-sm text-green-700 border-b border-gray-100 py-2"
        >
          <span>Descuento por método de pago ({pct}%)</span>
          <span className="tabular-nums shrink-0">-${disc.toLocaleString('es-AR')}</span>
        </li>
      );
    })
    .filter(Boolean);

  const totalPayments = paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0);

  const hasAnyLine = productRows.length > 0 || discountRows.length > 0;

  return (
    <div className="space-y-0">
      {!hasAnyLine ? (
        <p className="text-sm text-gray-500 py-2">Seleccioná productos para ver el detalle.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {productRows}
          {discountRows}
        </ul>
      )}

      <div className="flex justify-between text-lg font-semibold pt-4 mt-2 border-t border-gray-200">
        <span>Total a pagar</span>
        <span className="text-green-600 tabular-nums">
          ${Math.max(0, roundPeso(totalPayments)).toLocaleString('es-AR')}
        </span>
      </div>
    </div>
  );
}
