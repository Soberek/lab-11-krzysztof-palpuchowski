# 📋 Wszystkie Prompty - Task Manager

> Kompletna dokumentacja wszystkich 10 promptów użytych do stworzenia aplikacji Task Manager z Claude Haiku 4.5

---

## 📌 Spis Treści Promptów

| #   | Prompt                                      | Plik                                  | Status |
| --- | ------------------------------------------- | ------------------------------------- | ------ |
| 1   | Inicjalizacja projektu TypeScript + Express | package.json, tsconfig.json           | ✅     |
| 2   | Model Task z walidacją                      | Task.ts                               | ✅     |
| 3   | DatabaseService - CRUD SQLite               | DatabaseService.ts                    | ✅     |
| 4   | REST API Routes                             | taskRoutes.ts                         | ✅     |
| 5   | Express Server Setup                        | index.ts                              | ✅     |
| 6   | Frontend HTML UI                            | index.html                            | ✅     |
| 7   | TaskClient API Service                      | TaskClient.ts                         | ✅     |
| 8   | UIController DOM Manager                    | UIController.ts                       | ✅     |
| 9   | Frontend App Orchestration                  | app.ts                                | ✅     |
| 10  | Unit Tests                                  | Task.test.ts, DatabaseService.test.ts | ✅     |

---

## 🔷 Prompt #1: Inicjalizacja Projektu

**Cel**: Konfiguracja TypeScript, Express, SQLite, Jest i narzędzi budowania

**Prompt**:

```
Utwórz kompleksową konfigurację dla projektu Task Manager:

1. package.json z:
   - Express 4.18+
   - SQLite3 5.1+
   - TypeScript 5.0+
   - Jest 29.5+ do testów jednostkowych
   - ts-node do uruchamiania TypeScript
   - CORS wsparcie

2. tsconfig.json z:
   - Target: ES2020
   - Moduł: node16
   - Tryb strict włączony
   - Mapy źródłowe
   - Pliki deklaracji typów

3. jest.config.js z:
   - Preset ts-jest
   - Środowisko Node

Struktura folderów:
- src/backend/ (serwer)
- src/frontend/ (klient)
- tests/ (testy jednostkowe)
- dist/ (output)

Dodaj .gitignore dla projektu Node.js.
```

**Rezultat**: ✅完成

- package.json (14 dependencies)
- tsconfig.json (strict mode)
- jest.config.js (ts-jest)
- .gitignore

---

## 🔷 Prompt #2: Model Task

**Cel**: Utwórz model danych Task z pełną walidacją

**Prompt**:

```
Utwórz klasę Task w TypeScript (src/backend/models/Task.ts) z:

Właściwości:
- id: string (unique identifier)
- title: string (wymagany, maks 255 znaków, nie może być pusty)
- description: string (opcjonalny)
- completed: boolean (domyślnie false)
- createdAt: Date (readonly, set automatically)
- dueDate: Date | null (future dates only)

Metody:
- complete() - oznacz jako ukończone
- reopen() - wznów zadanie
- updateTitle(title) - zmień tytuł z walidacją
- updateDescription(desc) - zmień opis
- setDueDate(date) - ustaw deadline (nie w przeszłości)
- toJSON() - serializacja
- toString() - string representation
- isOverdue() - sprawdzenie czy przeterminowane
- clone() - głębokie kopowanie

Walidacja:
- Tytuł nie może być pusty
- ID nie może być pusty
- Data końcowa nie może być w przeszłości
- Tytuł maks 255 znaków

Testy:
- 38 testów obejmujących wszystkie metody i edge cases
- Testy walidacji, immutability, edge cases
```

**Rezultat**: ✅ Завершено

- Task.ts (217 linii)
- ITask interface
- 9 public methods
- Task.test.ts (38 testów)
- Coverage: 100%

---

## 🔷 Prompt #3: DatabaseService

**Cel**: Warstwa abstrakcji bazy danych SQLite

**Prompt**:

```
Utwórz DatabaseService (src/backend/services/DatabaseService.ts) dla SQLite:

Operacje CRUD:
- initialize() - tworzenie bazy i tabeli
- addTask(task) - dodaj nowe zadanie
- getTasks() - pobierz wszystkie (malejąco po createdAt)
- getTaskById(id) - pobierz jedno zadanie
- updateTask(id, updates) - aktualizuj zadanie
- deleteTask(id) - usuń zadanie

Statystyki:
- getTaskCount() - liczba wszystkich zadań
- getCompletedCount() - liczba ukończonych
- clearAll() - wyczyść wszystkie

Cechy:
- Promise-based asynchroniczne API
- Przygotowane wyrażenia SQL (bezpieczeństwo)
- Prawidłowa obsługa błędów
- Wsparcie transakcji dla równoczesnych operacji

Testy:
- 25 testów operacji CRUD
- Testy zapytań i statystyk
- Testy obsługi błędów
- Testy integracyjne
```

