import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../../components/common/FilterBar';
import Pagination from '../../components/common/Pagination';
import { Badge, EmptyState, ErrorState, TableSkeleton } from '../../components/common/States';
import usePagedList from '../../hooks/usePagedList';
import { dashboardService, ledgerService, productService, warehouseService } from '../../services/inventoryService';
import { formatDateParts, formatDay, formatNumber } from '../../utils/format';

export default function MoveHistory() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState(params.get('search') || '');
  const query = {
    page: Number(params.get('page') || 1),
    limit: 20,
    search: params.get('search') || '',
    type: params.get('type') || '',
    product: params.get('product') || '',
    warehouse: params.get('warehouse') || '',
    user: params.get('user') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
  };
  const list = usePagedList(ledgerService.list, query);

  useEffect(() => {
    productService.options().then((response) => setProducts(response.data)).catch(() => {});
    warehouseService.list({ limit: 50 }).then((response) => setWarehouses(response.data)).catch(() => {});
    dashboardService.users().then((response) => setUsers(response.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((current) => {
        const currentSearch = current.get('search') || '';
        if (currentSearch === searchInput) return current;
        const next = new URLSearchParams(current);
        if (searchInput) next.set('search', searchInput); else next.delete('search');
        next.set('page', '1');
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setParams]);

  function setFilter(name, value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value); else next.delete(name);
      if (name !== 'page') next.set('page', '1');
      return next;
    });
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Stock ledger</h1>
          <p>Every receipt, delivery, transfer, and adjustment is recorded here. Ledger rows cannot be edited.</p>
        </div>
      </header>
      <FilterBar>
        <div className="field"><label htmlFor="ledger-search">Search</label><input id="ledger-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Product, SKU, reference" /></div>
        <div className="field"><label htmlFor="ledger-type">Operation</label>
          <select id="ledger-type" value={query.type} onChange={(event) => setFilter('type', event.target.value)}>
            <option value="">All</option>
            {['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'].map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="ledger-product">Product</label>
          <select id="ledger-product" value={query.product} onChange={(event) => setFilter('product', event.target.value)}>
            <option value="">All</option>
            {products.map((product) => <option key={product._id} value={product._id}>{product.sku}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="ledger-warehouse">Warehouse</label>
          <select id="ledger-warehouse" value={query.warehouse} onChange={(event) => setFilter('warehouse', event.target.value)}>
            <option value="">All</option>
            {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="ledger-user">User</label>
          <select id="ledger-user" value={query.user} onChange={(event) => setFilter('user', event.target.value)}>
            <option value="">All</option>
            {users.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="ledger-from">From</label><input id="ledger-from" type="date" value={query.from} onChange={(event) => setFilter('from', event.target.value)} /></div>
        <div className="field"><label htmlFor="ledger-to">To</label><input id="ledger-to" type="date" value={query.to} onChange={(event) => setFilter('to', event.target.value)} /></div>
      </FilterBar>
      {list.loading ? <TableSkeleton /> : null}
      {list.error ? <ErrorState description={list.error} onRetry={() => setParams(new URLSearchParams(params))} /> : null}
      {!list.loading && !list.error && list.rows.length === 0 ? <div className="card"><EmptyState title="No movements found." description="Validated operations will appear in the stock ledger." /></div> : null}
      {list.rows.length > 0 ? (
        <>
        <div className="card ledger-table">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th><th>Product</th><th>Type</th><th>Reference</th><th className="num">Quantity</th>
                  <th className="num">Previous</th><th className="num">New</th><th>Source</th><th>Destination</th><th>User</th><th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => {
                  const when = formatDateParts(row.occurredAt);
                  return (
                    <tr key={row._id}>
                      <td><span className="cell-stack"><span>{formatDay(row.occurredAt)}</span><span className="muted">{when.time}</span></span></td>
                      <td><span className="cell-stack"><strong>{row.productName}</strong><span className="muted">{row.sku}</span></span></td>
                      <td><Badge value={row.type} /></td>
                      <td>{row.reference}</td>
                      <td className="num">{formatNumber(row.signedQuantity ?? row.quantity)}</td>
                      <td className="num">{formatNumber(row.previousStock)}</td>
                      <td className="num">{formatNumber(row.newStock)}</td>
                      <td>{row.sourceLocationName || row.locationName || '—'}</td>
                      <td>{row.destinationLocationName || '—'}</td>
                      <td>{row.userName}</td>
                      <td className="cell-wrap">{row.reason || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={list.meta} onPage={(page) => setFilter('page', String(page))} />
        </div>
        <div className="card sheet ledger-cards">
          <div className="sheet-head move-cols">
            <span>When</span><span>Product</span><span>Type</span><span>Reference</span><span>Quantity</span><span>User</span>
          </div>
          {list.rows.map((row) => {
            const when = formatDateParts(row.occurredAt);
            return (
              <div className="sheet-row move-cols" key={row._id}>
                <span className="sheet-when"><span className="sheet-label">When</span>{formatDay(row.occurredAt)}<span className="sheet-sub">{when.time}</span></span>
                <span className="sheet-product"><strong>{row.productName}</strong><span>{row.sku}</span></span>
                <span><span className="sheet-label">Type</span><Badge value={row.type} /></span>
                <span><span className="sheet-label">Reference</span>{row.reference}</span>
                <span className="sheet-qty"><span className="sheet-label">Quantity</span>{formatNumber(row.signedQuantity ?? row.quantity)}</span>
                <span><span className="sheet-label">User</span>{row.userName}</span>
                <p className="sheet-meta">
                  {formatNumber(row.previousStock)} → {formatNumber(row.newStock)}
                  {' · '}{row.sourceLocationName || row.locationName || '—'}
                  {row.destinationLocationName ? ` → ${row.destinationLocationName}` : ''}
                  {row.reason ? ` · ${row.reason}` : ''}
                  {' · '}<Badge value={row.status || 'done'} />
                </p>
              </div>
            );
          })}
          <Pagination meta={list.meta} onPage={(page) => setFilter('page', String(page))} />
        </div>
        </>
      ) : null}
    </section>
  );
}
