import React from "react";
import { Marker, Polyline } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";

export const ObjectMarkers = React.memo(() => {
	const { currentJourney, currentObjectPoints } = useJourney();

	return (
		<React.Fragment>
			{currentJourney?.objects.map((obj) => (
				<React.Fragment key={obj.id}>
					{obj?.points.map((point, index) => (
						<Marker key={`${obj.id}-point-${index}`} position={[point.lat, point.lng]} />
					))}

					{obj.points.length > 1 && (
						<Polyline positions={obj.points.map((point) => [point.lat, point.lng])} color="blue" />
					)}
				</React.Fragment>
			))}

			{currentObjectPoints.map((point, idx) => (
				<Marker key={`current-point-${idx}`} position={[point.lat, point.lng]} />
			))}

			{currentObjectPoints.length > 1 && (
				<Polyline positions={currentObjectPoints.map((point) => [point.lat, point.lng])} color="red" />
			)}
		</React.Fragment>
	);
});
