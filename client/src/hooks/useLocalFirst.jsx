import { useState, useEffect, useCallback } from 'react';
import { getCachedData, setCachedData } from '../utils/db';

/**
 * useLocalFirst - A hook for Stale-While-Revalidate Local-First data fetching.
 * 
 * @param {string} cacheKey - The unique key for the IndexedDB cache (e.g. 'dashboard_complaints')
 * @param {function} fetchCallback - The async function that fetches data from the backend API.
 * @param {any} initialData - The initial state (e.g. [])
 * @returns {object} { data, setData, loading, error, refresh }
 */
export const useLocalFirst = (cacheKey, fetchCallback, initialData = []) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize from cache immediately, then fetch from network
    const refresh = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        
        try {
            // Step 1: Read from Local IndexedDB (Zero Latency)
            const cached = await getCachedData(cacheKey);
            if (cached) {
                setData(cached);
                setLoading(false); // UI renders instantly
            }

            // Step 2: Fetch fresh data from network in background
            if (navigator.onLine) {
                const freshData = await fetchCallback(...args);
                
                // Step 3: Update local DB and React state
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

    // Expose a setter that also updates the cache
    const setLocalData = async (newData) => {
        // If it's a function (like prev => [...prev]), evaluate it
        const evaluatedData = typeof newData === 'function' ? newData(data) : newData;
        setData(evaluatedData);
        await setCachedData(cacheKey, evaluatedData);
    };

    return { data, setData: setLocalData, loading, error, refresh };
};
