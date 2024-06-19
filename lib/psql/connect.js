import pg from "pg";

let pool;

class Connect {
    config = null;

    static connect(connectionString, name) {
        var data = connectionString.split(';');
        var params = {};
        for (var i in data) {
            var item = data[i];
            params[item.split(':')[0]] = item.split(':')[1];
        }
    
        pool = new pg.Pool({
            host: params.host,
            user: params.user,
            port: params.port,
            password: params.password,
            database: params.database,
            max: parseInt(params.max || '100'),
            idleTimeoutMillis: parseInt(params.idleTimeoutMillis || '30000'),
            application_name: name || 'pg-connect'
        });
    
        pool.on('error', function(e) {
            console.log('Pool error: ' + e.toString());
        });
    }
    
    static close() {
        if(pool != null) {
            pool.end();
        }
    }

    constructor(name) {

    }

    async _query(query, params) {
        var dt = Date.now();
        var self = this;

        return new Promise((resolve, reject) => {
            pool.connect(function (err, client, done) {
                if(err) {
                    reject({ 
                        response: null, 
                        duration: Date.now() - dt, 
                        ext: {
                            query: query,
                            params: params,
                            response: err
                        }
                    });
                } else {
                    client.query(query, self._normalParams(params), (err, res) => {
                        client.release();
            
                        if(!err) {
                            delete res._parsers;
                            delete res._types;
                            delete res.fields;
                            delete res.oid;
                            delete res.rowAsArray;
                            delete res.RowCtor;
                        }
            
                        resolve({ 
                            response: res, 
                            duration: Date.now() - dt, 
                            ext: {
                                query: query,
                                params: params,
                                error: err
                            }
                        });
                    });
                }
             });
        });
    }

    async upsert(_id, payload, expiresIn) {
        let expiresAt;

        if (expiresIn) {
            expiresAt = new Date(Date.now() + (expiresIn * 1000));
        }

        return await this._query('INSERT INTO oidc.sd_tokens(id, jb_data) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET jb_data = EXCLUDED.jb_data, d_change_date = now();', [_id, { payload, ...(expiresAt ? { expiresAt } : undefined) }]);
    }

    async findByUserCode(userCode){
        var data = await this._query("SELECT t.jb_data FROM oidc.sd_tokens AS t WHERE (((t.jb_data#>>'{payload}')::jsonb)#>>'{userCode}') = $1", [userCode]);

        return data.response.rows.length == 1 ? data.response.rows[0].jb_data.payload : undefined;
    }

    async findByUid(uid){
        var data = await this._query("SELECT t.jb_data FROM oidc.sd_tokens AS t WHERE (((t.jb_data#>>'{payload}')::jsonb)#>>'{uid}') = $1", [uid]);

        return data.response.rows.length == 1 ? data.response.rows[0].jb_data.payload : undefined;
    }

    async find(_id){
        var data = await this._query('SELECT t.jb_data FROM oidc.sd_tokens AS t WHERE t.id = $1', [_id]);

        return data.response.rows.length == 1 ? data.response.rows[0].jb_data.payload : undefined;
    }

    async auth(login, password) {
        var input = {
            "login": login,
            "password": password
        };

        var data = await this._query('SELECT * FROM oidc.sf_verify_user($1);', [input]);

        return data.response.rows.length == 1 ? data.response.rows[0].sf_verify_user : undefined;
    }

    async destroy(_id) {

        return await this._query('DELETE FROM oidc.sd_tokens AS t WHERE t.id = $1', [_id]);
    }

    async consume(_id) {
        var data = await this._query('SELECT t.jb_data FROM oidc.sd_tokens AS t WHERE t.id = $1', [_id]);

        var jb_data = data.response.rows.length == 1 ? data.response.rows[0].jb_data : undefined;

        jb_data.payload.consumed = Math.floor(Date.now() / 1000);
        await this._query('UPDATE oidc.sd_tokens SET jb_data = $1 WHERE id = $2', [jb_data, _id]);
        // await this.coll().findOneAndUpdate(
        //   { _id },
        //   { $set: { 'payload.consumed': Math.floor(Date.now() / 1000) } },
        // );
      }

    async revokeByGrantId(grantId) {

        return await this._query("DELETE FROM oidc.sd_tokens AS t WHERE (((t.jb_data#>>'{payload}')::jsonb)#>>'{grantId}')= $1", [grantId]);
    }

    _normalParams(items) {
        if (!items)
            return items;
    
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (Array.isArray(item)) {
                items[i] = JSON.stringify(item);
            }
        }
        return items;
    }

    get config() {
        return this.config;
    }
}

export default Connect;