/**
 * UIController
 * Zarządza interfejsem użytkownika i interakcją z DOM
 */

import { ITask } from "../services/TaskClient";

export class UIController {
  private taskForm: HTMLFormElement;
  private taskTitle: HTMLInputElement;
  private taskDescription: HTMLTextAreaElement;
  private taskDueDate: HTMLInputElement;
  private tasksList: HTMLElement;
  private messageContainer: HTMLElement;
  private totalTasksEl: HTMLElement;
  private completedTasksEl: HTMLElement;
  private pendingTasksEl: HTMLElement;

  constructor() {
    // Pobranie elementów z DOM
    this.taskForm = document.getElementById("taskForm") as HTMLFormElement;
    this.taskTitle = document.getElementById("taskTitle") as HTMLInputElement;
    this.taskDescription = document.getElementById(
      "taskDescription",
    ) as HTMLTextAreaElement;
    this.taskDueDate = document.getElementById(
      "taskDueDate",
    ) as HTMLInputElement;
    this.tasksList = document.getElementById("tasksList") as HTMLElement;
    this.messageContainer = document.getElementById(
      "messageContainer",
    ) as HTMLElement;
    this.totalTasksEl = document.getElementById("totalTasks") as HTMLElement;
    this.completedTasksEl = document.getElementById(
      "completedTasks",
    ) as HTMLElement;
    this.pendingTasksEl = document.getElementById(
      "pendingTasks",
    ) as HTMLElement;

    // Validacja czy elementy zostały znalezione
    if (!this.taskForm || !this.tasksList || !this.messageContainer) {
      throw new Error("Required DOM elements not found");
    }
  }

  /**
   * Renderuje listę zadań
   */
  public renderTasks(tasks: ITask[]): void {
    this.tasksList.innerHTML = "";

    if (tasks.length === 0) {
      this.tasksList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Brak zadań. Dodaj nowe zadanie aby zacząć!</p>
        </div>
      `;
      return;
    }

    const taskElements = tasks.map((task) => this.createTaskElement(task));
    this.tasksList.append(...taskElements);
  }

  /**
   * Tworzy element DOM dla pojedynczego zadania
   */
  private createTaskElement(task: ITask): HTMLElement {
    const div = document.createElement("div");
    div.className = `task-item ${task.completed ? "completed" : ""}`;
    div.dataset.taskId = task.id;

    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && new Date() > dueDate && !task.completed;

    let dueDateHtml = "";
    if (dueDate) {
      const dateStr = dueDate.toLocaleDateString("pl-PL");
      const dueDateClass = isOverdue ? "overdue" : "";
      dueDateHtml = `<span class="task-due-date ${dueDateClass}">📅 ${dateStr}</span>`;
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      this.dispatchEvent("taskToggle", {
        id: task.id,
        completed: checkbox.checked,
      });
    });

    const content = document.createElement("div");
    content.className = "task-content";

    content.innerHTML = `
      <div class="task-title">${this.escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ""}
      <div class="task-meta">
        ${dueDateHtml}
        <span>Utworzone: ${new Date(task.createdAt).toLocaleDateString("pl-PL")}</span>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    if (!task.completed) {
      const completeBtn = document.createElement("button");
      completeBtn.type = "button";
      completeBtn.className = "btn-success";
      completeBtn.textContent = "✓";
      completeBtn.title = "Oznacz jako ukończone";
      completeBtn.addEventListener("click", () => {
        this.dispatchEvent("taskToggle", { id: task.id, completed: true });
      });
      actions.appendChild(completeBtn);
    }

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn-secondary";
    editBtn.textContent = "✏️";
    editBtn.title = "Edytuj";
    editBtn.addEventListener("click", () => {
      this.dispatchEvent("taskEdit", { id: task.id, task });
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Usuń";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Czy na pewno chcesz usunąć "${task.title}"?`)) {
        this.dispatchEvent("taskDelete", { id: task.id });
      }
    });
    actions.appendChild(deleteBtn);

    div.appendChild(checkbox);
    div.appendChild(content);
    div.appendChild(actions);

    return div;
  }

