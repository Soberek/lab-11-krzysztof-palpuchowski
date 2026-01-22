/**
 * Task Model
 * Reprezentuje pojedyncze zadanie w aplikacji Task Manager
 */

export interface ITask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  dueDate: Date | null;
}

export class Task implements ITask {
  public id: string;
  public title: string;
  public description: string;
  public completed: boolean;
  public readonly createdAt: Date;
  public dueDate: Date | null;

  /**
   * Konstruktor klasy Task
   * @param id - Unikalne ID zadania
   * @param title - Tytuł zadania (nie może być pusty)
   * @param description - Opis zadania (opcjonalny)
   * @param completed - Czy zadanie jest ukończone
   * @param dueDate - Data końcowa (opcjonalna)
   * @throws Error jeśli tytuł jest pusty lub ID nie jest unikalne
   */
  constructor(
    id: string,
    title: string,
    description: string = "",
    completed: boolean = false,
    dueDate: Date | null = null,
    createdAt: Date = new Date(),
  ) {
    this.validateTitle(title);
    this.validateId(id);
    this.validateDueDate(dueDate);

    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.dueDate = dueDate;
    this.createdAt = createdAt;
  }

  /**
   * Waliduje tytuł zadania
   * @param title - Tytuł do walidacji
   * @throws Error jeśli tytuł jest pusty lub zawiera tylko whitespace
   */
  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error("Task title cannot be empty");
    }
    if (title.length > 255) {
      throw new Error("Task title cannot exceed 255 characters");
    }
  }

  /**
   * Waliduje ID zadania
   * @param id - ID do walidacji
   * @throws Error jeśli ID jest pusty
   */
  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Task ID cannot be empty");
    }
  }

  /**
   * Waliduje datę końcową
   * @param dueDate - Data do walidacji
   * @throws Error jeśli data jest w przeszłości
   */
  private validateDueDate(dueDate: Date | null): void {
    if (dueDate && dueDate < new Date()) {
      throw new Error("Due date cannot be in the past");
    }
  }

  /**
   * Oznacza zadanie jako ukończone
   * Ustawia completed na true
   */
  public complete(): void {
    this.completed = true;
  }

  /**
   * Wraca do stanu nieukończonego
   */
  public reopen(): void {
    this.completed = false;
  }

  /**
   * Aktualizuje tytuł zadania
   * @param title - Nowy tytuł
   * @throws Error jeśli nowy tytuł jest nieprawidłowy
   */
  public updateTitle(title: string): void {
    this.validateTitle(title);
    this.title = title;
  }

  /**
   * Aktualizuje opis zadania
   * @param description - Nowy opis
   */
  public updateDescription(description: string): void {
    this.description = description;
  }

  /**
   * Ustawia datę końcową zadania
   * @param date - Nowa data (może być null)
   * @throws Error jeśli data jest w przeszłości
   */
  public setDueDate(date: Date | null): void {
    this.validateDueDate(date);
    this.dueDate = date;
  }

  /**
   * Konwertuje zadanie do obiektu JSON
   * @returns Reprezentacja JSON zadania
   */
  public toJSON(): ITask {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt,
      dueDate: this.dueDate,
    };
  }

  /**
   * Konwertuje zadanie do string
   * @returns String reprezentacja zadania
   */
  public toString(): string {
    const status = this.completed ? "[✓]" : "[ ]";
    return `${status} ${this.title}${this.dueDate ? ` (Due: ${this.dueDate.toISOString()})` : ""}`;
  }

  /**
   * Sprawdza czy zadanie jest przeterminowane
   * @returns true jeśli dueDate istnieje i jest w przeszłości
   */
  public isOverdue(): boolean {
    if (!this.dueDate || this.completed) {
      return false;
    }
    return this.dueDate < new Date();
  }

  /**
   * Klonuje zadanie
   * @returns Kopia zadania
   */
  public clone(): Task {
    return new Task(
      this.id,
      this.title,
      this.description,
      this.completed,
      this.dueDate ? new Date(this.dueDate) : null,
      new Date(this.createdAt),
    );
  }
}
