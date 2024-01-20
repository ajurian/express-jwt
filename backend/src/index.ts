import cookieParser from "cookie-parser";
import cors from "cors";
import { randomUUID } from "crypto";
import express, { json } from "express";
import { createServer } from "http";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { z } from "zod";
import { SessionHandler } from "./sessionHandler";
import { makeBodyEndpoint, makeQueryEndpoint } from "./utils";

const PRIVATE_KEY = "secret";
const PORT = 3001;

const sessionHandler = new SessionHandler();
const app = express();
const server = createServer(app);

app.use(json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.delete("/oauth/session", (req, res) => {
    const refreshToken = req.cookies.refresh_token ?? "";
    const success = sessionHandler.deleteSession(refreshToken) > -1;

    if (success) {
        sessionHandler.save();
        res.status(200).json({ status: "success" });
    } else {
        res.status(400).json({ status: "error" });
    }
});

app.get(
    "/oauth/session",
    makeQueryEndpoint(
        z.object({
            auto_refresh: z.boolean().default(true),
        }),
        (req, res, query) => {
            const refreshToken = req.cookies.refresh_token;
            const session = sessionHandler.getSession(refreshToken);
            const { auto_refresh: autoRefresh } = query;

            try {
                const accessToken = z
                    .string({ required_error: "access token is required" })
                    .parse(req.headers.authorization?.split(" ")[1]);

                if (session === undefined) {
                    return res
                        .status(200)
                        .json({ status: "success", user: null });
                }

                const payload = jwt.verify(accessToken, PRIVATE_KEY, {
                    algorithms: ["HS256"],
                });

                res.status(200).json({
                    status: "success",
                    /* @ts-expect-error */
                    user: { username: payload.username },
                });
            } catch (e) {
                if (e instanceof TokenExpiredError) {
                    if (autoRefresh && session) {
                        session.refreshToken = randomUUID();

                        return res.status(200).json({
                            status: "replace",
                            access_token: jwt.sign(
                                { username: session.username },
                                PRIVATE_KEY,
                                {
                                    expiresIn: 3600,
                                    algorithm: "HS256",
                                }
                            ),
                            refresh_token: session.refreshToken,
                            user: {
                                username: session.username,
                            },
                        });
                    }

                    return res
                        .status(401)
                        .json({ status: "error", message: e.message });
                }

                if (e instanceof JsonWebTokenError) {
                    return res
                        .status(400)
                        .json({ status: "error", message: e.message });
                }

                res.status(400).json({
                    status: "error",
                    message: "unkown error",
                });
            }
        }
    )
);

app.post(
    "/oauth/session",
    makeBodyEndpoint(
        z.object({
            username: z.string({ required_error: "username is required" }),
        }),
        (req, res, body) => {
            let refreshToken = req.cookies.refresh_token;
            const session = sessionHandler.getSession(refreshToken);

            try {
                const { username } = body;

                if (session === undefined) {
                    refreshToken = sessionHandler.createSession(username);
                    sessionHandler.save();
                }

                res.status(200).json({
                    status: "success",
                    access_token: jwt.sign({ username }, PRIVATE_KEY, {
                        expiresIn: 3600,
                        algorithm: "HS256",
                    }),
                    refresh_token: refreshToken,
                });
            } catch (e) {
                if (e instanceof JsonWebTokenError) {
                    return res
                        .status(400)
                        .json({ status: "error", message: e.message });
                }

                res.status(400).json({
                    status: "error",
                    message: "unkown error",
                });
            }
        }
    )
);

server.listen(PORT, () => {
    console.log("Listening on port", PORT);
});
