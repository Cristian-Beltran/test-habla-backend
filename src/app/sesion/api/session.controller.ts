// src/app/session/controllers/session.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { IngestSessionDto } from '../dtos/session-data.dto';
import { CreateTestDto } from '../dtos/create-test.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly service: SessionService) {}

  /**
   * Ingesta de una muestra desde el ESP32
   * (crea o continúa la sesión del día según el dispositivo).
   */
  @Post('ingest')
  ingest(@Body() dto: IngestSessionDto) {
    return this.service.ingest(dto);
  }

  /**
   * Listar todas las sesiones de un paciente con sus datos.
   */
  @Get('patient/:patientId')
  listAllByPatient(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.service.listAllByPatient(patientId);
  }

  /**
   * Listar todas las sesiones del sistema.
   */
  @Get()
  async listAll() {
    return this.service.listAll();
  }

  // ========================================
  //                TESTS
  // ========================================

  /**
   * Crear un test para un paciente (nota + comentario IA).
   */
  @Post('patient/:patientId/tests')
  async createTest(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() dto: CreateTestDto,
  ) {
    return this.service.createTest(patientId, dto);
  }

  /**
   * Listar todos los tests de un paciente.
   */
  @Get('patient/:patientId/tests')
  async listTests(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.service.listTestsByPatient(patientId);
  }

  /**
   * Obtener un test específico de un paciente.
   */
  @Get('patient/:patientId/tests/:testId')
  async getTest(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('testId', new ParseUUIDPipe()) testId: string,
  ) {
    return this.service.getTest(patientId, testId);
  }
}
