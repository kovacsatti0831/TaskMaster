let tasks = [];
let history = [];
let categories = ["Work", "Study", "Personal", "Other"];

const STORAGE_KEY = 'tasks';
const HISTORY_KEY = 'history';
const CAT_KEY = 'categories';

let pendingAction = null;
let pendingIndex = null;
let currentEditIndex = null;

// ==================== BETÖLTÉS ÉS MENTÉS ====================
function loadData() {
    if (localStorage.getItem(STORAGE_KEY)) {
        tasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    }
    if (localStorage.getItem(HISTORY_KEY)) {
        history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    }
    if (localStorage.getItem(CAT_KEY)) {
        categories = JSON.parse(localStorage.getItem(CAT_KEY));
    }
    
    renderCategories();
    renderTasks();
}
//  ==================== Aktuális adatok mentése Local Storage-ba  ====================
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(CAT_KEY, JSON.stringify(categories));
}

// ==================== FELADATOK MEGJELENÍTÉSE ====================
function renderTasks(filter = 'all', sortBy = 'created-desc') {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';

    let filtered = tasks;
    if (filter !== 'all') {
        filtered = tasks.filter(t => t.category === filter);
    }

    filtered.sort((a, b) => {
        if (sortBy === 'created-desc') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'deadline-asc') return (a.deadline || '9999').localeCompare(b.deadline || '9999');
        if (sortBy === 'deadline-desc') return (b.deadline || '0000').localeCompare(a.deadline || '0000');
        if (sortBy === 'priority') {
            const order = { high: 1, medium: 2, low: 3 };
            return order[getTaskColorClass(a)] - order[getTaskColorClass(b)];
        }
        return 0;
    });

    filtered.forEach(task => {
        const realIndex = tasks.findIndex(t => t.id === task.id);
        const colorClass = getTaskColorClass(task);

        const li = document.createElement('li');
        li.className = `task-item ${colorClass}`;
        li.innerHTML = `
            <input type="checkbox" class="complete-checkbox" data-index="${realIndex}" ${task.completed ? 'checked' : ''}>
            <div class="task-info">
                <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
                ${task.note ? `<span class="note">${task.note}</span>` : ''}
            </div>
            <small class="category">${task.category || 'Other'}</small>
            ${task.deadline ? `<span class="deadline">${task.deadline}</span>` : ''}
            <div class="task-actions">
                <button class="edit-btn" data-index="${realIndex}">Edit</button>
                <button class="delete-btn" data-index="${realIndex}">Delete</button>
            </div>
        `;
        list.appendChild(li);
    });
};

// ==================== ÚJ FELADAT HOZZÁADÁSA ====================
document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
        alert("Task title cannot be empty!");
        return;
    }

    const newTask = {
        id: Date.now(),
        title: title,
        note: document.getElementById('task-note').value.trim(),
        deadline: document.getElementById('task-deadline').value || null,
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value || 'Other',
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveData();
    renderTasks();
    this.reset();
});

// ==================== KATEGÓRIÁK ====================
function renderCategories() {
    const catSelect = document.getElementById('task-category');
    const filterSelect = document.getElementById('category-filter');
    const editCatSelect = document.getElementById('edit-category');

    const html = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    if (catSelect) catSelect.innerHTML = '<option value="">Select category</option>' + html;
    if (filterSelect) filterSelect.innerHTML = '<option value="all">All Categories</option>' + html;
    if (editCatSelect) editCatSelect.innerHTML = html;
}

// ==================== SZÍNEZÉS ====================
function getTaskColorClass(task) {
    if (task.completed) return 'low';
    if (task.priority === 'high') return 'high';

    if (!task.deadline) {
        if (task.priority === 'medium') return 'medium';
        return 'low';
    }

    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays <= 3) return 'high';
    if (diffDays <= 7) return 'medium';
    if (task.priority === 'medium') return 'medium';
    return 'low';
}

// ==================== SZŰRÉS ÉS RENDEZÉS ====================
document.getElementById('category-filter').addEventListener('change', () => {
    const filter = document.getElementById('category-filter').value;
    const sortBy = document.getElementById('sort-option').value;
    renderTasks(filter, sortBy);
});

document.getElementById('sort-option').addEventListener('change', () => {
    const filter = document.getElementById('category-filter').value;
    const sortBy = document.getElementById('sort-option').value;
    renderTasks(filter, sortBy);
});

// ==================== CONFIRM MODAL ====================
function showConfirmModal(title, message, actionType, index) {
    pendingAction = actionType;
    pendingIndex = index;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-action-modal').style.display = 'flex';
}

