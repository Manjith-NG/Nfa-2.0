import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "";

if (!url) {
  console.error("FAIL: DATABASE_URL missing in .env");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email: "faculty.cse@gcu.edu.in" },
  });
  if (!user) {
    console.error("FAIL: User not found in database");
    process.exit(1);
  }
  const ok = await bcrypt.compare("password123", user.passwordHash);
  if (!ok) {
    console.error("FAIL: Demo password hash mismatch — contact support to re-seed users");
    process.exit(1);
  }
  console.log("OK: Database connected and login password123 works");
  process.exit(0);
} catch (e) {
  console.error("FAIL: Could not connect to database\n");
  console.error(e.message);
  if (e.message?.includes("Authentication failed") || e.message?.includes("password")) {
    console.error("\n→ Wrong database password. Run: node scripts/setup-env.mjs YOUR_PASSWORD");
  } else if (e.message?.includes("Can't reach")) {
    console.error("\n→ Check internet / Supabase project is not paused");
  }
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
