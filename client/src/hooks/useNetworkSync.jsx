import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getOutboxItems, removeFromOutbox } from '../utils/db';

export const useNetworkSync = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);

    const syncOutbox = useCallback(async () => {
        if (!navigator.onLine) return;
        
        try {
            setIsSyncing(true);
            const items = await getOutboxItems();
            
            if (items.length === 0) {
                setIsSyncing(false);
                return;
            }
            
            toast.loading(`Syncing ${items.length} offline items...`, { id: 'sync-toast' });
            
            let syncedCount = 0;
            
            for (const item of items) {
                try {
                    if (item.type === 'complaint') {
                        const payload = item.payload;
                        const formData = new FormData();
                        
                        if (payload.photos && Array.isArray(payload.photos)) {
                            for (let i = 0; i < payload.photos.length; i++) {
                                const response = await fetch(payload.photos[i]);
                                const blob = await response.blob();
                                const file = new File([blob], `complaint_${Date.now()}_${i}.jpg`, { type: 'image/jpeg' });
                                formData.append('images', file);
                            }
                        }
                        
                        formData.append('category', payload.category);
                        formData.append('description', payload.description);
                        if (payload.language) formData.append('language', payload.language);
                        if (payload.coords) formData.append('coordinates', JSON.stringify(payload.coords));
                        if (payload.address) formData.append('address', JSON.stringify(payload.address));

                        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/complaint/create`, formData, {
                            withCredentials: true,
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } else if (item.type === 'chat') {
                        // Assuming socket handles it, or there's a REST endpoint.
                        // Wait, for chat we usually emit via Socket, but a REST fallback is helpful.
                        // Let's assume we dispatch a custom event and Community.jsx handles emitting it if we don't have a REST route.
                        // Let's just dispatch an event for Chat so Community.jsx can catch it and emit via socket.
                        window.dispatchEvent(new CustomEvent('sync-chat-message', { detail: item }));
                    }
                    
                    if (item.type !== 'chat') {
                        await removeFromOutbox(item.id);
                        syncedCount++;
                    }
                } catch (err) {
                    console.error('Failed to sync item:', item, err);
                }
            }
            
            if (syncedCount > 0) {
                toast.success(`Successfully synced ${syncedCount} complaints!`, { id: 'sync-toast' });
            } else if (items.some(i => i.type !== 'chat')) {
                toast.dismiss('sync-toast');
            }
        } catch (error) {
            console.error("Sync process failed", error);
            toast.dismiss('sync-toast');
        } finally {
            setIsSyncing(false);
            window.dispatchEvent(new Event('sync-completed'));
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Back online! Syncing data...");
            syncOutbox();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error("You are offline. Working locally.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Register Periodic Sync if Supported
        const registerPeriodicSync = async () => {
            if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
                try {
                    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                    if (status.state === 'granted') {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.periodicSync.register('sync-latest-complaints', {
                            minInterval: 12 * 60 * 60 * 1000, // 12 hours
                        });
                        console.log('Periodic background sync registered!');
                    }
                } catch (error) {
                    console.error('Periodic sync could not be registered', error);
                }
            }
        };
        registerPeriodicSync();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncOutbox]);

    return { isOnline, isSyncing, syncOutbox };
};
