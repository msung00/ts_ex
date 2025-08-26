const App = {
    state: {
        todos: [],
        currentFilter: 'all',
    },

    api: {
        BASE_URL: 'http://localhost:3000/todos',
        async fetchTodos() {
            const response = await fetch(this.BASE_URL);
            if (!response.ok) throw new Error('서버에서 데이터를 가져오지 못했습니다.');
            return await response.json();
        },
        async createTodo(title) {
            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });
            if (!response.ok) throw new Error('할 일 추가에 실패했습니다.');
            return await response.json();
        },
        async updateTodo(id, updatedData) {
            const response = await fetch(`${this.BASE_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });
            if (!response.ok) throw new Error('할 일 업데이트에 실패했습니다.');
            return await response.json();
        },
        async deleteTodo(id) {
            const response = await fetch(`${this.BASE_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('할 일 삭제에 실패했습니다.');
        },
    },

    elements: {},
    cacheElements() {
        this.elements = {
            form: document.getElementById('todo-form'),
            titleInput: document.getElementById('title-input'),
            list: document.getElementById('todo-list'),
            loader: document.getElementById('loader'),
            filterControls: document.getElementById('filter-controls'),
        };
    },
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadTodos();
    },

    bindEvents() {
        this.elements.form.addEventListener('submit', this.handleCreate.bind(this));
        this.elements.list.addEventListener('click', this.handleListClick.bind(this));
        this.elements.list.addEventListener('dblclick', this.handleListDblClick.bind(this));
        this.elements.filterControls.addEventListener('click', this.handleFilter.bind(this));
    },

    async handleCreate(event) {
        event.preventDefault();
        const title = this.elements.titleInput.value.trim();
        if (!title) return;

        try {
            const newTodo = await this.api.createTodo(title);
            this.state.todos.push(newTodo);
            this.render();
            this.elements.titleInput.value = '';
        } catch (error) {
            alert(error.message);
        }
    },

    handleListClick(event) {
        const target = event.target;
        const todoItem = target.closest('.todo-item');
        if (!todoItem) return;

        const id = Number(todoItem.dataset.id);

        if (target.classList.contains('checkbox')) {
            this.toggleStatus(id, target.checked);
        } else if (target.classList.contains('delete-button')) {
            this.deleteTodo(id, todoItem);
        }
    },
    
    handleListDblClick(event) {
        const todoContent = event.target.closest('.todo-content');
        if (!todoContent) return;
        this.enterEditMode(todoContent.closest('.todo-item'));
    },
    
    handleFilter(event) {
        const target = event.target;
        if (!target.classList.contains('filter-button')) return;
        this.state.currentFilter = target.dataset.filter;
        this.render();
    },

    async loadTodos() {
        this.toggleLoader(true);
        try {
            this.state.todos = await this.api.fetchTodos();
            this.render();
        } catch (error) {
            alert(error.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    async toggleStatus(id, isDone) {
        const todo = this.state.todos.find(t => t.id === id);
        if (!todo) return;
        
        try {
            await this.api.updateTodo(id, { isDone });
            todo.isDone = isDone;
            this.render();
        } catch (error) {
            alert(error.message);
        }
    },
    
    async deleteTodo(id, element) {
        if (!confirm('정말로 삭제하시겠습니까?')) return;
        
        element.classList.add('exiting');
        
        setTimeout(async () => {
            try {
                await this.api.deleteTodo(id);
                this.state.todos = this.state.todos.filter(t => t.id !== id);
                this.render();
            } catch (error) {
                alert(error.message);
                element.classList.remove('exiting');
            }
        }, 400);
    },
    
    enterEditMode(todoItem) {
        const id = Number(todoItem.dataset.id);
        const todo = this.state.todos.find(t => t.id === id);
        const titleElement = todoItem.querySelector('.todo-title');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = todo.title;
        
        titleElement.replaceWith(input);
        input.focus();
        
        const saveChanges = async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== todo.title) {
                try {
                    await this.api.updateTodo(id, { title: newTitle });
                    todo.title = newTitle;
                } catch (error) {
                    alert(error.message);
                } finally {
                    this.render();
                }
            } else {
                input.replaceWith(titleElement);
            }
        };
        
        input.addEventListener('blur', saveChanges);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveChanges();
            if (e.key === 'Escape') input.replaceWith(titleElement);
        });
    },

    render() {
        const { list, filterControls } = this.elements;
        const { todos, currentFilter } = this.state;
        
        filterControls.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });

        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') return !todo.isDone;
            if (currentFilter === 'completed') return todo.isDone;
            return true;
        });
        
        list.innerHTML = '';
        
        if (filteredTodos.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'todo-item';
            emptyMessage.textContent = '표시할 항목이 없습니다.';
            list.appendChild(emptyMessage);
            return;
        }
        
        filteredTodos.forEach(todo => {
            const item = this.createTodoElement(todo);
            list.appendChild(item);
            requestAnimationFrame(() => {
                item.classList.remove('entering');
            });
        });
    },
    
    createTodoElement(todo) {
        const item = document.createElement('li');
        item.className = 'todo-item entering';
        if (todo.isDone) item.classList.add('done');
        item.dataset.id = todo.id;
        
        item.innerHTML = `
            <input type="checkbox" class="checkbox" ${todo.isDone ? 'checked' : ''}>
            <div class="todo-content">
                <span class="todo-title">${todo.title}</span>
            </div>
            <button class="delete-button">&times;</button>
        `;
        return item;
    },
    
    toggleLoader(show) {
        this.elements.loader.style.display = show ? 'block' : 'none';
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());