import { ResponseError } from "../types";

export const extrapolateErrors = async (response: Response): Promise<ResponseError> => {
	const json = await response.json();
	if (json.errors) return json.errors as ResponseError;

	return json as ResponseError;
};
