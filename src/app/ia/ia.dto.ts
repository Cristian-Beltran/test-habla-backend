import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class EvaluateIaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000) // ajusta si quieres
  text!: string;
}

export class CompareSpeechDto {
  @IsString()
  @MaxLength(10000)
  previousText: string; // texto transcrito de la sesión "antes"

  @IsString()
  @MaxLength(10000)
  currentText: string; // texto transcrito de la sesión "después"
}