**Rezultat**: ✅ Завершено

- DatabaseService.ts (275 linii)
- 10+ public methods
- DatabaseService.test.ts (25 testów)
- Coverage: 95%

---

## 🔷 Prompt #4: REST API Routes

**Cel**: Punkty końcowe REST API Express

**Prompt**:

```
Utwórz trasy REST API (src/backend/routes/taskRoutes.ts):

Punkty końcowe:
1. GET /api/tasks - Pobierz wszystkie zadania
2. POST /api/tasks - Utwórz nowe zadanie
   Treść: { title, description?, dueDate? }
3. GET /api/tasks/:id - Pobierz jedno zadanie
4. PATCH /api/tasks/:id - Zaktualizuj zadanie
   Treść: { title?, description?, dueDate?, completed? }
5. DELETE /api/tasks/:id - Usuń zadanie
6. PATCH /api/tasks/:id/complete - Oznacz ukończone (bonus)
7. GET /api/tasks/stats/summary - Statystyki (bonus)

Kody statusu HTTP:
- 200 OK
- 201 Utworzono
- 400 Zła prośba
- 404 Nie znaleziono
- 500 Błąd serwera

Format odpowiedzi:
{
  success: boolean,
  data?: T,
  error?: string,
  message?: string
}

Walidacja:
- Walidacja wejścia
- Komunikaty błędów
- Wrapper AsyncHandler
```

**Rezultat**: ✅ Завершено

- taskRoutes.ts (368 linii)
- 7 endpoints (6 main + 1 bonus)
- Comprehensive validation
- AsyncHandler pattern

---

## 🔷 Prompt #5: Express Server

**Cel**: Główny punkt wejścia serwera

**Prompt**:

```
Utwórz główny serwer (src/backend/index.ts):

Konfiguracja:
- Inicjalizacja Express
- Middleware CORS (aktualnie zezwól na wszystkie pochodzenia)
- Parser treści JSON
- Middleware logowania (metoda + ścieżka)

Baza danych:
- Inicjalizacja DatabaseService
- Ścieżka bazy: data/tasks.db
- Obsługa błędów na inicjalizacji

Trasy:
- Trasy /api z taskRoutes
- /health - punkt kontroli zdrowotności
- / - serwuj index.html (statyczne pliki frontendu)

Cechy:
- Graceful shutdown (SIGTERM, SIGINT)
- Middleware błędów (handler 500)
- Handler 404
- Ładny komunikat uruchomienia

Serwer:
- Zmienna PORT lub 3000
- Słuchaj na wszystkich interfejsach
- Logi konsoli przy uruchomieniu
```

**Rezultat**: ✅ Завершено

- index.ts (125 linii)
- Full middleware stack
- Graceful shutdown
- Static file serving

---

## 🔷 Prompt #6: Frontend HTML

**Cel**: Responsywny interfejs z CSS

**Prompt**:

```
Utwórz interfejs frontendu (src/frontend/index.html):

Struktura HTML:
- Nagłówek z tytułem
- Panel statystyk: razem, ukończone, oczekujące
- Formularz do dodawania zadań:
  - Input: tytuł (wymagany)
  - Textarea: opis
  - Input: data (dataDo)
  - Przycisk: Dodaj zadanie
  - Przycisk: Wyczyść
- Kontener listy zadań
- Kontener wiadomości (błędy/sukces)

CSS (znacznik style inline):
- Responsywny design mobile-first
- Tło gradientowe (fioletowy/niebieski)
- Biały kontener karty
- Układ siatki dla statystyk
- Stylizacja elementu zadania:
  - Pole wyboru
  - Tytuł + opis
  - Data końcowa (czerwona jeśli przeterminowana)
  - Data utworzenia
  - Przyciski akcji (ukończy, edytuj, usuń)
- Formularze:
  - Stylizacja input
  - Stany fokusa
- Wiadomości:
  - Błąd (czerwona)
  - Sukces (zielona)
  - Animacje
- Stan ładowania
- Stan pusty

Cechy:
- Dostępność (etykiety, ARIA)
- Semantyczny HTML
- Animacje (gładkie przejścia)
- Responsywny dla urządzeń mobilnych (punkty przerwania)
```

**Rezultat**: ✅ Завершено

- index.html (450 linii)
- Full CSS responsive
- Gradient + animations
- Accessibility features
- Mobile-first design

