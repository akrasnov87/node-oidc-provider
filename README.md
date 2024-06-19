# oidc-provider

This module provides an OAuth 2.0 ([RFC 6749][oauth2]) Authorization Server with support for OpenID Connect ([OIDC][openid-connect]) and many
other additional features and standards.

**Table of Contents**

- [Implemented specs & features](#implemented-specs--features)
- [Certification](#certification)
- [Documentation & Configuration](#documentation--configuration)
- [Recipes](#recipes)
- [Events](#events)

## Implemented specs & features

The following specifications are implemented by oidc-provider (not exhaustive):

_Note that not all features are enabled by default, check the configuration section on how to enable them._

- [`RFC6749` - OAuth 2.0][oauth2] & [`OIDC` Core 1.0][core]
- [OIDC `Discovery 1.0`][discovery]
- Dynamic Client Registration
  - [OIDC `Dynamic Client Registration 1.0`][registration]
  - [`RFC7591` - OAuth 2.0 Dynamic Client Registration Protocol][oauth2-registration]
  - [`RFC7592` - OAuth 2.0 Dynamic Client Registration Management Protocol][registration-management]
- [OIDC `RP-Initiated Logout 1.0`][rpinitiated-logout]
- [OIDC `Back-Channel Logout 1.0`][backchannel-logout]
- [`RFC7009` - OAuth 2.0 Token Revocation][revocation]
- [`RFC7636` - Proof Key for Code Exchange (`PKCE`)][pkce]
- [`RFC7662` - OAuth 2.0 Token Introspection][introspection]
- [`RFC8252` - OAuth 2.0 for Native Apps BCP (`AppAuth`)][oauth-native-apps]
- [`RFC8628` - OAuth 2.0 Device Authorization Grant (`Device Flow`)][device-flow]
- [`RFC8705` - OAuth 2.0 Mutual TLS Client Authentication and Certificate Bound Access Tokens (`MTLS`)][mtls]
- [`RFC8707` - OAuth 2.0 Resource Indicators][resource-indicators]
- [`RFC9101` - OAuth 2.0 JWT-Secured Authorization Request (`JAR`)][jar]
- [`RFC9126` - OAuth 2.0 Pushed Authorization Requests (`PAR`)][par]
- [`RFC9207` - OAuth 2.0 Authorization Server Issuer Identifier in Authorization Response][iss-auth-resp]
- [`RFC9449` - OAuth 2.0 Demonstration of Proof-of-Possession at the Application Layer (`DPoP`)][dpop]
- [Financial-grade API Security Profile 1.0 - Part 2: Advanced (`FAPI 1.0`)][fapi]
- [JWT Secured Authorization Response Mode for OAuth 2.0 (`JARM`)][jarm]
- [OIDC Client Initiated Backchannel Authentication Flow (`CIBA`)][ciba]

Supported Access Token formats:

- Opaque
- [JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens][jwt-at]

The following draft specifications are implemented by oidc-provider:

- [JWT Response for OAuth Token Introspection - draft 10][jwt-introspection]
- [Financial-grade API: Client Initiated Backchannel Authentication Profile (`FAPI-CIBA`) - Implementer's Draft 01][fapi-ciba]

Updates to draft specification versions are released as MINOR library versions,
if you utilize these specification implementations consider using the tilde `~` operator in your
package.json since breaking changes may be introduced as part of these version updates. Alternatively
[acknowledge](/docs/README.md#features) the version and be notified of breaking changes as part of
your CI.

## Certification
[<img width="184" height="96" align="right" src="https://cdn.jsdelivr.net/gh/panva/node-oidc-provider@acd3ebf2f5ebbb5605463cb681a1fb2ab9742ace/OpenID_Certified.png" alt="OpenID Certification">][openid-certified-link]  
Filip Skokan has [certified][openid-certified-link] that [oidc-provider][npm-url]
conforms to the following profiles of the OpenID Connect™ protocol.

- Basic, Implicit, Hybrid, Config, Dynamic, Form Post, and 3rd Party-Init OP profiles
- Back-Channel Logout and RP-Initiated Logout
- FAPI 1.0 Advanced (w/ Private Key JWT, MTLS, JARM, PAR, CIBA)

## Sponsor

[<img height="65" align="left" src="https://cdn.auth0.com/blog/github-sponsorships/brand-evolution-logo-Auth0-horizontal-Indigo.png" alt="auth0-logo">][sponsor-auth0] If you want to quickly add OpenID Connect authentication to Node.js apps, feel free to check out Auth0's Node.js SDK and free plan. [Create an Auth0 account; it's free!][sponsor-auth0]<br><br>

## Support

If you or your company use this module, or you need help using/upgrading the module, please consider becoming a [sponsor][support-sponsor] so I can continue maintaining it and adding new features carefree. The only way to guarantee you get feedback from the author & sole maintainer of this module is to support the package through GitHub Sponsors.

## [Documentation](/docs/README.md) & Configuration

oidc-provider can be mounted to existing connect, express, fastify, hapi, or koa applications, see
[how](/docs/README.md#mounting-oidc-provider). The provider allows to be extended and configured in
various ways to fit a variety of uses. See the [documentation](/docs/README.md) and [example folder](/example).

```js
import Provider from 'oidc-provider';
const configuration = {
  // refer to the documentation for other available configuration
  clients: [{
    client_id: 'foo',
    client_secret: 'bar',
    redirect_uris: ['http://lvh.me:8080/cb'],
    // ... other client properties
  }],
};

const oidc = new Provider('http://localhost:3000', configuration);

oidc.listen(3000, () => {
  console.log('oidc-provider listening on port 3000, check http://localhost:3000/.well-known/openid-configuration');
});
```


## Recipes
Collection of useful configuration use cases are available over at [recipes](/recipes).


## Events
oidc-provider instances are event emitters, using event handlers you can hook into the various
actions and i.e. emit metrics that react to specific triggers. See the list of available emitted [event names](/docs/events.md) and their description.


[npm-url]: https://www.npmjs.com/package/oidc-provider
[openid-certified-link]: https://openid.net/certification/
[openid-connect]: https://openid.net/connect/
[core]: https://openid.net/specs/openid-connect-core-1_0.html
[discovery]: https://openid.net/specs/openid-connect-discovery-1_0.html
[oauth2-registration]: https://www.rfc-editor.org/rfc/rfc7591.html
[registration]: https://openid.net/specs/openid-connect-registration-1_0.html
[oauth2]: https://www.rfc-editor.org/rfc/rfc6749.html
[oauth2-bearer]: https://www.rfc-editor.org/rfc/rfc6750.html
[revocation]: https://www.rfc-editor.org/rfc/rfc7009.html
[introspection]: https://www.rfc-editor.org/rfc/rfc7662.html
[pkce]: https://www.rfc-editor.org/rfc/rfc7636.html
[example-repo]: https://github.com/panva/node-oidc-provider-example
[backchannel-logout]: https://openid.net/specs/openid-connect-backchannel-1_0-final.html
[registration-management]: https://www.rfc-editor.org/rfc/rfc7592.html
[oauth-native-apps]: https://www.rfc-editor.org/rfc/rfc8252.html
[jar]: https://www.rfc-editor.org/rfc/rfc9101.html
[device-flow]: https://www.rfc-editor.org/rfc/rfc8628.html
[jwt-introspection]: https://tools.ietf.org/html/draft-ietf-oauth-jwt-introspection-response-10
[sponsor-auth0]: https://a0.to/try-auth0
[mtls]: https://www.rfc-editor.org/rfc/rfc8705.html
[dpop]: https://www.rfc-editor.org/rfc/rfc9449.html
[resource-indicators]: https://www.rfc-editor.org/rfc/rfc8707.html
[jarm]: https://openid.net/specs/oauth-v2-jarm.html
[jwt-at]: https://www.rfc-editor.org/rfc/rfc9068.html
[support-sponsor]: https://github.com/sponsors/panva
[par]: https://www.rfc-editor.org/rfc/rfc9126.html
[rpinitiated-logout]: https://openid.net/specs/openid-connect-rpinitiated-1_0-final.html
[iss-auth-resp]: https://www.rfc-editor.org/rfc/rfc9207.html
[fapi]: https://openid.net/specs/openid-financial-api-part-2-1_0.html
[ciba]: https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0-final.html
[fapi-ciba]: https://openid.net/specs/openid-financial-api-ciba-ID1.html

## Тестирование 

Устанавливаем, чтобы прокинуть данные наружу:

`sudo snap install ngrok`

Запускаем (возможно нужно будет применить токен, надо авторизоваться)

`ngrok port 3000`

Переходи на сайт https://oidcdebugger.com/ и заполняем информацию, тестируем

## Хранилище

Провайдер работает только специальной БД для RPC-сервиса, например [us-db-ci_purgeable](https://github.com/akrasnov87/us-db-ci_purgeable). В указанную БД требуется добавить информацию из schema.sql

__Примечание__: набор информации для профиля может отличаться, поэтому может потребоваться корректировка функции `oidc.sf_verify_user`

## Контейнер

### Сборка

`docker build -t akrasnov87/node-oidc-provider:0.0.1 .`

Либо вызвать `./build.sh` 

### Запуск

`docker run -d --rm --env-file=./.env --name node-oidc-provider -p 3000:3000 akrasnov87/node-oidc-provider:0.0.1`

После запуска хост будет доступен по адресу http://localhost:3000/dev/.well-known/openid-configuration

__Примечание__: виртуальный путь `/dev` может быть изменёт в файле .conf/dev.conf

 Для удобства можно вывести каталог `.conf` через `volumes`, чтобы была возможность управлять настройками и данными по клиентским приложениям `clients.json`

## Получение последних изменений

<pre>
git remote add upstream https://github.com/panva/node-oidc-provider.git
git pull upstream main
</pre>