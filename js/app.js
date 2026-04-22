let tasks = [];
let history = [];
let categories = ["Munka", "Tanulás", "Háztartás", "Egyéb"];

const STORAGE_KEY = 'tasks';
const HISTORY_KEY = 'history';
const CAT_KEY = 'categories';

function loadData() {
    if (localStorage.getItem(STORAGE_KEY)) tasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (localStorage.getItem(HISTORY_KEY)) history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (localStorage.getItem(CAT_KEY)) categories = JSON.parse(localStorage.getItem(CAT_KEY));

    renderCategories();
    renderTasks();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(CAT_KEY, JSON.stringify(categories));
}

function renderCategories() {
    const catSelect = document.getElementById('task-category');
    const filterSelect = document.getElementById('category-filter');
    const editCatSelect = document.getElementById('edit-category');
    
    catSelect.innerHTML = '';
    filterSelect.innerHTML = '<option value="all">Összes kategória</option>';
    editCatSelect.innerHTML = '';

    categories.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        editCatSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function getTaskColor(task) {
    if (task.completed) return 'gray';
    if (task.priority === 'high') return 'red-high';
    if (task.priority === 'medium') return 'yellow';
    return 'gray';
}

function sortTasks(tasksToSort, sortBy) {
    let sorted = [...tasksToSort];
    if (sortBy === "created-desc") {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "deadline-asc") {
        sorted.sort((a, b) => (a.deadline || "9999-12-31").localeCompare(b.deadline || "9999-12-31"));
    } else if (sortBy === "deadline-desc") {
        sorted.sort((a, b) => (b.deadline || "0000-00-00").localeCompare(a.deadline || "0000-00-00"));
    } else if (sortBy === "priority") {
        const order = { high: 1, medium: 2, low: 3 };
        sorted.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sortBy === "category") {
        sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    }
    return sorted;
}

function renderTasks(filter = 'all', sortBy = 'created-desc') {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    let filtered = tasks;
    if (filter !== 'all') filtered = tasks.filter(t => t.category === filter);

    filtered = sortTasks(filtered, sortBy);

    filtered.forEach((task) => {
        const realIndex = tasks.findIndex(t => t.id === task.id);
        const color = getTaskColor(task);

        let deadlineHTML = '';
        if (task.deadline) {
            deadlineHTML = (new Date(task.deadline) < new Date()) 
                ? `<span class="deadline overdue">Lejárt - ${task.deadline}</span>` 
                : `<span class="deadline">${task.deadline}</span>`;
        }

        const noteHTML = task.note ? `<span class="note">Megjegyzés: ${task.note}</span>` : '';

        const li = document.createElement('li');
        li.className = `task-item ${color}`;
        li.innerHTML = `
            <input type="checkbox" class="complete-checkbox" data-index="${realIndex}" ${task.completed ? 'checked' : ''}>
            <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
            ${noteHTML}
            <small>${task.category || 'Egyéb'}</small>
            ${deadlineHTML}
            
            ${task.completed ? 
                `<button class="complete-btn" data-index="${realIndex}" style="background:#27ae60;">Teljesítve</button>` : 
                `<button class="complete-btn" data-index="${realIndex}" disabled>Teljesítve</button>`
            }
            
            <button class="edit-btn" data-index="${realIndex}">Szerkeszt</button>
            <button class="delete-btn" data-index="${realIndex}">Törlés</button>
        `;
        list.appendChild(li);
    });

    addEventListeners();
}

function addEventListeners() {
    document.querySelectorAll('.complete-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            tasks[index].completed = this.checked;
            saveData();
            renderTasks(document.getElementById('category-filter').value, document.getElementById('sort-option').value);
        });
    });

    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            const index = parseInt(this.dataset.index);
            const completedTask = {...tasks[index], action: "Teljesítve", date: new Date().toISOString()};
            history.unshift(completedTask);
            tasks.splice(index, 1);
            saveData();
            renderTasks(document.getElementById('category-filter').value, document.getElementById('sort-option').value);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const task = tasks[index];

            document.getElementById('edit-title').value = task.title || '';
            document.getElementById('edit-note').value = task.note || '';
            document.getElementById('edit-deadline').value = task.deadline || '';
            document.getElementById('edit-priority').value = task.priority || 'medium';
            document.getElementById('edit-category').value = task.category || 'Egyéb';

            document.getElementById('edit-modal').style.display = 'block';
        });
    });

    document.getElementById('save-edit').addEventListener('click', () => {
        document.getElementById('edit-modal').style.display = 'none';
    });

    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('edit-modal').style.display = 'none';
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === "Törlés") {
                this.textContent = "Biztos?";
                this.style.background = "#e67e22";
                setTimeout(() => {
                    if (this.textContent === "Biztos?") {
                        this.textContent = "Törlés";
                        this.style.background = "#e74c3c";
                    }
                }, 3000);
            } else {
                const index = parseInt(this.dataset.index);
                const deleted = {...tasks[index], action: "Törölve", date: new Date().toISOString()};
                history.unshift(deleted);
                tasks.splice(index, 1);
                saveData();
                renderTasks(document.getElementById('category-filter').value, document.getElementById('sort-option').value);
            }
        });
    });
}

// Új kategória
document.getElementById('add-category-btn').addEventListener('click', () => {
    document.getElementById('new-category-name').value = '';
    document.getElementById('category-modal').style.display = 'block';
});

document.getElementById('save-category').addEventListener('click', () => {
    let newName = document.getElementById('new-category-name').value.trim();
    if (!newName) return alert("A kategória neve nem lehet üres!");
    if (newName.length > 100) return alert("Maximum 100 karakter!");
    if (categories.includes(newName)) return alert("Már létezik!");
    if (categories.length >= 20) return alert("Maximum 20 kategória!");

    categories.push(newName);
    saveData();
    renderCategories();
    document.getElementById('category-modal').style.display = 'none';
});

