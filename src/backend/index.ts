/**
 * Main Server Entry Point
 * Inicjalizuje Express server z middleware i routes
 */

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseService } from "./services/DatabaseService";
import { createTaskRoutes } from "./routes/taskRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Ścieżka do bazy danych
const dbPath =
  process.env.DB_PATH || path.join(__dirname, "../../data/tasks.db");

// Inicjalizuj DatabaseService
const dbService = new DatabaseService(dbPath);

/**
 * Middleware
 */

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * API Routes
 */
const taskRoutes = createTaskRoutes(dbService);
app.use("/api", taskRoutes);

/**
 * Health Check
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Serving Frontend (static files)
 */
const frontendPath = path.join(__dirname, "../../src/frontend");
app.use(express.static(frontendPath));

/**
 * Root route - serve index.html
 */
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/**
 * 404 Handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

/**
 * Error Handler
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/**
 * Server Initialization and Graceful Shutdown
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database
    console.log("Initializing database...");
    await dbService.initialize();
    console.log("Database initialized successfully");

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  Task Manager Server Started           ║
╠════════════════════════════════════════╣
║  URL: http://localhost:${PORT}            ║
║  Health: http://localhost:${PORT}/health  ║
║  API: http://localhost:${PORT}/api/tasks  ║
╚════════════════════════════════════════╝
      `);
    });

    /**
     * Graceful Shutdown
     */
    process.on("SIGTERM", () => shutdownGracefully(server));
    process.on("SIGINT", () => shutdownGracefully(server));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function shutdownGracefully(server: any): Promise<void> {
  console.log("\nShutting down gracefully...");

  server.close(async () => {
    console.log("Server closed");
    try {
      await dbService.close();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error closing database:", error);
    }
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown");
    process.exit(1);
  }, 10000);
}

// Start the server
startServer();

export default app;
