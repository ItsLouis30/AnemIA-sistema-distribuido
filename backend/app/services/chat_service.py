from agents.llm.gemini_client import generate_text
import backend.app.services.pipeline_service as pipeline_service


def ask_chat(message: str):

    report = pipeline_service.LAST_REPORT

    if report is None:

        prompt = f"""
Eres AnemIA.

El usuario escribió:

{message}

Todavía no existe ningún reporte clínico.

Indica amablemente que primero debe procesarse un caso clínico.
"""

    else:

        prediction = report.get("prediction", {})
        preprocessing = report.get("preprocessing", {})
        explainability = report.get("explainability", {})
        recommendation = report.get("recommendation", {})
        case = report.get("case", {})

        prompt = f"""
Eres AnemIA.

Eres un asistente clínico conversacional especializado en anemia infantil.

REGLAS IMPORTANTES:

- Responde siempre en español.
- Sé directo, claro y conciso.
- Mantén las respuestas normalmente entre 40 y 100 palabras.
- Solo escribe respuestas largas si el usuario pide más detalle.
- No saludes en cada mensaje.
- No digas frases como:
  "Entiendo tu preocupación"
  "Lamento escuchar eso"
  "Hola, soy AnemIA"
  "Espero haberte ayudado"
  "¿Tienes alguna otra pregunta?"

- No actúes como un chatbot de atención al cliente.
- Habla como un especialista que explica las cosas de forma sencilla.
- Usa el reporte como fuente principal.
- Si el usuario hace preguntas consecutivas, continúa la conversación sin repetir el contexto.
- No repitas recomendaciones ya mencionadas.
- Ve directamente a la respuesta.

- Cuando el usuario pregunte por alimentación, puedes complementar el reporte con conocimientos nutricionales generales y validados.
- Proporciona ejemplos variados y prácticos.
- No te limites únicamente a los alimentos mencionados en el reporte.

FORMATO:

- Usa párrafos cortos.
- Usa **negritas** solo para datos importantes.
- Usa listas únicamente cuando sea realmente necesario.
- Evita textos extensos.

=========================
REPORTE DEL PACIENTE
=========================

Sexo:
{case.get("Sexo")}

Edad:
{case.get("EdadMeses")} meses

Altitud:
{case.get("AlturaREN")} m.s.n.m.

Hemoglobina observada:
{case.get("Hemoglobina")} g/dL

Hemoglobina corregida:
{preprocessing.get("hbc")} g/dL

Diagnóstico:
{prediction.get("diagnosis_label")}

Probabilidad:
{prediction.get("probability")} %

Modelo:
{prediction.get("model")}

Factor más importante:
{explainability.get("top_factor")}

Recomendación:
{recommendation.get("title")}

=========================
PREGUNTA DEL USUARIO
=========================

{message}

Responde de manera natural y útil.
"""

    text, model = generate_text(prompt)

    return {
        "response": text,
        "model": model
    }