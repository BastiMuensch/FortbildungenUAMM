CREATE TABLE "BdbUnterschrift" (
    "userId" TEXT NOT NULL,
    "bildPng" BYTEA NOT NULL,
    "aktualisiertAm" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "BdbUnterschrift_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "BdbUnterschrift_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
