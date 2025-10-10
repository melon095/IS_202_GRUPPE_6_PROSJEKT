import { Marker } from "react-leaflet";
import { usePointStore } from "../store/useLocalPointsStore";

export default function PointsLayer() {
	const localPoints = usePointStore((state) => state.points);

	return (
		<>
			{localPoints.map((point, idx) => (
				<Marker key={idx} position={[point.lat, point.lng]} />
			))}
		</>
	);
}
