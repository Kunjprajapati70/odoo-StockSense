import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { Badge, EmptyState, ErrorState, TableSkeleton } from '../../components/common/States';
import { errorMessage } from '../../services/api';
import { warehouseService } from '../../services/inventoryService';

export default function Warehouses() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', contact: '', isActive: true, warehouse: '' });

  function load() {
    setLoading(true);
    warehouseService.list({ limit: 50, search })
      .then((response) => { setRows(response.data); setError(''); })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search]);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      if (open === 'warehouse') {
        await warehouseService.create(form);
        toast.notify('Warehouse created successfully.');
      } else {
        await warehouseService.createLocation(form);
        toast.notify('Location created successfully.');
      }
      setOpen(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function toggleWarehouse(warehouse) {
    try {
      await warehouseService.update(warehouse._id, { isActive: !warehouse.isActive });
      toast.notify('Warehouse updated successfully.');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function toggleLocation(location) {
    try {
      await warehouseService.updateLocation(location._id, { isActive: !location.isActive });
      toast.notify('Location updated successfully.');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Warehouses</h1>
          <p>Each warehouse holds multiple locations. Stock is tracked per location.</p>
        </div>
        {isManager ? (
          <div className="toolbar">
            <button className="btn btn-primary" type="button" onClick={() => { setForm({ name: '', code: '', address: '', contact: '', isActive: true, warehouse: '' }); setOpen('warehouse'); }}>Add warehouse</button>
            <button className="btn" type="button" onClick={() => { setForm({ name: '', code: '', notes: '', isActive: true, warehouse: rows[0]?._id || '' }); setOpen('location'); }}>Add location</button>
          </div>
        ) : null}
      </header>
      <div className="field" style={{ maxWidth: 320 }}><label htmlFor="wh-search">Search</label><input id="wh-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or code" /></div>
      {loading ? <TableSkeleton /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {!loading && !error && rows.length === 0 ? <div className="card"><EmptyState title="No warehouses found." description="Add a warehouse before receiving stock." /></div> : null}
      <div className="wh-grid">
        {rows.map((warehouse) => (
          <article className="card card-pad warehouse-card" key={warehouse._id}>
            <header className="page-header">
              <div><h2>{warehouse.name}</h2><p className="muted">{warehouse.code}</p></div>
              <Badge value={warehouse.isActive ? 'active' : 'inactive'} />
            </header>
            <p>{warehouse.address}</p>
            <p className="muted">{warehouse.contact}</p>
            <p className="muted">{warehouse.locations?.length || 0} locations</p>
            <h3 className="location-heading">Locations</h3>
            <div className="stock-list">
              {(warehouse.locations || []).map((location) => (
                <div className="stock-row" key={location._id}>
                  <span className="stock-id">
                    <strong>{location.name}</strong>
                    <span className="muted">{location.code}</span>
                  </span>
                  <span className="stock-meta">
                    <Badge value={location.isActive ? 'active' : 'inactive'} />
                    {isManager ? <button className="btn" type="button" onClick={() => toggleLocation(location)}>{location.isActive ? 'Deactivate' : 'Activate'}</button> : null}
                  </span>
                </div>
              ))}
            </div>
            {isManager ? <button className="btn" type="button" style={{ marginTop: 10 }} onClick={() => toggleWarehouse(warehouse)}>{warehouse.isActive ? 'Deactivate warehouse' : 'Activate warehouse'}</button> : null}
          </article>
        ))}
      </div>
      {open ? (
        <Modal title={open === 'warehouse' ? 'Add warehouse' : 'Add location'} onClose={() => setOpen(null)} footer={<><button className="btn" type="button" onClick={() => setOpen(null)}>Cancel</button><button className="btn btn-primary" type="submit" form="wh-form">Save</button></>}>
          <form id="wh-form" className="form-grid" onSubmit={onSubmit}>
            {open === 'location' ? (
              <div className="field wide"><label htmlFor="wh">Warehouse</label>
                <select id="wh" required value={form.warehouse} onChange={(event) => setForm({ ...form, warehouse: event.target.value })}>
                  {rows.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>)}
                </select>
              </div>
            ) : null}
            <div className="field"><label htmlFor="wh-name">Name</label><input id="wh-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="field"><label htmlFor="wh-code">Code</label><input id="wh-code" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></div>
            {open === 'warehouse' ? (
              <>
                <div className="field wide"><label htmlFor="address">Address</label><input id="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div>
                <div className="field wide"><label htmlFor="contact">Contact</label><input id="contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /></div>
              </>
            ) : <div className="field wide"><label htmlFor="notes">Notes</label><input id="notes" value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>}
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
