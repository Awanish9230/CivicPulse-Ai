import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Loader2, CheckCircle, Navigation } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = ['Road', 'Electricity', 'Garbage', 'Water', 'Drainage', 'Traffic', 'Illegal Dumping', 'Street Light', 'Construction', 'Animal', 'Others'];

// Component to handle map clicks and marker dragging
const LocationMarker = ({ position, setPosition, fetchAddress }) => {
    const markerRef = useRef(null);

    useMapEvents({
        click(e) {
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPos);
            fetchAddress(newPos.lat, newPos.lng);
        },
    });

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const newPos = marker.getLatLng();
                const posObj = { lat: newPos.lat, lng: newPos.lng };
                setPosition(posObj);
                fetchAddress(posObj.lat, posObj.lng);
            }
        },
    };

    return position === null ? null : (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        ></Marker>
    );
};

const ReportModal = ({ captureData, onClose, onSuccess }) => {
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [position, setPosition] = useState(captureData?.gps || { lat: 28.6139, lng: 77.2090 }); // Default to New Delhi if no GPS
    const [address, setAddress] = useState({
        line1: '',
        line2: '',
        pinCode: '',
        district: '',
        state: ''
    });
    const [isFetchingAddress, setIsFetchingAddress] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reverse Geocode
    const fetchAddress = async (lat, lng) => {
        setIsFetchingAddress(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            
            if (res.data && res.data.address) {
                const addr = res.data.address;
                setAddress({
                    line1: addr.road || addr.suburb || addr.neighbourhood || '',
                    line2: addr.village || addr.city_district || '',
                    district: addr.state_district || addr.county || addr.city || '',
                    state: addr.state || '',
                    pinCode: addr.postcode || ''
                });
            }
        } catch (error) {
            console.error("Failed to fetch address", error);
            toast.error("Could not determine exact address from map pin.");
        } finally {
            setIsFetchingAddress(false);
        }
    };

    useEffect(() => {
        // Reverse Geocode
        const fetchAddress = async () => {
            try {
                const { lat, lng } = captureData.gps;
                // Using OpenStreetMap Nominatim for free reverse geocoding
                const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                
                if (res.data && res.data.address) {
                    const addr = res.data.address;
                    setAddress({
                        line1: addr.road || addr.suburb || addr.neighbourhood || '',
                        line2: addr.village || addr.city_district || '',
                        district: addr.state_district || addr.county || addr.city || '',
                        state: addr.state || '',
                        pinCode: addr.postcode || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch address", error);
                toast.error("Could not determine exact address from GPS.");
            } finally {
                setIsFetchingAddress(false);
            }
        };

        if (captureData?.gps) {
            fetchAddress();
        }
    }, [captureData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category || !description) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            
            // Convert multiple Base64 photos to Blobs
            for (let i = 0; i < captureData.photos.length; i++) {
                const response = await fetch(captureData.photos[i]);
                const blob = await response.blob();
                const file = new File([blob], `complaint_${Date.now()}_${i}.jpg`, { type: 'image/jpeg' });
                formData.append('images', file);
            }

            formData.append('category', category);
            formData.append('description', description);
            
            // Format coordinates as [longitude, latitude] for GeoJSON
            const coords = [position.lng, position.lat];
            formData.append('coordinates', JSON.stringify(coords));
            
            if (address) {
                formData.append('address', JSON.stringify(address));
            }

            await axios.post('http://localhost:5000/api/v1/complaint/create', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Issue reported successfully!");
            onSuccess();
        } catch (error) {
            console.error("Error submitting complaint:", error);
            toast.error(error.response?.data?.message || "Failed to submit report");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
            <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="bg-white w-full max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black text-text">Finalize Report</h2>
                        <p className="text-sm text-text/50">Submit your captured issue to authorities.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6 flex gap-2 overflow-x-auto pb-2 snap-x">
                        {captureData.photos.map((photo, i) => (
                            <div key={i} className="w-40 h-40 shrink-0 rounded-2xl overflow-hidden bg-black/5 relative snap-center">
                                <img src={photo} alt="Captured issue" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
                            </div>
                        ))}
                    </div>

                    <form id="report-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Interactive Map */}
                        <div className="bg-surface border border-border/50 rounded-xl overflow-hidden relative">
                            <div className="bg-slate-50 p-2 flex items-center gap-2 border-b border-border/50">
                                <Navigation size={16} className="text-primary" />
                                <span className="text-xs font-bold text-slate-600">Adjust pin to exact location</span>
                            </div>
                            <div className="h-48 w-full z-0 relative">
                                <MapContainer center={position} zoom={16} scrollWheelZoom={true} className="h-full w-full">
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <LocationMarker position={position} setPosition={setPosition} fetchAddress={fetchAddress} />
                                </MapContainer>
                            </div>
                        </div>

                        {/* Editable Address Fields */}
                        <div className="bg-surface border border-border/50 rounded-xl p-4">
                            <label className="block text-sm font-bold text-text mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <MapPin size={16} className="text-primary" />
                                    Location Details
                                </span>
                                {isFetchingAddress && <Loader2 size={14} className="animate-spin text-primary" />}
                            </label>
                            
                            <div className="space-y-3">
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Address Line 1 (Street/Locality)" 
                                        value={address.line1} 
                                        onChange={(e) => setAddress({...address, line1: e.target.value})}
                                        className="w-full bg-white border border-border/50 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Address Line 2 (Landmark - Optional)" 
                                        value={address.line2} 
                                        onChange={(e) => setAddress({...address, line2: e.target.value})}
                                        className="w-full bg-white border border-border/50 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="District/City" 
                                        value={address.district} 
                                        onChange={(e) => setAddress({...address, district: e.target.value})}
                                        className="w-full bg-white border border-border/50 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="State" 
                                        value={address.state} 
                                        onChange={(e) => setAddress({...address, state: e.target.value})}
                                        className="w-full bg-white border border-border/50 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Pin Code" 
                                        value={address.pinCode} 
                                        onChange={(e) => setAddress({...address, pinCode: e.target.value})}
                                        className="w-full bg-white border border-border/50 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text/70 mb-1.5">Category</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white border border-border/50 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                                required
                            >
                                <option value="" disabled>Select the type of issue...</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text/70 mb-1.5">Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue in detail..."
                                rows="3"
                                className="w-full bg-white border border-border/50 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                                required
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border/50 bg-white sticky bottom-0 z-10">
                    <button 
                        type="submit"
                        form="report-form"
                        disabled={isSubmitting || isFetchingAddress}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={18} className="animate-spin" /> Submitting securely...</>
                        ) : (
                            'Submit Report Anonymously'
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ReportModal;
