export const formatTime = (date: string | number | undefined): string => {
	if (!date) return "-";

	const d = new Date(date);

	return d.toLocaleTimeString("no-NO", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};
