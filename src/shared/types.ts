export type Payload = Record<string, unknown>;
export type EmptyPayload = Payload;

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

export interface UserPayload extends Payload {
	name: string,
	socketId: string,
	connected: boolean,
	muted: boolean,
}

export type Message<PayloadType> = {
	authToken?: string,
	payload: PayloadType,
};

export type RevealState = {
	indexh: number,
	indexv: number,
	indexf?: number,
	paused: boolean,
	overview: boolean,
};

export type UserInfo = {
	socketId: string,
	name: string,
};

export type RoomState = {
	adminIds: Array<string>,
	users: Array<UserInfo>,
	activeModule?: string,
	presentationUrl?: string,
	wikipediaUrl?: string,
};

export type PresentationState = {
	state: RevealState,
};
