import { useState } from 'react';

export default function FilterBar({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card card-pad filters${open ? ' open' : ''}`}>
      <button className="btn btn-ghost filters-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide filters' : 'Filters'}
      </button>
      {children}
    </div>
  );
}
