-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('ADMIN', 'WHITELIST', 'BLACKLIST');

-- CreateTable
CREATE TABLE "Urls" (
    "id" SERIAL NOT NULL,
    "urlLong" TEXT NOT NULL,
    "urlQrCode" TEXT NOT NULL,
    "urlShort" TEXT NOT NULL,
    "urlShortFull" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "checkedBy" "CheckType",
    "checkedAt" TIMESTAMP(3),
    "ipAddressHash" TEXT,

    CONSTRAINT "Urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostnames" (
    "id" SERIAL NOT NULL,
    "hostname" TEXT NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hostnames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ipaddresses" (
    "id" SERIAL NOT NULL,
    "ipAddressHash" TEXT NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT true,
    "until" TIMESTAMP(3) NOT NULL DEFAULT NOW() + interval '1 day',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ipaddresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Urls_urlLong_key" ON "Urls"("urlLong");

-- CreateIndex
CREATE UNIQUE INDEX "Urls_urlShort_key" ON "Urls"("urlShort");

-- CreateIndex
CREATE INDEX "Urls_urlLong_idx" ON "Urls"("urlLong");

-- CreateIndex
CREATE INDEX "Urls_urlShort_idx" ON "Urls"("urlShort");

-- CreateIndex
CREATE UNIQUE INDEX "Hostnames_hostname_key" ON "Hostnames"("hostname");

-- CreateIndex
CREATE INDEX "Hostnames_hostname_idx" ON "Hostnames"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "Ipaddresses_ipAddressHash_key" ON "Ipaddresses"("ipAddressHash");

-- CreateIndex
CREATE INDEX "Ipaddresses_ipAddressHash_idx" ON "Ipaddresses"("ipAddressHash");
