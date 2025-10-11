import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
	const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	return React.useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);

			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay]
	);
}
