import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;
const url = import.meta.env.VITE_API_URL;

export const getConnection = () => {
	if (!connection) {
		connection = new signalR.HubConnectionBuilder()
			.withUrl(`${url}/lobby-hub`, {
				skipNegotiation: true,
				transport: signalR.HttpTransportType.WebSockets,
			})
			.build();
	}
	return connection;
};
