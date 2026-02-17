const { Room } = require("colyseus");
const { Schema, MapSchema, type } = require("@colyseus/schema");

/* ===== Player Schema ===== */
class Player extends Schema {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");

/* ===== Room State ===== */
class State extends Schema {
    constructor() {
        super();
        this.players = new MapSchema();
    }
}
type({ map: Player })(State.prototype, "players");

/* ===== Room ===== */
class MyRoom extends Room {
    onCreate() {
        this.setState(new State());

        this.onMessage("move", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.z = data.z;
            }
        });
    }

    onJoin(client) {
        this.state.players.set(client.sessionId, new Player());
    }

    onLeave(client) {
        this.state.players.delete(client.sessionId);
    }
}

module.exports = { MyRoom };
