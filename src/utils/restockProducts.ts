import type { Product, Sale } from '../types/api';

export interface RestockProduct {
  product: Product;
  lastSaleTime: string;
  lastSaleByUsername: string;
}

/** Sales must be sorted by time descending (most recent first). */
export function buildRestockList(
  sales: Sale[],
  productsById: Map<number, Product>
): RestockProduct[] {
  const lastSaleByProduct = new Map<number, { time: string; username: string }>();

  for (const sale of sales) {
    for (const item of sale.items) {
      const productId = item.product.id;
      if (!lastSaleByProduct.has(productId)) {
        lastSaleByProduct.set(productId, {
          time: sale.time,
          username: sale.created_by_username,
        });
      }
    }
  }

  const result: RestockProduct[] = [];

  for (const [productId, lastSale] of lastSaleByProduct) {
    const product = productsById.get(productId);
    if (product && product.current_stock <= 1) {
      result.push({
        product,
        lastSaleTime: lastSale.time,
        lastSaleByUsername: lastSale.username,
      });
    }
  }

  return result.sort((a, b) => a.product.name.localeCompare(b.product.name, 'es'));
}
