import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States';
import Pagination from '../../components/common/Pagination';
import { errorMessage } from '../../services/api';
import { productService, reorderService, warehouseService } from '../../services/inventoryService';
import { formatNumber } from '../../utils/format';

export default function ReorderRules() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({ product: '', warehouse: '', reorderLevel: 0 });

  function load() {
    setLoading(true);
    reorderService.list({ page, limit: 20 })
      .then((response) => { setRows(response.data); setMeta(response.meta); setError(''); })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [page]);
  useEffect(() => {
    productService.options().then((response) => setProducts(response.data)).catch(() => {});
    warehouseService.list({ limit: 50 }).then((response) => setWarehouses(response.data)).catch(() => {});
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      await reorderService.save({ ...form, reorderLevel: Number(form.reorderLevel) });
      toast.notify('Reorder rule saved.');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function onDelete(id) {
    try {
      await reorderService.remove(id);
      toast.notify('Reorder rule deleted.');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>Reorder rules</h1><p>A product is low stock when quantity at a warehouse is at or below that warehouse rule, and also when total stock is at or below the product reorder level.</p></div></header>
      {isManager ? (
        <form className="card card-pad filters" onSubmit={onSubmit}>
          <div className="field"><label htmlFor="rule-product">Product</label>
            <select id="rule-product" required value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })}>
              <option value="">Select</option>
              {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="rule-warehouse">Warehouse</label>
            <select id="rule-warehouse" required value={form.warehouse} onChange={(event) => setForm({ ...form, warehouse: event.target.value })}>
              <option value="">Select</option>
              {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="rule-level">Reorder level</label><input id="rule-level" type="number" min="0" step="0.001" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} /></div>
          <button className="btn btn-primary" type="submit">Save rule</button>
        </form>
      ) : null}
      {loading ? <TableSkeleton /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {!loading && rows.length === 0 ? <div className="card"><EmptyState title="No reorder rules yet." description="Add a rule to watch a product inside a specific warehouse." /></div> : null}
      {rows.length > 0 ? (
        <div className="card sheet">
          <div className={`sheet-head rule-cols${isManager ? '' : ' readonly'}`}>
            <span>Product</span><span>SKU</span><span>Warehouse</span><span>Reorder level</span>{isManager ? <span></span> : null}
          </div>
          {rows.map((rule) => (
            <div className={`sheet-row rule-cols${isManager ? '' : ' readonly'}`} key={rule._id}>
              <span className="sheet-product"><strong>{rule.product?.name}</strong><span>{rule.product?.sku}</span></span>
              <span><span className="sheet-label">SKU</span>{rule.product?.sku}</span>
              <span><span className="sheet-label">Warehouse</span>{rule.warehouse?.name}</span>
              <span className="sheet-qty"><span className="sheet-label">Reorder level</span>{formatNumber(rule.reorderLevel)} {rule.product?.unit}</span>
              {isManager ? <span className="sheet-actions"><button className="btn" type="button" onClick={() => onDelete(rule._id)}>Delete</button></span> : null}
            </div>
          ))}
          <Pagination meta={meta} onPage={setPage} />
        </div>
      ) : null}
    </section>
  );
}
