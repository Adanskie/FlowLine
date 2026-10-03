import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export default function useFetch(url, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError('');
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error ?? 'Failed to load data.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
