import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import FilterBar from '../../components/common/FilterBar';
import { Badge, EmptyState, ErrorState, TableSkeleton } from '../../components/common/States';
import usePagedList from '../../hooks/usePagedList';
import { categoryService, productService, warehouseService } from '../../services/inventoryService';
import { errorMessage } from '../../services/api';
import { STATUS_LABELS, formatDate, formatNumber } from '../../utils/format';

const UNITS = ['PCS', 'KG', 'M', 'L', 'BOX', 'SET', 'ROLL'];
const EMPTY = { name: '', sku: '', category: '', unit: 'PCS', reorderLevel: 0, description: '', isActive: true, initialStock: 0, warehouse: '', location: '' };

export default function Products() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('cards');
  const [searchInput, setSearchInput] = useState(params.get('search') || '');

  const query = {
    page: Number(params.get('page') || 1),
    limit: 20,
    search: params.get('search') || '',
    category: params.get('category') || '',
    warehouse: params.get('warehouse') || '',
    stockStatus: params.get('stockStatus') || '',
    sort: params.get('sort') || 'date',
    direction: params.get('direction') || 'desc',
  };
  const list = usePagedList(productService.list, query);

  useEffect(() => {
    categoryService.list({ limit: 100 }).then((response) => setCategories(response.data)).catch(() => {});
    warehouseService.list({ limit: 50 }).then((response) => setWarehouses(response.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((current) => {
        const currentSearch = current.get('search') || '';
        if (currentSearch === searchInput) return current;
        const next = new URLSearchParams(current);
        if (searchInput) next.set('search', searchInput);
        else next.delete('search');
        next.set('page', '1');
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setParams]);

  function setFilter(name, value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      if (name !== 'page') next.set('page', '1');
      return next;
    });
  }

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  useEffect(() => {
    if (!form.warehouse) {
      setLocations([]);
      return;
    }
    warehouseService.locations({ warehouse: form.warehouse, active: 'true' }).then((response) => setLocations(response.data)).catch(() => {});
  }, [form.warehouse]);

  async function onCreate(event) {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await productService.create({ ...form, reorderLevel: Number(form.reorderLevel), initialStock: Number(form.initialStock) });
      toast.notify('Product created successfully.');
      setOpen(false);
      setForm(EMPTY);
      setParams((current) => new URLSearchParams(current));
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Products</h1>
          <p>Search by name or SKU. Stock status is calculated from on-hand quantity and the reorder level.</p>
        </div>
        <div className="toolbar">
          <div className="view-switch" role="group" aria-label="Product layout">
            <button className={`btn ${view === 'cards' ? 'btn-primary' : ''}`} type="button" onClick={() => setView('cards')}>Cards</button>
            <button className={`btn ${view === 'table' ? 'btn-primary' : ''}`} type="button" onClick={() => setView('table')}>Table</button>
          </div>
          {isManager ? <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>Add product</button> : null}
        </div>
      </header>
      <FilterBar>
        <div className="field"><label htmlFor="product-search">Search</label><input id="product-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name or SKU" /></div>
        <div className="field"><label htmlFor="product-category">Category</label>
          <select id="product-category" value={query.category} onChange={(event) => setFilter('category', event.target.value)}>
            <option value="">All</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="product-warehouse">Warehouse</label>
          <select id="product-warehouse" value={query.warehouse} onChange={(event) => setFilter('warehouse', event.target.value)}>
            <option value="">All</option>
            {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="product-status">Stock status</label>
          <select id="product-status" value={query.stockStatus} onChange={(event) => setFilter('stockStatus', event.target.value)}>
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).filter(([key]) => key.includes('_') || key === 'inactive').map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="product-sort">Sort</label>
          <select id="product-sort" value={query.sort} onChange={(event) => setFilter('sort', event.target.value)}>
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="sku">SKU</option>
            <option value="stock">Stock</option>
          </select>
        </div>
      </FilterBar>
      {list.loading ? <TableSkeleton /> : null}
      {list.error ? <ErrorState description={list.error} onRetry={() => setParams(new URLSearchParams(params))} /> : null}
      {!list.loading && !list.error && list.rows.length === 0 ? (
        <div className="card"><EmptyState title="No products found." description="Add your first product to start managing inventory." /></div>
      ) : null}
      {!list.loading && list.rows.length > 0 && view === 'cards' ? (
        <div className="product-grid">
          {list.rows.map((product) => (
            <Link className="card product-tile" key={product._id} to={`/products/${product._id}`}>
              <span className="tile-row"><strong>{product.name}</strong><Badge value={product.stockStatus} /></span>
              <span className="muted">{product.sku}</span>
              <span>{product.category?.name || 'Uncategorized'}</span>
              <span className="sheet-qty">{formatNumber(product.currentStock)} {product.unit}</span>
              <span className="muted">{product.locationName ? `${product.locationName}${product.warehouseName ? ` · ${product.warehouseName}` : ''}` : 'No location yet'}</span>
              <span className="muted">Reorder {formatNumber(product.reorderLevel)}</span>
            </Link>
          ))}
        </div>
      ) : null}
      {!list.loading && list.rows.length > 0 && view === 'cards' ? <Pagination meta={list.meta} onPage={(page) => setFilter('page', String(page))} /> : null}
      {!list.loading && list.rows.length > 0 && view === 'table' ? (
        <div className="card sheet">
          <div className="sheet-head product-cols">
            <span>Product</span><span>Category</span><span>Stock</span><span>Location</span><span>Status</span><span>Created</span><span></span>
          </div>
          {list.rows.map((product) => (
            <Link className="sheet-row product-cols" key={product._id} to={`/products/${product._id}`}>
              <span className="sheet-product"><strong>{product.name}</strong><span>{product.sku}</span></span>
              <span><span className="sheet-label">Category</span>{product.category?.name || '—'}</span>
              <span className="sheet-qty"><span className="sheet-label">Stock</span>{formatNumber(product.currentStock)} {product.unit}<span className="sheet-sub">Reorder {formatNumber(product.reorderLevel)}</span></span>
              <span><span className="sheet-label">Location</span>{product.locationName || '—'}<span className="sheet-sub">{product.warehouseName || ''}{product.locationCount > 1 ? ` · +${product.locationCount - 1} more` : ''}</span></span>
              <span><span className="sheet-label">Status</span><Badge value={product.stockStatus} /></span>
              <span><span className="sheet-label">Created</span>{formatDate(product.createdAt)}</span>
              <span className="row-action">View</span>
            </Link>
          ))}
          <Pagination meta={list.meta} onPage={(page) => setFilter('page', String(page))} />
        </div>
      ) : null}
      {open ? (
        <Modal
          title="Create product"
          onClose={() => setOpen(false)}
          footer={<><button className="btn" type="button" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit" form="product-form" disabled={busy}>{busy ? 'Saving…' : 'Create product'}</button></>}
        >
          <form id="product-form" className="form-grid" onSubmit={onCreate}>
            <div className="field"><label htmlFor="name">Product name</label><input id="name" name="name" required value={form.name} onChange={update} /></div>
            <div className="field"><label htmlFor="sku">SKU</label><input id="sku" name="sku" required value={form.sku} onChange={update} /></div>
            <div className="field"><label htmlFor="category">Category</label>
              <select id="category" name="category" required value={form.category} onChange={update}>
                <option value="">Select</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="unit">Unit of measure</label>
              <select id="unit" name="unit" value={form.unit} onChange={update}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select>
            </div>
            <div className="field"><label htmlFor="initialStock">Initial stock</label><input id="initialStock" name="initialStock" type="number" min="0" step="0.001" value={form.initialStock} onChange={update} /></div>
            <div className="field"><label htmlFor="reorderLevel">Reorder level</label><input id="reorderLevel" name="reorderLevel" type="number" min="0" step="0.001" value={form.reorderLevel} onChange={update} /></div>
            <div className="field"><label htmlFor="warehouse">Warehouse</label>
              <select id="warehouse" name="warehouse" value={form.warehouse} onChange={update}>
                <option value="">Select if opening stock is above zero</option>
                {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="location">Location</label>
              <select id="location" name="location" value={form.location} onChange={update}>
                <option value="">Select</option>
                {locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}
              </select>
            </div>
            <div className="field wide"><label htmlFor="description">Description</label><textarea id="description" name="description" value={form.description} onChange={update} /></div>
            <label className="wide"><input type="checkbox" name="isActive" checked={form.isActive} onChange={update} /> Active</label>
            {formError ? <p className="form-error wide">{formError}</p> : null}
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
