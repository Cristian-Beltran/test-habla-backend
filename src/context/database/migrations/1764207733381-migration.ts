import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1764207733381 implements MigrationInterface {
    name = 'Migration1764207733381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tests" ADD "inputText" text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "tests" ADD "userText" text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "userText"`);
        await queryRunner.query(`ALTER TABLE "tests" DROP COLUMN "inputText"`);
    }

}
