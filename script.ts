// --- 타입 및 인터페이스 정의 ---
interface Todo {
    id: number;
    title: string;
    isDone: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

// --- API 서비스, 캐시 서비스, UI 서비스 클래스는 이전과 동일 ---
class ApiService {
    private readonly BASE_URL = 'http://localhost:3000/todos';

    async fetchTodos(): Promise<Todo[]> {
        const response = await fetch(this.BASE_URL);
        if (!response.ok) throw new Error('서버에서 데이터를 가져오지 못했습니다.');
        return response.json();
    }

    async createTodo(title: string): Promise<Todo> {
        const response = await fetch(this.BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        if (!response.ok) throw new Error('할 일 추가에 실패했습니다.');
        return response.json();
    }

    async updateTodo(id: number, updatedData: Partial<Todo>): Promise<Todo> {
        const response = await fetch(`${this.BASE_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });
        if (!response.ok) throw new Error('할 일 업데이트에 실패했습니다.');
        return response.json();
    }

    async deleteTodo(id: number): Promise<void> {
        const response = await fetch(`${this.BASE_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('할 일 삭제에 실패했습니다.');
    }
}

class CacheService {
    private readonly CACHE_KEY = 'todos';
    getTodos(): Todo[] | null { const cached = localStorage.getItem(this.CACHE_KEY); return cached ? JSON.parse(cached) : null; }
    setTodos(todos: Todo[]): void { localStorage.setItem(this.CACHE_KEY, JSON.stringify(todos)); }
}

class UiService {
    showToast(message: string): void {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}


// --- 메인 애플리케이션 클래스 ---
class TodoListApp {
    private todos: Todo[] = [];
    private currentFilter: FilterType = 'all';

    constructor(
        private readonly api: ApiService,
        private readonly cache: CacheService,
        private readonly ui: UiService
    ) {}

    private elements!: {
        form: HTMLFormElement;
        titleInput: HTMLInputElement;
        list: HTMLUListElement;
        loader: HTMLDivElement;
        filterControls: HTMLElement;
        counter: HTMLSpanElement; // 새로 추가
        clearCompletedBtn: HTMLButtonElement; // 새로 추가
    };

    public init(): void {
        this.cacheElements();
        this.bindEvents();
        this.loadInitialData();
    }

    private cacheElements(): void {
        this.elements = {
            form: document.getElementById('todo-form') as HTMLFormElement,
            titleInput: document.getElementById('title-input') as HTMLInputElement,
            list: document.getElementById('todo-list') as HTMLUListElement,
            loader: document.getElementById('loader') as HTMLDivElement,
            filterControls: document.getElementById('filter-controls') as HTMLElement,
            counter: document.getElementById('todo-counter') as HTMLSpanElement, // 새로 추가
            clearCompletedBtn: document.getElementById('clear-completed-button') as HTMLButtonElement, // 새로 추가
        };
    }

    private bindEvents(): void {
        this.elements.form.addEventListener('submit', this.handleCreate.bind(this));
        this.elements.list.addEventListener('click', this.handleListClick.bind(this));
        this.elements.filterControls.addEventListener('click', this.handleFilter.bind(this));
        this.elements.clearCompletedBtn.addEventListener('click', this.handleClearCompleted.bind(this)); // 새로 추가
    }

    private async loadInitialData(): Promise<void> {
        const cachedTodos = this.cache.getTodos();
        if (cachedTodos) {
            this.todos = cachedTodos;
            this.render();
        } else {
            this.toggleLoader(true);
        }

        try {
            const fetchedTodos = await this.api.fetchTodos();
            this.todos = fetchedTodos;
            this.cache.setTodos(fetchedTodos);
            this.render();
        } catch (error) {
            if (error instanceof Error) this.ui.showToast(error.message);
        } finally {
            this.toggleLoader(false);
        }
    }
    
    private render(): void {
        const { list, filterControls, counter, clearCompletedBtn } = this.elements;

        filterControls.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });

        const filteredTodos = this.todos.filter(todo => {
            if (this.currentFilter === 'active') return !todo.isDone;
            if (this.currentFilter === 'completed') return todo.isDone;
            return true;
        });

        list.innerHTML = '';
        if (filteredTodos.length === 0) {
            list.innerHTML = `<li class="todo-item">표시할 항목이 없습니다.</li>`;
        } else {
            filteredTodos.forEach(todo => {
                const item = this.createTodoElement(todo);
                list.appendChild(item);
            });
        }
        
        // --- 새로 추가된 렌더링 로직 ---
        const activeTodosCount = this.todos.filter(todo => !todo.isDone).length;
        counter.textContent = `남은 할 일: ${activeTodosCount}개`;

        const completedTodosCount = this.todos.length - activeTodosCount;
        clearCompletedBtn.style.display = completedTodosCount > 0 ? 'block' : 'none';
    }

    private createTodoElement(todo: Todo): HTMLLIElement {
        const item = document.createElement('li');
        item.className = 'todo-item';
        if (todo.isDone) item.classList.add('done');
        item.dataset.id = String(todo.id);
        
        item.innerHTML = `
            <input type="checkbox" class="checkbox" ${todo.isDone ? 'checked' : ''}>
            <div class="todo-content">
                <span class="todo-title">${todo.title}</span>
            </div>
            <button class="delete-button">&times;</button>
        `;
        return item;
    }
    
    private async handleCreate(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const title = this.elements.titleInput.value.trim();
        if (!title) return;

        try {
            const newTodo = await this.api.createTodo(title);
            this.todos.push(newTodo);
            this.cache.setTodos(this.todos);
            this.render();
            this.elements.titleInput.value = '';
        } catch (error) {
            if (error instanceof Error) this.ui.showToast(error.message);
        }
    }

    private handleListClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const todoItem = target.closest<HTMLLIElement>('.todo-item');
        if (!todoItem?.dataset.id) return;

        const id = Number(todoItem.dataset.id);
        if (target.classList.contains('checkbox')) {
            this.toggleStatus(id, (target as HTMLInputElement).checked);
        } else if (target.classList.contains('delete-button')) {
            this.deleteTodo(id);
        }
    }
    
    private handleFilter(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.classList.contains('filter-button')) return;
        this.currentFilter = target.dataset.filter as FilterType;
        this.render();
    }

