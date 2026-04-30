# Настройка перед первым запуском

## 1. Firebase Config

Открой `utils/firebase.ts` и замени плейсхолдеры своими данными из Firebase Console:
- Зайди на console.firebase.google.com
- Выбери свой проект → Project Settings → Your apps → Web app
- Скопируй firebaseConfig

## 2. Google Sign-In Client ID

Открой `app/login.tsx` и замени `YOUR_GOOGLE_WEB_CLIENT_ID`:
- Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
- Скопируй Web client ID

## 3. Запуск

```bash
cd finance-app-native
npx expo start --ios
```

Откроется симулятор iPhone. Нажми `i` в терминале если не открылся автоматически.

## 4. Сборка для App Store (позже)

```bash
npm install -g eas-cli
eas login
eas build --platform ios
```

## Структура проекта

```
app/
├── _layout.tsx          # Root (шрифты, Firebase auth)
├── login.tsx            # Экран входа
└── (tabs)/
    ├── _layout.tsx      # Tab bar + кнопка +
    ├── index.tsx        # Главная
    ├── piggy.tsx        # Копилка
    ├── budget.tsx       # Бюджеты
    └── history.tsx      # История

components/sheets/       # Все bottom sheets
store/useStore.ts        # Zustand (данные + Firebase sync)
constants/               # Цвета, категории, сервисы
utils/                   # Firebase, форматирование, recurring
```