document.getElementById('confirm-yes').addEventListener('click', () => {
    if (pendingAction === 'complete' && pendingIndex !== null) {
        const task = tasks[pendingIndex];
        task.completed = true;
        history.unshift({ ...task, action: "completed", completedAt: new Date().toISOString() });
        tasks.splice(pendingIndex, 1);
    } 
    else if (pendingAction === 'delete' && pendingIndex !== null) {
        const task = tasks[pendingIndex];
        history.unshift({ ...task, action: "deleted", deletedAt: new Date().toISOString() });
        tasks.splice(pendingIndex, 1);
    }

    saveData();
    renderTasks();
    document.getElementById('confirm-action-modal').style.display = 'none';
    pendingAction = null;
    pendingIndex = null;
});

document.getElementById('confirm-no').addEventListener('click', () => {
    document.getElementById('confirm-action-modal').style.display = 'none';
    pendingAction = null;
    pendingIndex = null;
});

// ==================== KATTINTÁSOK (Edit, Delete, Complete gombok megnyomása) ====================
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('complete-checkbox')) {
        const index = parseInt(e.target.dataset.index);
        if (tasks[index] && !tasks[index].completed) {
            e.target.checked = false;
            showConfirmModal("Complete Task", "Mark this task as completed?", 'complete', index);
        }
    }

    if (e.target.classList.contains('delete-btn')) {
        const index = parseInt(e.target.dataset.index);
        showConfirmModal("Delete Task", "Are you sure you want to delete this task?", 'delete', index);
    }

    if (e.target.classList.contains('edit-btn')) {
        currentEditIndex = parseInt(e.target.dataset.index);
        const task = tasks[currentEditIndex];

        document.getElementById('edit-title').value = task.title;
        document.getElementById('edit-note').value = task.note || '';
        document.getElementById('edit-deadline').value = task.deadline || '';
        document.getElementById('edit-priority').value = task.priority;
        document.getElementById('edit-category').value = task.category || '';

        document.getElementById('edit-modal').style.display = 'flex';
    }
});

// ==================== EDIT MODAL ====================
document.getElementById('save-edit').addEventListener('click', () => {
    if (currentEditIndex === null) return;

    const task = tasks[currentEditIndex];
    task.title = document.getElementById('edit-title').value.trim();
    task.note = document.getElementById('edit-note').value.trim();
    task.deadline = document.getElementById('edit-deadline').value || null;
    task.priority = document.getElementById('edit-priority').value;
    task.category = document.getElementById('edit-category').value;

    saveData();
    renderTasks();
    document.getElementById('edit-modal').style.display = 'none';
    currentEditIndex = null;
});

document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditIndex = null;
});

// ==================== HISTORY MODAL ====================
document.getElementById('show-history').addEventListener('click', () => {
    let html = '<h3>Completed Tasks</h3>';
    const completed = history.filter(h => h.action === "completed");
    const deleted = history.filter(h => h.action === "deleted");

    if (completed.length > 0) {
        completed.forEach((item) => {
            const globalIndex = history.indexOf(item);
            html += `
                <div class="history-item completed">
                    <span class="task-title">${item.title}</span>
                    <small>${item.category || 'Other'} • ${item.deadline || ''}</small>
                    ${item.note ? `<p class="note">${item.note}</p>` : ''}
                    <button class="undo-btn" data-index="${globalIndex}">Restore</button>
                </div>
            `;
        });
    } else {
        html += '<p>No completed tasks yet.</p>';
    }

    html += '<h3>Deleted Tasks</h3>';

    if (deleted.length > 0) {
        deleted.forEach(item => {
            const globalIndex = history.indexOf(item);
            html += `
                <div class="history-item deleted">
                    <span class="task-title">${item.title}</span>
                    <small>${item.category || 'Other'} • ${item.deadline || ''}</small>
                    <button class="undo-btn" data-index="${globalIndex}">Restore</button>
                </div>
            `;
        });
    } else {
        html += '<p>No deleted tasks yet.</p>';
    }

    document.getElementById('history-content').innerHTML = html;
    document.getElementById('history-modal').style.display = 'flex';

    // Restore gombok
    document.querySelectorAll('.undo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const taskToRestore = history[index];
            if (taskToRestore) {
                tasks.unshift({
                    id: Date.now(),
                    title: taskToRestore.title,
                    note: taskToRestore.note || '',
                    deadline: taskToRestore.deadline,
                    priority: taskToRestore.priority,
                    category: taskToRestore.category,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
                history.splice(index, 1);
                saveData();
                renderTasks();
                document.getElementById('show-history').click();
            }
        });
    });
});

document.getElementById('close-history').addEventListener('click', () => {
    document.getElementById('history-modal').style.display = 'none';
});