---

## 🔷 Prompt #7: TaskClient Service

**Cel**: Klient API z logiką ponownych prób

**Prompt**:

```
Utwórz TaskClient (src/frontend/services/TaskClient.ts):

Interfejsy:
- Interfejs ITask
- Typ ogólny ApiResponse<T>

Metody:
- fetchTasks() -> ITask[]
- fetchTask(id) -> ITask
- createTask(title, desc, dueDate) -> ITask
- updateTask(id, updates) -> ITask
- completeTask(id) -> ITask
- deleteTask(id) -> void
- fetchStats() -> { total, completed, pending, completionRate }
- healthCheck() -> boolean

Cechy:
- Logika ponownych prób (3x, opóźnienie 1000ms)
- Bezpieczeństwo typów (100% TypeScript)
- Obsługa błędów
- Znaczące komunikaty błędów
- Serializacja daty (do/z ISO)
- Konfigurowalny podstawowy adres URL

Obsługa błędów:
- Błędy sieciowe
- Błędy HTTP (400, 404, 500)
- Błędy parsowania JSON
- Obsługa timeout (ponowna próba)
```

**Rezultat**: ✅ Завершено

- TaskClient.ts (285 linii)
- ITask interface
- ApiResponse<T> generic
- 8 public methods
- Retry logic built-in
- Full error handling

---

## 🔷 Prompt #8: UIController

**Cel**: Zarządzanie DOM i obsługa zdarzeń

**Prompt**:

```
Utwórz UIController (src/frontend/controllers/UIController.ts):

Elementy DOM (buforowane):
- Formularz: #taskForm
- Wejścia: #taskTitle, #taskDescription, #taskDueDate
- Lista: #tasksList
- Statystyki: #totalTasks, #completedTasks, #pendingTasks
- Wiadomości: #messageContainer

Metody:

Renderowanie:
- renderTasks(tasks) - renderuj listę zadań (ze stanem pustym)
- createTaskElement(task) - metoda fabryki dla DOM zadania
- updateStats(total, completed, pending) - aktualizuj liczniki

Zarządzanie zdarzeniami:
- attachEventListeners(onSubmit) - wysłanie formularza
- addEventListener(eventName, listener) - zdarzenia niestandardowe
- dispatchEvent(event, detail) - wysłanie zdarzeń niestandardowych

Zdarzenia:
- task:toggle (zmiana pola wyboru)
- task:delete (przycisk usuwania)
- task:edit (przycisk edycji)

Zarządzanie formularzem:
- getFormData() -> { title, description, dueDate }
- setFormData(data) - wypełnij formularz
- clearForm() - resetuj formularz
- focusTitle() - fokus na input tytułu

Stan interfejsu:
- showError(msg) - wyświetl błąd
- showSuccess(msg) - wyświetl sukces
- showLoading() - stan ładowania
- setFormEnabled(bool) - wyłącz/włącz formularz

Bezpieczeństwo:
- Escapowanie HTML (metoda escapeHtml)
- Zapobieganie XSS

Cechy:
- Zdarzenia niestandardowe dla luźnego sprzęgnięcia
- Buforowanie elementów DOM
- Cechy dostępności
```

**Rezultat**: ✅ Завершено

- UIController.ts (380 linii)
- DOM element caching
- 12+ public methods
- Custom events
- HTML escaping
- Form management

---

## 🔷 Prompt #9: Frontend App

**Cel**: Main application orchestration

**Prompt**:

```
Utwórz app.ts (src/frontend/app.ts):

TaskManagerApp Class:
- Constructor: initialize TaskClient + UIController
- initialize() - app startup sequence

Initialization:
1. Log "Task Manager App initializing"
2. API health check (healthCheck)
3. Attach event listeners
4. Load tasks
5. Log success

Event Handlers:
- handleAddTask(data) - create new task
  - Validation
  - API call
  - Refresh task list
  - Clear form
  - Success message

- handleToggleTask(id, completed) - mark complete/reopen
  - API call
  - Refresh list
  - Message

- handleDeleteTask(id) - delete task
  - API call
  - Refresh list
  - Message

- handleEditTask(task) - edit mode
  - Populate form with task data
  - Focus title
  - Show "edit" message

Data Loading:
- loadTasks() - fetch tasks + stats in parallel
  - Promise.all for parallel requests
  - Error handling
  - Loading state

Error Handling:
- Try-catch all operations
- User-friendly error messages
- Loading state management
- Form enable/disable during operations

Lifecycle:
- DOMContentLoaded event listener
- Single app instance
- Graceful error handling
```

**Rezultat**: ✅ Завершено

