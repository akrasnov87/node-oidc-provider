/* eslint-disable no-console, camelcase, no-unused-vars */
import { strict as assert } from 'node:assert';
import * as querystring from 'node:querystring';
import { inspect } from 'node:util';
import { dirname } from 'desm';

const __dirname = dirname(import.meta.url);

import isEmpty from 'lodash/isEmpty.js';
import { urlencoded } from 'express'; // eslint-disable-line import/no-unresolved

import Account from '../support/account.js';
import { errors } from '../../lib/index.js'; // from 'oidc-provider';
import * as path from 'node:path';
import Configuration from '../../lib/psql/conf.js';
var args = new Configuration(path.join(__dirname, '../', '../', '.conf')).args

const body = urlencoded({ extended: false });

const keys = new Set();
const debug = (obj) => { 
  if(args.debug) {
    return querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
      keys.add(key);
      if (isEmpty(value)) return acc;
      acc[key] = inspect(value, { depth: null });
      return acc;
    }, {}), '<br/>', ': ', {
      encodeURIComponent(value) { return keys.has(value) ? `<strong>${value}</strong>` : value; },
    });
  }
  return '';
}
const { SessionNotFound } = errors;
export default (app, provider, vPath) => {
  app.use(vPath, (req, res, next) => {
    const orig = res.render;
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
        if (err) throw err;
        orig.call(res, '_layout', {
          ...locals,
          body: html,
          debug: args.debug
        });
      });
    };
    next();
  });

  function setNoCache(req, res, next) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.get(vPath + 'interaction/:uid', setNoCache, async (req, res, next) => {
    try {
      const {
        uid, prompt, params, session,
      } = await provider.interactionDetails(req, res);

      const client = await provider.Client.find(params.client_id);

      switch (prompt.name) {
        case 'login': {
          return res.render('login', {
            client,
            uid,
            details: prompt.details,
            params,
            vPath: vPath,
            title: 'Авторизация',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
            debug: args.debug
          });
        }
        case 'consent': {
          return res.render('interaction', {
            client,
            uid,
            vPath: vPath,
            details: prompt.details,
            params,
            title: 'Авторизовать',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
            debug: args.debug
          });
        }
        default:
          return undefined;
      }
    } catch (err) {
      return next(err);
    }
  });

  app.post(vPath + 'interaction/:uid/login', setNoCache, body, async (req, res, next) => {
    try {
      const { prompt: { name } } = await provider.interactionDetails(req, res);
      assert.equal(name, 'login');

//provider.Interaction.adapter

      //const account = await Account.findByLogin(req.body.login);
      var account;
      
      if(provider.Interaction.adapter.auth) {
        account = await provider.Interaction.adapter.auth(req.body.login, req.body.password);

        if(account) {
          await Account.findByLogin(req.body.login, account.profile);
        }
      } else {
        account = await Account.findByLogin(req.body.login);
      }
      if(account) {
        const result = {
          login: {
            accountId: account.accountId,
          },
        };

        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
      } else {
        return res.redirect(vPath + 'interaction/' + req.params.uid, 401);
        //res.status(401).send('No authorized');
      }
    } catch (err) {
      next(err);
    }
  });

  app.post(vPath + 'interaction/:uid/confirm', setNoCache, body, async (req, res, next) => {
    try {
      const interactionDetails = await provider.interactionDetails(req, res);
      const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;
      assert.equal(name, 'consent');

      let { grantId } = interactionDetails;
      let grant;

      if (grantId) {
        // we'll be modifying existing grant in existing session
        grant = await provider.Grant.find(grantId);
      } else {
        // we're establishing a new grant
        grant = new provider.Grant({
          accountId,
          clientId: params.client_id,
        });
      }

      if (details.missingOIDCScope) {
        grant.addOIDCScope(details.missingOIDCScope.join(' '));
      }
      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims);
      }
      if (details.missingResourceScopes) {
        for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
          grant.addResourceScope(indicator, scopes.join(' '));
        }
      }

      grantId = await grant.save();

      const consent = {};
      if (!interactionDetails.grantId) {
        // we don't have to pass grantId to consent, we're just modifying existing one
        consent.grantId = grantId;
      }

      const result = { consent };
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    } catch (err) {
      next(err);
    }
  });

  app.get(vPath + 'interaction/:uid/abort', setNoCache, async (req, res, next) => {
    try {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction',
      };
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
      next(err);
    }
  });

  app.use(vPath, (err, req, res, next) => {
    if (err instanceof SessionNotFound) {
      // handle interaction expired / session not found error
    }
    next(err);
  });
};
