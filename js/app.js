let tasks = [];
const STORAGE_KEY = 'tasks';

function loadTasks() {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Színkódolás
function getTaskColor(task) {
    if (task.completed) return 'gray';
    if (task.priority === 'high') return 'red-high';

    if (!task.deadline) return 'gray';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.deadline);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'red';
    if (diffDays <= 1) return 'red';
    if (diffDays <= 7) return 'yellow';
    return 'gray';
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach((task, index) => {
        const colorClass = getTaskColor(task);
        
        let deadlineHTML = '';
        if (task.deadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(task.deadline);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate < today) {
                deadlineHTML = `<span class="deadline overdue">Lejárt - ${task.deadline}</span>`;
            } else {
                deadlineHTML = `<span class="deadline">${task.deadline}</span>`;
            }
        }

        const li = document.createElement('li');
        li.className = `task-item ${colorClass}`;

        li.innerHTML = `
            <input type="checkbox" class="complete-checkbox" data-index="${index}" ${task.completed ? 'checked' : ''}>
            <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
            ${deadlineHTML}
            <button class="delete-btn" data-index="${index}">Törlés</button>
        `;

        taskList.appendChild(li);
    });

    addEventListeners();
}

function addEventListeners() {
    document.querySelectorAll('.complete-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const index = parseInt(this.getAttribute('data-index'));
            tasks[index].completed = this.checked;
            saveTasks();
            renderTasks();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (confirm('Biztosan törlöd ezt a feladatot?')) {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
            }
        });
    });
}

// Dátum mező korlátozása (csak számok és kötőjelek, max 10 karakter)
document.getElementById('task-deadline').addEventListener('input', function(e) {
    let value = e.target.value.replace(/[^0-9-]/g, ''); // csak szám és kötőjel
    
    // Automatikus formázás yyyy-mm-dd
    if (value.length > 4 && value[4] !== '-') {
        value = value.slice(0,4) + '-' + value.slice(4);
    }
    if (value.length > 7 && value[7] !== '-') {
        value = value.slice(0,7) + '-' + value.slice(7);
    }
    
    // Max 10 karakter (yyyy-mm-dd)
    if (value.length > 10) {
        value = value.slice(0,10);
    }
    
    e.target.value = value;
});

// Új feladat hozzáadása
document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    let deadline = document.getElementById('task-deadline').value.trim();
    const priority = document.getElementById('task-priority').value || 'medium';

    if (title === '') return;

    // Ellenőrzés: ha van dátum, legyen pontosan yyyy-mm-dd formátum
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        alert("Kérlek érvényes dátumot adj meg! Formátum: ÉÉÉÉ-HH-NN");
        return;
    }

    tasks.push({
        id: Date.now(),
        title: title,
        deadline: deadline || null,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveTasks();
    renderTasks();
    this.reset();
});

document.addEventListener('DOMContentLoaded', loadTasks);