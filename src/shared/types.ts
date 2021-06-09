export type AnyPayload = Record<string, unknown>;
export type EmptyPayload = Record<string, never>;

export interface RevealStateChangePayload extends AnyPayload {
	state: Partial<RevealState>,
}

export interface PresentationStartPayload extends AnyPayload {
	url: string,
}

export interface UrlPayload extends AnyPayload {
	url: string,
}

export interface MatrixRoomPayload extends AnyPayload {
	roomId: string,
}

export interface ActiveModulePayload extends AnyPayload {
	activeModule: string,
}

export interface ClaimAdminRolePayload extends AnyPayload {
	secret: string,
}

export interface AuthTokenPayload extends AnyPayload {
	token: string,
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
	name: string,
	socketId: string,
	matrixUserId?: string,
	connected?: boolean,
	muted?: boolean,
};

export type RoomState = {
	adminIds: Array<string>,
	users: Array<UserInfo>,
};

export type ModuleState = {
	activeModule: string,
	url?: string,
	activeSectionHash?: string,
	presentationState: {
		state: Partial<RevealState>
	},
	matrixRoomId: string,
};
