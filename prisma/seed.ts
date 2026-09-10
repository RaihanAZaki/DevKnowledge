import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, KnowledgeCategory } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed the database");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@devknowledge.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: {
      name: "DevKnowledge Admin",
      email,
      passwordHash,
      role: Role.ADMIN,
      bio: "Maintains the internal developer knowledge base.",
    },
  });

    const testUsers = [
    {
      name: "Budi Santoso",
      email: "budi@devknowledge.local",
      bio: "Backend developer focused on APIs and system integration.",
    },
    {
      name: "Siti Rahma",
      email: "siti@devknowledge.local",
      bio: "Frontend developer interested in React and UI engineering.",
    },
    {
      name: "Andi Pratama",
      email: "andi@devknowledge.local",
      bio: "Software engineer working with Java and backend services.",
    },
    {
      name: "Nadia Putri",
      email: "nadia@devknowledge.local",
      bio: "Full-stack developer and technical documentation enthusiast.",
    },
    {
      name: "Fajar Ramadhan",
      email: "fajar@devknowledge.local",
      bio: "Developer interested in cloud, databases, and architecture.",
    },
  ];

  const testUserPassword = "Test123!";
  const testUserPasswordHash = await bcrypt.hash(testUserPassword, 12);

  for (const user of testUsers) {
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        bio: user.bio,
        role: Role.MEMBER,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash: testUserPasswordHash,
        role: Role.MEMBER,
        bio: user.bio,
      },
    });
  }

  const snippetCount = await prisma.codeSnippet.count();
  if (snippetCount === 0) {
    await prisma.codeSnippet.create({
      data: {
        ticketNo: "DEV-1024",
        title: "Add permission guard to task endpoint",
        description: "Example snippet showing the intended before/after knowledge format.",
        reason: "The endpoint previously did not enforce the required permission before returning task data.",
        impact: "Improves authorization consistency and reduces accidental access.",
        language: "Java",
        framework: "Quarkus",
        category: KnowledgeCategory.BACKEND,
        beforeCode: `@GET\n@Path("/tasks")\npublic Uni<List<Task>> getTasks() {\n  return taskService.getTasks();\n}`,
        afterCode: `@GET\n@Path("/tasks")\n@RequiresPermission("task_view_all")\npublic Uni<List<Task>> getTasks() {\n  return taskService.getTasks();\n}`,
        authorId: admin.id,
      },
    });
  }

  const docCount = await prisma.documentation.count();
  if (docCount === 0) {
    await prisma.documentation.create({
      data: {
        title: "JWT Authentication Flow",
        excerpt: "A concise guide to request authentication using signed JWT cookies.",
        content: `# JWT Authentication Flow\n\n1. User submits credentials.\n2. Backend validates the password.\n3. Backend signs a short-lived JWT.\n4. JWT is stored in an HttpOnly cookie.\n5. Protected API routes verify the token before serving data.\n\n## Why HttpOnly?\n\nThe browser sends the cookie automatically while JavaScript cannot read it directly.`,
        language: "TypeScript",
        category: KnowledgeCategory.BACKEND,
        tags: ["jwt", "auth", "security"],
        authorId: admin.id,
      },
    });
  }

  const forumCount = await prisma.forumThread.count();
  if (forumCount === 0) {
    await prisma.forumThread.create({
      data: {
        title: "Best way to document breaking API changes?",
        content: "How do you keep API change context discoverable without duplicating the ticket system?",
        category: KnowledgeCategory.GENERAL,
        tags: ["api", "documentation"],
        authorId: admin.id,
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
