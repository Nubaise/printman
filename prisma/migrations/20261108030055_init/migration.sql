-- CreateEnum
CREATE TYPE "PrintType" AS ENUM ('BW', 'COLOR');

-- CreateEnum
CREATE TYPE "PrinterReliability" AS ENUM ('HIGH', 'LOW');

-- CreateEnum
CREATE TYPE "PrinterStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "printers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PrintType" NOT NULL,
    "speed" INTEGER NOT NULL,
    "reliability" "PrinterReliability" NOT NULL,
    "status" "PrinterStatus" NOT NULL DEFAULT 'ACTIVE',
    "single_sided" BOOLEAN NOT NULL DEFAULT true,
    "double_sided" BOOLEAN NOT NULL DEFAULT false,
    "color" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "printers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "roll_number" TEXT NOT NULL,
    "printer_id" TEXT NOT NULL,
    "booking_date" DATE NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "pages" INTEGER NOT NULL,
    "copies" INTEGER NOT NULL,
    "type" "PrintType" NOT NULL,
    "double_sided" BOOLEAN NOT NULL DEFAULT false,
    "binding" BOOLEAN NOT NULL DEFAULT false,
    "duration_minutes" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_booking_date_printer_id_idx" ON "bookings"("booking_date", "printer_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_printer_id_fkey" FOREIGN KEY ("printer_id") REFERENCES "printers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
