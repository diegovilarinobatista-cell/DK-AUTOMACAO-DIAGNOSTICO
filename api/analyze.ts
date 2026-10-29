// Vercel serverless function: POST /api/analyze
// - Requires a logged-in Supabase user (Bearer token).
// - If ANTHROPIC_API_KEY is not configured, answers { mode: 'demo' } and the app
//   falls back to its built-in rules engine (zero cost).

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bhdsltfpwzjnzcgpeyfn.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hCePSOLP4DW8d8aEL0UTqQ_MGvToCcO';

const LANG_NAMES: Record<string, string> = {
  pt: 'português do Brasil', en: 'English', es: 'español', de: 'Deutsch', fr: 'français', it: 'italiano', zh: '中文', ja: '日本語',
};

const SYSTEM_PROMPT = `Eres el asistente de diagnóstico de averías industriales de DK Automação Industrial. Ayudas a técnicos de mantenimiento con PLC, variadores de frecuencia, HMI, motores, servos, robots, neumática y cuadros eléctricos.

REGLAS DE SEGURIDAD (obligatorias):
1. Eres un asistente de diagnóstico: NUNCA afirmes una causa definitiva sin evidencia en los datos recibidos.
2. NUNCA inventes códigos de error, parámetros, tensiones, valores, modelos, componentes ni causas. Si no conoces con certeza el significado de un código para ese fabricante y modelo, dilo y pide el manual o más datos.
3. El campo "analisis" separa siempre la información en cuatro secciones, con títulos en MAYÚSCULAS traducidos al idioma de respuesta:
   DATO CONFIRMADO: solo lo que el técnico ha dicho o se ve en la foto.
   HIPÓTESIS: causas posibles, ordenadas de más a menos probable, cada una con su motivo.
   TEST NECESARIO: pruebas concretas y seguras para confirmar o descartar cada hipótesis, en orden.
   INFORMACIÓN DESCONOCIDA: lo que falta saber y qué debe aportar el técnico.
4. Antes de cualquier prueba eléctrica recuerda: bloqueo y consignación (LOTO), esperar la descarga del bus de continua en variadores y usar el EPI adecuado. No propongas puentear protecciones ni seguridades.
5. Indica un nivel de confianza global: ALTA (datos suficientes y coherentes), MEDIA (hipótesis razonable pero falta confirmar) o BAJA (pocos datos o contradictorios).
6. Si hay resultados de pruebas, úsalos para actualizar el diagnóstico: pasa a DATO CONFIRMADO lo que las pruebas demostraron y descarta las hipótesis que no se cumplieron.
7. Si hay una foto, describe solo lo que se ve con claridad (texto del display, LEDs, estado de componentes). Si lees un código en la foto, ponlo en "codigo_visto"; si no se lee con claridad, deja "codigo_visto" vacío.
8. Claro y directo, para un técnico en planta. Sin relleno.`;

const TOOL = {
  name: 'registrar_diagnostico',
  description: 'Registra el diagnóstico estructurado de la avería.',
  input_schema: {
    type: 'object',
    properties: {
      confianza: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
      codigo_visto: { type: 'string', description: 'Código leído con claridad en la foto, o cadena vacía.' },
      analisis: { type: 'string', description: 'Texto con las 4 secciones, con saltos de línea.' },
      causa_probable: { type: 'string', description: 'Hipótesis principal en una frase (no afirmarla como definitiva).' },
      hipotesis_raiz: { type: 'string', description: 'Explicación breve del razonamiento.' },
      accion_recomendada: { type: 'string' },
      tests: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            method: { type: 'string', description: 'Cómo hacer la prueba de forma segura.' },
            expected: { type: 'string', description: 'Resultado esperado si el componente está bien.' },
          },
          required: ['title', 'description', 'method', 'expected'],
        },
      },
      plan_accion: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['Imediata', 'Corretiva', 'Preventiva'] },
            action: { type: 'string' },
            responsible: { type: 'string' },
            deadline: { type: 'string' },
          },
          required: ['type', 'action', 'responsible', 'deadline'],
        },
      },
    },
    required: ['confianza', 'codigo_visto', 'analisis', 'causa_probable', 'hipotesis_raiz', 'accion_recomendada', 'tests', 'plan_accion'],
  },
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

async function getUser(token: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return (await r.json()) as { id: string; email?: string };
}

export async function GET() {
  return json(200, { mode: process.env.ANTHROPIC_API_KEY ? 'ai' : 'demo' });
}

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'unauthorized' });
  const user = await getUser(token);
  if (!user) return json(401, { error: 'unauthorized' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(200, { mode: 'demo' });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: 'invalid json' }); }

  const s = (v: unknown, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
  const lang = LANG_NAMES[s(body.lang, 5)] || LANG_NAMES.pt;
  const tests = Array.isArray(body.tests) ? body.tests.slice(0, 30) : [];
  const testsText = tests
    .filter((t: any) => t && t.result && t.result !== 'untested')
    .map((t: any) => `- ${s(t.title, 200)}: ${t.result === 'ok' ? 'OK (normal)' : 'FALLÓ (anormal)'}`)
    .join('\n');

  const text = `Analiza esta avería. Responde en ${lang}.

Máquina: ${s(body.machineName, 200) || '(no informado)'}
Fabricante: ${s(body.manufacturer, 200) || '(no informado)'}
Modelo: ${s(body.model, 200) || '(no informado)'}
Tipo: ${s(body.machineType, 200) || '(no informado)'}
Código de error: ${s(body.errorCode, 200) || '(no informado)'}

Descripción del problema:
${s(body.symptom) || '(no informado)'}

Resultados de pruebas ya realizadas:
${testsText || '(ninguna todavía)'}`;

  const content: any[] = [];
  const img = s(body.image, 6_000_000);
  const m = img.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (m) content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
  content.push({ type: 'text', text });

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!r.ok) {
    const detail = await r.text();
    console.error('anthropic error', r.status, detail.slice(0, 500));
    return json(502, { error: 'ai_unavailable', status: r.status });
  }
  const data: any = await r.json();
  const out = (data.content || []).find((c: any) => c.type === 'tool_use')?.input;
  if (!out) return json(502, { error: 'ai_no_output' });

  return json(200, { mode: 'ai', result: out });
}
