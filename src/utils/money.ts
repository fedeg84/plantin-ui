/** Pesos enteros (sin centavos). */
export function roundPeso(n: number): number {
  return Math.round(Number(n) || 0);
}

export type PaymentLineInput = {
  amount: number;
  discount?: number;
};

function methodCoverage(finalAmount: number, discountPercentage: number): number {
  if (discountPercentage >= 100) return 0;
  return finalAmount / (1 - discountPercentage / 100);
}

function paymentLinesDiscountTotal(lines: PaymentLineInput[]): number {
  return lines.reduce((total, pm) => total + paymentMethodLineDiscountAmount(pm), 0);
}

/** Reparto proporcional (EditSalePage). */
export function computeEditSaleTargetAmounts(
  productsSubtotal: number,
  lines: PaymentLineInput[]
): number[] {
  if (lines.length === 0) return [];
  if (lines.length === 1) {
    const discountPercentage = lines[0].discount || 0;
    return [roundPeso(productsSubtotal * (1 - discountPercentage / 100))];
  }

  const totalDiscountAmount = paymentLinesDiscountTotal(lines);
  const remainingAmount = productsSubtotal - totalDiscountAmount;
  if (remainingAmount <= 0) return lines.map(() => 0);

  const totalCoverage = lines.reduce(
    (sum, pm) => sum + methodCoverage(remainingAmount, pm.discount || 0),
    0
  );

  const amounts = lines.map((pm) => {
    const discountPercentage = pm.discount || 0;
    const coverage = methodCoverage(remainingAmount, discountPercentage);
    const proportion = totalCoverage > 0 ? coverage / totalCoverage : 1 / lines.length;
    return roundPeso(remainingAmount * proportion);
  });

  const target = roundPeso(productsSubtotal - totalDiscountAmount);
  let sum = 0;
  for (let i = 0; i < amounts.length - 1; i++) {
    sum += amounts[i];
  }
  amounts[amounts.length - 1] = Math.max(0, target - sum);
  return amounts;
}

/** Reparto secuencial (CreateSalePage). */
export function computeCreateSaleTargetAmounts(
  productsSubtotal: number,
  lines: PaymentLineInput[]
): number[] {
  if (lines.length === 0) return [];
  if (lines.length === 1) {
    const discountPercentage = lines[0].discount || 0;
    return [roundPeso(productsSubtotal * (1 - discountPercentage / 100))];
  }

  let remainingTotal = productsSubtotal;
  const amounts: number[] = [];

  lines.forEach((pm, filledIndex) => {
    const discountPercentage = pm.discount || 0;
    if (filledIndex === lines.length - 1) {
      amounts.push(roundPeso(Math.max(0, remainingTotal * (1 - discountPercentage / 100))));
    } else {
      const avgAmount = remainingTotal / (lines.length - filledIndex);
      const finalAmount = avgAmount * (1 - discountPercentage / 100);
      amounts.push(roundPeso(Math.max(0, finalAmount)));
      remainingTotal -= methodCoverage(finalAmount, discountPercentage);
    }
  });

  const target = roundPeso(productsSubtotal - paymentLinesDiscountTotal(lines));
  let sum = 0;
  for (let i = 0; i < amounts.length - 1; i++) {
    sum += amounts[i];
  }
  amounts[amounts.length - 1] = Math.max(0, target - sum);
  return amounts;
}

export function computePaymentAmountIfOthersFixed(
  productsSubtotal: number,
  lines: PaymentLineInput[],
  targetIndex: number
): number {
  const discountPercentage = lines[targetIndex].discount || 0;
  if (discountPercentage >= 100) return 0;

  let otherSum = 0;
  let otherDiscounts = 0;
  lines.forEach((line, index) => {
    if (index === targetIndex) return;
    otherSum += line.amount || 0;
    otherDiscounts += paymentMethodLineDiscountAmount(line);
  });

  const remainingCoverage = productsSubtotal - otherSum - otherDiscounts;
  return roundPeso(Math.max(0, remainingCoverage * (1 - discountPercentage / 100)));
}

/** Monto de cada método si se mantienen fijos los demás (con descuento aplicado). */
export function getPaymentCompletionOptions(
  productsSubtotal: number,
  lines: Array<PaymentLineInput & { name: string; payment_method_id?: number }>
): Array<{ name: string; payment_method_id?: number; amount: number }> {
  return lines.map((line, index) => ({
    name: line.name,
    payment_method_id: line.payment_method_id,
    amount: computePaymentAmountIfOthersFixed(productsSubtotal, lines, index),
  }));
}

/**
 * Total que deben sumar los montos a pagar: subtotal productos menos descuento
 * implícito en los métodos (mismo criterio que el reparto en pantalla).
 */
export function expectedPaymentsTotal(productsSubtotal: number, paymentMethodDiscountsTotal: number): number {
  return roundPeso(productsSubtotal - paymentMethodDiscountsTotal);
}

export function paymentsMatchSaleTotals(
  productsSubtotal: number,
  paymentMethodDiscountsTotal: number,
  paymentsSum: number
): boolean {
  return roundPeso(paymentsSum) === expectedPaymentsTotal(productsSubtotal, paymentMethodDiscountsTotal);
}

/** Descuento en pesos implícito en una línea de método de pago (lista − monto a pagar). */
export function paymentMethodLineDiscountAmount(pm: { amount: number; discount?: number }): number {
  const finalAmount = pm.amount || 0;
  const discountPercentage = pm.discount || 0;
  const originalAmount =
    discountPercentage > 0 ? finalAmount / (1 - discountPercentage / 100) : finalAmount;
  return roundPeso(originalAmount - finalAmount);
}
