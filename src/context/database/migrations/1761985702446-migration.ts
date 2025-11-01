import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761985702446 implements MigrationInterface {
    name = 'Migration1761985702446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" DROP CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c"`);
        await queryRunner.query(`CREATE TABLE "tests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" double precision NOT NULL, "aiComment" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid, CONSTRAINT "PK_4301ca51edf839623386860aed2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_tests_created_at" ON "tests" ("createdAt") `);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "lungCapacity"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "pulse"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "oxygenSaturation"`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "pressureVolt" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "bpm" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "spo2" double precision`);
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" DROP DEFAULT`);
        await queryRunner.query(`CREATE INDEX "idx_session_data_recorded_at" ON "session_data" ("recordedAt") `);
        await queryRunner.query(`ALTER TABLE "tests" ADD CONSTRAINT "FK_cb1362ec1cce3209129a07b73ee" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_data" DROP CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c"`);
        await queryRunner.query(`ALTER TABLE "tests" DROP CONSTRAINT "FK_cb1362ec1cce3209129a07b73ee"`);
        await queryRunner.query(`DROP INDEX "public"."idx_session_data_recorded_at"`);
        await queryRunner.query(`ALTER TABLE "session_data" ALTER COLUMN "recordedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "spo2"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "bpm"`);
        await queryRunner.query(`ALTER TABLE "session_data" DROP COLUMN "pressureVolt"`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "oxygenSaturation" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "pulse" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD "lungCapacity" double precision NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."idx_tests_created_at"`);
        await queryRunner.query(`DROP TABLE "tests"`);
        await queryRunner.query(`ALTER TABLE "session_data" ADD CONSTRAINT "FK_3f0a377247128b3d22355f0bc0c" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
