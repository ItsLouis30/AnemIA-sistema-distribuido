-- ============================================================
--  AnemIA · schema.sql
--  Esquema de trazabilidad (espejo de los modelos SQLAlchemy).
--  Idempotente: usa CREATE TABLE IF NOT EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id            SERIAL PRIMARY KEY,
    sexo          VARCHAR(1)  NOT NULL,
    edad_meses    REAL        NOT NULL,
    provincia_ren VARCHAR(80),
    distrito_ren  VARCHAR(80),
    altura_ren    REAL,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluations (
    id             SERIAL PRIMARY KEY,
    patient_id     INTEGER REFERENCES patients(id),
    prov_eess      VARCHAR(80),
    dist_eess      VARCHAR(80),
    hemoglobina    REAL NOT NULL,
    altura_ren     REAL NOT NULL,
    hbc            REAL NOT NULL,
    adjustment     REAL NOT NULL,
    juntos         BOOLEAN DEFAULT FALSE,
    sis            BOOLEAN DEFAULT FALSE,
    qaliwarma      BOOLEAN DEFAULT FALSE,
    cred           BOOLEAN DEFAULT FALSE,
    suplementacion BOOLEAN DEFAULT FALSE,
    consejeria     BOOLEAN DEFAULT FALSE,
    sesion         BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS predictions (
    id                  SERIAL PRIMARY KEY,
    evaluation_id       INTEGER REFERENCES evaluations(id),
    model_name          VARCHAR(40) NOT NULL,
    diagnosis_code      VARCHAR(40) NOT NULL,
    diagnosis_label     VARCHAR(60) NOT NULL,
    probability         REAL NOT NULL,
    class_probabilities TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS explanations (
    id            SERIAL PRIMARY KEY,
    prediction_id INTEGER REFERENCES predictions(id),
    method        VARCHAR(40) NOT NULL,
    payload       TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id             SERIAL PRIMARY KEY,
    prediction_id  INTEGER REFERENCES predictions(id),
    diagnosis_code VARCHAR(40) NOT NULL,
    title          VARCHAR(120) NOT NULL,
    items          TEXT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id         SERIAL PRIMARY KEY,
    run_id     VARCHAR(40) NOT NULL,
    agent      VARCHAR(60) NOT NULL,
    status     VARCHAR(20) NOT NULL,
    elapsed_ms REAL NOT NULL,
    message    TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_run_id ON agent_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_predictions_dx ON predictions(diagnosis_code);
