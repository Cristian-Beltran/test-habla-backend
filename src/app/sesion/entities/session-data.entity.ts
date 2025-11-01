// src/app/session/entities/session-data.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('session_data')
@Index('idx_session_data_recorded_at', ['recordedAt'])
export class SessionData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session, (s) => s.records, { onDelete: 'CASCADE' })
  session: Session;

  // === Respiración (presión como VOLTAJE) ===
  @Column('float', { nullable: true })
  pressureVolt: number | null; // Ej. 0–3.3V (filtrado en el dispositivo)

  // === Cardiaco / SpO2 ===
  @Column('float', { nullable: true })
  bpm: number | null;

  @Column('float', { nullable: true })
  spo2: number | null;

  @Column({ type: 'timestamp' })
  recordedAt: Date;
}
