// ----------------------------- src/ia/ia.service.ts -----------------------------
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

export interface SpeechEvalResult {
  transcript: string;
  score: number;
  comment: string;
}

export interface SpeechProgressResult {
  previousScore: number;
  currentScore: number;
  delta: number;
  improved: boolean;
  comment: string;
}

@Injectable()
export class IaService {
  private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly evalModel = process.env.OPENAI_EVAL_MODEL || 'gpt-4o-mini';
  private readonly transcribeModel =
    process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';

  /**
   * Flujo: 1) Transcribir audio → 2) Evaluar texto vs transcripción
   */
  async evaluateSpeech({
    targetText,
    audio,
  }: {
    targetText: string;
    audio: Express.Multer.File;
  }): Promise<SpeechEvalResult> {
    try {
      const transcript = await this.transcribeAudio(audio);
      const { score, comment } = await this.askModelForEvaluation({
        targetText,
        transcript,
      });
      return { transcript, score, comment };
    } catch (err: any) {
      throw new InternalServerErrorException(
        err?.message || 'Fallo al evaluar el audio',
      );
    }
  }

  /** Transcripción del audio con Whisper */
  private async transcribeAudio(audio: Express.Multer.File): Promise<string> {
    const file = await toFile(audio.buffer, audio.originalname, {
      type: audio.mimetype || 'audio/mpeg',
    });

    const res = await this.client.audio.transcriptions.create({
      file,
      model: this.transcribeModel,
      // language: 'es', // descomenta si quieres forzar español
    } as any);

    return (res as any).text || (res as any).transcript || '';
  }

  private async askModelForEvaluation({
    targetText,
    transcript,
  }: {
    targetText: string;
    transcript: string;
  }): Promise<{ score: number; comment: string }> {
    const systemPrompt = `
  Eres un terapeuta del habla especializado en tartamudez.
  Compara el TEXTO ORIGINAL con la TRANSCRIPCIÓN de la grabación y devuelve:
  - Una calificación numérica de 0 a 100 según fluidez, pronunciación y ritmo.
  - Un comentario breve y profesional (1 párrafo) con tono alentador.

  Responde exclusivamente en JSON válido con las claves:
  { "score": número, "comment": texto }.
  Ejemplo:
  {"score": 86, "comment": "Buena articulación y ritmo natural, solo pequeñas pausas en las oraciones largas."}
    `;

    const userPrompt = `
  TEXTO ORIGINAL:
  ${targetText}

  TRANSCRIPCIÓN:
  ${transcript}
    `;

    const response = await this.client.responses.create({
      model: this.evalModel,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw =
      (response as any).output_text ||
      (response as any).output?.[0]?.content?.[0]?.text ||
      '{}';

    try {
      const parsed = JSON.parse(raw);
      return {
        score: Number(parsed.score) || 0,
        comment: parsed.comment || 'Sin comentario generado.',
      };
    } catch {
      return {
        score: 0,
        comment: 'No se pudo interpretar la respuesta del modelo.',
      };
    }
  }

  async compareSpeechProgress(params: {
    previousText: string;
    currentText: string;
  }): Promise<SpeechProgressResult> {
    const { previousText, currentText } = params;

    try {
      const systemPrompt = `
  Eres un terapeuta del habla especializado en tartamudez.
  Vas a comparar DOS TRANSCRIPCIONES de la misma persona en momentos distintos.

  Objetivo:
  - Evaluar cada transcripción con una calificación de 0 a 100 según fluidez, continuidad del discurso, presencia de bloqueos y repeticiones.
  - Indicar si en la segunda transcripción hay mejora, empeoramiento o se mantiene igual.
  - Dar un comentario corto, profesional y alentador (máx. 2–3 frases).

  Responde EXCLUSIVAMENTE en JSON válido, SIN texto adicional, con las claves:
  {
    "previousScore": number,
    "currentScore": number,
    "delta": number,
    "improved": boolean,
    "comment": string
  }
      `.trim();

      const userPrompt = `
  TRANSCRIPCIÓN ANTERIOR:
  ${previousText}

  TRANSCRIPCIÓN ACTUAL:
  ${currentText}
      `.trim();

      // 🔁 CAMBIO CLAVE: usar chat.completions con response_format json_object
      const response = await this.client.chat.completions.create({
        model: this.evalModel, // gpt-4o-mini soporta response_format
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const raw = response.choices?.[0]?.message?.content?.trim() ?? '{}';

      // Opcional: log para depurar si algo va mal en futuro
      // console.log('compareSpeechProgress raw:', raw);

      const parsed = JSON.parse(raw);

      const previousScore = Number(parsed.previousScore);
      const currentScore = Number(parsed.currentScore);

      const safePrev = Number.isFinite(previousScore) ? previousScore : 0;
      const safeCurr = Number.isFinite(currentScore) ? currentScore : 0;

      const delta =
        typeof parsed.delta === 'number' ? parsed.delta : safeCurr - safePrev;

      const improved =
        typeof parsed.improved === 'boolean' ? parsed.improved : delta > 0;

      return {
        previousScore: safePrev,
        currentScore: safeCurr,
        delta,
        improved,
        comment:
          typeof parsed.comment === 'string' && parsed.comment.trim().length
            ? parsed.comment.trim()
            : 'Comparación generada, sin comentario descriptivo adicional.',
      };
    } catch (err: any) {
      // Si por alguna razón el modelo igual devuelve algo raro, lo ves en logs
      console.error('Error en compareSpeechProgress:', err?.message, err);
      throw new InternalServerErrorException(
        err?.message || 'Fallo al comparar las transcripciones',
      );
    }
  }
}
