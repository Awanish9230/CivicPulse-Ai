import { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CameraCapture = ({ onClose, onCapture }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState('');
    const [photos, setPhotos] = useState([]);
    const [gps, setGps] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                if (!isMounted) {
                    mediaStream.getTracks().forEach(track => {
                        track.stop();
                    });
                    return;
                }
                streamRef.current = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                if (isMounted) {
                    setError('Camera access denied or unavailable. This is required to ensure real-time reporting authenticity.');
                }
            }
        };

        startCamera();

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => {
                track.stop();
                videoRef.current.srcObject.removeTrack(track);
            });
            videoRef.current.srcObject = null;
        }
        if (streamRef.current) {
            const tracks = streamRef.current.getTracks();
            tracks.forEach(track => {
                track.stop();
                streamRef.current.removeTrack(track);
            });
            streamRef.current = null;
        }
    };

    const fetchGps = async () => {
        return new Promise((resolve, reject) => {
            if (gps) return resolve(gps);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
                    setGps(loc);
                    resolve(loc);
                },
                (err) => {
                    setError('GPS location is required to submit a complaint.');
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    };

    const takePhoto = async () => {
        if (!videoRef.current || photos.length >= 5) return;
        
        try {
            await fetchGps();
            
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            
            const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPhotos(prev => [...prev, photoDataUrl]);
        } catch (e) {
            // Error handled in fetchGps
        }
    };

    const handleDone = () => {
        if (photos.length > 0 && gps) {
            stopCamera();
            onCapture({ photos, gps });
        }
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
                    LIVE CAPTURE ({photos.length}/5)
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
                
                {/* Thumbnails */}
                {photos.length > 0 && (
                    <div className="absolute bottom-4 left-0 w-full px-4 flex gap-2 overflow-x-auto">
                        {photos.map((p, i) => (
                            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/50 shrink-0 relative">
                                <img src={p} alt="thumb" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                                >
                                    <X size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="h-32 bg-black pb-safe flex items-center justify-between px-8 pb-8 pt-4">
                <div className="w-16"></div> {/* Spacer */}
                
                <button 
                    onClick={takePhoto}
                    disabled={!!error || photos.length >= 5}
                    className="w-20 h-20 rounded-full border-4 border-white/50 p-1 disabled:opacity-50 transition-transform active:scale-95 shrink-0 relative"
                >
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-black">
                        <Camera size={28} />
                    </div>
                    {photos.length >= 5 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-bold rounded-full">MAX</div>
                    )}
                </button>
                
                <div className="w-16 flex justify-end">
                    {photos.length > 0 && (
                        <button 
                            onClick={handleDone}
                            className="bg-primary text-white p-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <Check size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;
