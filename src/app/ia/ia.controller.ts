import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IaService } from './ia.service';
import { CompareSpeechDto, EvaluateIaDto } from './ia.dto'; // <-- importa el DTO exportado

@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('evaluate')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype?.startsWith('audio/') ||
          ['video/mp4', 'application/octet-stream'].includes(file.mimetype);
        cb(
          ok ? null : new BadRequestException('Formato de audio no soportado'),
          ok,
        );
      },
    }),
  )
  async evaluate(
    @Body() body: EvaluateIaDto, // <-- ahora sí pasa whitelist
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio)
      throw new BadRequestException('El archivo de "audio" es requerido');

    const result = await this.iaService.evaluateSpeech({
      targetText: body.text,
      audio,
    });

    return result;
  }
  @Post('compare')
  async compare(@Body() body: CompareSpeechDto) {
    const result = await this.iaService.compareSpeechProgress({
      previousText: body.previousText,
      currentText: body.currentText,
    });

    return result;
  }
}
