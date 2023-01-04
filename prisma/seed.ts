import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { createUser, createContactInfo, createPassword } from "./seed-utils";


const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding the database... 🌱')
  console.time('Database seeded 🌱')
  // cleanup the existing database
  console.time('Cleaning up the database... 🧹')
  await prisma.user.deleteMany({where: {}});
  await prisma.admin.deleteMany({where: {}});
  await prisma.hiker.deleteMany({where: {}});
  await prisma.sherpa.deleteMany({where: {}});
  await prisma.trail.deleteMany({where: {}});
  await prisma.hike.deleteMany({where: {}});
  await prisma.adventure.deleteMany({where: {}});
  await prisma.chat.deleteMany({where: {}});

  console.timeEnd('Cleaned up the database... 🧹')

  // create 200 users in a function using seed-utils
  console.time('Creating Users 👤')

  const users = await Promise.all(
    Array.from({ length: 200 },async () => {
      const userData = await createUser();
      const user = await prisma.user.create({
        data: {
          ...userData,
          contactInfo: {
            create: createContactInfo(),
          },
          password: {
            create: createPassword(userData.username),
          },
        }
      })
      return user;
    }),
    );

  const indy = createUser();

  await prisma.user.create({
    data: {
      email: "indy@dog.com",
      username: "indy",
      name: "Indy",
      imageUrl: indy.imageUrl,
      password: {
        create: {
          hash: await bcrypt.hash("indyiscool", 10),
        },
      },
      admin: {
        create: {},
      },
      hiker: {
        create: {},
      },
    }
  });
  console.timeEnd('Created Users.. 👤')

  // console Admins
  console.time('Creating Admins... 👩‍💼')

  console.timeEnd('Created Admins... 👩‍💼')

  console.time('Creating Hikers... 🥾')

  console.timeEnd('Created Hikers... 🥾')

  console.time('Creating Sherpas... 🧗‍♀️')
  console.timeEnd('Created Sherpas... 🧗‍♀️')

  console.time('Creating Trails... 🚶‍♀️')
  console.timeEnd('Created Trails... 🚶‍♀️')

  console.time('Creating Hikes... 🏔')
  console.timeEnd('Created Hikes... 🏔')

  // console time Adventures
  console.time('Creating Adventures... 🏕')
  console.timeEnd('Created Adventures... 🏕')

  // console time Chats
  console.time('Creating Chats... 💬')
  console.timeEnd('Created Chats... 💬')

  // console time Reviews
  console.time('Creating Reviews... 📝')
  console.timeEnd('Created Reviews... 📝')


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
