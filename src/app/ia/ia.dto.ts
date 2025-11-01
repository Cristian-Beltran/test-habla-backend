import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class EvaluateIaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000) // ajusta si quieres
  text!: string;
}
