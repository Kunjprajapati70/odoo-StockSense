import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/navigation';
import { productService } from '../../services/inventoryService';

const PAGES = NAV_SECTIONS.flatMap((section) => section.items.map((item) => ({
  label: item.label,
  to: item.to,
  hint: section.label,
})));

export default function CommandSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState(0);

  const pages = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return PAGES;
    return PAGES.filter((page) => page.label.toLowerCase().includes(term) || page.hint.toLowerCase().includes(term));
  }, [query]);

  const results = [
    ...pages.map((page) => ({ id: page.to, kind: 'Page', label: page.label, hint: page.hint, to: page.to })),
    ...products.map((product) => ({
      id: product._id,
      kind: 'Product',
      label: product.name,
      hint: product.sku,
      to: `/products/${product._id}`,
    })),
  ];

  useEffect(() => {
    function onKey(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    setActive(0);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const term = query.trim();
    if (term.length < 1) {
      setProducts([]);
      return undefined;
    }
    let activeRequest = true;
    const timer = setTimeout(() => {
      productService.list({ search: term, limit: 8 })
        .then((response) => { if (activeRequest) setProducts(response.data || []); })
        .catch(() => { if (activeRequest) setProducts([]); });
    }, 200);
    return () => {
      activeRequest = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  function close() {
    setOpen(false);
    setQuery('');
    setProducts([]);
  }

  function go(index) {
    const item = results[index];
    if (!item) return;
    navigate(item.to);
    close();
  }

  function onInputKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(active);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop command-backdrop" onMouseDown={close}>
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="Search" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-input">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onKeyDown={onInputKey}
            placeholder="Search pages or products"
            aria-label="Search pages or products"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-list">
          {results.length === 0 ? <p className="muted command-empty">No matches.</p> : results.map((item, index) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              className={index === active ? 'command-item active' : 'command-item'}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(index)}
            >
              <span>{item.label}</span>
              <small>{item.kind} · {item.hint}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
