// src/app/session/dtos/create-test.dto.ts
import { IsNumber, Min, Max, IsString, MaxLength } from 'class-validator';

export class CreateTestDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  score: number;

  @IsString()
  @MaxLength(5000)
  aiComment: string;
}
