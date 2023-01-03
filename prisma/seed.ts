import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding the database... 🌱')
  console.time('Database seeded 🌱')
  const email = "indy@sherpa.dev";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("indyiscool", 10);

  const user = await prisma.user.create({
    data: {
      username: "indy",
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
  // c

  await prisma.note.create({
    data: {
      title: "My first note",
      body: "Hello, world!",
      userId: user.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "My second note",
      body: "Hello, world!",
      userId: user.id,
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
