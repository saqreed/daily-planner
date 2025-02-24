const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, 'data.json');

// Вспомогательные функции для работы с файлами
function readEntries(callback) {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err || !data) {
      return callback([]);
    }
    try {
      const entries = JSON.parse(data);
      callback(entries);
    } catch (error) {
      callback([]);
    }
  });
}

function writeEntries(entries, callback) {
  fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), callback);
}

// Создание новой записи
app.post('/save', (req, res) => {
  const { title, date, content, tags, priority, reminder } = req.body;

  // Валидация: обязательны title, date, content
  if (!title || !date || !content) {
    return res.status(400).send('Название, дата и содержание обязательны.');
  }

  // Создаём новую запись с уникальным идентификатором (используем Date.now)
  const newEntry = {
    id: Date.now().toString(),
    title,
    date,
    content,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    priority: priority || 'medium',
    reminder: reminder || null
  };

  readEntries(entries => {
    entries.push(newEntry);
    writeEntries(entries, err => {
      if (err) {
        res.status(500).send('Ошибка при сохранении записи.');
      } else {
        res.send(newEntry);
      }
    });
  });
});

// Редактирование записи
app.put('/entry/:id', (req, res) => {
  const entryId = req.params.id;
  const { title, date, content, tags, priority, reminder } = req.body;

  if (!title || !date || !content) {
    return res.status(400).send('Название, дата и содержание обязательны.');
  }

  readEntries(entries => {
    const index = entries.findIndex(e => e.id === entryId);
    if (index === -1) {
      return res.status(404).send('Запись не найдена.');
    }
    entries[index] = {
      ...entries[index],
      title,
      date,
      content,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      priority: priority || 'medium',
      reminder: reminder || null
    };

    writeEntries(entries, err => {
      if (err) {
        res.status(500).send('Ошибка при обновлении записи.');
      } else {
        res.send(entries[index]);
      }
    });
  });
});

// Удаление записи
app.delete('/entry/:id', (req, res) => {
  const entryId = req.params.id;

  readEntries(entries => {
    const filtered = entries.filter(e => e.id !== entryId);
    if (filtered.length === entries.length) {
      return res.status(404).send('Запись не найдена.');
    }
    writeEntries(filtered, err => {
      if (err) {
        res.status(500).send('Ошибка при удалении записи.');
      } else {
        res.send({ success: true });
      }
    });
  });
});

// Получение записей с возможной фильтрацией по тегу или дате
app.get('/entries', (req, res) => {
  const { tag, date } = req.query;

  readEntries(entries => {
    let filtered = entries;
    if (tag) {
      filtered = filtered.filter(entry => entry.tags.includes(tag));
    }
    if (date) {
      filtered = filtered.filter(entry => entry.date === date);
    }
    res.json(filtered);
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен по адресу http://localhost:${PORT}`);
});
