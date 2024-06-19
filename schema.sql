CREATE SCHEMA IF NOT EXISTS oidc
    AUTHORIZATION oidc;

CREATE OR REPLACE FUNCTION oidc.sf_verify_user(
	params jsonb)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
	
DECLARE
	_d_expired_date 		date;
	_jb_result				jsonb;
	_c_login				text;
	_c_password				text;
BEGIN
	SELECT params#>>'{login}' INTO _c_login;
	SELECT params#>>'{password}' INTO _c_password;
	
	-- проверяем блокировку
	SELECT u.d_expired_date INTO _d_expired_date 
	FROM core.pd_users AS u 
	WHERE u.c_login = _c_login;
	
	IF _d_expired_date IS NOT NULL AND NOW() > _d_expired_date THEN
		UPDATE core.pd_users AS u
		SET b_disabled = true
		WHERE u.c_login = _c_login;
		
		RETURN null;
	END IF;

	IF params#>>'{password}' IS NOT NULL THEN
		-- читаем информацию из БД без учёта устройств
		SELECT 	(CASE 
					WHEN t.b_verify THEN t.jb_data 
					ELSE NULL
				END) INTO _jb_result
		FROM (
			SELECT 
				CASE WHEN u.s_hash IS NULL 
					THEN u.c_password = _c_password 
					ELSE crypt(_c_password, u.s_hash) = u.s_hash 
				END AS b_verify,
				jsonb_build_object(
					'accountId', u.c_login,
					'profile', jsonb_build_object(
						'email', u.c_email,
						'email_verified', u.c_email,
						'family_name', u.c_last_name,
						'given_name', u.c_first_name,
						'middle_name', u.c_middle_name,
						'name', u.c_first_name || ' ' || u.c_last_name || ' ' || u.c_middle_name,
						'phone_number', u.c_phone,
						'locale', 'ru'
					)
				) AS jb_data
			FROM core.pd_users AS u 
			WHERE u.c_login = _c_login AND u.b_disabled = false AND u.sn_delete = false
		) AS t;

		RETURN _jb_result;
	ELSE
		RETURN NULL;
	END IF;
END
$BODY$;

ALTER FUNCTION oidc.sf_verify_user(jsonb)
    OWNER TO oidc;

COMMENT ON FUNCTION oidc.sf_verify_user(jsonb)
    IS 'Проверка пользователя OIDC';

CREATE TABLE IF NOT EXISTS oidc.sd_tokens
(
    id text COLLATE pg_catalog."default" NOT NULL,
    jb_data jsonb,
    d_created_date timestamp without time zone DEFAULT now(),
    d_change_date timestamp without time zone,
    CONSTRAINT sd_tokens_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS oidc.sd_tokens
    OWNER to oidc;

COMMENT ON TABLE oidc.sd_tokens
    IS 'Токены авторизации для OIDC провайдера';