import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Boxes, PackageX, TriangleAlert } from 'lucide-react';
import FilterBar from '../../components/common/FilterBar';
import { ErrorState, TableSkeleton, Badge } from '../../components/common/States';
import { dashboardService, warehouseService, categoryService } from '../../services/inventoryService';
import { useTheme } from '../../context/ThemeContext';
import { ROUTES } from '../../constants/routes';
import { formatDay, formatNumber, STATUS_LABELS } from '../../utils/format';

const EMPTY_FILTERS = { range: '30d', documentType: 'all', status: 'all', warehouse: '', location: '', category: '', from: '', to: '' };

export default function Dashboard() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const grid = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';
  const tick = { fill: dark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 };
  const tooltipStyle = dark
    ? { borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#f8fafc' }
    : { borderRadius: 10, border: '1px solid #e7e8ef', background: '#ffffff', color: '#1f2937' };
  const legendStyle = { color: dark ? '#cbd5e1' : '#334155', fontWeight: 500 };
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    warehouseService.list({ limit: 50 }).then((response) => setWarehouses(response.data)).catch(() => {});
    categoryService.list({ limit: 50 }).then((response) => setCategories(response.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!filters.warehouse) {
      setLocations([]);
      return;
    }
    warehouseService.locations({ warehouse: filters.warehouse }).then((response) => setLocations(response.data)).catch(() => {});
  }, [filters.warehouse]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dashboardService.get(filters)
      .then((response) => {
        if (active) {
          setData(response.data);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to reach the server. Check your connection and try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  function update(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value, ...(name === 'warehouse' ? { location: '' } : {}), ...(name === 'range' && value !== 'custom' ? { from: '', to: '' } : {}) }));
  }

  const movement = (data?.movement || []).map((row) => ({ ...row, label: formatDay(row.date) }));

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Current stock comes from the ledger. Movement charts follow the selected dates.</p>
        </div>
      </header>
      <FilterBar>
        <div className="field"><label htmlFor="range">Date range</label>
          <select id="range" name="range" value={filters.range} onChange={update}>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
        {filters.range === 'custom' ? (
          <>
            <div className="field"><label htmlFor="from">From</label><input id="from" type="date" name="from" value={filters.from} onChange={update} /></div>
            <div className="field"><label htmlFor="to">To</label><input id="to" type="date" name="to" value={filters.to} onChange={update} /></div>
          </>
        ) : null}
        <div className="field"><label htmlFor="documentType">Document type</label>
          <select id="documentType" name="documentType" value={filters.documentType} onChange={update}>
            <option value="all">All</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="transfer">Internal transfers</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
        <div className="field"><label htmlFor="status">Status</label>
          <select id="status" name="status" value={filters.status} onChange={update}>
            <option value="all">All</option>
            {['draft', 'waiting', 'ready', 'done', 'canceled'].map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="warehouse">Warehouse</label>
          <select id="warehouse" name="warehouse" value={filters.warehouse} onChange={update}>
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="location">Location</label>
          <select id="location" name="location" value={filters.location} onChange={update}>
            <option value="">All locations</option>
            {locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="category">Category</label>
          <select id="category" name="category" value={filters.category} onChange={update}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        </div>
      </FilterBar>
      {loading ? <TableSkeleton /> : null}
      {error ? <ErrorState description={error} onRetry={() => setFilters({ ...filters })} /> : null}
      {data && !loading ? (
        <>
          <div className="kpi-grid">
            <Link className="card kpi kpi-indigo" to={ROUTES.PRODUCTS}><span className="kpi-icon"><Boxes size={18} /></span><span><strong>{formatNumber(data.kpis.productsInStock)}</strong><span>Products in stock · {formatNumber(data.kpis.unitsOnHand)} units</span></span></Link>
            <Link className="card kpi kpi-amber" to={`${ROUTES.PRODUCTS}?stockStatus=low_stock`}><span className="kpi-icon"><TriangleAlert size={18} /></span><span><strong>{formatNumber(data.kpis.lowStock)}</strong><span>Low stock items</span></span></Link>
            <Link className="card kpi kpi-rose" to={`${ROUTES.PRODUCTS}?stockStatus=out_of_stock`}><span className="kpi-icon"><PackageX size={18} /></span><span><strong>{formatNumber(data.kpis.outOfStock)}</strong><span>Out of stock items</span></span></Link>
            <Link className="card kpi kpi-sky" to={ROUTES.RECEIPTS}><span className="kpi-icon"><ArrowDownToLine size={18} /></span><span><strong>{formatNumber(data.kpis.pendingReceipts)}</strong><span>Pending receipts</span></span></Link>
            <Link className="card kpi kpi-violet" to={ROUTES.DELIVERIES}><span className="kpi-icon"><ArrowUpFromLine size={18} /></span><span><strong>{formatNumber(data.kpis.pendingDeliveries)}</strong><span>Pending deliveries</span></span></Link>
            <Link className="card kpi kpi-teal" to={ROUTES.TRANSFERS}><span className="kpi-icon"><ArrowLeftRight size={18} /></span><span><strong>{formatNumber(data.kpis.scheduledTransfers)}</strong><span>Scheduled transfers</span></span></Link>
          </div>
          <div className="chart-grid">
            <article className="card card-pad chart-card">
              <h2>Stock movement overview</h2>
              <p>X-axis: date. Y-axis: quantity. Incoming receipts, outgoing deliveries, and adjustment differences.</p>
              <div className="chart-frame">
                <ResponsiveContainer>
                  <LineChart data={movement} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                    <CartesianGrid stroke={grid} vertical={false} />
                    <XAxis dataKey="label" tick={tick} height={42} label={{ value: 'Date', position: 'insideBottom', offset: -2, fill: tick.fill, fontSize: 11 }} />
                    <YAxis width={52} tick={tick} label={{ value: 'Quantity', angle: -90, position: 'insideLeft', fill: tick.fill, fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={legendStyle} />
                    <Line type="monotone" dataKey="incoming" name="Incoming stock" stroke={dark ? '#9b8afb' : '#8b7cf6'} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="outgoing" name="Outgoing stock" stroke={dark ? '#fbbf24' : '#d99a24'} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="adjustments" name="Adjustments" stroke={dark ? '#60a5fa' : '#4f7cff'} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="card card-pad chart-card">
              <h2>Low stock overview</h2>
              <p>Products at or below their reorder level.</p>
              {data.lowStock.length === 0 ? <p className="muted">No products are currently below their reorder level.</p> : (
                <div className="stock-list">
                  {data.lowStock.map((item) => (
                    <Link className="stock-row" key={item.id} to={`/products/${item.id}`}>
                      <span className="stock-id">
                        <strong>{item.name}</strong>
                        <span className="muted">{item.sku}</span>
                      </span>
                      <span className="stock-meta">
                        <Badge value="low_stock" />
                        <span className="stock-qty">{formatNumber(item.quantity)} / {formatNumber(item.reorderLevel)} {item.unit}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          </div>
          <div className="chart-grid">
            <article className="card card-pad chart-card">
              <h2>Inventory by category</h2>
              <p>X-axis: product category. Y-axis: stock quantity.</p>
              <div className="chart-frame">
                <ResponsiveContainer>
                  <BarChart data={data.byCategory} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                    <CartesianGrid stroke={grid} vertical={false} />
                    <XAxis dataKey="category" interval={0} angle={-28} textAnchor="end" height={78} tick={{ ...tick, fontSize: 11 }} label={{ value: 'Category', position: 'insideBottom', offset: -2, fill: tick.fill, fontSize: 11 }} />
                    <YAxis width={52} tick={tick} label={{ value: 'Quantity', angle: -90, position: 'insideLeft', fill: tick.fill, fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="quantity" name="Stock quantity" fill={dark ? '#9b8afb' : '#8b7cf6'} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="card card-pad chart-card">
              <h2>Warehouse stock</h2>
              <p>X-axis: warehouse. Y-axis: total stock.</p>
              <div className="chart-frame">
                <ResponsiveContainer>
                  <BarChart data={data.byWarehouse} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                    <CartesianGrid stroke={grid} vertical={false} />
                    <XAxis dataKey="warehouse" interval={0} angle={-18} textAnchor="end" height={78} tick={{ ...tick, fontSize: 11 }} label={{ value: 'Warehouse', position: 'insideBottom', offset: -2, fill: tick.fill, fontSize: 11 }} />
                    <YAxis width={52} tick={tick} label={{ value: 'Quantity', angle: -90, position: 'insideLeft', fill: tick.fill, fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="quantity" name="Total stock" fill={dark ? '#60a5fa' : '#4f7cff'} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
          <article className="card sheet">
            <div className="sheet-title"><h2>Recent movements</h2></div>
            <div className="sheet-head move-cols">
              <span>When</span><span>Product</span><span>Type</span><span>Reference</span><span>Quantity</span><span>User</span>
            </div>
            {data.recent.length === 0 ? <p className="sheet-empty muted">No movements in this range.</p> : data.recent.map((row) => (
              <div className="sheet-row move-cols" key={row._id}>
                <span className="sheet-when"><span className="sheet-label">When</span>{formatDay(row.occurredAt)}</span>
                <span className="sheet-product"><strong>{row.productName}</strong><span>{row.sku}</span></span>
                <span><span className="sheet-label">Type</span><Badge value={row.type} /></span>
                <span><span className="sheet-label">Reference</span>{row.reference}</span>
                <span className="sheet-qty"><span className="sheet-label">Quantity</span>{formatNumber(row.signedQuantity)}</span>
                <span><span className="sheet-label">User</span>{row.userName}</span>
              </div>
            ))}
          </article>
        </>
      ) : null}
    </section>
  );
}
