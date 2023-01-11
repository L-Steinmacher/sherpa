-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Adventure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "trailId" TEXT NOT NULL,
    "hikerId" TEXT NOT NULL,
    "sherpaId" TEXT NOT NULL,
    "hikeId" TEXT,
    CONSTRAINT "Adventure_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Adventure_hikerId_fkey" FOREIGN KEY ("hikerId") REFERENCES "Hiker" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Adventure_sherpaId_fkey" FOREIGN KEY ("sherpaId") REFERENCES "Sherpa" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Adventure_hikeId_fkey" FOREIGN KEY ("hikeId") REFERENCES "Hike" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Adventure" ("createdAt", "endDate", "hikeId", "hikerId", "id", "sherpaId", "startDate", "trailId", "updatedAt") SELECT "createdAt", "endDate", "hikeId", "hikerId", "id", "sherpaId", "startDate", "trailId", "updatedAt" FROM "Adventure";
DROP TABLE "Adventure";
ALTER TABLE "new_Adventure" RENAME TO "Adventure";
CREATE UNIQUE INDEX "Adventure_id_key" ON "Adventure"("id");
CREATE UNIQUE INDEX "Adventure_hikeId_key" ON "Adventure"("hikeId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
