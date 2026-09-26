import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States';
import { errorMessage } from '../../services/api';
import { categoryService } from '../../services/inventoryService';

export default function Categories() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [reassignTo, setReassignTo] = useState('');

  function load() {
    setLoading(true);
    categoryService.list({ limit: 100, search })
      .then((response) => { setRows(response.data); setError(''); })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [search]);

  async function onCreate(event) {
    event.preventDefault();
    try {
      if (editing) {
        await categoryService.update(editing, form);
        toast.notify('Category updated successfully.');
      } else {
        await categoryService.create(form);
        toast.notify('Category created successfully.');
      }
      setForm({ name: '', description: '' });
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function onDelete() {
    try {
      await categoryService.remove(removing._id, reassignTo ? { reassignTo } : {});
      toast.notify('Category deleted successfully.');
      setRemoving(null);
      setReassignTo('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>Categories</h1><p>Categories group products. A category in use must be reassigned before it can be deleted.</p></div></header>
      <div className="field" style={{ maxWidth: 320 }}><label htmlFor="cat-search">Search</label><input id="cat-search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      {isManager ? (
        <form className="card card-pad form-grid" onSubmit={onCreate}>
          <div className="field"><label htmlFor="cat-name">Name</label><input id="cat-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="field"><label htmlFor="cat-desc">Description</label><input id="cat-desc" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          <button className="btn btn-primary" type="submit">{editing ? 'Save category' : 'Add category'}</button>
        </form>
      ) : null}
      {loading ? <TableSkeleton /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {!loading && rows.length === 0 ? <div className="card"><EmptyState title="No categories found." description="Create a category before adding products." /></div> : null}
      {rows.length > 0 ? (
        <div className="card sheet">
          <div className={`sheet-head cat-cols${isManager ? '' : ' readonly'}`}>
            <span>Name</span><span>Description</span>{isManager ? <span>Actions</span> : null}
          </div>
          {rows.map((category) => (
            <div className={`sheet-row cat-cols${isManager ? '' : ' readonly'}`} key={category._id}>
              <span className="sheet-product"><strong>{category.name}</strong></span>
              <span><span className="sheet-label">Description</span>{category.description || '—'}</span>
              {isManager ? (
                <span className="sheet-actions">
                  <button className="btn" type="button" onClick={() => { setEditing(category._id); setForm({ name: category.name, description: category.description || '' }); }}>Edit</button>
                  <button className="btn" type="button" onClick={() => setRemoving(category)}>Delete</button>
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {removing ? (
        <Modal
          title="Delete category"
          onClose={() => setRemoving(null)}
          footer={<><button className="btn" type="button" onClick={() => setRemoving(null)}>Cancel</button><button className="btn btn-danger" type="button" onClick={onDelete}>Delete category</button></>}
        >
          <p>Are you sure you want to delete {removing.name}? If products use it, choose a category to move them to.</p>
          <div className="field">
            <label htmlFor="reassign">Reassign products to</label>
            <select id="reassign" value={reassignTo} onChange={(event) => setReassignTo(event.target.value)}>
              <option value="">Only if unused</option>
              {rows.filter((category) => category._id !== removing._id).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
