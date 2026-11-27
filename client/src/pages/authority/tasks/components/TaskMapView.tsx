import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getPriorityColor } from '../../../../utils/complaintUtils';
import type { Complaint } from '../../../../types';

interface TaskMapViewProps {
    tasks: Complaint[];
    onSwitchToList: () => void;
}

const TaskMapView: React.FC<TaskMapViewProps> = ({ tasks, onSwitchToList }) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[600px] relative">
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {tasks.map((task) => {
                    if (!task.location?.coordinates) return null;
                    return (
                        <Marker
                            key={task._id}
                            position={[task.location.coordinates[1], task.location.coordinates[0]]}
                        >
                            <Popup className="rounded-xl overflow-hidden">
                                <div className="p-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityColor(task.priority, true)}`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            ID: {task._id.slice(-6).toUpperCase()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">{task.category}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                                    <button
                                        onClick={onSwitchToList}
                                        className="w-full py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default TaskMapView;
