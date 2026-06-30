-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetImage" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "imageData" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelClass" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabelClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "labelClassId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dataset_organizationId_idx" ON "Dataset"("organizationId");

-- CreateIndex
CREATE INDEX "DatasetImage_datasetId_idx" ON "DatasetImage"("datasetId");

-- CreateIndex
CREATE INDEX "LabelClass_datasetId_idx" ON "LabelClass"("datasetId");

-- CreateIndex
CREATE INDEX "Annotation_imageId_idx" ON "Annotation"("imageId");

-- CreateIndex
CREATE INDEX "Annotation_labelClassId_idx" ON "Annotation"("labelClassId");

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetImage" ADD CONSTRAINT "DatasetImage_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelClass" ADD CONSTRAINT "LabelClass_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "DatasetImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_labelClassId_fkey" FOREIGN KEY ("labelClassId") REFERENCES "LabelClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
