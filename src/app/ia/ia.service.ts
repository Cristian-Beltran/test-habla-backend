// ----------------------------- src/ia/ia.service.ts -----------------------------
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

export interface SpeechEvalResult {
  transcript: string;
  score: number;
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
}
