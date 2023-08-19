import * as signalR from "@microsoft/signalr";
import { toast } from "react-hot-toast";

let connection: signalR.HubConnection | null = null;
const url = import.meta.env.VITE_API_URL;

const createConnection = async() => {
	if (!connection)
	{
		connection = new signalR.HubConnectionBuilder()
				.withUrl(`${url}/lobby-hub`, {
					skipNegotiation: true,
					transport: signalR.HttpTransportType.WebSockets,
				})
				.build();
	}
}


export const getConnection = () => {
	toast.promise(
		createConnection(),
		  {
			loading: "Loading...",
			success: () => {
			  return "Connected!";
			},
			error: (error) => {
			  return error.message;
			},
		  },
		  {
			style: {
			  background: "#333",
			  color: "#fff",
			},
		  }
	);
	return connection;
};
