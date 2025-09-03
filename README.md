# PDF Generator - Генератор полисов страхования

Веб-приложение для генерации PDF полисов с динамическими данными.

## 🏗️ Архитектура

- **Backend**: Flask API (Python) - обработка PDF
- **Frontend**: React + TypeScript + Material-UI - веб-интерфейс
- **PDF Engine**: ReportLab + PyPDF2 - генерация PDF

## 📋 Требования

### Backend

- Python 3.8+
- Flask, Flask-CORS
- PyPDF2, ReportLab

### Frontend

- Node.js 16+
- npm или yarn
- React 18+ с TypeScript

## 🚀 Быстрый запуск

### Автоматический запуск (рекомендуется)

```bash
# Активируем виртуальную среду
.venv\Scripts\activate  # Windows
# или
source .venv/bin/activate  # Linux/Mac

# Запускаем приложение
python start.py
```

### Ручной запуск

#### 1. Запуск Backend

```bash
# Установка зависимостей
pip install flask flask-cors PyPDF2 reportlab

# Запуск API сервера
python app.py
```

API будет доступен по адресу: http://localhost:5000

#### 2. Запуск Frontend

```bash
# Переход в папку frontend
cd frontend

# Установка зависимостей
npm install

# Запуск dev сервера
npm start
```

Приложение откроется в браузере: http://localhost:3000

## 📁 Структура проекта

```
pdf-coordinate-example/
├── app.py                          # Flask API сервер
├── field_9_inserter.py            # Модуль генерации PDF
├── start.py                        # Скрипт автозапуска
├── data/
│   ├── Shablon.pdf                 # Шаблон PDF
│   └── field_9_annotations.json    # Координаты полей
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── PolicyForm.tsx      # Главная форма
│   │   ├── services/
│   │   │   └── api.ts              # API клиент
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript типы
│   │   ├── App.tsx                 # Главный компонент
│   │   └── index.tsx               # Точка входа
│   ├── public/
│   │   └── index.html              # HTML шаблон
│   ├── package.json                # Зависимости Node.js
│   └── tsconfig.json               # Конфигурация TypeScript
├── out/                            # Выходные PDF файлы
├── Pipfile                         # Python зависимости
└── README.md                       # Документация
```

## 🎯 Функциональность

### Веб-интерфейс

- ✅ Адаптивная форма ввода данных
- ✅ Валидация полей в реальном времени
- ✅ Красивый UI на Material-UI
- ✅ TypeScript для типобезопасности
- ✅ Автоматическое скачивание PDF

### Поля формы

1. **ФИО страхователя** - полное имя
2. **Адрес страхователя** - адрес регистрации
3. **Дата начала полиса** - формат ДД.ММ.ГГГГ
4. **Дата окончания полиса** - формат ДД.ММ.ГГГГ
5. **Регистрационный знак** - номер авто
6. **Тип транспортного средства** - категория (A. CAR, B. MOTORCYCLE, C. LORRY OR TRACTOR, D. CYCLE, E. BUS, F. TRAILER, G. OTHERS)
7. **Марка и модель** - информация об автомобиле
8. **Размер шрифта** - от 6 до 16 пунктов

### API Endpoints

#### `POST /api/generate-pdf`

Генерация PDF с данными из формы

```json
{
	"fio": "Иванов Иван Иванович",
	"address": "г. Москва, ул. Ленина, д. 1",
	"date_start": "01.01.2024",
	"date_end": "31.12.2024",
	"reg_number": "А123БВ77",
	"vehicle_type": "A",
	"brand_model": "Toyota Camry",
	"font_size": 8
}
```

#### `GET /api/health`

Проверка работоспособности API

#### `POST /api/validate-date`

Валидация формата даты

## 🎨 Особенности UI

- **Современный дизайн** - Material-UI компоненты
- **Адаптивность** - работает на всех устройствах
- **Валидация в реальном времени** - мгновенная обратная связь
- **Красивые анимации** - плавные переходы
- **Градиентный фон** - стильное оформление
- **Иконки Material Icons** - узнаваемые символы

## 🔧 Настройка

### Изменение координат полей

Отредактируйте файл `field_9_inserter.py`:

```python
# Координаты для размещения текста
start_x = 45
start_y_fio = 340
reg_number_x = 150
reg_number_y = 535
# ... другие координаты
```

### Изменение шрифтов

```python
font_name = 'Times-Roman'  # Доступные: Times-Roman, Helvetica, Courier
font_size = 8              # Размер шрифта
```

### Настройка API

Измените `app.py` для добавления новых endpoint'ов или изменения логики.

## 🚨 Решение проблем

### Backend не запускается

```bash
# Проверьте зависимости
pip install flask flask-cors PyPDF2 reportlab

# Проверьте наличие шаблона
ls data/Shablon.pdf
```

### Frontend не запускается

```bash
# Обновите Node.js до версии 16+
node --version

# Очистите кэш npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### CORS ошибки

Убедитесь, что Flask сервер запущен с CORS:

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Важно!
```

## 📝 Лицензия

Проект предназначен для демонстрации возможностей генерации PDF с веб-интерфейсом.

## 🔮 Планы развития

- [ ] Загрузка пользовательских шаблонов PDF
- [ ] Сохранение настроек в localStorage
- [ ] Предпросмотр PDF в браузере
- [ ] Пакетная генерация PDF
- [ ] Экспорт в другие форматы
- [ ] Аутентификация пользователей
