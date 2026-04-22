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
    
    catSelect.innerHTML = '';
    filterSelect.innerHTML = '<option value="all">Összes kategória</option>';

    categories.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function getTaskColor(task) {
    if (task.completed) return 'gray';
    if (task.priority === 'high') return 'red-high';
    if (task.priority === 'medium') return 'yellow';
    return 'gray';
}

function renderTasks(filter = 'all') {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    let filtered = tasks;
    if (filter !== 'all') filtered = tasks.filter(t => t.category === filter);

    filtered.forEach((task) => {
        const realIndex = tasks.findIndex(t => t.id === task.id);
        const color = getTaskColor(task);

        let deadlineHTML = '';
        if (task.deadline) {
            deadlineHTML = (new Date(task.deadline) < new Date()) 
                ? `<span class="deadline overdue">Lejárt - ${task.deadline}</span>` 
                : `<span class="deadline">${task.deadline}</span>`;
        }

        const li = document.createElement('li');
        li.className = `task-item ${color}`;
        li.innerHTML = `
            <input type="checkbox" class="complete-checkbox" data-index="${realIndex}" ${task.completed ? 'checked' : ''}>
            <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
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
    // Pipa
    document.querySelectorAll('.complete-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            tasks[index].completed = this.checked;
            saveData();
            renderTasks(document.getElementById('category-filter').value);
        });
    });

    // Teljesítve gomb (csak ha már be van pipálva)
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            const index = parseInt(this.dataset.index);
            const completedTask = {...tasks[index], action: "Teljesítve", date: new Date().toISOString()};
            history.unshift(completedTask);
            tasks.splice(index, 1);
            saveData();
            renderTasks(document.getElementById('category-filter').value);
        });
    });

    // Szerkesztés
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const newTitle = prompt("Új feladat cím:", tasks[index].title);
            if (newTitle && newTitle.trim() !== '') {
                tasks[index].title = newTitle.trim();
                saveData();
                renderTasks(document.getElementById('category-filter').value);
            }
        });
    });

    // Törlés
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm("Biztosan törlöd?")) {
                const index = parseInt(this.dataset.index);
                const deleted = {...tasks[index], action: "Törölve", date: new Date().toISOString()};
                history.unshift(deleted);
                tasks.splice(index, 1);
                saveData();
                renderTasks(document.getElementById('category-filter').value);
            }
        });
    });
}

// Új kategória, szűrés, statisztika, előzmények, random tipp, sötét mód...
document.getElementById('add-category-btn').addEventListener('click', () => {
    let uj = prompt("Új kategória neve:");
    if (uj && uj.trim() !== '' && !categories.includes(uj.trim())) {
        categories.push(uj.trim());
        saveData();
        renderCategories();
    }
});

document.getElementById('category-filter').addEventListener('change', (e) => {
    renderTasks(e.target.value);
});

document.getElementById('show-stats').addEventListener('click', () => {
    let kesz = tasks.filter(t => t.completed).length;
    let ossz = tasks.length;
    let szoveg = `<p>Összes feladat: <strong>${ossz}</strong></p>`;
    szoveg += `<p>Teljesített: <strong>${kesz}</strong> (${ossz ? Math.round(kesz/ossz*100) : 0}%)</p>`;
    document.getElementById('stats-content').innerHTML = szoveg;
    document.getElementById('stats-modal').style.display = 'block';
});

document.getElementById('close-stats').addEventListener('click', () => {
    document.getElementById('stats-modal').style.display = 'none';
});

document.getElementById('show-history').addEventListener('click', () => {
    let html = '<h3>Előzmények</h3>';

    const completed = history.filter(h => h.action === "Teljesítve");
    const deleted = history.filter(h => h.action === "Törölve");

    if (completed.length > 0) {
        html += '<div class="history-section"><h3>✅ Teljesített feladatok</h3>';
        completed.forEach((item, idx) => {
            const histIndex = history.indexOf(item);
            html += `<div class="history-item">
                        <strong>${item.title}</strong> — ${item.category || 'Egyéb'}
                        <small>(${new Date(item.date).toLocaleDateString('hu-HU')})</small>
                        <button class="undo-btn" data-history-index="${histIndex}" style="margin-left:10px;">Visszaállítás</button>
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

    // Visszaállítás az előzményből
    document.querySelectorAll('#history-content .undo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const histIndex = parseInt(this.dataset.historyIndex);
            const taskToRestore = history[histIndex];
            
            tasks.push({
                id: Date.now(),
                title: taskToRestore.title,
                deadline: taskToRestore.deadline,
                priority: taskToRestore.priority,
                category: taskToRestore.category,
                completed: false,
                createdAt: new Date().toISOString()
            });

            history.splice(histIndex, 1);
            saveData();
            renderTasks();
            document.getElementById('show-history').click();
        });
    });
});

document.getElementById('close-history').addEventListener('click', () => {
    document.getElementById('history-modal').style.display = 'none';
});

document.getElementById('random-tip').addEventListener('click', () => {
    const tips = ["Kezdj el valamit, amit már rég halogatsz – csak 5 percig!", "Írd fel a 3 legfontosabb feladatot mára.", "Használj Pomodoro technikát: 25 perc munka, 5 perc szünet.", "Csináld meg először a legnehezebb feladatot.", "Állíts be egy kis jutalmat magadnak a nap végén."];
    alert("💡 Mai tipp:\n\n" + tips[Math.floor(Math.random() * tips.length)]);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.getElementById('theme-toggle').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;

    tasks.push({
        id: Date.now(),
        title: title,
        deadline: document.getElementById('task-deadline').value || null,
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value || 'Egyéb',
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveData();
    renderTasks(document.getElementById('category-filter').value);
    this.reset();
});

document.addEventListener('DOMContentLoaded', loadData);