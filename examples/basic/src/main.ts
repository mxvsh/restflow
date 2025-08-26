import express from "express";
import jwt from "jsonwebtoken";

const host = process.env.HOST ?? "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

app.use(express.json());

const authenticateToken = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
) => {
	const authHeader = req.headers.authorization ?? "";
	const token = authHeader.split(" ")[1];

	if (!token) {
		res.status(401).send({ status: "error", message: "Access token required" });
	} else {
		jwt.verify(token, JWT_SECRET, (err, user) => {
			if (err) {
				res.status(403).send({ status: "error", message: "Invalid token" });
			}
			// @ts-expect-error - valid
			req.user = user;
			next();
		});
	}
};

type User = {
	id: string;
	name: string;
	email: string;
	password: string;
};

const users: User[] = [];

app.get("/health", (_, res) => {
	res.send({ status: "ok", version: "2.0.0" });
});

app.post("/register", (req, res) => {
	const user = req.body as User;
	users.push(user);
	res.send({ status: "ok" });
});

app.post("/login", (req, res) => {
	const { email, password } = req.body;

	const user = users.find(
		(user) => user.email === email && user.password === password,
	);

	if (!user) {
		res.status(401).send({ status: "error", message: "Invalid credentials" });
	} else {
		const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
			expiresIn: "1h",
		});
		res.send({ status: "ok", user: user, token });
	}
});

app.get("/auth/profile", authenticateToken, (req, res) => {
	// @ts-expect-error - valid
	const userId = req.user.id;
	const user = users.find((u) => u.id === userId);

	if (!user) {
		res.status(404).send({ status: "error", message: "User not found" });
	} else {
		res.send({
			status: "ok",
			user: { id: user.id, name: user.name, email: user.email },
		});
	}
});

app.listen(port, host, () => {
	console.log(`[ ready ] http://${host}:${port}`);
});
