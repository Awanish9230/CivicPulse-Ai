import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertTriangle, Check, ZoomIn, ZoomOut, SwitchCamera } from 'lucide-react';

const CameraCapture = ({ onClose, onCapture }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const trackRef = useRef(null);
    const [error, setError] = useState('');
    const [photos, setPhotos] = useState([]);
    const [gps, setGps] = useState(null);
    
    // Camera state
    const [facingMode, setFacingMode] = useState('environment');
    const [zoomParams, setZoomParams] = useState(null);
    const [zoomValue, setZoomValue] = useState(1);

    // Eager GPS fetch
    useEffect(() => {
        let isMounted = true;
        const fallbackGps = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (isMounted) setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
                },
                (err) => {
                    if (isMounted) console.warn('GPS fallback failed:', err);
                    // Do not block UI, allow submission without GPS or handle in parent
                },
                { enableHighAccuracy: false, maximumAge: Infinity, timeout: 10000 }
            );
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (isMounted) setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
            },
            (err) => {
                if (isMounted) fallbackGps();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        return () => { isMounted = false; };
    }, []);

    const startCamera = useCallback(async () => {
        try {
            stopCamera();
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode } 
            });
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            
            // Check for zoom capabilities
            const track = mediaStream.getVideoTracks()[0];
            trackRef.current = track;
            
            if (track.getCapabilities) {
                const capabilities = track.getCapabilities();
                if (capabilities.zoom) {
                    setZoomParams({
                        min: capabilities.zoom.min,
                        max: capabilities.zoom.max,
                        step: capabilities.zoom.step
                    });
                    setZoomValue(capabilities.zoom.min);
                } else {
                    setZoomParams(null);
                }
            }
            setError('');
        } catch (err) {
            setError('Camera access denied or unavailable. This is required to ensure real-time reporting authenticity.');
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera]);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
            trackRef.current = null;
        }
    };

    const handleZoomChange = (e) => {
        const value = parseFloat(e.target.value);
        setZoomValue(value);
        if (trackRef.current) {
            trackRef.current.applyConstraints({
                advanced: [{ zoom: value }]
            }).catch(e => console.error("Zoom not supported", e));
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const takePhoto = () => {
        if (!videoRef.current || photos.length >= 5) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Mirror if user facing
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(videoRef.current, 0, 0);
        
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => [...prev, photoDataUrl]);
    };

    const handleDone = () => {
        if (photos.length > 0) {
            stopCamera();
            onCapture({ photos, gps }); // parent can decide if it errors if gps is null
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10 pointer-events-none">
                <button aria-label="Close" onClick={() => { stopCamera(); onClose(); }} className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md pointer-events-auto">
                    <X size={24} />
                </button>
                <div className="flex gap-3 items-center pointer-events-auto">
                    {/* GPS Indicator */}
                    {gps ? (
                        <div className="bg-green-500/80 text-white px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md">GPS Lock</div>
                    ) : (
                        <div className="bg-yellow-500/80 text-white px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md">Waiting GPS...</div>
                    )}
                    
                    <div className="bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        LIVE CAPTURE ({photos.length}/5)
                    </div>
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
                        className={`min-w-full min-h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                )}
                
                {/* Crosshairs Overlay */}
                {!error && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                        <div className="w-64 h-64 border-2 border-dashed border-white rounded-[3rem]"></div>
                    </div>
                )}
                
                {/* Zoom Slider */}
                {!error && zoomParams && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 h-48 flex flex-col items-center gap-2">
                        <ZoomIn size={16} className="text-white drop-shadow-md" />
                        <input 
                            type="range"
                            orient="vertical"
                            className="h-32 appearance-none bg-white/30 w-1 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                            style={{ WebkitAppearance: 'slider-vertical' }}
                            min={zoomParams.min}
                            max={zoomParams.max}
                            step={zoomParams.step}
                            value={zoomValue}
                            onChange={handleZoomChange}
                        />
                        <ZoomOut size={16} className="text-white drop-shadow-md" />
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
                <div className="w-16 flex justify-start">
                    <button 
                        onClick={toggleCamera}
                        className="bg-white/10 text-white p-3 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors"
                    >
                        <SwitchCamera size={24} />
                    </button>
                </div>
                
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
