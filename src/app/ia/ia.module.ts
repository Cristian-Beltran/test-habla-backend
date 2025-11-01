import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { IaService } from './ia.service';
import { IaController } from './ia.controller';

@Module({
  imports: [
    // Memoria por defecto; ajusta límites según tus necesidades
    MulterModule.register({
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  ],
  controllers: [IaController],
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
