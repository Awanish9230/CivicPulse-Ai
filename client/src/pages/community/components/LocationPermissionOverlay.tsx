import React from 'react';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import type { GeoLocation } from '../types';

interface LocationPermissionOverlayProps {
    onLocationGranted: (loc: GeoLocation) => void;
}

const LocationPermissionOverlay: React.FC<LocationPermissionOverlayProps> = ({ onLocationGranted }) => {
    const handleRetry = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    onLocationGranted({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    toast.success("Location enabled!");
                },
                () => toast.error("Still blocked. In the PWA, please go to your phone's Settings > Apps > CivicPulse > Permissions to enable Location.")
            );
        }
    };

    const handleDefault = () => {
        onLocationGranted({ lat: 28.6139, lng: 77.2090 });
        toast.success("Using default location (New Delhi)");
    };

    return (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
            <MapPin size={48} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">Location Required</h2>
            <p className="text-slate-600 max-w-md mb-6">
                You must enable location permissions in your browser to access the Community chat and local feeds. Please click the lock icon in your URL bar to allow location access.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
                >
                    Retry Location Access
                </button>
                <button
                    onClick={handleDefault}
                    className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl transition-colors shadow-lg border border-slate-200"
                >
                    Use Default Location
                </button>
            </div>
        </div>
    );
};

export default LocationPermissionOverlay;
