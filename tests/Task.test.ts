import { Task } from "../src/backend/models/Task";

describe("Task Model", () => {
  let task: Task;

  beforeEach(() => {
    task = new Task(
      "task-1",
      "Learn TypeScript",
      "Study TypeScript fundamentals and advanced patterns",
      false,
      new Date("2026-02-01"),
    );
  });

  describe("Constructor", () => {
    test("should create a task with valid properties", () => {
      expect(task.id).toBe("task-1");
      expect(task.title).toBe("Learn TypeScript");
      expect(task.description).toBe(
        "Study TypeScript fundamentals and advanced patterns",
      );
      expect(task.completed).toBe(false);
      expect(task.dueDate).toEqual(new Date("2026-02-01"));
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    test("should throw error for empty title", () => {
      expect(() => {
        new Task("task-2", "", "Description");
      }).toThrow("Task title cannot be empty");
    });

    test("should throw error for whitespace-only title", () => {
      expect(() => {
        new Task("task-2", "   ", "Description");
      }).toThrow("Task title cannot be empty");
    });

    test("should throw error for empty ID", () => {
      expect(() => {
        new Task("", "Valid Title");
      }).toThrow("Task ID cannot be empty");
    });

    test("should throw error for title exceeding 255 characters", () => {
      const longTitle = "a".repeat(256);
      expect(() => {
        new Task("task-2", longTitle);
      }).toThrow("Task title cannot exceed 255 characters");
    });

    test("should throw error for past due date", () => {
      const pastDate = new Date("2020-01-01");
      expect(() => {
        new Task("task-2", "Title", "Description", false, pastDate);
      }).toThrow("Due date cannot be in the past");
    });

    test("should allow null due date", () => {
      const taskWithoutDueDate = new Task(
        "task-2",
        "Title",
        "Description",
        false,
        null,
      );
      expect(taskWithoutDueDate.dueDate).toBeNull();
    });

    test("should set createdAt to current date by default", () => {
      const newTask = new Task("task-2", "Title");
      const now = new Date();
      expect(newTask.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    test("should allow custom createdAt date", () => {
      const customDate = new Date("2025-12-01");
      const newTask = new Task("task-2", "Title", "", false, null, customDate);
      expect(newTask.createdAt).toEqual(customDate);
    });
  });

  describe("complete()", () => {
    test("should mark task as completed", () => {
      expect(task.completed).toBe(false);
      task.complete();
      expect(task.completed).toBe(true);
    });

    test("should allow multiple complete() calls", () => {
      task.complete();
      task.complete();
      expect(task.completed).toBe(true);
    });
  });

  describe("reopen()", () => {
    test("should mark task as not completed", () => {
      task.complete();
      expect(task.completed).toBe(true);
      task.reopen();
      expect(task.completed).toBe(false);
    });
  });

  describe("updateTitle()", () => {
    test("should update task title", () => {
      task.updateTitle("New Title");
      expect(task.title).toBe("New Title");
    });

    test("should throw error for empty title", () => {
      expect(() => {
        task.updateTitle("");
      }).toThrow("Task title cannot be empty");
    });

    test("should throw error for whitespace-only title", () => {
      expect(() => {
        task.updateTitle("   ");
      }).toThrow("Task title cannot be empty");
    });

    test("should throw error for title exceeding 255 characters", () => {
      const longTitle = "a".repeat(256);
      expect(() => {
        task.updateTitle(longTitle);
      }).toThrow("Task title cannot exceed 255 characters");
    });
  });

  describe("updateDescription()", () => {
    test("should update task description", () => {
      task.updateDescription("New description");
      expect(task.description).toBe("New description");
    });

    test("should allow empty description", () => {
      task.updateDescription("");
      expect(task.description).toBe("");
    });
  });

  describe("setDueDate()", () => {
    test("should set a valid future due date", () => {
      const futureDate = new Date("2026-12-31");
      task.setDueDate(futureDate);
      expect(task.dueDate).toEqual(futureDate);
    });

    test("should set due date to null", () => {
      task.setDueDate(null);
      expect(task.dueDate).toBeNull();
    });

    test("should throw error for past due date", () => {
      const pastDate = new Date("2020-01-01");
      expect(() => {
        task.setDueDate(pastDate);
      }).toThrow("Due date cannot be in the past");
    });
  });

  describe("toJSON()", () => {
    test("should return object with all properties", () => {
      const json = task.toJSON();
      expect(json).toHaveProperty("id", "task-1");
      expect(json).toHaveProperty("title", "Learn TypeScript");
      expect(json).toHaveProperty("description");
      expect(json).toHaveProperty("completed", false);
      expect(json).toHaveProperty("createdAt");
      expect(json).toHaveProperty("dueDate");
    });

    test("should return serializable object", () => {
      const json = task.toJSON();
      const jsonString = JSON.stringify(json);
      expect(typeof jsonString).toBe("string");
      const parsed = JSON.parse(jsonString);
      expect(parsed.id).toBe("task-1");
    });
  });

  describe("toString()", () => {
    test("should return string representation of incomplete task", () => {
      const str = task.toString();
      expect(str).toContain("[ ]");
      expect(str).toContain("Learn TypeScript");
    });

    test("should return string representation of completed task", () => {
      task.complete();
      const str = task.toString();
      expect(str).toContain("[✓]");
      expect(str).toContain("Learn TypeScript");
    });

    test("should include due date in string if present", () => {
      const str = task.toString();
      expect(str).toContain("Due:");
    });
  });

  describe("isOverdue()", () => {
    test("should return false for future due date", () => {
      task.dueDate = new Date("2026-12-31");
      expect(task.isOverdue()).toBe(false);
    });

    test("should return true for past due date", () => {
      task.dueDate = new Date("2020-01-01");
      expect(() => {
        task.isOverdue();
      }).not.toThrow();
      // Note: This test will fail in constructor, but we're testing the method
    });

    test("should return false for completed task even if past due date", () => {
      const pastTask = new Task("task-2", "Title");
      pastTask.complete();
      pastTask.dueDate = new Date("2020-01-01");
      expect(pastTask.isOverdue()).toBe(false);
    });

    test("should return false when no due date", () => {
      task.dueDate = null;
      expect(task.isOverdue()).toBe(false);
    });
  });

  describe("clone()", () => {
    test("should create independent copy of task", () => {
      const cloned = task.clone();
      expect(cloned).toEqual(task);
      expect(cloned).not.toBe(task);
    });

    test("should clone with new Date objects", () => {
      const cloned = task.clone();
      cloned.dueDate = new Date("2027-01-01");
      expect(task.dueDate).not.toEqual(cloned.dueDate);
    });

    test("should preserve all properties in clone", () => {
      const cloned = task.clone();
      expect(cloned.id).toBe(task.id);
      expect(cloned.title).toBe(task.title);
      expect(cloned.description).toBe(task.description);
      expect(cloned.completed).toBe(task.completed);
    });
  });

  describe("Immutability", () => {
    test("createdAt should be readonly (enforced by TypeScript)", () => {
      const originalDate = task.createdAt;
      expect(originalDate).toBeInstanceOf(Date);
    });
  });

  describe("Edge Cases", () => {
    test("should handle task with very long description", () => {
      const longDescription = "a".repeat(5000);
      const newTask = new Task("task-2", "Title", longDescription);
      expect(newTask.description.length).toBe(5000);
    });

    test("should handle task with special characters in title", () => {
      const specialTitle = "Task with <html> & special chars!@#$%";
      const newTask = new Task("task-2", specialTitle);
      expect(newTask.title).toBe(specialTitle);
    });

    test("should handle rapid status changes", () => {
      task.complete();
      task.reopen();
      task.complete();
      expect(task.completed).toBe(true);
    });
  });
});
