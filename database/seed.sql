-- ============================================================
--  AnemIA · seed.sql
--  Datos semilla mínimos para que el dashboard muestre contenido
--  antes de ejecutar el primer caso. Caso de ejemplo: Juliaca.
-- ============================================================

INSERT INTO patients (sexo, edad_meses, provincia_ren, distrito_ren, altura_ren)
VALUES ('F', 53.62, 'SANROMAN', 'JULIACA', 3877)
ON CONFLICT DO NOTHING;

INSERT INTO evaluations
    (patient_id, prov_eess, dist_eess, hemoglobina, altura_ren, hbc, adjustment,
     juntos, sis, qaliwarma, cred, suplementacion, consejeria, sesion)
VALUES
    (1, 'SANROMAN', 'JULIACA', 13.7, 3877, 11.40, -2.30,
     FALSE, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO predictions
    (evaluation_id, model_name, diagnosis_code, diagnosis_label, probability, class_probabilities)
VALUES
    (1, 'random_forest', 'Normal', 'Normal', 92.0,
     '{"Normal": 0.92, "AnemiaLeve": 0.06, "AnemiaModerada": 0.015, "AnemiaSevera": 0.005}')
ON CONFLICT DO NOTHING;

INSERT INTO recommendations (prediction_id, diagnosis_code, title, items)
VALUES
    (1, 'Normal', 'Seguimiento preventivo',
     '["Continuar suplementación preventiva con hierro.", "Mantener controles CRED.", "Control en 3 meses."]')
ON CONFLICT DO NOTHING;

INSERT INTO agent_logs (run_id, agent, status, elapsed_ms, message)
VALUES
    ('seed00000001', 'data_agent', 'ok', 1.2, 'Datos clínicos validados.'),
    ('seed00000001', 'preprocessing_agent', 'ok', 0.8, 'Hbc 11.40 g/dL.'),
    ('seed00000001', 'prediction_agent', 'ok', 12.5, 'Diagnóstico: Normal (92%).'),
    ('seed00000001', 'explainability_agent', 'ok', 45.0, 'Factor: Hemoglobina ajustada.'),
    ('seed00000001', 'recommendation_agent', 'ok', 0.5, 'Seguimiento preventivo.'),
    ('seed00000001', 'monitoring_agent', 'ok', 0.3, 'Pipeline auditado.')
ON CONFLICT DO NOTHING;
