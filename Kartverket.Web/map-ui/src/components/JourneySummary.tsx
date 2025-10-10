import { Journey } from "../types";

interface JourneySummaryProps {
	journey: Journey;
	onClose: () => void;
}

export const JourneySummary = (props: JourneySummaryProps) => {
	return <>Journey Summary</>;
};
