export type Payload = Record<string, unknown>;

export interface RevealStateChangePayload extends Payload {
	state: RevealState,
}

export interface PresentationStartPayload extends Payload {
	url: string,
}

export interface WikipediaUrlPayload extends Payload {
	url: string,
}

export interface ActiveModulePayload extends Payload {
	activeModule: string,
}

export interface ClaimAdminRolePayload extends Payload {
	secret: string,
}

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

export type User = {
	socketId: string,
	name: string,
};

export type RoomState = {
	adminIds: Array<string>,
	users: Array<User>,
	activeModule?: string,
	presentationUrl?: string,
	wikipediaUrl?: string,
};

export type PresentationState = {
	state: RevealState,
};