document.getElementById('cancel-category').addEventListener('click', () => {
    document.getElementById('category-modal').style.display = 'none';
});

// Szűrés és rendezés
document.getElementById('category-filter').addEventListener('change', () => {
    renderTasks(document.getElementById('category-filter').value, document.getElementById('sort-option').value);
});

document.getElementById('sort-option').addEventListener('change', () => {
    renderTasks(document.getElementById('category-filter').value, document.getElementById('sort-option').value);
});

// Statisztika
document.getElementById('show-stats').addEventListener('click', () => {
    const totalEver = tasks.length + history.filter(h => h.action === "Teljesítve").length;
    const current = tasks.length;
    const completed = history.filter(h => h.action === "Teljesítve").length;
    const overdue = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
    const completionRate = current + completed > 0 ? Math.round((completed / (current + completed)) * 100) : 0;

    let html = `
        <p><strong>Összes feladat valaha:</strong> ${totalEver}</p>
        <p><strong>Jelenlegi feladatok:</strong> ${current}</p>
        <p><strong>Teljesített feladatok:</strong> ${completed}</p>
        <p><strong>Lejárt feladatok:</strong> ${overdue}</p>
        <p><strong>Teljesítési arány:</strong> ${completionRate}%</p>
    `;
    document.getElementById('stats-content').innerHTML = html;
    document.getElementById('stats-modal').style.display = 'block';
});

document.getElementById('close-stats').addEventListener('click', () => {
    document.getElementById('stats-modal').style.display = 'none';
});

// Előzmények
document.getElementById('show-history').addEventListener('click', () => {
    let html = '<h3>Előzmények</h3>';

    const completed = history.filter(h => h.action === "Teljesítve");
    const deleted = history.filter(h => h.action === "Törölve");

    if (completed.length > 0) {
        html += '<div class="history-section"><h3>✅ Teljesített feladatok</h3>';
        completed.forEach((item) => {
            const histIndex = history.indexOf(item);
            html += `<div class="history-item">
                        <strong>${item.title}</strong> — ${item.category || 'Egyéb'}
                        ${item.note ? `<br><span class="note">Megjegyzés: ${item.note}</span>` : ''}
                        <small>(${new Date(item.date).toLocaleDateString('hu-HU')})</small>
                        <button class="undo-btn" data-history-index="${histIndex}">Visszaállítás</button>
                     </div>`;
        });
        html += '</div>';
    }

    if (deleted.length > 0) {
        html += '<div class="history-section"><h3>🗑️ Törölt feladatok</h3>';
        deleted.forEach(item => {
            html += `<div class="history-item"><strong>${item.title}</strong> — ${item.category || 'Egyéb'} 
                     <small>(${new Date(item.date).toLocaleDateString('hu-HU')})</small></div>`;
        });
        html += '</div>';
    }

    if (completed.length === 0 && deleted.length === 0) {
        html += '<p>Még nincs semmi az előzményekben.</p>';
    }

    document.getElementById('history-content').innerHTML = html;
    document.getElementById('history-modal').style.display = 'block';

    document.querySelectorAll('#history-content .undo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const histIndex = parseInt(this.dataset.historyIndex);
            const taskToRestore = history[histIndex];
            
            tasks.push({
                id: Date.now(),
                title: taskToRestore.title,
                note: taskToRestore.note || "",
                deadline: taskToRestore.deadline,
                priority: taskToRestore.priority,
                category: taskToRestore.category,
                completed: false,
                createdAt: new Date().toISOString()
            });

            history.splice(histIndex, 1);
            saveData();
            renderTasks(document.getElementById('category-filter').value, document.getElementById('sort-option').value);
            document.getElementById('show-history').click();
        });
    });
});

document.getElementById('close-history').addEventListener('click', () => {
    document.getElementById('history-modal').style.display = 'none';
});

// Random tipp
document.getElementById('random-tip').addEventListener('click', () => {
    const tips = [
        "Kezdj el valamit, amit már rég halogatsz – csak 5 percig!",
        "Írd fel a 3 legfontosabb feladatot mára.",
        "Használj Pomodoro technikát: 25 perc munka, 5 perc szünet.",
        "Csináld meg először a legnehezebb feladatot.",
        "Állíts be egy kis jutalmat magadnak a nap végén.",
        "Igyál egy pohár vizet és állj fel 2 percre.",
        "Nézd meg a naptáradat és tervezd meg a következő órát.",
        "Törölj ki egy felesleges dolgot az asztalodról.",
        "Írj egy rövid köszönő üzenetet valakinek.",
        "Csinálj 10 mély lélegzetet, mielőtt folytatod a munkát.",
        "Állíts be egy időzítőt 25 percre és dolgozz fókuszáltan.",
        "Készíts egy gyors prioritási listát a mai napra.",
        "Tedd el a telefonodat 30 percre."
    ];
    document.getElementById('tip-text').textContent = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('tip-modal').style.display = 'block';
});

document.getElementById('close-tip').addEventListener('click', () => {
    document.getElementById('tip-modal').style.display = 'none';
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.getElementById('theme-toggle').textContent = document.body.classList.contains('dark') ? 'Világos mód' : 'Sötét mód';
});

document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;

    tasks.push({
        id: Date.now(),
        title: title,
        note: "",
        deadline: document.getElementById('task-deadline').value || null,
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value || 'Egyéb',
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveData();
    renderTasks(document.getElementById('category-filter').value, document.getElementById('sort-option').value);
    this.reset();
});

document.addEventListener('DOMContentLoaded', loadData);