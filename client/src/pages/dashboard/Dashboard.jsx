import PageHeader from '../../components/common/PageHeader';

export default function Dashboard() {
  return (
    <section className="page">
      <PageHeader
        title="Dashboard"
        description="Stock totals, low stock, receipts, deliveries, and transfers will be summarized here."
      />
    </section>
  );
}
