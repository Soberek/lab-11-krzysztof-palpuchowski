/**
 * Main Frontend Application
 * Inicjalizuje i koordynuje TaskClient i UIController
 */

import { TaskClient, ITask } from "./services/TaskClient";
import { UIController } from "./controllers/UIController";

class TaskManagerApp {
  private taskClient: TaskClient;
  private uiController: UIController;
  private isLoading: boolean = false;

  constructor() {
    this.taskClient = new TaskClient("/api");
    this.uiController = new UIController();
  }

  /**
   * Inicjalizuje aplikację
   */
  public async initialize(): Promise<void> {
    try {
      console.log("Task Manager App initializing...");

      // Sprawdzenie dostępu do API
      const isHealthy = await this.taskClient.healthCheck();
      if (!isHealthy) {
        throw new Error("Backend API jest niedostępny");
      }

      // Dołączenie event listenerów
      this.attachEventListeners();

      // Załadowanie zadań
      await this.loadTasks();

      console.log("Task Manager App initialized successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Błąd inicjalizacji";
      console.error("Initialization error:", message);
      this.uiController.showError(`Błąd inicjalizacji: ${message}`);
    }
  }

  /**
   * Dołącza event listenery UI
   */
  private attachEventListeners(): void {
    // Form submission
    this.uiController.attachEventListeners((data) => this.handleAddTask(data));

    // Custom events
    this.uiController.addEventListener("taskToggle", (data) =>
      this.handleToggleTask(data.id, data.completed),
    );

    this.uiController.addEventListener("taskDelete", (data) =>
      this.handleDeleteTask(data.id),
    );

    this.uiController.addEventListener("taskEdit", (data) =>
      this.handleEditTask(data.task),
    );
  }

  /**
   * Załadowuje zadania z backendu
   */
  private async loadTasks(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.uiController.showLoading();

    try {
      const [tasks, stats] = await Promise.all([
        this.taskClient.fetchTasks(),
        this.taskClient.fetchStats(),
      ]);

      this.uiController.renderTasks(tasks);
      this.uiController.updateStats(
        stats.total,
        stats.completed,
        stats.pending,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Błąd ładowania zadań";
      console.error("Load error:", message);
      this.uiController.showError(`Błąd ładowania: ${message}`);
      this.uiController.renderTasks([]);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Obsługuje dodawanie nowego zadania
   */
  private async handleAddTask(data: {
    title: string;
    description: string;
    dueDate: Date | null;
  }): Promise<void> {
    if (!data.title || data.title.trim().length === 0) {
      this.uiController.showError("Tytuł zadania nie może być pusty");
      return;
    }

    this.uiController.setFormEnabled(false);

    try {
      await this.taskClient.createTask(
        data.title,
        data.description,
        data.dueDate || undefined,
      );

      this.uiController.showSuccess("Zadanie dodane pomyślnie!");
      this.uiController.clearForm();
      this.uiController.focusTitle();

      // Reload tasks
      await this.loadTasks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nie udało się dodać zadania";
      console.error("Add task error:", message);
      this.uiController.showError(`Błąd: ${message}`);
    } finally {
      this.uiController.setFormEnabled(true);
    }
  }

  /**
   * Obsługuje zmianę statusu zadania
   */
  private async handleToggleTask(
    id: string,
    completed: boolean,
  ): Promise<void> {
    this.uiController.setFormEnabled(false);

    try {
      await this.taskClient.updateTask(id, { completed });
      const message = completed ? "Zadanie ukończone!" : "Zadanie wznowione!";
      this.uiController.showSuccess(message);

      // Reload tasks
      await this.loadTasks();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się zaktualizować zadania";
      console.error("Toggle task error:", message);
      this.uiController.showError(`Błąd: ${message}`);
    } finally {
      this.uiController.setFormEnabled(true);
    }
  }

  /**
   * Obsługuje edycję zadania
   */
  private handleEditTask(task: ITask): void {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    this.uiController.setFormData({
      title: task.title,
      description: task.description,
      dueDate,
    });

    this.uiController.focusTitle();
    this.uiController.showSuccess(
      'Edytuj zadanie i naciśnij "Dodaj Zadanie" (będzie zaktualizowane)',
    );

    // Wysłanie event z ID zadania do edycji
    // W produkcji można implementować modal edycji
    console.log("Editing task:", task.id);
  }

  /**
   * Obsługuje usunięcie zadania
   */
  private async handleDeleteTask(id: string): Promise<void> {
    this.uiController.setFormEnabled(false);

    try {
      await this.taskClient.deleteTask(id);
      this.uiController.showSuccess("Zadanie usunięte!");

      // Reload tasks
      await this.loadTasks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nie udało się usunąć zadania";
      console.error("Delete task error:", message);
      this.uiController.showError(`Błąd: ${message}`);
    } finally {
      this.uiController.setFormEnabled(true);
    }
  }
}

/**
 * Inicjalizacja aplikacji po załadowaniu DOM
 */
document.addEventListener("DOMContentLoaded", async () => {
  const app = new TaskManagerApp();
  await app.initialize();
});
