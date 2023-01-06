import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { createUser, createContactInfo, createPassword } from "./seed-utils";


const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding the database... 🌱')
  console.time(`Database has been seeded... 🌱`)
  // cleanup the existing database
  console.time('Cleaned up the database... 🧹')
  await prisma.user.deleteMany({where: {}});
  await prisma.admin.deleteMany({where: {}});
  await prisma.hiker.deleteMany({where: {}});
  await prisma.sherpa.deleteMany({where: {}});
  await prisma.trail.deleteMany({where: {}});
  await prisma.hike.deleteMany({where: {}});
  await prisma.adventure.deleteMany({where: {}});
  await prisma.chat.deleteMany({where: {}});

  console.timeEnd('Cleaned up the database... 🧹')

  console.time('Created Trails... 🚶‍♀️')
  const trails = await Promise.all(
    Array.from({ length: 100 }, async () => {
      const trail = await prisma.trail.create({
        data: {
          name: faker.lorem.words(),
          description: faker.lorem.paragraph(1),
          latitude: Number(faker.address.latitude()),
          longitude: Number(faker.address.longitude()),
          routeType: faker.helpers.arrayElement(['Easy', 'Moderate', 'Hard']),
          length: faker.datatype.number({min: 1, max: 20}),
          elevation: faker.datatype.number({min: 100, max: 10000}),
        },
      })
      return trail;
    })
  )
  console.timeEnd('Created Trails... 🚶‍♀️')
  // create 200 users in a function using seed-utils
  console.time('Created Users 👤')
  const totalUsers = 200;

  const users = await Promise.all(
    Array.from({ length:totalUsers },async () => {
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
      sherpa: {
        create: {},
      },
    }
  });
  console.timeEnd('Created Users.. 👤')

  console.time('Creating Hikers... 🥾')
  const totalHikers = totalUsers * 0.9;
  const hikerIds = users.slice(0, totalHikers).map((user) => user.id);

  const hikers = Promise.all(
    hikerIds.map(async (id) => {
      const hikes = faker.datatype.number({min: 1, max: 10});

      const hiker = await prisma.hiker.create({
        data: {
          userId: id,
          bio: faker.lorem.paragraph(1),
          hikes: {
            create: await Promise.all(
              Array.from({ length: hikes }, async () => {
                return{
                  hikerId: id,
                  trailId: faker.helpers.arrayElement(trails).id,
                  description: faker.lorem.paragraph(1),
                  imageUrl: faker.image.nature(),
                  rating: faker.datatype.number({min: 1, max: 5}),
                }
              })
            )
          },
        },
        })
      return hiker;
    })
  )

  console.timeEnd('Created Hikers... 🥾')

  console.time('Created Sherpas... 🧗‍♀️')
  const sherpaIds = users.slice(0,50).map((user) => user.id);
  const sherpas = Promise.all(
    sherpaIds.map(async (id) => {
      const sherpa = await prisma.sherpa.create({
        data: {
          userId: id,
          bio: faker.lorem.paragraph(),
        },
      })
      return sherpa;
    })
  )
  console.timeEnd('Created Sherpas... 🧗‍♀️')

  console.time('Creating Admins... 👩‍💼')
  const adminIds = users.slice(0,10).map((user) => user.id);
  const admins = Promise.all(
    adminIds.map(async (id) => {
      const admin = await prisma.admin.create({
        data: {
          userId: id,
        },
      })
      return admin;
    })
  )
  console.timeEnd('Created Admins... 👩‍💼')

  // console time Adventures
  console.time('Created Adventures... 🏕')
  console.timeEnd('Created Adventures... 🏕')

  // console time Chats
  console.time('Created Chats... 💬')
  console.timeEnd('Created Chats... 💬')

  // console time Reviews
  console.time('Created Reviews... 📝')
  console.timeEnd('Created Reviews... 📝')


  console.log(`Database has been seeded... 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
