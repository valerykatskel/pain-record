/* eslint-disable no-restricted-globals */

// Этот файл помогает с загрузкой service-worker.js на iOS устройствах
// iOS устройства очень строго относятся к загрузке скриптов

// Загружаем основной сервис-воркер
self.importScripts('./service-worker.js'); 