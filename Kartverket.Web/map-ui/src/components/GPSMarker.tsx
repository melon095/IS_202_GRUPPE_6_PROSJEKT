import {useMemo} from "react";
import {divIcon, LatLngTuple} from "leaflet";
import {Marker} from "react-leaflet";
import {useLocation} from "../contexts/LocationProvider.tsx";

export const GPSMarker = () => {
    const {coords, isGeolocationAvailable, isGeolocationEnabled} = useLocation();

    const icon = useMemo(() => {
        if (!coords) {
            return undefined;
        }

        const svg = `   
<div style="transform: rotate(${coords?.heading ?? 0}deg);">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="m0 9 24-9-8.986 24L12 12z"/></svg>
</div>`;

        return divIcon({
            className: "",
            html: svg,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
        });
    }, [coords?.heading]);

    if (!isGeolocationAvailable || !isGeolocationEnabled) {
        return null;
    }

    return (
        <>
            {coords && (
                <Marker position={[coords.latitude, coords.longitude] satisfies LatLngTuple} icon={icon}></Marker>
            )}
        </>
    );
};
