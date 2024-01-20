import { randomUUID } from "crypto";
import fs from "fs";

export interface Session {
    username: string;
    refreshToken: string;
}

export class SessionHandler {
    #data: Session[] = [];
    dbPath: string;

    constructor(dbName: string = "sessions") {
        this.dbPath = `src/assets/${dbName}.json`;
        this.sync();
    }

    createSession(username: string) {
        const refreshToken = randomUUID();
        this.#data.push({ username, refreshToken });
        return refreshToken;
    }

    deleteSessions(username: string) {
        const targetIndex = this.#data.findIndex(
            (session) => session.username === username
        );
        this.#data.splice(targetIndex, 1);
    }

    deleteSession(refreshToken: string) {
        const targetIndex = this.#data.findIndex(
            (session) => session.refreshToken === refreshToken
        );

        if (targetIndex === -1) {
            return -1;
        }

        this.#data.splice(targetIndex, 1);
        return targetIndex;
    }

    getSession(refreshToken: string) {
        return this.#data.find(
            (session) => session.refreshToken === refreshToken
        );
    }

    save() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.#data, null, 4));
    }

    sync() {
        try {
            const content = fs.readFileSync(this.dbPath, "utf8");
            this.#data = JSON.parse(content);
        } catch (e) {}
    }
}