// ==================== NEW CATEGORY, RESET ALL DATA, CONFIRMATION MESSAGE ====================
document.getElementById('add-category-btn').addEventListener('click', () => {
    document.getElementById('new-category-name').value = '';
    document.getElementById('category-modal').style.display = 'flex';
});

document.getElementById('save-category').addEventListener('click', () => {
    const newName = document.getElementById('new-category-name').value.trim();
    if (newName === '') {
        showMessage("Error", "Category name cannot be empty!");
        return;
    }
    if (categories.includes(newName)) {
        showMessage("Error", "This category already exists!");
        return;
    }
    categories.push(newName);
    saveData();
    renderCategories();
    document.getElementById('category-modal').style.display = 'none';
});

document.getElementById('cancel-category').addEventListener('click', () => {
    document.getElementById('category-modal').style.display = 'none';
});

document.getElementById('reset-data').addEventListener('click', () => {
    document.getElementById('reset-modal').style.display = 'flex';
});

document.getElementById('confirm-reset').addEventListener('click', () => {
    localStorage.clear();
    tasks = [];
    history = [];
    categories = ["Work", "Study", "Personal", "Other"];
    document.getElementById('reset-modal').style.display = 'none';
    showMessage("Success", "All data has been successfully reset.");
    setTimeout(() => location.reload(), 2500);
});

document.getElementById('cancel-reset').addEventListener('click', () => {
    document.getElementById('reset-modal').style.display = 'none';
});

function showMessage(title, text) {
    document.getElementById('message-title').textContent = title;
    document.getElementById('message-text').textContent = text;
    document.getElementById('message-modal').style.display = 'flex';
}

document.getElementById('close-message').addEventListener('click', () => {
    document.getElementById('message-modal').style.display = 'none';
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
});

// ==================== RANDOM TIP MODAL ====================
const tips = [
  "Write down your top 3 priorities for today", "Clear your desk before starting work", "Reply to one email you've been avoiding", "Delete 10 old files you no longer need", "Organize your browser bookmarks",
  "Update your to-do list and remove finished tasks", "Set a 25-minute focus timer", "Close all unnecessary browser tabs", "Backup important documents", "Review your calendar for the week",
  "Plan tomorrow's first task tonight", "Archive old emails", "Unsubscribe from one newsletter", "Clean up your downloads folder", "Rename messy files with clear names",
  "Create a simple folder structure for projects", "Review and update your passwords", "Enable two-factor authentication on one account", "Clear notification clutter", "Turn off non-essential alerts for 1 hour",
  "Go for a 10-minute walk without your phone", "Drink a glass of water right now", "Stretch for 5 minutes", "Take 10 deep breaths", "Stand up and move for 2 minutes",
  "Prepare a healthy snack", "Review your sleep schedule", "Set a bedtime reminder", "Meditate for 5 minutes", "Take a screen break and look outside",
  "Call or message a family member", "Reply to a message you've postponed", "Send a short thank-you message", "Reach out to an old friend", "Schedule a short call with someone you care about",
  "Update your contact list", "Clean up your social media feed", "Mute one distracting chat", "Respond to an invitation you've been ignoring", "Send birthday or congratulations wishes",
  "Read one short article about something useful", "Watch a 10-minute educational video", "Practice a foreign language for 10 minutes", "Take notes on something you learned today", "Review study or work materials for 15 minutes",
  "Finish one small tutorial", "Learn one new keyboard shortcut", "Research a topic you've been curious about", "Write down 3 things you want to learn this month", "Review your learning goals",
  "Write down 3 wins from this week", "Reflect on one thing you could improve", "Update your personal journal", "Set one small goal for tomorrow", "Review your monthly goals",
  "Declutter your task list", "Break one big task into smaller steps", "Remove one unnecessary commitment", "Plan a productive morning routine", "Write a short plan for the weekend",
  "Water your plants", "Tidy one small area of your room", "Organize your cables", "Empty the trash", "Wipe your desk and keyboard",
  "Check household supplies", "Replace a dead battery", "Sort recycling", "Clean your phone screen", "Organize one drawer",
  "Review your subscriptions and cancel one unused", "Check upcoming payments", "Track today's expenses", "Review your monthly budget", "Set a small savings goal",
  "Organize digital receipts", "Update payment methods if needed", "Check bank notifications", "Review loyalty programs", "Compare one recurring expense",
  "Clean your workspace", "Create a focus playlist", "Prepare tomorrow's agenda", "Review meeting notes", "Archive completed tasks",
  "Update project status", "Set clear work priorities for today", "Organize digital documents", "Close unfinished drafts or notes", "Review pending tasks one by one",
  "Donate or sell one unused item", "Organize your wardrobe a little", "Fold laundry", "Prepare clothes for tomorrow", "Declutter one shelf",
  "Review passwords for important accounts", "Check login activity on one service", "Update recovery email or phone", "Remove an unused app", "Review app permissions",
  "Listen to a short podcast", "Read one chapter of a book", "Try a new recipe", "Write a short journal entry", "Sketch or doodle for 5 minutes",
  "Explore a new music genre", "Watch a short documentary", "Try a creative hobby for 15 minutes", "Write down 3 ideas you have", "Review your favorite tools or resources",

  "Talk to a stranger for 2 minutes today", "Try a food you've never had before", "Go somewhere alone (café, walk, shop)", "Message someone you haven't talked to in months", "Say no to something you usually accept",
  "Ask for help with something small", "Wear something slightly bolder than usual", "Give a genuine compliment to someone", "Ask a question you've been hesitant to ask", "Apply for something even if you're unsure",
  "Try a new form of exercise", "Visit a place in your city you've never been to", "Share an opinion you usually keep to yourself", "Call someone instead of texting", "Introduce yourself to someone new",
  "Start a conversation with a classmate or colleague", "Invite someone for a short coffee or walk", "Ask someone to teach you something simple", "Give kind and honest feedback", "Attend an event where you don't know many people",
  "Speak up once in a meeting or group", "Try a different route today", "Order something new instead of your usual", "Send a voice message instead of text", "Join a short online class or workshop",
  "Spend 20 minutes offline", "Leave your phone in another room for 30 minutes", "Finish one task you've been delaying", "Write down one fear and take a small step toward facing it", "Go for a walk without headphones",
  "Cook a meal without a recipe", "Read about a topic that never interested you", "Go one afternoon without complaining", "Ask for feedback on your work", "Try something that feels slightly uncomfortable but useful",
  "Start a small new habit today", "Sit in a different place than usual", "Ask a stranger for directions even if you know the way", "Share a small win with someone", "Offer help with a small task",
  "Try a short cold water rinse", "Practice saying thank you more intentionally", "Smile and make eye contact with a few people", "Write a short note to your future self", "Take one small step toward a bigger goal",
  "Try a new productivity method for today", "Ask a question in a group or forum", "Clean one area you've been ignoring", "Message an old friend just to say hi", "Practice introducing yourself out loud",
  "Try a 5-minute language lesson", "Eat lunch somewhere different", "Stand while working for 15 minutes", "Listen fully when someone speaks", "Walk through a neighborhood you don't know well",
  "Write 5 things you're grateful for", "Take a photo of something ordinary", "Leave a positive review for a local place", "Try a short workout you've never done", "Change one part of your morning routine",
  "Ask a colleague or classmate for advice", "Wear a color you rarely wear", "Start a short chat with a cashier or barista", "Try a tool or app you've been avoiding", "Go to a library or bookstore and browse",
  "Record a 30-second voice note about your day", "Invite someone to do something simple together", "Draw the view from your window", "Practice disagreeing politely once", "Try deep breathing for 2 minutes when stressed"
];

