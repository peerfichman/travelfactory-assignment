import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('Requester', 'Validator')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
        "name"       VARCHAR(100) NOT NULL,
        "email"      VARCHAR(255) NOT NULL,
        "password"   VARCHAR NOT NULL,
        "role"       "user_role_enum" NOT NULL DEFAULT 'Requester',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "request_status_enum" AS ENUM ('Pending', 'Approved', 'Rejected')
    `);

    await queryRunner.query(`
      CREATE TABLE "vacation_requests" (
        "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id"    UUID NOT NULL,
        "start_date" DATE NOT NULL,
        "end_date"   DATE NOT NULL,
        "reason"     TEXT,
        "status"     "request_status_enum" NOT NULL DEFAULT 'Pending',
        "comments"   TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vacation_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vacation_requests_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vacation_requests_user_id" ON "vacation_requests" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vacation_requests_status" ON "vacation_requests" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vacation_requests"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "request_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
