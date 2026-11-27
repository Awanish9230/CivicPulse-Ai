import { useState, useCallback } from 'react';
import { getCachedData, setCachedData } from '../utils/db';

export const useLocalFirst = <T = unknown, Args extends unknown[] = unknown[]>(
    cacheKey: string,
    fetchCallback: (...args: Args) => Promise<T>,
    initialData: T
) => {
    const [data, setData] = useState<T>(initialData);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<unknown>(null);

    const refresh = useCallback(async (...args: Args) => {
        setLoading(true);
        setError(null);

        try {
            const cached = await getCachedData<T>(cacheKey);
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

    const setLocalData = async (newData: T | ((prev: T) => T)) => {
        const evaluatedData = typeof newData === 'function'
            ? (newData as (prev: T) => T)(data)
            : newData;
        setData(evaluatedData);
        await setCachedData(cacheKey, evaluatedData);
    };

    return { data, setData: setLocalData, loading, error, refresh };
};
