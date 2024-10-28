/* eslint-disable no-console */

import * as path from 'node:path';
import * as url from 'node:url';

const __dirname = dirname(import.meta.url);

import Configuration from '../lib/psql/conf.js';
var args = new Configuration(path.join(__dirname, '../', '.conf')).args
var vPath = args.virtual_dir_path;
import { dirname } from 'desm';
import express from 'express'; // eslint-disable-line import/no-unresolved
import helmet from 'helmet';

import Provider from '../lib/index.js'; // from 'oidc-provider';

import Account from './support/account.js';
import configuration from './support/configuration.js';
import routes from './routes/express.js';

console.log(JSON.stringify(args));

const { PORT = args.port, ISSUER = args.issuer } = process.env;
configuration.findAccount = Account.findAccount;

const app = express();

const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete directives['form-action'];
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives,
  },
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let server;
let adapter;
try {
  async function connect() {
    try {
      if (process.env.MONGODB_URI) {
        ({ default: adapter } = await import('./adapters/mongodb.js'));
        await adapter.connect();
      }
  
      if (args.couchdb_host) {
        ({ default: adapter } = await import('./adapters/couchdb.js'));
        await adapter.connect();
      }
  
      if (args.connection_string) {
        ({ default: adapter } = await import('../lib/psql/connect.js'));
        adapter.connect(args.connection_string, args.application_name);
      }
      
      start();
    } catch(err) {
      console.log(`reconnecting...` + err);
      setTimeout(async () => {
        await connect();
      }, 1000);
    }
  }

  function start() {
    console.log('starting...');

    const prod = process.env.NODE_ENV === 'production' || args.https == true;

    const provider = new Provider(ISSUER, { adapter, ...configuration });
  
    if (prod) {
      console.log('production mode');
      app.enable('trust proxy');
      provider.proxy = true;
  
      app.use((req, res, next) => {
        if (req.secure) {
          next();
        } else if (req.method === 'GET' || req.method === 'HEAD') {
          res.redirect(url.format({
            protocol: 'https',
            host: req.get('host'),
            pathname: req.originalUrl,
          }));
        } else {
          res.status(400).json({
            error: 'invalid_request',
            error_description: 'do yourself a favor and only use https',
          });
        }
      });
    }
  
    console.log('configuration');
    routes(app, provider, vPath);
    app.use(vPath, provider.callback());
    server = app.listen(PORT, () => {
      console.log(`application is listening on port ${PORT}, check its /.well-known/openid-configuration`);
    });
  }

  await connect();

} catch (err) {
  if (server?.listening) server.close();
  console.error(err);
  process.exitCode = 1;
}
