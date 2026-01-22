import { DatabaseService } from "../src/backend/services/DatabaseService";
import { Task } from "../src/backend/models/Task";

describe("DatabaseService", () => {
  let dbService: DatabaseService;

  beforeEach(async () => {
    dbService = new DatabaseService(":memory:");
    await dbService.initialize();
  });

  afterEach(async () => {
    await dbService.close();
  });

  describe("initialize()", () => {
    test("should initialize database successfully", async () => {
      const service = new DatabaseService(":memory:");
      await expect(service.initialize()).resolves.not.toThrow();
      await service.close();
    });

    test("should create tasks table", async () => {
      const tasks = await dbService.getTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  describe("addTask()", () => {
    test("should add a task to database", async () => {
      const task = new Task("task-1", "Test Task", "Description");
      await dbService.addTask(task);

      const tasks = await dbService.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Test Task");
    });

    test("should add multiple tasks", async () => {
      const task1 = new Task("task-1", "Task 1");
      const task2 = new Task("task-2", "Task 2");

      await dbService.addTask(task1);
      await dbService.addTask(task2);

      const tasks = await dbService.getTasks();
      expect(tasks).toHaveLength(2);
    });

    test("should fail when adding duplicate ID", async () => {
      const task1 = new Task("task-1", "Task 1");
      const task2 = new Task("task-1", "Task 2");

      await dbService.addTask(task1);
      await expect(dbService.addTask(task2)).rejects.toThrow();
    });

    test("should preserve task properties", async () => {
      const dueDate = new Date("2026-12-31");
      const task = new Task(
        "task-1",
        "Task with due date",
        "Description",
        false,
        dueDate,
      );
      await dbService.addTask(task);

      const tasks = await dbService.getTasks();
      expect(tasks[0].title).toBe("Task with due date");
      expect(tasks[0].description).toBe("Description");
      expect(tasks[0].dueDate).toEqual(dueDate);
    });
  });

  describe("getTasks()", () => {
    test("should return empty array when no tasks", async () => {
      const tasks = await dbService.getTasks();
      expect(tasks).toHaveLength(0);
    });

    test("should return all tasks sorted by creation date", async () => {
      const task1 = new Task("task-1", "Task 1");
      const task2 = new Task("task-2", "Task 2");

      await dbService.addTask(task1);
      await new Promise((r) => setTimeout(r, 10));
      await dbService.addTask(task2);

      const tasks = await dbService.getTasks();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe("task-2"); // Newer first
    });

    test("should return Task objects", async () => {
      const task = new Task("task-1", "Test Task");
      await dbService.addTask(task);

      const tasks = await dbService.getTasks();
      expect(tasks[0]).toBeInstanceOf(Task);
    });
  });

  describe("getTaskById()", () => {
    test("should return task by ID", async () => {
      const task = new Task("task-1", "Test Task");
      await dbService.addTask(task);

      const retrieved = await dbService.getTaskById("task-1");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe("Test Task");
    });

    test("should return null for non-existent ID", async () => {
      const retrieved = await dbService.getTaskById("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("updateTask()", () => {
    test("should update task title", async () => {
      const task = new Task("task-1", "Original Title");
      await dbService.addTask(task);

      await dbService.updateTask("task-1", { title: "Updated Title" });

      const updated = await dbService.getTaskById("task-1");
      expect(updated?.title).toBe("Updated Title");
    });

    test("should update task completion status", async () => {
      const task = new Task("task-1", "Task");
      await dbService.addTask(task);

      await dbService.updateTask("task-1", { completed: true });

      const updated = await dbService.getTaskById("task-1");
      expect(updated?.completed).toBe(true);
    });

    test("should update due date", async () => {
      const task = new Task("task-1", "Task");
      await dbService.addTask(task);

      const newDate = new Date("2026-12-31");
      await dbService.updateTask("task-1", { dueDate: newDate });

      const updated = await dbService.getTaskById("task-1");
      expect(updated?.dueDate).toEqual(newDate);
    });

    test("should fail for non-existent task", async () => {
      await expect(
        dbService.updateTask("non-existent", { title: "New Title" }),
      ).rejects.toThrow();
    });

    test("should preserve other properties on partial update", async () => {
      const task = new Task("task-1", "Original Title", "Original Description");
      await dbService.addTask(task);

      await dbService.updateTask("task-1", { title: "New Title" });

      const updated = await dbService.getTaskById("task-1");
      expect(updated?.title).toBe("New Title");
      expect(updated?.description).toBe("Original Description");
    });
  });

  describe("deleteTask()", () => {
    test("should delete a task", async () => {
      const task = new Task("task-1", "Task to delete");
      await dbService.addTask(task);

      await dbService.deleteTask("task-1");

      const remaining = await dbService.getTasks();
      expect(remaining).toHaveLength(0);
    });

    test("should not throw when deleting non-existent task", async () => {
      await expect(dbService.deleteTask("non-existent")).resolves.not.toThrow();
    });

    test("should only delete specified task", async () => {
      const task1 = new Task("task-1", "Task 1");
      const task2 = new Task("task-2", "Task 2");

      await dbService.addTask(task1);
      await dbService.addTask(task2);

      await dbService.deleteTask("task-1");

      const remaining = await dbService.getTasks();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("task-2");
    });
  });

  describe("close()", () => {
    test("should close database connection", async () => {
      const service = new DatabaseService(":memory:");
      await service.initialize();
      await expect(service.close()).resolves.not.toThrow();
    });

    test("should handle closing uninitialized database", async () => {
      const service = new DatabaseService(":memory:");
      await expect(service.close()).resolves.not.toThrow();
    });
  });

  describe("getTaskCount()", () => {
    test("should return correct count", async () => {
      await dbService.addTask(new Task("task-1", "Task 1"));
      await dbService.addTask(new Task("task-2", "Task 2"));

      const count = await dbService.getTaskCount();
      expect(count).toBe(2);
    });

    test("should return 0 for empty database", async () => {
      const count = await dbService.getTaskCount();
      expect(count).toBe(0);
    });
  });

  describe("getCompletedCount()", () => {
    test("should count completed tasks", async () => {
      const task1 = new Task("task-1", "Task 1", "", false);
      const task2 = new Task("task-2", "Task 2", "", true);

      await dbService.addTask(task1);
      await dbService.addTask(task2);

      const count = await dbService.getCompletedCount();
      expect(count).toBe(1);
    });

    test("should return 0 when no completed tasks", async () => {
      await dbService.addTask(new Task("task-1", "Task"));
      const count = await dbService.getCompletedCount();
      expect(count).toBe(0);
    });
  });

  describe("clearAll()", () => {
    test("should delete all tasks", async () => {
      await dbService.addTask(new Task("task-1", "Task 1"));
      await dbService.addTask(new Task("task-2", "Task 2"));

      await dbService.clearAll();

      const tasks = await dbService.getTasks();
      expect(tasks).toHaveLength(0);
    });

    test("should work on empty database", async () => {
      await expect(dbService.clearAll()).resolves.not.toThrow();
    });
  });

  describe("Integration", () => {
    test("should handle full lifecycle of task", async () => {
      // Create
      const task = new Task("task-1", "Complete Task", "Description");
      await dbService.addTask(task);

      // Read
      let retrieved = await dbService.getTaskById("task-1");
      expect(retrieved?.completed).toBe(false);

      // Update
      await dbService.updateTask("task-1", { completed: true });
      retrieved = await dbService.getTaskById("task-1");
      expect(retrieved?.completed).toBe(true);

      // Delete
      await dbService.deleteTask("task-1");
      retrieved = await dbService.getTaskById("task-1");
      expect(retrieved).toBeNull();
    });

    test("should handle concurrent operations", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(dbService.addTask(new Task(`task-${i}`, `Task ${i}`)));
      }

      await Promise.all(promises);

      const count = await dbService.getTaskCount();
      expect(count).toBe(10);
    });
  });
});
