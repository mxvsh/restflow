import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";

function sleepForRandomTime() {
	return new Promise((resolve) => {
		const delay = Math.random() * 2000;
		setTimeout(resolve, delay);
	});
}

interface User {
	id: number;
	username: string;
	password: string;
}

const app = new Hono();

const users: User[] = [];
const JWT_SECRET = "secret-key";

app.get("/", async (c) => {
	await sleepForRandomTime();
	return c.text("Hello Hono!");
});

app.post("/auth/register", async (c) => {
	const { username, password } = await c.req.json();

	await sleepForRandomTime();

	if (users.find((u) => u.username === username)) {
		return c.json({ error: "User already exists" }, 400);
	}

	const user = { id: users.length + 1, username, password };
	users.push(user);

	return c.json({ message: "User registered successfully", userId: user.id });
});

app.post("/auth/login", async (c) => {
	const { username, password } = await c.req.json();

	await sleepForRandomTime();

	const user = users.find(
		(u) => u.username === username && u.password === password,
	);
	if (!user) {
		return c.json({ error: "Invalid credentials" }, 401);
	}

	const token = await sign(
		{
			id: user.id,
			username: user.username,
			exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
		},
		JWT_SECRET,
	);
	return c.json({ token });
});

const jwtMiddleware = jwt({ secret: JWT_SECRET });

app.get("/auth/profile", jwtMiddleware, async (c) => {
	const payload = c.get("jwtPayload");

	if (!payload) {
		return c.json({ error: "Invalid token" }, 401);
	}
	const user = users.find((u) => u.id === payload.id);

	await sleepForRandomTime();

	if (!user) {
		return c.json({ error: "User not found" }, 404);
	}

	return c.json({ id: user.id, username: user.username });
});

app.put("/auth/profile", jwtMiddleware, async (c) => {
	const payload = c.get("jwtPayload");

	if (!payload) {
		return c.json({ error: "Invalid token" }, 401);
	}
	const { username } = await c.req.json();

	await sleepForRandomTime();

	const user = users.find((u) => u.id === payload.id);
	if (!user) {
		return c.json({ error: "User not found" }, 404);
	}

	if (users.find((u) => u.username === username && u.id !== user.id)) {
		return c.json({ error: "Username already taken" }, 400);
	}

	user.username = username;
	return c.json({
		message: "Profile updated successfully",
		user: { id: user.id, username: user.username },
	});
});

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);

process.on("SIGINT", () => {
	process.exit(0);
});

process.on("SIGTERM", () => {
	process.exit(0);
});
