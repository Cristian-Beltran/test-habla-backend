// src/app/session/dtos/create-test.dto.ts
import { IsNumber, Min, Max, IsString, MaxLength } from 'class-validator';

export class CreateTestDto {
  @IsString()
  @MaxLength(5000)
  inputText: string; // texto de referencia

  @IsString()
  @MaxLength(5000)
  userText: string; // texto del usuario / transcripción

  @IsNumber()
  @Min(0)
  @Max(10)
  score: number;

  @IsString()
  @MaxLength(5000)
  aiComment: string;
}
