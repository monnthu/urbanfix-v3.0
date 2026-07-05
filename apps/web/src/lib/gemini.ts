import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiAnalysis, Report, ReportPriority } from './types';

const PRIORITIES: ReportPriority[] = ['low', 'medium', 'high', 'critical'];

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  });
}

/**
 * Multimodal image understanding. Returns strict JSON with a suggested
 * category + priority. Throws on failure so the caller can mark ai_status.
 */
export async function analyzeReportImage(
  imageBase64: string,
  mimeType: string,
  categoryIds: string[],
): Promise<AiAnalysis> {
  const model = getModel();

  const prompt = `You are triaging a civic infrastructure report photo.
Return ONLY valid minified JSON, no markdown, matching:
{"category": string, "priority": "low"|"medium"|"high"|"critical", "confidence": number, "reason": string}
- "category" MUST be one of: ${categoryIds.join(', ')}.
- "priority" reflects urgency/public-safety risk.
- "confidence" is 0..1.
- "reason" is one short sentence.`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  return parseAnalysis(result.response.text(), categoryIds);
}

function parseAnalysis(raw: string, categoryIds: string[]): AiAnalysis {
  const jsonText = raw.replace(/```json|```/g, '').trim();
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned no JSON');
  const parsed = JSON.parse(match[0]);

  const category = categoryIds.includes(parsed.category)
    ? parsed.category
    : 'other';
  const priority: ReportPriority = PRIORITIES.includes(parsed.priority)
    ? parsed.priority
    : 'medium';

  return {
    category,
    priority,
    confidence:
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
  };
}

/**
 * Answer an institution question using ONLY the provided (already scoped)
 * reports. The model never touches the database. Returns the answer text and
 * the report ids referenced.
 */
export async function answerInstitutionQuestion(
  question: string,
  reports: Report[],
): Promise<{ answer: string; referencedReportIds: string[] }> {
  const model = getModel();

  const context = reports
    .map(
      (r) =>
        `- id=${r.id} | title="${r.title}" | category=${r.category} | priority=${r.priority} | status=${r.status} | zone=${r.zone_id ?? 'n/a'} | supports=${r.support_count} | created=${r.created_at} | desc="${r.description.slice(0, 200)}"`,
    )
    .join('\n');

  const prompt = `You are an assistant for a civic institution. Answer the question using ONLY the reports listed below. If the data does not contain the answer, say so. Be concise. When you reference specific reports, cite their ids in square brackets like [id].

REPORTS:
${context || '(no reports assigned)'}

QUESTION: ${question}`;

  const result = await model.generateContent(prompt);
  const answer = result.response.text().trim();

  const referenced = reports
    .map((r) => r.id)
    .filter((id) => answer.includes(id));

  return { answer, referencedReportIds: referenced };
}
