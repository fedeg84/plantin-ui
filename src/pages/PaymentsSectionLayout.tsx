import SectionTabsLayout, { SectionTab } from '../components/SectionTabsLayout';

const paymentTabs: SectionTab[] = [
  {
    id: 'payments',
    label: 'Pagos',
    to: '/admin/payments',
    isActive: (pathname) =>
      pathname === '/admin/payments' ||
      pathname.startsWith('/admin/expenses') ||
      (pathname.startsWith('/admin/payments/') && !pathname.startsWith('/admin/payments/types')),
  },
  {
    id: 'types',
    label: 'Tipos de Pago',
    to: '/admin/payments/types',
    isActive: (pathname) =>
      pathname === '/admin/payments/types' || pathname.startsWith('/admin/expense-types'),
  },
];

export default function PaymentsSectionLayout() {
  return (
    <SectionTabsLayout
      title="Pagos"
      tabs={paymentTabs}
    />
  );
}
