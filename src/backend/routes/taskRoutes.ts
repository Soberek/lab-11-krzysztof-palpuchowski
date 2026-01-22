/**
 * Task Routes
 * REST API endpoints dla zarządzania zadaniami
 */

import { Router, Request, Response, NextFunction } from "express";
import { Task } from "../models/Task";
import { DatabaseService } from "../services/DatabaseService";

export function createTaskRoutes(dbService: DatabaseService): Router {
  const router = Router();

  /**
   * Middleware do obsługi błędów
   */
  const asyncHandler =
    (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res)).catch(next);
    };

  /**
   * GET /api/tasks
   * Pobiera wszystkie zadania
   */
  router.get(
    "/tasks",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const tasks = await dbService.getTasks();
        const taskJsons = tasks.map((task) => task.toJSON());
        res.status(200).json({
          success: true,
          data: taskJsons,
          count: taskJsons.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch tasks",
        });
      }
    }),
  );

  /**
   * GET /api/tasks/:id
   * Pobiera jedno zadanie po ID
   */
  router.get(
    "/tasks/:id",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!id || id.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: "Task ID is required",
          });
          return;
        }

        const task = await dbService.getTaskById(id);

        if (!task) {
          res.status(404).json({
            success: false,
            error: "Task not found",
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: task.toJSON(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch task",
        });
      }
    }),
  );

  /**
   * POST /api/tasks
   * Tworzy nowe zadanie
   * Body: { title: string, description?: string, dueDate?: string }
   */
  router.post(
    "/tasks",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { title, description = "", dueDate } = req.body;

        // Validacja
        if (!title || title.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: "Task title is required",
          });
          return;
        }

        // Generowanie ID
        const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Konwersja dueDate jeśli istnieje
        let dueDateObj: Date | null = null;
        if (dueDate) {
          try {
            dueDateObj = new Date(dueDate);
            if (isNaN(dueDateObj.getTime())) {
              res.status(400).json({
                success: false,
                error: "Invalid due date format",
              });
              return;
            }
          } catch (error) {
            res.status(400).json({
              success: false,
              error: "Invalid due date format",
            });
            return;
          }
        }

        // Tworzenie zadania
        const task = new Task(id, title, description, false, dueDateObj);
        await dbService.addTask(task);

        res.status(201).json({
          success: true,
          data: task.toJSON(),
          message: "Task created successfully",
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("cannot be empty")
        ) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
        if (error instanceof Error && error.message.includes("cannot exceed")) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
        if (error instanceof Error && error.message.includes("in the past")) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }

        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create task",
        });
      }
    }),
  );

  /**
   * PATCH /api/tasks/:id
   * Aktualizuje zadanie
   * Body: { title?: string, description?: string, dueDate?: string, completed?: boolean }
   */
  router.patch(
    "/tasks/:id",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { title, description, dueDate, completed } = req.body;

        if (!id || id.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: "Task ID is required",
          });
          return;
        }

        // Sprawdzenie czy zadanie istnieje
        const existingTask = await dbService.getTaskById(id);
        if (!existingTask) {
          res.status(404).json({
            success: false,
            error: "Task not found",
          });
          return;
        }

        // Przygotowanie updates
        const updates: Partial<Task> = {};

        if (title !== undefined) {
          if (title.trim().length === 0) {
            res.status(400).json({
              success: false,
              error: "Task title cannot be empty",
            });
            return;
          }
          updates.title = title;
        }

        if (description !== undefined) {
          updates.description = description;
        }

        if (dueDate !== undefined) {
          if (dueDate === null) {
            updates.dueDate = null;
          } else {
            try {
              const dueDateObj = new Date(dueDate);
              if (isNaN(dueDateObj.getTime())) {
                res.status(400).json({
                  success: false,
                  error: "Invalid due date format",
                });
                return;
              }
              updates.dueDate = dueDateObj;
            } catch (error) {
              res.status(400).json({
                success: false,
                error: "Invalid due date format",
              });
              return;
            }
          }
        }

        if (completed !== undefined) {
          updates.completed = Boolean(completed);
        }

        // Aktualizacja
        await dbService.updateTask(id, updates);

        // Pobieranie zaktualizowanego zadania
        const updatedTask = await dbService.getTaskById(id);

        res.status(200).json({
          success: true,
          data: updatedTask?.toJSON(),
          message: "Task updated successfully",
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }

        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to update task",
        });
      }
    }),
  );

  /**
   * PATCH /api/tasks/:id/complete
   * Oznacza zadanie jako ukończone
   */
  router.patch(
    "/tasks/:id/complete",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!id || id.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: "Task ID is required",
          });
          return;
        }

        // Sprawdzenie czy zadanie istnieje
        const task = await dbService.getTaskById(id);
        if (!task) {
          res.status(404).json({
            success: false,
            error: "Task not found",
          });
          return;
        }

        // Aktualizacja statusu
        await dbService.updateTask(id, { completed: true });

        const updatedTask = await dbService.getTaskById(id);

        res.status(200).json({
          success: true,
          data: updatedTask?.toJSON(),
          message: "Task marked as completed",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to complete task",
        });
      }
    }),
  );

  /**
   * DELETE /api/tasks/:id
   * Usuwa zadanie
   */
  router.delete(
    "/tasks/:id",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!id || id.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: "Task ID is required",
          });
          return;
        }

        // Sprawdzenie czy zadanie istnieje
        const task = await dbService.getTaskById(id);
        if (!task) {
          res.status(404).json({
            success: false,
            error: "Task not found",
          });
          return;
        }

        // Usunięcie
        await dbService.deleteTask(id);

        res.status(200).json({
          success: true,
          message: "Task deleted successfully",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to delete task",
        });
      }
    }),
  );

  /**
   * GET /api/tasks/stats/summary
   * Pobiera statystyki zadań
   */
  router.get(
    "/tasks/stats/summary",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const total = await dbService.getTaskCount();
        const completed = await dbService.getCompletedCount();
        const pending = total - completed;

        res.status(200).json({
          success: true,
          data: {
            total,
            completed,
            pending,
            completionRate:
              total > 0 ? ((completed / total) * 100).toFixed(2) + "%" : "0%",
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch stats",
        });
      }
    }),
  );

  return router;
}
