// public/main.js
const entryForm = document.getElementById('entryForm');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEdit');
const entriesDiv = document.getElementById('entries');
const filterDate = document.getElementById('filterDate');
const filterTag = document.getElementById('filterTag');
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');

let isEditing = false;
let editingId = null;

entryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Простейшая клиентская валидация
  const title = document.getElementById('title').value.trim();
  const date = document.getElementById('date').value;
  const content = document.getElementById('content').value.trim();
  
  if (!title || !date || !content) {
    alert('Пожалуйста, заполните обязательные поля: название, дата и содержание.');
    return;
  }
  
  const data = {
    title,
    date,
    content,
    tags: document.getElementById('tags').value.trim(),
    priority: document.getElementById('priority').value,
    reminder: document.getElementById('reminder').value
  };
  
  if (isEditing && editingId) {
    // Обновление записи
    fetch(`/entry/${editingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(updatedEntry => {
      resetForm();
      loadEntries();
    })
    .catch(err => console.error('Ошибка обновления записи:', err));
  } else {
    // Создание новой записи
    fetch('/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(newEntry => {
      resetForm();
      loadEntries();
    })
    .catch(err => console.error('Ошибка сохранения записи:', err));
  }
});

function loadEntries(queryParams = {}) {
  let url = '/entries';
  const params = new URLSearchParams(queryParams).toString();
  if (params) {
    url += '?' + params;
  }
  
  fetch(url)
    .then(response => response.json())
    .then(entries => {
      entriesDiv.innerHTML = '';
      if (entries.length === 0) {
        entriesDiv.innerHTML = '<p class="text-center">Нет записей</p>';
      }
      entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.innerHTML = `
          <div class="card-body">
            <h5 class="card-title">${entry.title}</h5>
            <h6 class="card-subtitle mb-2 text-muted">Дата: ${entry.date} | Приоритет: ${entry.priority}</h6>
            <p class="card-text">${entry.content}</p>
            ${entry.tags.length ? `<p>Теги: ${entry.tags.join(', ')}</p>` : ''}
            ${entry.reminder ? `<p>Напоминание: ${entry.reminder}</p>` : ''}
            <button class="btn btn-sm btn-info edit-btn" data-id="${entry.id}">Редактировать</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${entry.id}">Удалить</button>
          </div>
        `;
        entriesDiv.appendChild(card);
      });
      
      // Вешаем обработчики событий для кнопок редактирования и удаления
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editEntry(btn.getAttribute('data-id')));
      });
      
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteEntry(btn.getAttribute('data-id')));
      });
    })
    .catch(error => console.error('Ошибка загрузки записей:', error));
}

function editEntry(id) {
  // Получаем данные записи и заполняем форму
  fetch(`/entries`)
    .then(res => res.json())
    .then(entries => {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;
      isEditing = true;
      editingId = id;
      
      document.getElementById('title').value = entry.title;
      document.getElementById('date').value = entry.date;
      document.getElementById('content').value = entry.content;
      document.getElementById('tags').value = entry.tags.join(', ');
      document.getElementById('priority').value = entry.priority;
      document.getElementById('reminder').value = entry.reminder || '';
      
      submitBtn.textContent = 'Обновить запись';
      cancelEditBtn.style.display = 'inline-block';
    })
    .catch(err => console.error('Ошибка получения записи для редактирования:', err));
}

function deleteEntry(id) {
  if (!confirm('Вы действительно хотите удалить эту запись?')) return;
  
  fetch(`/entry/${id}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(response => {
    if (response.success) {
      loadEntries();
    }
  })
  .catch(err => console.error('Ошибка удаления записи:', err));
}

function resetForm() {
  entryForm.reset();
  isEditing = false;
  editingId = null;
  submitBtn.textContent = 'Сохранить запись';
  cancelEditBtn.style.display = 'none';
}

cancelEditBtn.addEventListener('click', resetForm);

applyFilterBtn.addEventListener('click', () => {
  const filter = {};
  if (filterDate.value) filter.date = filterDate.value;
  if (filterTag.value.trim()) filter.tag = filterTag.value.trim();
  loadEntries(filter);
});

clearFilterBtn.addEventListener('click', () => {
  filterDate.value = '';
  filterTag.value = '';
  loadEntries();
});

// Загрузка записей при старте
loadEntries();
