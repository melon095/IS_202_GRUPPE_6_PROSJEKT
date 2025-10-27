import React from "react";
import { Marker, Polyline, Popup } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { useServerObjectsQuery } from "../hooks/useServerObjectsQuery";

export const ServerMarkers = () => {
	const { currentJourney } = useJourney();
	const { data, isLoading, isError } = useServerObjectsQuery(currentJourney?.id);

	if (isLoading || isError || !data) return null;

	return (
		<React.Fragment>
			{data.map((obj) => (
				<React.Fragment key={obj.id}>
					{obj.points.map((point, index) => (
						<Marker key={`${obj.id}-point-${index}`} position={[point.lat, point.lng]}>
							{obj.title && <Popup>{obj.title}</Popup>}
						</Marker>
					))}

					{obj.points.length > 1 && (
						<Polyline positions={obj.points.map((point) => [point.lat, point.lng])} color="green" />
					)}
				</React.Fragment>
			))}
		</React.Fragment>
	);
};
