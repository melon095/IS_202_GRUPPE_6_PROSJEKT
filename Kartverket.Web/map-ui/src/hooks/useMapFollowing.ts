import { Map } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useGeolocated } from "react-geolocated";

import { ONE_SECOND_MS } from "../utils/time-constants";

export interface UseMapFollowingReturnType {
	isFollowing: boolean;
	toggleFollowing: () => void;
}

export const useMapFollowing = (map: Map): UseMapFollowingReturnType => {
	const [isFollowing, setIsFollowing] = useState<boolean>(false);
	const programmaticFlyToRef = useRef<boolean>(false);

	const { coords } = useGeolocated({
		positionOptions: {
			enableHighAccuracy: true,
		},
	});

	useEffect(() => {
		const handleMoveStart = () => {
			if (!isFollowing || programmaticFlyToRef.current) return;

			setIsFollowing(false);
		};

		map.on("movestart", handleMoveStart);

		return () => {
			map.off("movestart", handleMoveStart);
		};
	}, [map, isFollowing]);

	useEffect(() => {
		if (!isFollowing || !coords) return;

		programmaticFlyToRef.current = true;
		const zoom = map.getZoom();
		const relZoom = zoom < 15 ? 15 : zoom;
		map.flyTo([coords.latitude, coords.longitude], relZoom, {
			animate: true,
			duration: 1.0,
		});

		const timer = setTimeout(() => {
			programmaticFlyToRef.current = false;
		}, ONE_SECOND_MS);

		return () => clearTimeout(timer);
	}, [map, coords, isFollowing]);

	const toggleFollowing = () => {
		if (!isFollowing && !navigator.geolocation) {
			return;
		}

		setIsFollowing((f) => !f);
	};

	return { isFollowing, toggleFollowing };
};
