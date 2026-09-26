import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EmptyState, ErrorState, TableSkeleton } from '../../components/common/States';
import { dashboardService } from '../../services/inventoryService';
import { errorMessage } from '../../services/api';
import { formatNumber } from '../../utils/format';

export default function Alerts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  function load() {
    dashboardService.alerts().then((response) => { setData(response.data); setError(''); }).catch((err) => setError(errorMessage(err)));
  }
  useEffect(() => { load(); }, []);
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!data) return <TableSkeleton />;
  const empty = data.lowStock.length === 0 && data.outOfStock.length === 0 && data.warehouseRules.length === 0;

  return (
    <section className="page">
      <header className="page-header"><div><h1>Alerts</h1><p>Low stock means on-hand quantity is at or below the reorder level. Out of stock means quantity is zero.</p></div></header>
      {empty ? <div className="card"><EmptyState title="No stock alerts." description="Products below their reorder level will show up here." /></div> : null}
      <div className="split">
        <article className="card card-pad">
          <div className="section-title"><h2>Out of stock</h2><span className="count-pill">{data.outOfStock.length}</span></div>
          {data.outOfStock.length === 0 ? <p className="muted">None</p> : (
            <div className="stock-list">
              {data.outOfStock.map((item) => (
                <Link className="stock-row" key={item.id} to={`/products/${item.id}`}>
                  <span className="stock-id">
                    <strong>{item.name}</strong>
                    <span className="muted">{item.sku}</span>
                  </span>
                  <span className="stock-meta"><Badge value="out_of_stock" /></span>
                </Link>
              ))}
            </div>
          )}
        </article>
        <article className="card card-pad">
          <div className="section-title"><h2>Low stock</h2><span className="count-pill">{data.lowStock.length}</span></div>
          {data.lowStock.length === 0 ? <p className="muted">None</p> : (
            <div className="stock-list">
              {data.lowStock.map((item) => (
                <Link className="stock-row" key={item.id} to={`/products/${item.id}`}>
                  <span className="stock-id">
                    <strong>{item.name}</strong>
                    <span className="muted">{formatNumber(item.quantity)} / {formatNumber(item.reorderLevel)} {item.unit}</span>
                  </span>
                  <span className="stock-meta"><Badge value="low_stock" /></span>
                </Link>
              ))}
            </div>
          )}
        </article>
      </div>
      <article className="card card-pad">
        <div className="section-title"><h2>Warehouse reorder rules</h2><span className="count-pill">{data.warehouseRules.length}</span></div>
        {data.warehouseRules.length === 0 ? <p className="muted">No warehouse rules are currently breached.</p> : (
          <div className="stock-list">
            {data.warehouseRules.map((item) => (
              <Link className="stock-row" key={`${item.productId}-${item.warehouse}`} to={`/products/${item.productId}`}>
                <span className="stock-id">
                  <strong>{item.name}</strong>
                  <span className="muted">{item.warehouse}</span>
                </span>
                <span className="stock-meta">
                  <Badge value={item.scope} />
                  <span className="stock-qty">{formatNumber(item.quantity)} / {formatNumber(item.reorderLevel)} {item.unit}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
