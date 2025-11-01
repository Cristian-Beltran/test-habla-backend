// src/app/session/entities/test.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Patient } from '../../users/entities/patient.entity';

@Entity('tests')
@Index('idx_tests_created_at', ['createdAt'])
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  patient: Patient;

  // Nota 0–10 (permite decimales: ej. 7.5)
  @Column({ type: 'float' })
  score: number;

  // Comentario de la IA
  @Column({ type: 'text' })
  aiComment: string;

  @CreateDateColumn()
  createdAt: Date;
}
