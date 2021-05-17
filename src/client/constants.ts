const serverPort = process.env.SERVER_PORT;
const serverName = process.env.SERVER_NAME;
export const serverUrl = `http://${serverName}:${serverPort}`;
