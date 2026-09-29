import { useState, useEffect, useCallback } from 'react';
import { getCachedData, setCachedData } from '../utils/db';

export const useLocalFirst = (cacheKey, fetchCallback, initialData = []) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        
        try {
            const cached = await getCachedData(cacheKey);
            if (cached) {
                setData(cached);
                setLoading(false); 
            }

            if (navigator.onLine) {
                const freshData = await fetchCallback(...args);
                
                if (freshData) {
                    await setCachedData(cacheKey, freshData);
                    setData(freshData);
                }
            }
        } catch (err) {
            console.error(`useLocalFirst (${cacheKey}) Error:`, err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [cacheKey, fetchCallback]);

    const setLocalData = async (newData) => {
        const evaluatedData = typeof newData === 'function' ? newData(data) : newData;
        setData(evaluatedData);
        await setCachedData(cacheKey, evaluatedData);
    };

    return { data, setData: setLocalData, loading, error, refresh };
};
