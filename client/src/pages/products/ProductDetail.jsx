import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/common/Modal';
import { Badge, ErrorState, TableSkeleton } from '../../components/common/States';
import { categoryService, productService } from '../../services/inventoryService';
import { errorMessage } from '../../services/api';
import { formatDay, formatNumber } from '../../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState(null);

  function load() {
    setError('');
    productService.get(id)
      .then((response) => {
        setProduct(response.data);
        setForm({
          name: response.data.name,
          sku: response.data.sku,
          category: response.data.category?._id || '',
          unit: response.data.unit,
          reorderLevel: response.data.reorderLevel,
          description: response.data.description || '',
          isActive: response.data.isActive,
        });
      })
      .catch((err) => setError(errorMessage(err)));
  }

  useEffect(() => {
    load();
    categoryService.list({ limit: 100 }).then((response) => setCategories(response.data)).catch(() => {});
  }, [id]);

  async function onSave(event) {
    event.preventDefault();
    try {
      const response = await productService.update(id, { ...form, reorderLevel: Number(form.reorderLevel) });
      setProduct(response.data);
      toast.notify('Product updated successfully.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function onDelete() {
    try {
      await productService.remove(id);
      toast.notify('Product deleted successfully.');
      navigate('/products');
    } catch (err) {
      toast.error(errorMessage(err));
      setConfirm(false);
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!product || !form) return <TableSkeleton />;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="muted"><Link to="/products">Products</Link> / {product.sku}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
        </div>
        <Badge value={product.stockStatus} />
      </header>
      <div className="split">
        <article className="card card-pad">
          <h2>Product information</h2>
          <form className="form-grid" onSubmit={onSave} style={{ marginTop: 12 }}>
            <div className="field"><label htmlFor="edit-name">Name</label><input id="edit-name" value={form.name} disabled={!isManager} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="field"><label htmlFor="edit-sku">SKU</label><input id="edit-sku" value={form.sku} disabled={!isManager} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></div>
            <div className="field"><label htmlFor="edit-category">Category</label>
              <select id="edit-category" value={form.category} disabled={!isManager} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="edit-reorder">Reorder level</label><input id="edit-reorder" type="number" min="0" step="0.001" value={form.reorderLevel} disabled={!isManager} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} /></div>
            <div className="field wide"><label htmlFor="edit-description">Description</label><textarea id="edit-description" value={form.description} disabled={!isManager} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
            <div className="form-footer wide">
              <label className="check-line"><input type="checkbox" checked={form.isActive} disabled={!isManager} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active</label>
              {isManager ? (
                <div className="form-footer-actions">
                  <button className="btn btn-danger" type="button" onClick={() => setConfirm(true)}>Delete</button>
                  <button className="btn btn-primary" type="submit">Save changes</button>
                </div>
              ) : null}
            </div>
          </form>
        </article>
        <article className="card card-pad">
          <h2>Current stock</h2>
          <p style={{ fontSize: '2rem', margin: '8px 0' }}>{formatNumber(product.currentStock)} {product.unit}</p>
          <p className="muted">Reorder level {formatNumber(product.reorderLevel)} {product.unit}</p>
          <h3 style={{ marginTop: 16 }}>Available locations</h3>
          {product.locations?.length ? product.locations.map((level) => (
            <p key={level._id}>{level.warehouse?.name} / {level.location?.name}: {formatNumber(level.quantity)} {product.unit}</p>
          )) : <p className="muted">No stock has been received yet.</p>}
        </article>
      </div>
      <article className="card sheet">
        <div className="sheet-title"><h2>Recent movements</h2></div>
        <div className="sheet-head move-cols">
          <span>When</span><span>Product</span><span>Type</span><span>Reference</span><span>Quantity</span><span>User</span>
        </div>
        {product.movements?.length ? product.movements.map((move) => (
          <div className="sheet-row move-cols" key={move._id}>
            <span className="sheet-when"><span className="sheet-label">When</span>{formatDay(move.occurredAt)}</span>
            <span className="sheet-product"><strong>{move.productName || product.name}</strong><span>{move.sku || product.sku}</span></span>
            <span><span className="sheet-label">Type</span><Badge value={move.type} /></span>
            <span><span className="sheet-label">Reference</span>{move.reference}</span>
            <span className="sheet-qty"><span className="sheet-label">Quantity</span>{formatNumber(move.signedQuantity ?? move.quantity)}</span>
            <span><span className="sheet-label">User</span>{move.userName}</span>
            <p className="sheet-meta">{formatNumber(move.previousStock)} → {formatNumber(move.newStock)} at {move.locationName || move.sourceLocationName || '—'}</p>
          </div>
        )) : <p className="sheet-empty muted">No movements yet.</p>}
      </article>
      {confirm ? (
        <ConfirmDialog
          title="Delete product"
          message="Are you sure you want to delete this product? Products with stock history should be deactivated instead."
          confirmLabel="Delete product"
          onClose={() => setConfirm(false)}
          onConfirm={onDelete}
        />
      ) : null}
    </section>
  );
}
