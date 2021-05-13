// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Payload = any;

export type Message = {
	authToken?: string,
	payload: Payload,
};

export type RevealState = {
	indexh: number,
	indexv: number,
	indexf?: number,
	paused: boolean,
	overview: boolean,
};

export type RevealStateChangePayload = {
	state: RevealState,
};

export type User = {
	socketId: string,
	name: string,
};

export type RoomState = {
	adminIds: Array<string>,
	users: Array<User>,
};

export type PresentationState = {
	state: RevealState,
};
