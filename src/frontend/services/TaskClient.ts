/**
 * TaskClient Service
 * Komunikacja z REST API backendu
 */

export interface ITask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  dueDate: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class TaskClient {
  private baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper do retry logiki
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, this.retryDelay));
        return this.retryRequest(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Pobiera wszystkie zadania
   */
  async fetchTasks(): Promise<ITask[]> {
    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/tasks`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ApiResponse<ITask[]>;

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch tasks");
      }

      return data.data || [];
    });
  }

  /**
   * Pobiera jedno zadanie
   */
  async fetchTask(id: string): Promise<ITask> {
    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/tasks/${id}`);

      if (response.status === 404) {
        throw new Error("Task not found");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ApiResponse<ITask>;

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch task");
      }

      if (!data.data) {
        throw new Error("No task data in response");
      }

      return data.data;
    });
  }

  /**
   * Tworzy nowe zadanie
   */
  async createTask(
    title: string,
    description: string = "",
    dueDate?: Date,
  ): Promise<ITask> {
    return this.retryRequest(async () => {
      const body: any = {
        title,
        description,
      };

      if (dueDate) {
        body.dueDate = dueDate.toISOString();
      }

      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse<ITask>;

      if (!data.success) {
        throw new Error(data.error || "Failed to create task");
      }

      if (!data.data) {
        throw new Error("No task data in response");
      }

      return data.data;
    });
  }

  /**
   * Aktualizuje zadanie
   */
  async updateTask(
    id: string,
    updates: {
      title?: string;
      description?: string;
      dueDate?: Date | null;
      completed?: boolean;
    },
  ): Promise<ITask> {
    return this.retryRequest(async () => {
      const body: any = {};

      if (updates.title !== undefined) {
        body.title = updates.title;
      }

      if (updates.description !== undefined) {
        body.description = updates.description;
      }

      if (updates.dueDate !== undefined) {
        body.dueDate = updates.dueDate ? updates.dueDate.toISOString() : null;
      }

      if (updates.completed !== undefined) {
        body.completed = updates.completed;
      }

      const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 404) {
        throw new Error("Task not found");
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse<ITask>;

      if (!data.success) {
        throw new Error(data.error || "Failed to update task");
      }

      if (!data.data) {
        throw new Error("No task data in response");
      }

      return data.data;
    });
  }

  /**
   * Oznacza zadanie jako ukończone
   */
  async completeTask(id: string): Promise<ITask> {
    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/tasks/${id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        throw new Error("Task not found");
      }

      if (!response.ok) {
        const error = (await response.json()) as any;
        throw new Error((error?.error as string) || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse<ITask>;

      if (!data.success) {
        throw new Error(data.error || "Failed to complete task");
      }

      if (!data.data) {
        throw new Error("No task data in response");
      }

      return data.data;
    });
  }

  /**
   * Usuwa zadanie
   */
  async deleteTask(id: string): Promise<void> {
    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        throw new Error("Task not found");
      }

      if (!response.ok) {
        const error = (await response.json()) as any;
        throw new Error((error?.error as string) || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse<void>;

      if (!data.success) {
        throw new Error(data.error || "Failed to delete task");
      }
    });
  }

  /**
   * Pobiera statystyki
   */
  async fetchStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
  }> {
    return this.retryRequest(async () => {
      const response = await fetch(`${this.baseUrl}/tasks/stats/summary`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ApiResponse<any>;

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch stats");
      }

      if (!data.data) {
        throw new Error("No stats data in response");
      }

      return data.data;
    });
  }

  /**
   * Sprawdza dostęp do API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch("/health");
      return response.ok;
    } catch {
      return false;
    }
  }
}
