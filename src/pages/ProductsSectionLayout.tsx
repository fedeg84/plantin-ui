import SectionTabsLayout, { SectionTab } from '../components/SectionTabsLayout';

const productTabs: SectionTab[] = [
  {
    id: 'products',
    label: 'Productos',
    to: '/products',
    isActive: (pathname) =>
      pathname === '/products' ||
      (pathname.startsWith('/products/') && !pathname.startsWith('/products/types')),
  },
  {
    id: 'types',
    label: 'Tipos de Producto',
    to: '/products/types',
    isActive: (pathname) =>
      pathname === '/products/types' || pathname.startsWith('/product-types'),
  },
];

export default function ProductsSectionLayout() {
  return (
    <SectionTabsLayout
      title="Productos"
      tabs={productTabs}
    />
  );
}
