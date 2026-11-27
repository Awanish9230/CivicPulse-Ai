import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    coordinates?: [number, number];
    title?: string;
    subtitle?: string;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
    isOpen,
    onClose,
    coordinates,
    title = 'Location Map',
    subtitle
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col"
                    >
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-surface z-10">
                            <div>
                                <h3 className="font-black text-slate-800">{title}</h3>
                                {subtitle && (
                                    <p className="text-xs text-text/50 font-medium">{subtitle}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-xl text-text/40 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="h-[400px] w-full bg-slate-100 relative z-0">
                            {coordinates && coordinates.length === 2 && (
                                <MapContainer
                                    center={[coordinates[1], coordinates[0]]}
                                    zoom={16}
                                    className="h-full w-full"
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[coordinates[1], coordinates[0]]} />
                                </MapContainer>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LocationMapModal;
