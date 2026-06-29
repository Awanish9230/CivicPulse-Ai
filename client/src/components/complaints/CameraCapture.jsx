import { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CameraCapture = ({ onClose, onCapture }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Camera access denied or unavailable. This is required to ensure real-time reporting authenticity.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const takePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Convert to base64 or blob
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Get GPS
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                stopCamera();
                onCapture({
                    photo: photoDataUrl,
                    gps: { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }
                });
            },
            (err) => {
                setError('GPS location is required to submit a complaint.');
            }
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
                <button onClick={() => { stopCamera(); onClose(); }} className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md">
                    <X size={24} />
                </button>
                <div className="bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    LIVE CAPTURE ONLY
                </div>
            </div>

            {/* Viewfinder */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="text-white text-center p-8 max-w-sm">
                        <AlertTriangle size={48} className="mx-auto mb-4 text-warning" />
                        <p className="font-medium">{error}</p>
                    </div>
                ) : (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="min-w-full min-h-full object-cover"
                    />
                )}
                
                {/* Crosshairs Overlay */}
                {!error && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                        <div className="w-64 h-64 border-2 border-dashed border-white rounded-[3rem]"></div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="h-32 bg-black pb-safe flex items-center justify-center pb-8 pt-4">
                <button 
                    onClick={takePhoto}
                    disabled={!!error}
                    className="w-20 h-20 rounded-full border-4 border-white/50 p-1 disabled:opacity-50 transition-transform active:scale-95"
                >
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-black">
                        <Camera size={28} />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default CameraCapture;
