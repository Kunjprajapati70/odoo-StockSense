import { useEffect, useState } from 'react';

export default function usePagedList(loader, params) {
  const [state, setState] = useState({ loading: true, error: '', rows: [], meta: null });
  const key = JSON.stringify(params);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    loader(params)
      .then((response) => {
        if (!active) return;
        setState({ loading: false, error: '', rows: response.data || [], meta: response.meta || null });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loading: false,
          error: error.response?.data?.message || 'Unable to reach the server. Check your connection and try again.',
          rows: [],
          meta: null,
        });
      });
    return () => { active = false; };
  }, [key]);

  return state;
}
