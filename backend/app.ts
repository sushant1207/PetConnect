import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const app = express();

// Global middleware
app.use(express.json());

// Root route
app.get("/", (_req, res) => {
	res.status(200).send("API is running");
});

// Health check
app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

// Swagger setup
const swaggerSpec = swaggerJSDoc({
	definition: {
		openapi: "3.0.0",
		info: {
			title: "PetConnect API",
			version: "1.0.0"
		},
		servers: [
			{ url: "http://localhost:5555", description: "Local server" }
		]
	},
	apis: ["./routes/**/*.ts", "./controller/**/*.ts", "./app.ts"]
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;