document.getElementById('random-tip-btn').addEventListener('click', () => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('tip-text').textContent = randomTip;
    document.getElementById('tip-modal').style.display = 'flex';
});

document.getElementById('new-tip-btn').addEventListener('click', () => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('tip-text').textContent = randomTip;
});

document.getElementById('close-tip').addEventListener('click', () => {
    document.getElementById('tip-modal').style.display = 'none';
});

// ==================== STATISTICS ====================
document.getElementById('show-stats').addEventListener('click', () => {
    const total = tasks.length + history.length;
    const active = tasks.length;
    const completed = history.filter(h => h.action === "completed").length;
    const deleted = history.filter(h => h.action === "deleted").length;
    const overdue = tasks.filter(t => {
        if (!t.deadline || t.completed) return false;
        const diffDays = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return diffDays < 0;
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let html = `
        <p><strong>Total Tasks:</strong> ${total}</p>
        <p><strong>Active Tasks:</strong> ${active}</p>
        <p><strong>Completed Tasks:</strong> ${completed}</p>
        <p><strong>Deleted Tasks:</strong> ${deleted}</p>
        <p><strong>Overdue Tasks:</strong> ${overdue}</p>
        <p><strong>Completion Rate:</strong> ${completionRate}%</p>
    `;

    document.getElementById('stats-content').innerHTML = html;
    document.getElementById('stats-modal').style.display = 'flex';
});

document.getElementById('close-stats').addEventListener('click', () => {
    document.getElementById('stats-modal').style.display = 'none';
});

// ==================== BOTTOM NAVIGATION ====================
document.getElementById('nav-history').addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('show-history').click();
});

document.getElementById('nav-stats').addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('show-stats').click();
});

document.getElementById('nav-reset').addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('reset-data').click();
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderTasks();
    document.getElementById('nav-history').classList.add('active');
});