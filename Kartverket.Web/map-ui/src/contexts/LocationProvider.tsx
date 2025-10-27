import {createContext, ReactNode, useContext} from 'react';
import {useGeolocated} from 'react-geolocated';

const LocationContext = createContext<ReturnType<typeof useGeolocated> | null>(null);

export interface LocationProviderProps {
    children: ReactNode;
}

export function LocationProvider({children}: LocationProviderProps) {
    const geolocated = useGeolocated({
        positionOptions: {
            enableHighAccuracy: false,
        },
    });

    return (
        <LocationContext.Provider value={geolocated}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within LocationProvider');
    }
    return context;
}