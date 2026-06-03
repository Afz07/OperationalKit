-- AlterTable
ALTER TABLE "JobLog" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "JobLog_organizationId_idx" ON "JobLog"("organizationId");

-- AddForeignKey
ALTER TABLE "JobLog" ADD CONSTRAINT "JobLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
