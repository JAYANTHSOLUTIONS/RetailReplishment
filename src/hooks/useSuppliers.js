// src/hooks/useSuppliers.js
// Fetches and caches the supplier list.

import { useEffect, useState } from 'react';
import { suppliersService }    from '../services';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    suppliersService.getAll()
      .then((data) => { if (!cancelled) setSuppliers(data); })
      .catch((err)  => { if (!cancelled) setError(err);     })
      .finally(()   => { if (!cancelled) setLoading(false);  });
    return () => { cancelled = true; };
  }, []);

  return { suppliers, loading, error };
}
