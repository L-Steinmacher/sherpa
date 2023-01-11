/*
  Warnings:

  - Added the required column `date` to the `Hike` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trailId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "rating" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "hikerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hike_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hike_hikerId_fkey" FOREIGN KEY ("hikerId") REFERENCES "Hiker" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Hike" ("createdAt", "description", "hikerId", "id", "imageUrl", "rating", "trailId", "updatedAt") SELECT "createdAt", "description", "hikerId", "id", "imageUrl", "rating", "trailId", "updatedAt" FROM "Hike";
DROP TABLE "Hike";
ALTER TABLE "new_Hike" RENAME TO "Hike";
CREATE UNIQUE INDEX "Hike_id_key" ON "Hike"("id");
CREATE UNIQUE INDEX "Hike_trailId_key" ON "Hike"("trailId");
CREATE UNIQUE INDEX "Hike_hikerId_key" ON "Hike"("hikerId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
