import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Road', 'Electricity', 'Garbage', 'Water', 'Drainage', 'Traffic', 'Illegal Dumping', 'Street Light', 'Construction', 'Animal', 'Others'];

const ReportModal = ({ captureData, onClose, onSuccess }) => {
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState(null);
    const [isFetchingAddress, setIsFetchingAddress] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                        fullAddress: res.data.display_name,
                        ward: addr.suburb || addr.neighbourhood || addr.village || 'Unknown Ward',
                        district: addr.state_district || addr.county || addr.city || 'Unknown District',
                        pinCode: addr.postcode || 'Unknown'
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
            // Convert Base64 to Blob
            const response = await fetch(captureData.photo);
            const blob = await response.blob();
            const file = new File([blob], `complaint_${Date.now()}.jpg`, { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('image', file);
            formData.append('category', category);
            formData.append('description', description);
            
            // Format coordinates as [longitude, latitude] for GeoJSON
            const coords = [captureData.gps.lng, captureData.gps.lat];
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
                    <div className="mb-6 rounded-2xl overflow-hidden bg-black/5 relative h-48">
                        <img src={captureData.photo} alt="Captured issue" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
                    </div>

                    <form id="report-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Auto-Fetched Address (Read-only) */}
                        <div>
                            <label className="block text-sm font-bold text-text/70 mb-1.5 flex items-center gap-2">
                                <MapPin size={16} className="text-primary" />
                                Exact Location (Auto-detected)
                            </label>
                            <div className="bg-surface border border-border/50 rounded-xl p-3.5 text-sm">
                                {isFetchingAddress ? (
                                    <div className="flex items-center gap-2 text-text/50 font-medium">
                                        <Loader2 size={16} className="animate-spin text-primary" />
                                        Pinpointing your location...
                                    </div>
                                ) : address ? (
                                    <div>
                                        <p className="font-bold text-text mb-1 flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> Verified</p>
                                        <p className="text-text/70 leading-relaxed">{address.fullAddress}</p>
                                    </div>
                                ) : (
                                    <p className="text-orange-500 font-medium">Could not fetch physical address. GPS coordinates will be used instead.</p>
                                )}
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
