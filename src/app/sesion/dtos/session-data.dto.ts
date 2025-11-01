// src/app/session/dtos/session-data.dto.ts
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class IngestSessionDto {
  @IsString()
  serialNumber: string;

  // Epoch opcional en ms; prioridad menor que recordedAt
  @IsOptional()
  @IsInt()
  ts?: number;

  // === Presión (voltaje) ===
  @IsOptional()
  @IsNumber()
  pressureVolt?: number;

  // === Cardiaco / SpO2 ===
  @IsOptional()
  @IsNumber()
  bpm?: number;

  @IsOptional()
  @IsNumber()
  spo2?: number;

  // ISO opcional; tiene prioridad sobre ts
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
