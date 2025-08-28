import { toast } from "@/hooks/use-toast";

// Хелпер функции для удобного использования toast уведомлений

export const showSuccessToast = (title: string, description?: string) => {
  return toast({
    variant: "success",
    title,
    description,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  return toast({
    variant: "destructive",
    title,
    description,
  });
};

export const showWarningToast = (title: string, description?: string) => {
  return toast({
    variant: "warning",
    title,
    description,
  });
};

export const showInfoToast = (title: string, description?: string) => {
  return toast({
    variant: "info",
    title,
    description,
  });
};

// Специфические уведомления для частых случаев
export const showSaveSuccess = (itemName = "Дані") => {
  return showSuccessToast(
    "Збережено успішно",
    `${itemName} успішно збережено`
  );
};

export const showSaveError = (itemName = "дані", error?: string) => {
  return showErrorToast(
    "Помилка збереження",
    error || `Не вдалося зберегти ${itemName}. Спробуйте ще раз.`
  );
};

export const showDeleteSuccess = (itemName = "елемент") => {
  return showSuccessToast(
    "Видалено успішно",
    `${itemName} успішно видалено`
  );
};

export const showDeleteError = (itemName = "елемент", error?: string) => {
  return showErrorToast(
    "Помилка видалення",
    error || `Не вдалося видалити ${itemName}. Спробуйте ще раз.`
  );
};

export const showLoadingError = (itemName = "дані", error?: string) => {
  return showErrorToast(
    "Помилка завантаження",
    error || `Не вдалося завантажити ${itemName}. Перевірте підключення до інтернету.`
  );
};

export const showValidationError = (message = "Перевірте правильність введених даних") => {
  return showWarningToast(
    "Помилка валідації",
    message
  );
};

export const showNetworkError = () => {
  return showErrorToast(
    "Проблеми з мережею",
    "Перевірте підключення до інтернету та спробуйте ще раз"
  );
};

export const showMaintenanceNotice = () => {
  return showInfoToast(
    "Технічні роботи",
    "Сайт може працювати нестабільно через технічні роботи"
  );
};

export const showFileUploadSuccess = (fileName?: string) => {
  return showSuccessToast(
    "Файл завантажено",
    fileName ? `Файл "${fileName}" успішно завантажено` : "Файл успішно завантажено"
  );
};

export const showFileUploadError = (error?: string) => {
  return showErrorToast(
    "Помилка завантаження файлу",
    error || "Не вдалося завантажити файл. Перевірте формат та розмір файлу."
  );
};

export const showAuthError = (action = "виконати дію") => {
  return showWarningToast(
    "Потрібна авторизація",
    `Увійдіть в акаунт щоб ${action}`
  );
};

export const showPermissionError = () => {
  return showErrorToast(
    "Недостатньо прав",
    "У вас немає прав для виконання цієї дії"
  );
};

// Уведомления для специфических функций приложения
export const showListingPublished = () => {
  return showSuccessToast(
    "Оголошення опубліковано",
    "Ваше оголошення успішно опубліковано та доступне для перегляду"
  );
};

export const showListingDraft = () => {
  return showInfoToast(
    "Оголошення збережено як чернетка",
    "Ви можете завершити та опублікувати його пізніше"
  );
};

export const showMessageSent = () => {
  return showSuccessToast(
    "Повідомлення відправлено",
    "Ваше повідомлення успішно доставлено"
  );
};

export const showProfileUpdated = () => {
  return showSuccessToast(
    "Профіль оновлено",
    "Ваші дані успішно збережено"
  );
};

export const showPasswordChanged = () => {
  return showSuccessToast(
    "Пароль змінено",
    "Ваш пароль успішно оновлено"
  );
};

export const showEmailVerificationSent = () => {
  return showInfoToast(
    "Лист підтвердження відправлено",
    "Перевірте вашу електронну пошту та перейдіть за посиланням"
  );
};

export const showSearchSaved = () => {
  return showSuccessToast(
    "Пошук збережено",
    "Ви отримуватимете сповіщення про нові оголошення за цим запитом"
  );
};

export const showItemAddedToFavorites = () => {
  return showSuccessToast(
    "Додано в обране",
    "Оголошення збережено у ваших обраних"
  );
};

export const showItemRemovedFromFavorites = () => {
  return showInfoToast(
    "Видалено з обраного",
    "Оголошення більше не в обраних"
  );
};