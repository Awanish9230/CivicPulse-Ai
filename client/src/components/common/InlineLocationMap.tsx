import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface InlineLocationMapProps {
    isOpen: boolean;
    coordinates?: [number, number];
    zoom?: number;
    heightClass?: string;
    wrapperClassName?: string;
}

const InlineLocationMap: React.FC<InlineLocationMapProps> = ({
    isOpen,
    coordinates,
    zoom = 15,
    heightClass = 'h-32',
    wrapperClassName = 'mt-3 rounded-xl overflow-hidden border border-slate-200'
}) => {
    return (
        <AnimatePresence>
            {isOpen && coordinates && coordinates.length === 2 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={wrapperClassName}
                >
                    <div className={`${heightClass} w-full`}>
                        <MapContainer
                            center={[coordinates[1], coordinates[0]]}
                            zoom={zoom}
                            scrollWheelZoom={false}
                            className="h-full w-full z-0"
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[coordinates[1], coordinates[0]]} />
                        </MapContainer>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InlineLocationMap;
