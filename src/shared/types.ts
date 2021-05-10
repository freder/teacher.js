// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Payload = any;

export type Message = {
	authToken?: string,
	payload: Payload,
};

export type SlideEventPayload = {
	type: string,
	index: [number, number],
};