/**
 * DatabaseService
 * Zarządza połączeniem i operacjami na bazie danych SQLite
 */

import sqlite3 from "sqlite3";
import { Task } from "../models/Task";
import path from "path";

export class DatabaseService {
  private db: sqlite3.Database | null = null;
  private readonly dbPath: string;

  constructor(dbPath: string = ":memory:") {
    this.dbPath = dbPath;
  }

  /**
   * Inicjalizuje bazę danych i tworzy tabelę
   * @throws Error jeśli inicjalizacja się nie powiedzie
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }

        this.createTable().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Tworzy tabelę tasks jeśli nie istnieje
   */
  private async createTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = `
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          completed BOOLEAN DEFAULT 0,
          createdAt TEXT NOT NULL,
          dueDate TEXT
        )
      `;

      this.db.run(sql, (err) => {
        if (err) {
          reject(new Error(`Failed to create table: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Dodaje nowe zadanie do bazy danych
   * @param task - Zadanie do dodania
   * @throws Error jeśli operacja się nie powiedzie
   */
  public async addTask(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = `
        INSERT INTO tasks (id, title, description, completed, createdAt, dueDate)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const params = [
        task.id,
        task.title,
        task.description,
        task.completed ? 1 : 0,
        task.createdAt.toISOString(),
        task.dueDate ? task.dueDate.toISOString() : null,
      ];

      this.db.run(sql, params, (err) => {
        if (err) {
          reject(new Error(`Failed to add task: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Pobiera wszystkie zadania z bazy danych
   * @returns Tablica zadań
   * @throws Error jeśli operacja się nie powiedzie
   */
  public async getTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = "SELECT * FROM tasks ORDER BY createdAt ASC";

      this.db.all(sql, (err, rows: any[]) => {
        if (err) {
          reject(new Error(`Failed to fetch tasks: ${err.message}`));
          return;
        }

        try {
          const tasks = rows.map((row) => this.rowToTask(row));
          tasks.reverse();
          resolve(tasks);
        } catch (error) {
          reject(new Error(`Failed to parse tasks: ${error}`));
        }
      });
    });
  }

  /**
   * Pobiera jedno zadanie po ID
   * @param id - ID zadania
   * @returns Zadanie lub null jeśli nie znaleziono
   * @throws Error jeśli operacja się nie powiedzie
   */
  public async getTaskById(id: string): Promise<Task | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = "SELECT * FROM tasks WHERE id = ?";

      this.db.get(sql, [id], (err, row: any) => {
        if (err) {
          reject(new Error(`Failed to fetch task: ${err.message}`));
          return;
        }

        if (!row) {
          resolve(null);
        } else {
          try {
            resolve(this.rowToTask(row));
          } catch (error) {
            reject(new Error(`Failed to parse task: ${error}`));
          }
        }
      });
    });
  }

  /**
   * Aktualizuje zadanie
   * @param id - ID zadania
   * @param updates - Zmiany do zastosowania
   * @throws Error jeśli operacja się nie powiedzie
   */
  public async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const existingTask = await this.getTaskById(id);
        if (!existingTask) {
          reject(new Error(`Task with id ${id} not found`));
          return;
        }

        const task = new Task(
          id,
          updates.title ?? existingTask.title,
          updates.description ?? existingTask.description,
          updates.completed ?? existingTask.completed,
          updates.dueDate ?? existingTask.dueDate,
          existingTask.createdAt,
        );

        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }

        const sql = `
          UPDATE tasks
          SET title = ?, description = ?, completed = ?, dueDate = ?
          WHERE id = ?
        `;

        const params = [
          task.title,
          task.description,
          task.completed ? 1 : 0,
          task.dueDate ? task.dueDate.toISOString() : null,
          id,
        ];

        this.db.run(sql, params, (err) => {
          if (err) {
            reject(new Error(`Failed to update task: ${err.message}`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Usuwa zadanie
   * @param id - ID zadania do usunięcia
   * @throws Error jeśli operacja się nie powiedzie
   */
  public async deleteTask(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = "DELETE FROM tasks WHERE id = ?";

      this.db.run(sql, [id], (err) => {
        if (err) {
          reject(new Error(`Failed to delete task: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Zamyka połączenie z bazą danych
   * @throws Error jeśli zamykanie się nie powiedzie
   */
  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(new Error(`Failed to close database: ${err.message}`));
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }

  /**
   * Konwertuje wiersz z bazy na obiekt Task
   * @param row - Wiersz z bazy danych
   * @returns Instancja Task
   */
  private rowToTask(row: any): Task {
    return new Task(
      row.id,
      row.title,
      row.description || "",
      row.completed === 1,
      row.dueDate ? new Date(row.dueDate) : null,
      new Date(row.createdAt),
    );
  }

  /**
   * Zwraca liczbę wszystkich zadań
   * @returns Liczba zadań
   */
  public async getTaskCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = "SELECT COUNT(*) as count FROM tasks";

      this.db.get(sql, (err, row: any) => {
        if (err) {
          reject(new Error(`Failed to count tasks: ${err.message}`));
        } else {
          resolve(row.count);
        }
      });
    });
  }

  /**
   * Zwraca liczbę ukończonych zadań
   * @returns Liczba ukończonych zadań
   */
  public async getCompletedCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = "SELECT COUNT(*) as count FROM tasks WHERE completed = 1";

      this.db.get(sql, (err, row: any) => {
        if (err) {
          reject(new Error(`Failed to count completed tasks: ${err.message}`));
        } else {
          resolve(row.count);
        }
      });
    });
  }

  /**
   * Czyści wszystkie zadania z bazy
   * @throws Error jeśli operacja się nie powiedzie
   */
  public async clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = "DELETE FROM tasks";

      this.db.run(sql, (err) => {
        if (err) {
          reject(new Error(`Failed to clear tasks: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}