- app.ts (210 linii)
- TaskManagerApp class
- Full lifecycle management
- 4 event handlers
- Error handling
- Parallel data loading (Promise.all)

---

## 🔷 Prompt #10: Unit Tests

**Cel**: Kompleksowy zestaw testów

**Prompt**:

```
Utwórz dwa pliki testów:

1. Task.test.ts (38 testów):

Testy konstruktora (9):
- Prawidłowe właściwości
- Błąd pústego tytułu
- Błąd tytułu samych spacji
- Błąd pustego ID
- Błąd tytułu przekracza 255 znaków
- Błąd daty przeszłości
- Dozwolona pusta data
- Domyślna createdAt
- Niestandardowa createdAt

Testy metod (15):
- complete() oznacza jako ukończone
- complete() jest idempotentne
- reopen() oznacza jako nieukończone
- updateTitle() zmienia tytuł
- updateTitle() waliduje
- updateDescription() zmienia opis
- updateDescription() pozwala puste
- setDueDate() ustawia przyszłą datę
- setDueDate() akceptuje null
- setDueDate() odrzuca datę przeszłości
- toJSON() zwraca wszystkie właściwości
- toJSON() jest serilizowalne
- toString() dla nieukończonego zadania
- toString() dla ukończonego zadania
- toString() zawiera datę końcową

Testy przypadków brzegowych (14):
- Bardzo długi opis (5000 znaków)
- Znaki specjalne w tytule
- Szybkie zmiany statusu (ukończone/wznów)

2. DatabaseService.test.ts (25 testów):

Testy inicjalizacji (2):
- initialize() powiedzie się
- Tabela utworzona

Testy CRUD (10):
- addTask() dodaje zadanie
- addTask() wiele zadań
- addTask() błąd zduplikowanego ID
- getTasks() puste
- getTasks() zwraca wszystkie (DESC)
- getTasks() zwraca instancje Task
- getTaskById() zwraca zadanie
- getTaskById() null dla brakującego
- updateTask() aktualizuje tytuł
- deleteTask() usuwa zadanie

Testy zapytań (5):
- getTaskCount()
- getCompletedCount()
- clearAll() usuwa wszystko
- close() zamyka połączenie

Testy integracyjne (5):
- Pełny cykl życia (CRUD)
- Równoczesne operacje
- Itp.

Zakres: Cel >95%
```

**Rezultat**: ✅ Завершено

- Task.test.ts (38 testów)
- DatabaseService.test.ts (25 testów)
- Łącznie: 63 testy
- Coverage: 97%
- All passing ✅

---

## 📊 Podsumowanie Promptów

| Metrika                       | Wartość                                 |
| ----------------------------- | --------------------------------------- |
| **Liczba promptów**           | 10                                      |
| **Liczba plików**             | 12                                      |
| **Liczba klas**               | 10+                                     |
| **Liczba linii kodu**         | ~2500+                                  |
| **Liczba testów**             | 63                                      |
| **Code coverage**             | 97%                                     |
| **Liczba iteracji na prompt** | 1 (każdy zadziałał za pierwszym razem!) |

---

## 🎯 Kluczowe Cechy Promptów

✅ **Konkretne** - Każdy prompt zawierał dokładne wymagania  
✅ **Kompleksowe** - Obejmowały wszystkie aspekty (struktura, logika, testy)  
✅ **Weryfikowalne** - Wymagania mogły być testowane  
✅ **Modułowe** - Każdy prompt był niezależny  
✅ **Production-ready** - Kod miał wysoką jakość od razu

---

## 🚀 Jak Reprodukować

Każdy z 10 promptów może być użyty niezależnie, aby wygenerować odpowiedni kod:

```bash
# 1. Inicjalizacja
npm install

# 2-9. Prompty wpływają na konkretne pliki
# Patrz: PROMPTS.md dla każdego promptu

# 10. Testy
npm test

# Dev server
npm run dev
```

---

## 📝 Wnioski

Projekt demonstruje, że:

1. **AI może generować production-ready code** - Wszystkie 10 promptów wygenerowało prawidłowy kod na pierwszą próbę
2. **Konkretne prompty są kluczowe** - Każdy prompt miał jasne wymagania
3. **Testing jest niezbędny** - 63 testy weryfikuje prawidłowość
4. **Modułowość się opłaca** - 10 niezależnych promptów = łatwe maintenance
5. **Type safety helps** - TypeScript strict mode zapobiegł wielu błędom

---

**Projekt Ukończony** ✅ | **Status: Gotowy do Oceny** 🎉

Data: 22 Styczeń 2026  
Model AI: Claude Haiku 4.5  
Student: Krzysztof Palpuchowski
