import NodeCouchDb from 'node-couchdb';
import * as bcrypt from 'bcrypt';
import * as path from 'node:path';
import { dirname } from 'desm';
const __dirname = dirname(import.meta.url);

import Configuration from '../../lib/psql/conf.js';
var args = new Configuration(path.join(__dirname, '../', '../', '.conf')).args

let DB;
let TOKEN_TABLE = 'global-tokens';

async function compare(data, encrypted) {
  return bcrypt.compare(data, encrypted)
}

class CouchDbAdapter {
  constructor() {

  }

  // NOTE: the payload for Session model may contain client_id as keys, make sure you do not use
  //   dots (".") in your client_id value charset.
  async upsert(_id, payload, expiresIn) {
    let expiresAt;

    if (expiresIn) {
      expiresAt = new Date(Date.now() + (expiresIn * 1000));
    }

    try {
      let existItem = await DB.get(TOKEN_TABLE, _id, { conflicts: true });

      let item = Object.assign({
          _id: existItem.data._id,
          _rev: existItem.data._rev,
          upsert: true
        }, 
        { payload, ...(expiresAt ? { expiresAt } : undefined) }
      );

      await DB.update(TOKEN_TABLE, item);
      return
    } catch(e) {
      
    }

    let item = Object.assign({
        _id: _id,
        upsert: true
      }, 
      { payload, ...(expiresAt ? { expiresAt } : undefined) }
    );

    await DB.insert(TOKEN_TABLE, item);
  }

  async find(_id) {
    let result = null;
    try {
      result = await DB.get(TOKEN_TABLE, _id, { conflicts: true });
    } catch(e) {

    }

    if (!result) return undefined;
    return result.data.payload;
  }

  async findByUserCode(userCode) {
    let docs = await DB.mango(TOKEN_TABLE, {
        selector: {
            'payload.userCode': {
                $eq: userCode
            }
        },
        limit: 1
    });

    const result = docs.data.docs.length > 0 ? docs.data.docs[0] : undefined;

    if (!result) return undefined;
    return result.payload;
  }

  async findByUid(uid) {
    let docs = await DB.mango(TOKEN_TABLE, {
        selector: {
            'payload.uid': {
                $eq: uid
            }
        },
        limit: 1
    });

    const result = docs.data.docs.length > 0 ? docs.data.docs[0] : undefined;

    if (!result) return undefined;
    return result.payload;
  }

  async auth(login, password) {
    let docs = await DB.mango('global-db', {
        selector: {
            'email': {
                $eq: login
            }
        },
        limit: 1
    });

    if(docs.data.docs.length > 0) {
      let item = docs.data.docs[0];
      let b = await compare(password, item.password);

      return b ? {
        accountId: item._id,
        profile: {
          email: item.email,
          email_verified: false,
          family_name: '',
          given_name: '',
          middle_name: '',
          name: '',
          phone_number: '',
          locale: 'ru'
        }
      } : undefined;
    } else {
      return undefined;
    }
}

  async destroy(_id) {
    try {
      let existItem = await DB.get(TOKEN_TABLE, _id, { conflicts: true });
      await DB.del(TOKEN_TABLE, existItem.data._id, existItem.data._rev);
    } catch(e) {
      
    }
  }

  async consume(_id) {
    try {
      let result = await DB.get(TOKEN_TABLE, _id, { conflicts: true });
      result = result.data;

      let item = Object.assign({
          _id: result.data._id,
          _rev: result.data._rev
        }, 
        { payload, ...{consumed: Math.floor(Date.now() / 1000)} }
      );

      await DB.update(TOKEN_TABLE, item);
    } catch(e) {

    }
  }

  async revokeByGrantId(grantId) {
    let docs = await DB.mango(TOKEN_TABLE, {
        selector: {
            'payload.grantId': {
                $eq: grantId
            }
        }
    });

    const results = docs.data.docs.length > 0 ? docs.data.docs : undefined;

    for(var i = 0; i < results.length; i++) {
      let result = results[i];
      await DB.del(TOKEN_TABLE, result._id, result._rev);
    }
  }

  // This is not part of the required or supported API, all initialization should happen before
  // you pass the adapter to `new Provider`
  static async connect() {
    const connection = new NodeCouchDb({
      host: args.couchdb_host,
      protocol: args.couchdb_protocol,
      port: args.couchdb_post,
      auth: {
          user: args.couchdb_user,
          pass: args.couchdb_pass
      }
    });

    DB = connection;

    let list = await connection.listDatabases();
    if(list.filter((i)=>{ return i == TOKEN_TABLE; }).length == 0) {
      await connection.createDatabase(TOKEN_TABLE);
    }
  }
}

export default CouchDbAdapter;
