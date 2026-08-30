-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "school" TEXT,
    "major" TEXT,
    "resumeText" TEXT,
    "portfolioText" TEXT,
    "stuckOn" TEXT,
    "creatorType" TEXT,
    "skills" TEXT,
    "neededSkills" TEXT,
    "neededRoles" TEXT,
    "motivation" TEXT,
    "availability" INTEGER,
    "rolePreference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");
