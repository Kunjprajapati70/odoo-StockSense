import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import FilterBar from '../../components/common/FilterBar';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { Badge, EmptyState, ErrorState, TableSkeleton } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';
import usePagedList from '../../hooks/usePagedList';
import { errorMessage } from '../../services/api';
import { productService, warehouseService } from '../../services/inventoryService';
import { STATUS_LABELS, formatDate, formatNumber, toDateInput } from '../../utils/format';

const STATUS = ['all', 'draft', 'waiting', 'ready', 'done', 'canceled'];

function placeName(doc, mode) {
  if (mode === 'transfer') {
    return `${doc.sourceWarehouse?.name || ''} / ${doc.sourceLocation?.name || ''} → ${doc.destinationWarehouse?.name || ''} / ${doc.destinationLocation?.name || ''}`;
  }
  return `${doc.warehouse?.name || '—'} / ${doc.location?.name || '—'}`;
}

export function DocumentList({ title, description, basePath, service, mode, partyKey, partyLabel }) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchInput, setSearchInput] = useState(params.get('search') || '');
  const [form, setForm] = useState(() => initialForm(mode));

  const query = {
    page: Number(params.get('page') || 1),
    limit: 20,
    search: params.get('search') || '',
    status: params.get('status') || '',
    warehouse: params.get('warehouse') || '',
    sort: params.get('sort') || 'date',
    direction: params.get('direction') || 'desc',
  };
  const list = usePagedList(service.list, query);

  useEffect(() => {
    productService.options().then((response) => setProducts(response.data)).catch(() => {});
    warehouseService.list({ limit: 50, active: 'true' }).then((response) => setWarehouses(response.data)).catch(() => {});
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

  async function loadLocations(warehouseId, key) {
    if (!warehouseId) return;
    const response = await warehouseService.locations({ warehouse: warehouseId, active: 'true' });
    setLocations((current) => ({ ...current, [key]: response.data }));
  }

  function setFilter(name, value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value); else next.delete(name);
      if (name !== 'page') next.set('page', '1');
      return next;
    });
  }

  function updateLine(index, field, value) {
    setForm((current) => {
      const items = current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
      return { ...current, items };
    });
  }

  async function onCreate(event) {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() };
      payload.items = form.items.map((item) => (
        mode === 'adjustment'
          ? { product: item.product, physicalCount: Number(item.physicalCount) }
          : { product: item.product, quantity: Number(item.quantity) }
      ));
      const response = await service.create(payload);
      toast.notify(response.message || 'Saved.');
      setOpen(false);
      setForm(initialForm(mode));
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
        <div><h1>{title}</h1><p>{description}</p></div>
        <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>New {mode}</button>
      </header>
      <FilterBar>
        <div className="field"><label htmlFor={`${mode}-search`}>Search</label><input id={`${mode}-search`} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Number or reference" /></div>
        <div className="field"><label htmlFor={`${mode}-status`}>Status</label>
          <select id={`${mode}-status`} value={query.status} onChange={(event) => setFilter('status', event.target.value)}>
            {STATUS.map((status) => <option key={status} value={status === 'all' ? '' : status}>{status === 'all' ? 'All' : STATUS_LABELS[status]}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor={`${mode}-warehouse`}>Warehouse</label>
          <select id={`${mode}-warehouse`} value={query.warehouse} onChange={(event) => setFilter('warehouse', event.target.value)}>
            <option value="">All</option>
            {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
          </select>
        </div>
      </FilterBar>
      {list.loading ? <TableSkeleton /> : null}
      {list.error ? <ErrorState description={list.error} onRetry={() => setParams(new URLSearchParams(params))} /> : null}
      {!list.loading && !list.error && list.rows.length === 0 ? <div className="card"><EmptyState title={`No ${title.toLowerCase()} found.`} description="Create a document when you are ready to move stock." /></div> : null}
      {list.rows.length > 0 ? (
        <div className="card sheet">
          <div className="sheet-head doc-cols">
            <span>Number</span><span>{partyLabel || 'Route'}</span><span>Location</span><span>Date</span><span>Lines</span><span>Status</span>
          </div>
          {list.rows.map((doc) => (
            <Link className="sheet-row doc-cols" key={doc._id} to={`${basePath}/${doc._id}`}>
              <span className="sheet-product"><strong>{doc.number}</strong></span>
              <span><span className="sheet-label">{partyLabel || 'Route'}</span>{doc[partyKey] || '—'}</span>
              <span><span className="sheet-label">Location</span>{placeName(doc, mode)}</span>
              <span><span className="sheet-label">Date</span>{formatDate(doc.date)}</span>
              <span className="sheet-qty"><span className="sheet-label">Lines</span>{doc.items?.length || 0}</span>
              <span><span className="sheet-label">Status</span><Badge value={doc.status} /></span>
            </Link>
          ))}
          <Pagination meta={list.meta} onPage={(page) => setFilter('page', String(page))} />
        </div>
      ) : null}
      {open ? (
        <Modal title={`New ${mode}`} onClose={() => setOpen(false)} footer={<><button className="btn" type="button" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" form={`${mode}-form`} type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</button></>}>
          <form id={`${mode}-form`} className="form-grid" onSubmit={onCreate}>
            {partyKey ? <div className="field wide"><label htmlFor="party">{partyLabel}</label><input id="party" required value={form[partyKey]} onChange={(event) => setForm({ ...form, [partyKey]: event.target.value })} /></div> : null}
            {mode === 'transfer' ? (
              <>
                <WarehouseSelect label="Source warehouse" value={form.sourceWarehouse} onChange={async (value) => { setForm({ ...form, sourceWarehouse: value, sourceLocation: '' }); await loadLocations(value, 'source'); }} warehouses={warehouses} />
                <LocationSelect label="Source location" value={form.sourceLocation} onChange={(value) => setForm({ ...form, sourceLocation: value })} locations={locations.source || []} />
                <WarehouseSelect label="Destination warehouse" value={form.destinationWarehouse} onChange={async (value) => { setForm({ ...form, destinationWarehouse: value, destinationLocation: '' }); await loadLocations(value, 'destination'); }} warehouses={warehouses} />
                <LocationSelect label="Destination location" value={form.destinationLocation} onChange={(value) => setForm({ ...form, destinationLocation: value })} locations={locations.destination || []} />
              </>
            ) : (
              <>
                <WarehouseSelect label="Warehouse" value={form.warehouse} onChange={async (value) => { setForm({ ...form, warehouse: value, location: '' }); await loadLocations(value, 'single'); }} warehouses={warehouses} />
                <LocationSelect label="Location" value={form.location} onChange={(value) => setForm({ ...form, location: value })} locations={locations.single || []} />
              </>
            )}
            {mode === 'adjustment' ? <div className="field wide"><label htmlFor="reason">Reason</label><input id="reason" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></div> : null}
            <div className="field"><label htmlFor="date">Date</label><input id="date" type="datetime-local" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
            <div className="field wide"><label htmlFor="notes">Notes</label><textarea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
            <div className="wide lines">
              {form.items.map((item, index) => (
                <div className="line" key={index}>
                  <div className="field"><label>Product</label>
                    <select required value={item.product} onChange={(event) => updateLine(index, 'product', event.target.value)}>
                      <option value="">Select</option>
                      {products.map((product) => <option key={product._id} value={product._id}>{product.name} ({product.sku})</option>)}
                    </select>
                  </div>
                  <div className="field"><label>{mode === 'adjustment' ? 'Physical count' : 'Quantity'}</label>
                    <input type="number" min="0" step="0.001" required value={mode === 'adjustment' ? item.physicalCount : item.quantity} onChange={(event) => updateLine(index, mode === 'adjustment' ? 'physicalCount' : 'quantity', event.target.value)} />
                  </div>
                  <button className="btn" type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) })} disabled={form.items.length === 1}>Remove</button>
                </div>
              ))}
              <button className="btn" type="button" onClick={() => setForm({ ...form, items: [...form.items, blankLine(mode)] })}>Add line</button>
            </div>
            {formError ? <p className="form-error wide">{formError}</p> : null}
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

export function DocumentDetail({ service, mode, partyKey, partyLabel, listPath }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    service.get(id).then((response) => { setDoc(response.data); setError(''); }).catch((err) => setError(errorMessage(err)));
  }
  useEffect(() => { load(); }, [id]);

  async function run(action, success) {
    setBusy(true);
    try {
      const response = await action();
      toast.notify(response.message || success);
      if (response.data) setDoc(response.data); else load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!doc) return <TableSkeleton />;
  const open = ['draft', 'waiting', 'ready'].includes(doc.status);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="muted"><Link to={listPath}>Back</Link></p>
          <h1>{doc.number}</h1>
          <p>{placeName(doc, mode)}</p>
        </div>
        <Badge value={doc.status} />
      </header>
      <article className="card card-pad">
        <p><strong>{partyLabel}:</strong> {doc[partyKey] || doc.reason}</p>
        <p className="muted">{formatDate(doc.date)} · Created by {doc.createdBy?.name || '—'}</p>
        {doc.notes ? <p>{doc.notes}</p> : null}
        <div className="sheet" style={{ marginTop: 12, border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
          <div className="sheet-head line-cols">
            <span>Product</span><span>SKU</span><span>{mode === 'adjustment' ? 'Physical count' : 'Quantity'}</span><span>Unit</span>
          </div>
          {doc.items.map((item, index) => (
            <div className="sheet-row line-cols" key={index}>
              <span className="sheet-product"><strong>{item.product?.name}</strong></span>
              <span><span className="sheet-label">SKU</span>{item.product?.sku}</span>
              <span className="sheet-qty"><span className="sheet-label">{mode === 'adjustment' ? 'Physical count' : 'Quantity'}</span>{formatNumber(mode === 'adjustment' ? item.physicalCount : item.quantity)}{mode === 'adjustment' && item.difference !== undefined && doc.status === 'done' ? ` (${item.difference > 0 ? '+' : ''}${formatNumber(item.difference)})` : ''}</span>
              <span><span className="sheet-label">Unit</span>{item.unit}</span>
            </div>
          ))}
        </div>
        {open ? (
          <div className="toolbar" style={{ marginTop: 16 }}>
            {mode !== 'adjustment' && doc.status === 'draft' ? <button className="btn" type="button" disabled={busy} onClick={() => run(() => service.update(id, { status: 'waiting' }))}>Mark waiting</button> : null}
            {mode !== 'adjustment' && doc.status !== 'ready' ? <button className="btn" type="button" disabled={busy} onClick={() => run(() => service.update(id, { status: 'ready' }))}>Mark ready</button> : null}
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => run(() => service.validate(id))}>Validate</button>
            <button className="btn btn-danger" type="button" disabled={busy} onClick={() => run(() => service.cancel(id), 'Canceled')}>Cancel</button>
          </div>
        ) : null}
        {doc.status === 'done' ? <p className="muted" style={{ marginTop: 12 }}>Completed {formatDate(doc.validatedAt)} by {doc.validatedBy?.name || '—'}. Historical stock records cannot be edited.</p> : null}
        <button className="btn" type="button" style={{ marginTop: 12 }} onClick={() => navigate(listPath)}>Back to list</button>
      </article>
    </section>
  );
}

function initialForm(mode) {
  return {
    supplier: '',
    customer: '',
    reason: '',
    warehouse: '',
    location: '',
    sourceWarehouse: '',
    sourceLocation: '',
    destinationWarehouse: '',
    destinationLocation: '',
    date: toDateInput(),
    notes: '',
    items: [blankLine(mode)],
  };
}

function blankLine(mode) {
  return mode === 'adjustment' ? { product: '', physicalCount: '' } : { product: '', quantity: '' };
}

function WarehouseSelect({ label, value, onChange, warehouses }) {
  return (
    <div className="field"><label>{label}</label>
      <select required value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
      </select>
    </div>
  );
}

function LocationSelect({ label, value, onChange, locations }) {
  return (
    <div className="field"><label>{label}</label>
      <select required value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}
      </select>
    </div>
  );
}
