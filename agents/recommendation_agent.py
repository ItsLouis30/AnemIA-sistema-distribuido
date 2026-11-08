"""
agents/recommendation_agent.py — Agente 5 · Terapéutico
================================================================
Genera recomendaciones referenciales analizando el caso clínico y la
predicción del modelo mediante un agente de IA (Google Gemini).

Estrategia de robustez:
  * Se construye un prompt compacto con el diagnóstico estimado, la Hb
    corregida, datos del paciente y los factores XAI más influyentes.
  * Se invoca la cadena de modelos Gemini (con degradación automática).
  * Si no hay API key o todos los modelos fallan, se cae a las pautas
    MINSA-CRED por categoría (FALLBACK_RECOMMENDATIONS). El pipeline nunca
    se rompe y la salida mantiene siempre el mismo esquema.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from agents.base import Agent
from agents.llm.gemini_client import generate_text, is_configured

# Color visual por categoría (consumido por el frontend).
COLOR_BY_CODE = {
    "Normal": "green",
    "AnemiaLeve": "amber",
    "AnemiaModerada": "orange",
    "AnemiaSevera": "red",
}

# Respaldo determinista (pautas MINSA-CRED) si la IA no está disponible.
FALLBACK_RECOMMENDATIONS: Dict[str, Dict[str, Any]] = {
    "Normal": {
        "title": "Seguimiento preventivo",
        "items": [
            "Continuar suplementación preventiva con hierro (1 mg/kg/día) según esquema MINSA.",
            "Mantener controles CRED según edad: mensual hasta los 11 meses, bimestral de 12-23 meses.",
            "Reforzar alimentación complementaria rica en hierro (sangrecita, hígado, leguminosas).",
            "Control en 3 meses para verificar niveles de hemoglobina.",
            "Consejería nutricional a la madre o cuidador principal.",
        ],
    },
    "AnemiaLeve": {
        "title": "Tratamiento ambulatorio – Anemia Leve",
        "items": [
            "Iniciar suplementación terapéutica con hierro elemental: 3 mg/kg/día vía oral.",
            "Administrar en ayunas o entre comidas, alejado de lácteos y té.",
            "Control hematológico en 30 días para evaluar respuesta al tratamiento.",
            "Reforzar orientación alimentaria: consumo diario de alimentos fuente de hierro hemínico.",
            "Activar programa SIS para cobertura de suplementos si no cuenta con ellos.",
            "Registrar en sistema SIEN/HIS del establecimiento de salud.",
        ],
    },
    "AnemiaModerada": {
        "title": "Tratamiento prioritario – Anemia Moderada",
        "items": [
            "Suplementación terapéutica intensiva: hierro elemental 4–6 mg/kg/día vía oral.",
            "Evaluar tolerancia gástrica; si hay intolerancia considerar fraccionamiento de dosis.",
            "Control hematológico estricto a los 30 y 60 días.",
            "Descartar parasitosis intestinal; solicitar examen parasitológico.",
            "Notificación al coordinador de estrategia CRED del establecimiento.",
            "Referencia a médico especialista si no hay respuesta tras 30 días de tratamiento.",
            "Evaluar necesidad de consejería familiar intensiva y visita domiciliaria.",
        ],
    },
    "AnemiaSevera": {
        "title": "Atención urgente – Anemia Severa",
        "items": [
            "REFERENCIA INMEDIATA al Hospital o Centro de Salud II-2 / III.",
            "Evaluación médica urgente para determinar etiología (hemolítica, nutricional, parasitaria).",
            "Considerar hospitalización según estado clínico y tolerancia oral.",
            "Evaluación pediátrica para posible transfusión si Hbc < 7 g/dL con compromiso hemodinámico.",
            "Notificación obligatoria en el sistema de vigilancia epidemiológica de Puno.",
            "Coordinación con programa Juntos y SIS para acompañamiento familiar.",
            "Seguimiento post-alta con control en 15 días.",
        ],
    },
}

_SYSTEM_INSTRUCTION = (
    "Eres un asistente clínico de apoyo para anemia infantil en zonas altoandinas de "
    "Puno (Perú), guiado por los lineamientos MINSA-CRED. Generas recomendaciones "
    "REFERENCIALES, nunca un diagnóstico definitivo ni prescripción cerrada. Escribe en "
    "español claro y conciso, orientado al personal de salud del primer nivel."
)


def _flag(case: Dict[str, Any], key: str) -> str:
    return "sí" if case.get(key) in (1, "1", True) else "no"


def _build_prompt(prediction: Dict[str, Any], case: Dict[str, Any],
                  expl: Dict[str, Any]) -> str:
    dx = prediction.get("diagnosis_label", "Normal")
    prob = prediction.get("probability")
    hbc = prediction.get("hbc") or case.get("Hbc")
    edad = case.get("EdadMeses")
    sexo = "niña" if str(case.get("Sexo")) == "F" else "niño"
    alt = case.get("AlturaREN")
    hb = case.get("Hemoglobina")
    top = expl.get("top_factor") if isinstance(expl, dict) else None

    lineas = [
        f"Caso: {sexo} de {edad} meses en Puno (altitud {alt} m.s.n.m.).",
        f"Hemoglobina observada: {hb} g/dL; corregida por altitud (Hbc): {hbc} g/dL.",
        f"Diagnóstico estimado por el modelo: {dx}"
        + (f" (confianza {prob}%)." if prob is not None else "."),
        f"Cobertura — controles CRED: {_flag(case, 'Cred')}; "
        f"suplementación de hierro: {_flag(case, 'Suplementacion')}; "
        f"seguro SIS: {_flag(case, 'SIS')}; programa Juntos: {_flag(case, 'Juntos')}.",
    ]
    if top:
        lineas.append(f"Factor más influyente (XAI): {top}.")
    lineas.append(
        "\nRedacta recomendaciones breves y accionables acordes al diagnóstico y a la "
        "cobertura del paciente. Devuelve EXACTAMENTE este formato, sin texto extra:\n"
        "Título: <título corto>\n- <recomendación 1>\n- <recomendación 2>\n"
        "- <recomendación 3>\n(La cantidad de viñetas depende del diagnostico, implementa las mejore recomendaciones con una pequeña justificación en cada una)."
    )
    return "\n".join(lineas)


def _parse_response(text: str) -> Optional[Dict[str, Any]]:
    """Extrae título y viñetas del texto del modelo. Devuelve None si no hay viñetas."""
    title: Optional[str] = None
    items: List[str] = []
    for raw in text.splitlines():
        s = raw.strip()
        if not s:
            continue
        low = s.lower()
        if low.startswith("título:") or low.startswith("titulo:"):
            title = s.split(":", 1)[1].strip()
        elif s[0] in "-•*":
            item = s.lstrip("-•* ").strip()
            if item:
                items.append(item)
        elif title is None:
            title = s
    if not items:
        return None
    return {"title": title or "Recomendación clínica", "items": items[:4]}


class RecommendationAgent(Agent):
    name = "recommendation_agent"
    description = "Genera recomendaciones referenciales con IA (Gemini) o reglas MINSA."

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        prediction = context.get("prediction") or {}
        code = prediction.get("diagnosis_code", "Normal")
        case = context.get("case", {})
        expl = context.get("explainability") or {}

        title: str
        items: List[str]
        source: str
        engine: str

        parsed = None
        if is_configured():
            prompt = _build_prompt(prediction, case, expl)
            text, model_used = generate_text(prompt, system=_SYSTEM_INSTRUCTION)
            if text:
                parsed = _parse_response(text)

        if parsed:
            title = parsed["title"]
            items = parsed["items"]
            source = "Generado por IA (Gemini) · referencial"
            engine = f"gemini:{model_used}"
        else:
            rec = FALLBACK_RECOMMENDATIONS.get(code, FALLBACK_RECOMMENDATIONS["Normal"])
            title = rec["title"]
            items = rec["items"]
            source = "MINSA · Estrategia CRED (referencial)"
            engine = "fallback"

        result = {
            "_message": f"Recomendación generada ({engine}): {title}.",
            "diagnosis_code": code,
            "title": title,
            "color": COLOR_BY_CODE.get(code, "green"),
            "items": items,
            "source": source,
            "engine": engine,
        }
        context["recommendation"] = result
        return result
