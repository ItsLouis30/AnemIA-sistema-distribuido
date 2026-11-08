-- ============================================================
--  AnemIA · init.sql
--  Script combinado para inicialización manual:
--      psql "$DATABASE_URL" -f database/init.sql
--  (En Docker, schema.sql y seed.sql se montan por separado en
--   /docker-entrypoint-initdb.d con prefijos 01_ y 02_.)
-- ============================================================
\echo '== AnemIA: inicializando base de datos =='
\ir schema.sql
\ir seed.sql
\echo '== AnemIA: base de datos lista =='