    // --- 새로 추가된 핸들러 ---
    private async handleClearCompleted(): Promise<void> {
        const completedTodos = this.todos.filter(todo => todo.isDone);
        if (completedTodos.length === 0) return;
        
        if (!confirm(`${completedTodos.length}개의 완료된 항목을 삭제하시겠습니까?`)) return;

        const originalTodos = [...this.todos];
        this.todos = this.todos.filter(todo => !todo.isDone); // 낙관적 업데이트
        this.render();

        try {
            // 여러 API 요청을 동시에 보냄
            await Promise.all(completedTodos.map(todo => this.api.deleteTodo(todo.id)));
            this.cache.setTodos(this.todos);
        } catch (error) {
            this.todos = originalTodos; // 실패 시 롤백
            this.render();
            if (error instanceof Error) this.ui.showToast('완료된 항목 삭제에 실패했습니다.');
        }
    }
    
    private async toggleStatus(id: number, isDone: boolean): Promise<void> {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const originalStatus = todo.isDone;
        todo.isDone = isDone;
        this.render();
        
        try {
            await this.api.updateTodo(id, { isDone });
            this.cache.setTodos(this.todos);
        } catch (error) {
            todo.isDone = originalStatus;
            this.render();
            if (error instanceof Error) this.ui.showToast(error.message);
        }
    }

    private async deleteTodo(id: number): Promise<void> {
        const originalTodos = [...this.todos];
        this.todos = this.todos.filter(t => t.id !== id);
        this.render();

        try {
            await this.api.deleteTodo(id);
            this.cache.setTodos(this.todos);
        } catch (error) {
            this.todos = originalTodos;
            this.render();
            if (error instanceof Error) this.ui.showToast(error.message);
        }
    }
    
    private toggleLoader(show: boolean): void {
        this.elements.loader.style.display = show ? 'block' : 'none';
    }
}


// --- 애플리케이션 실행 ---
document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoListApp(new ApiService(), new CacheService(), new UiService());
    app.init();
});