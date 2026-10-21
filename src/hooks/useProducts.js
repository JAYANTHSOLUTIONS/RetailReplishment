// src/hooks/useProducts.js
// Fetches and caches the product list; exposes loading / error state.

import { useEffect, useState } from 'react';
import { productsService }     from '../services';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let cancelled = false;
    productsService.getAll()
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch((err)  => { if (!cancelled) setError(err);    })
      .finally(()   => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { products, loading, error };
}
