import { divIcon, LatLngTuple } from "leaflet";
import { useMemo } from "react";
import { useGeolocated } from "react-geolocated";
import { Marker } from "react-leaflet";

export const GPSMarker = () => {
	const { coords, isGeolocationEnabled } = useGeolocated({
		positionOptions: {
			enableHighAccuracy: true,
		},
	});

	const icon = useMemo(() => {
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

	if (!isGeolocationEnabled || !coords) {
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
