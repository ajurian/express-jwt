import axios from "axios";
import cookie from "cookie";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

function App() {
    const [user, setUser] = useState<{ username: string } | null>(null);
    const [username, setUsername] = useState("");

    const logOut: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault();

        try {
            setUsername("");
            await axios.delete("http://localhost:3001/oauth/session", {
                withCredentials: true,
            });
        } catch (e) {
            //
        }

        location.reload();
    };

    const createSession: React.FormEventHandler<HTMLFormElement> = async (
        e
    ) => {
        e.preventDefault();

        try {
            setUsername("");

            const res = await axios.post(
                "http://localhost:3001/oauth/session",
                { username },
                {
                    withCredentials: true,
                }
            );

            document.cookie = cookie.serialize(
                "access_token",
                res.data.access_token,
                {
                    path: "/",
                    maxAge: 86400,
                }
            );
            document.cookie = cookie.serialize(
                "refresh_token",
                res.data.refresh_token,
                {
                    path: "/",
                    maxAge: 86400,
                }
            );
        } catch (e) {
            //
        }

        location.reload();
    };

    useEffect(() => {
        const source = axios.CancelToken.source();

        const updateUser = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:3001/oauth/session",
                    {
                        cancelToken: source.token,
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${Cookies.get(
                                "access_token"
                            )}`,
                        },
                    }
                );

                setUser((res.data.user as { username: string }) || null);
            } catch (e) {
                setUser(null);
            }
        };

        updateUser();

        return () => {
            source.cancel();
        };
    }, [username]);

    return (
        <div style={{ padding: "1em" }}>
            {user === null ? (
                <form
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        maxWidth: "20em",
                        gap: "0.5em",
                    }}
                    onSubmit={createSession}
                >
                    <label htmlFor="username">Login</label>
                    <input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                    />
                    <button type="submit">Submit</button>
                </form>
            ) : (
                <button onClick={logOut}>Log out</button>
            )}
            <pre>{JSON.stringify(user)}</pre>
        </div>
    );
}

export default App;
