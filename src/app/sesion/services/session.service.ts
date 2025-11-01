// src/app/session/services/session.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { SessionData } from '../entities/session-data.entity';
import { Device } from '../../device/entities/device.entity';
import { Patient } from 'src/app/users/entities/patient.entity';
import { IngestSessionDto } from '../dtos/session-data.dto';
import { Test } from '../entities/test.entity';
import { CreateTestDto } from '../dtos/create-test.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,

    @InjectRepository(SessionData)
    private readonly dataRepo: Repository<SessionData>,

    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,

    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,

    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
  ) {}

  private dayBounds(base = new Date()) {
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async getOrCreateTodaySession(patient: Patient, device: Device) {
    const { start, end } = this.dayBounds();

    let session = await this.sessionRepo.findOne({
      where: { patient, device, startedAt: Between(start, end) },
      relations: ['patient', 'device'],
    });

    if (!session) {
      session = this.sessionRepo.create({ patient, device });
      session = await this.sessionRepo.save(session);
      session = await this.sessionRepo.findOneOrFail({
        where: { id: session.id },
        relations: ['patient', 'device'],
      });
    }
    return session;
  }

  /**
   * Ingesta UNIFICADA:
   * - Busca device por serial.
   * - Reusa/crea sesión del día.
   * - Inserta 1 registro con métricas (pressureVolt, bpm, spo2).
   */
  async ingest(dto: IngestSessionDto) {
    if (!dto?.serialNumber) {
      throw new BadRequestException('serialNumber requerido');
    }

    const hasAny =
      dto.pressureVolt !== undefined ||
      dto.bpm !== undefined ||
      dto.spo2 !== undefined;

    if (!hasAny) {
      throw new BadRequestException(
        'Debe incluir al menos una métrica (pressureVolt, bpm o spo2)',
      );
    }

    const device = await this.deviceRepo.findOne({
      where: { serialNumber: dto.serialNumber },
      relations: ['patient'],
    });
    if (!device) throw new NotFoundException('Device no encontrado');
    if (!device.patient)
      throw new BadRequestException('Device sin paciente asignado');

    const session = await this.getOrCreateTodaySession(device.patient, device);

    // recordedAt: preferencia recordedAt ISO > ts ms > now
    const recordedAt = dto.recordedAt
      ? new Date(dto.recordedAt)
      : dto.ts
        ? new Date(dto.ts)
        : new Date();

    const record = this.dataRepo.create({
      session,
      pressureVolt: dto.pressureVolt ?? null,
      bpm: dto.bpm ?? null,
      spo2: dto.spo2 ?? null,
      recordedAt,
    });

    const saved = await this.dataRepo.save(record);

    return {
      session: {
        id: session.id,
        patient: { id: session.patient.id },
        device: { id: session.device.id, serialNumber: device.serialNumber },
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
      },
      record: saved,
    };
  }

  async listAllByPatient(patientId: string) {
    const sessions = await this.sessionRepo.find({
      where: { patient: { id: patientId } },
      order: { startedAt: 'DESC' },
      relations: ['patient', 'device', 'records'],
    });
    return sessions;
  }

  async listAll(): Promise<Session[]> {
    return this.sessionRepo.find({
      relations: ['patient', 'patient.user', 'device', 'records'],
      order: { startedAt: 'DESC' },
    });
  }

  // =====================
  //        TESTS
  // =====================

  /** Crear test (independiente de sesión) para un paciente */
  async createTest(patientId: string, dto: CreateTestDto) {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    const test = this.testRepo.create({
      patient,
      score: dto.score,
      aiComment: dto.aiComment,
    });
    return this.testRepo.save(test);
  }

  /** Listar tests por paciente */
  async listTestsByPatient(patientId: string) {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    return this.testRepo.find({
      where: { patient: { id: patientId } },
      order: { createdAt: 'DESC' },
    });
  }

  /** Obtener test puntual del paciente */
  async getTest(patientId: string, testId: string) {
    const test = await this.testRepo.findOne({
      where: { id: testId, patient: { id: patientId } },
    });
    if (!test) throw new NotFoundException('Test no encontrado');
    return test;
  }
}
