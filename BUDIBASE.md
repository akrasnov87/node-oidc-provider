## Интеграция с Budibase

Добавлена поддержка для сервиса [budibase](https://budibase.com/).

При установке локальной версии https://github.com/akrasnov87/budibase (например запуск через контейнер) можно подключить данный сервис и выполнять авторизацию в смещных приложения через OIDC провайдер.

### Настройки

В настройках сервиса должны быть заполнены параметры:

* couchdb_host - хост для подключения к couchdb
* couchdb_protocol - протокол подключения к couchdb
* couchdb_post - порт подключения к couchdb
* couchdb_user - логин к couchdb
* couchdb_pass - пароль к couchdb

#### Базовые настройки

connection_string="" - устанавливваем соединение в пустое значение
virtual_dir_path="/" - виртуальный каталог
issuer="https://606d-109-195-246-209.ngrok-free.app" - внешний адрес подключения (для тестирования используется ngrok)
debug=false
port=7001 - внутрий порт
https=true - в режиме `production` должно быть `true`

### Запуск

Перед запуском требуется создать или обновить файл `.env.production`:

* DOCKER_ENV - тип запуска контейнера: production - контейнер запускается в "боевом режиме" (с протоколом https), developer - режим разработки;
* APP_ENV=budibase - имя настройки из каталога `./conf`;

`docker run --rm --env-file=./.env.budibase -p 7001:7001 -v ~/data/code/node-oidc-provider/.conf:/app/.conf akrasnov87/node-oidc-provider:latest`

### Клиенты

В каталоге `./conf` есть файл `clients.json`, в котором требуется указать список адресов (`redirect_uris`), для которых разрешено подключение. Тут так же указаны client_id и client_secret, которые могут понадобится при настройках OIDC провайдера. 