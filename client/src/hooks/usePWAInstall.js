import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setInstallPrompt(null);
            setIsInstallable(false);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) {
            alert("To install CivicPulse, tap your browser's menu (⋮) or Share button (↑) and select 'Add to Home Screen' or 'Install App'.");
            return;
        }
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setInstallPrompt(null);
        setIsInstallable(false);
    };

    // iOS Detection
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isPwa = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        
        setIsIOS(isIosDevice);
        setIsStandalone(isPwa);
    }, []);

    return { isInstallable, handleInstallClick, isIOS, isStandalone };
};
