-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_name" TEXT NOT NULL,
    "project_snippet" TEXT,
    "userid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Project_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Diagram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Diagram_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CodeBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "CodeBase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UMLClass" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shape" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    CONSTRAINT "UMLClass_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "Diagram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UMLAssociation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shape" TEXT NOT NULL,
    "source" INTEGER NOT NULL,
    "target" INTEGER NOT NULL,
    "label" TEXT,
    "diagramId" TEXT NOT NULL,
    CONSTRAINT "UMLAssociation_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "Diagram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visibility" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uml_classId" INTEGER NOT NULL,
    CONSTRAINT "Attribute_uml_classId_fkey" FOREIGN KEY ("uml_classId") REFERENCES "UMLClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Method" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visibility" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "uml_classId" INTEGER NOT NULL,
    CONSTRAINT "Method_uml_classId_fkey" FOREIGN KEY ("uml_classId") REFERENCES "UMLClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parameter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "methodId" INTEGER NOT NULL,
    CONSTRAINT "Parameter_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "Method" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Position" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "uml_classId" INTEGER NOT NULL,
    CONSTRAINT "Position_uml_classId_fkey" FOREIGN KEY ("uml_classId") REFERENCES "UMLClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_project_name_key" ON "Project"("project_name");

-- CreateIndex
CREATE UNIQUE INDEX "Diagram_projectId_key" ON "Diagram"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeBase_projectId_key" ON "CodeBase"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_uml_classId_key" ON "Position"("uml_classId");
