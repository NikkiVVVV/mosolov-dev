# mosolov.dev

Рабочий адрес: https://mosolov.dev/money/ . HTTPS проверен 10 ноября 2026; сертификат GitHub approved, Enforce HTTPS включён.

GitHub: https://github.com/NikkiVVVV/mosolov-dev . Pages публикует docs/ из main. Корень ведёт на money/.

Исходники: /Users/nomosolov/Documents/ChatGPT/Фан-пет/outputs/coin-toss. При обновлении копировать только index.html, app.js, assets/, vendor/ в docs/money/.

## DNS и восстановление

Локальная резервная копия: dns/README.md. В папке dns/ хранятся все четыре записи Porkbun до/после изменений, снимки интерфейса, публичные DNS-ответы, настройки GitHub Pages и результат проверки. Папка исключена из Git; пароли, cookies и ключи не сохранены.

Поддомен links.mosolov.dev использует отдельный репозиторий mosolov-links. Его запись не менялась.

Проверены HTTPS и все семь ресурсов по содержимому; мобильный Chrome 390×844: рисунки монеты, бросок, приземление, переключение темы. Реальный iPhone отдельно не тестировался.

## Игра в фишки

Адрес: https://mosolov.dev/bita/ . Исходники: outputs/pokemon-pogs, публикация: docs/bita/. Файлы index.html, app.js, dynamics.js, style.css, assets/, vendor/. Локальные Three.js и Rapier, без внешних CDN. Проверка: node outputs/pokemon-pogs/tests/physics.mjs. 72 сценария с разными начальными стопками, 1/2/6/12 фишек и тремя силами удара прошли 10.11.2026.
