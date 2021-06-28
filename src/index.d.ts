/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */


declare module 'ua-parser-js';


// adapted from
// https://github.com/mika-go-13/janus-typescript-client/blob/master/index.d.ts

declare module 'janus-gateway' {
	export interface Dependencies {
		adapter: any;
		newWebSocket: (server: string, protocol: string) => WebSocket;
		isArray: (array: any) => array is Array<any>;
		checkJanusExtension: () => boolean;
		httpAPICall: (url: string, options: any) => void;
	}

	export enum DebugLevel {
		Trace = 'trace',
		Debug = 'debug',
		Log = 'log',
		Warning = 'warn',
		Error = 'error'
	}

	export interface JSEP {}

	export interface InitOptions {
		debug?: boolean | 'all' | DebugLevel[];
		callback?: Function;
		dependencies?: Dependencies;
	}

	export interface ConstructorOptions {
		server: string | string[];
		iceServers?: RTCIceServer[];
		ipv6?: boolean;
		withCredentials?: boolean;
		max_poll_events?: number;
		destroyOnUnload?: boolean;
		token?: string;
		apisecret?: string;
		success?: Function;
		error?: (error: any) => void;
		destroyed?: Function;
	}

	export enum MessageType {
		Recording = 'recording',
		Starting = 'starting',
		Started = 'started',
		Stopped = 'stopped',
		SlowLink = 'slow_link',
		Preparing = 'preparing',
		Refreshing = 'refreshing'
	}

	export interface Message {
		result?: {
			status: MessageType;
			id?: string;
			uplink?: number;
		};
		error?: Error;
	}

	export interface PluginOptions {
		plugin: string;
		opaqueId?: string;
		success?: (handle: PluginHandle) => void;
		error?: (error: any) => void;
		consentDialog?: (on: boolean) => void;
		webrtcState?: (isConnected: boolean) => void;
		iceState?: (state: 'connected' | 'failed') => void;
		mediaState?: (state: { type: 'audio' | 'video'; on: boolean }) => void;
		slowLink?: (state: { uplink: boolean }) => void;
		onmessage?: (message: Message, jsep?: JSEP) => void;
		onlocalstream?: (stream: MediaStream) => void;
		onremotestream?: (stream: MediaStream) => void;
		ondataopen?: Function;
		ondata?: Function;
		oncleanup?: Function;
		detached?: Function;
	}

	export interface OfferParams {
		media?: {
			audioSend?: boolean;
			audioRecv?: boolean;
			videoSend?: boolean;
			videoRecv?: boolean;
			audio?: boolean | { deviceId: string };
			video?:
				| boolean
				| { deviceId: string }
				| 'lowres'
				| 'lowres-16:9'
				| 'stdres'
				| 'stdres-16:9'
				| 'hires'
				| 'hires-16:9';
			data?: boolean;
			failIfNoAudio?: boolean;
			failIfNoVideo?: boolean;
			screenshareFrameRate?: number;
		};
		trickle?: boolean;
		stream?: MediaStream;
		success: Function;
		error: (error: any) => void;
	}

	export interface PluginMessage {
		message: {
			request: string;
			[otherProps: string]: any;
		};
		jsep?: JSEP;
		[otherProps: string]: any;
	}

	export interface PluginHandle {
		getId(): string;
		getPlugin(): string;
		send(message: PluginMessage): void;
		createOffer(params: any): void;
		createAnswer(params: any): void;
		handleRemoteJsep(params: { jsep: JSEP }): void;
		dtmf(params: any): void;
		data(params: any): void;
		isVideoMuted(): boolean;
		muteVideo(): void;
		unmuteVideo(): void;
		getBitrate(): number;
		hangup(sendRequest?: boolean): void;
		detach(params: any): void;
	}

	export class Janus {
		static attachMediaStream(audioElement: HTMLAudioElement, stream: MediaStream): void;
		static useDefaultDependencies(deps: Partial<Dependencies>): Dependencies;
		static useOldDependencies(deps: Partial<Dependencies>): Dependencies;
		static init(options: InitOptions): void;
		static isWebrtcSupported(): boolean;
		static debug(...args: any[]): void;
		static log(...args: any[]): void;
		static warn(...args: any[]): void;
		static error(...args: any[]): void;
		static randomString(length: number): string;

		constructor(options: ConstructorOptions);

		getServer(): string;
		isConnected(): boolean;
		getSessionId(): string;
		attach(options: PluginOptions): void;
		destroy(): void;
	}
}
