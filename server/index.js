const { Server } = require("colyseus");
const { MyRoom } = require("./room/MyRoom");

const gameServer = new Server();

gameServer.define("town", MyRoom);

gameServer.listen(2567);
console.log("✅ Colyseus running on ws://localhost:2567");