  /**
   * Dołącza event listenery
   */
  public attachEventListeners(onSubmit: (data: any) => Promise<void>): void {
    this.taskForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      try {
        await onSubmit({
          title: this.taskTitle.value,
          description: this.taskDescription.value,
          dueDate: this.taskDueDate.value
            ? new Date(this.taskDueDate.value)
            : null,
        });
        this.taskForm.reset();
      } catch (error) {
        this.showError(
          error instanceof Error
            ? error.message
            : "Błąd przy dodawaniu zadania",
        );
      }
    });
  }

  /**
   * Pobiera dane z formularza
   */
  public getFormData(): {
    title: string;
    description: string;
    dueDate: Date | null;
  } {
    return {
      title: this.taskTitle.value,
      description: this.taskDescription.value,
      dueDate: this.taskDueDate.value ? new Date(this.taskDueDate.value) : null,
    };
  }

  /**
   * Ustawia dane w formularzu
   */
  public setFormData(data: {
    title?: string;
    description?: string;
    dueDate?: Date | null;
  }): void {
    if (data.title !== undefined) {
      this.taskTitle.value = data.title;
    }
    if (data.description !== undefined) {
      this.taskDescription.value = data.description;
    }
    if (data.dueDate !== undefined) {
      this.taskDueDate.value = data.dueDate
        ? data.dueDate.toISOString().split("T")[0]
        : "";
    }
  }

  /**
   * Czyści formularz
   */
  public clearForm(): void {
    this.taskForm.reset();
  }

  /**
   * Wyświetla komunikat błędu
   */
  public showError(message: string): void {
    this.showMessage(message, "error");
  }

  /**
   * Wyświetla komunikat sukcesu
   */
  public showSuccess(message: string): void {
    this.showMessage(message, "success");
  }

  /**
   * Wyświetla komunikat
   */
  private showMessage(
    message: string,
    type: "error" | "success" = "error",
  ): void {
    const className = type === "error" ? "error-message" : "success-message";
    const html = `<div class="${className}">${this.escapeHtml(message)}</div>`;

    this.messageContainer.innerHTML = html;

    // Auto-hide po 5 sekund
    setTimeout(() => {
      this.messageContainer.innerHTML = "";
    }, 5000);
  }

  /**
   * Pokazuje loading state
   */
  public showLoading(): void {
    this.tasksList.innerHTML = `
      <div class="loading">
        <div class="loader"></div>
        <p>Ładowanie zadań...</p>
      </div>
    `;
  }

  /**
   * Aktualizuje statystyki
   */
  public updateStats(total: number, completed: number, pending: number): void {
    this.totalTasksEl.textContent = total.toString();
    this.completedTasksEl.textContent = completed.toString();
    this.pendingTasksEl.textContent = pending.toString();
  }

  /**
   * Dodaje event listener na custom event
   */
  public addEventListener(
    event: "taskToggle" | "taskDelete" | "taskEdit",
    listener: (data: any) => void,
  ): void {
    window.addEventListener(`task:${event}`, (e: any) => {
      listener(e.detail);
    });
  }

  /**
   * Dispatch custom event
   */
  private dispatchEvent(event: string, detail: any): void {
    window.dispatchEvent(new CustomEvent(`task:${event}`, { detail }));
  }

  /**
   * Escape HTML dla bezpieczeństwa
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Ustawia fokus na pole tytułu
   */
  public focusTitle(): void {
    this.taskTitle.focus();
  }

  /**
   * Wyłącza/włącza formularz
   */
  public setFormEnabled(enabled: boolean): void {
    this.taskForm.querySelectorAll("input, textarea, button").forEach((el) => {
      (el as HTMLFormElement).disabled = !enabled;
    });
  }
}
