import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { create } from "domain";
import { connect } from "http2";
import { P } from "vitest/dist/global-58e8e951";
import { typedBoolean } from "~/utils/misc";

import { createUser, createContactInfo, createPassword, createTrail } from "./seed-utils";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding the database... 🌱");
  console.time(`Database has been seeded... 🌱`);
  // cleanup the existing database
  console.time("Cleaned up the database... 🧹");
  await prisma.user.deleteMany({ where: {} });
  await prisma.admin.deleteMany({ where: {} });
  await prisma.hiker.deleteMany({ where: {} });
  await prisma.sherpa.deleteMany({ where: {} });
  await prisma.trail.deleteMany({ where: {} });
  await prisma.hike.deleteMany({ where: {} });
  await prisma.adventure.deleteMany({ where: {} });
  await prisma.chat.deleteMany({ where: {} });

  console.timeEnd("Cleaned up the database... 🧹");

  console.time("Created Trails... 🚶‍♀️");
  const allTrails = await Promise.all(
    Array.from({ length: 30 }, async () => {
      const routeType = faker.helpers.arrayElement(["loop", "out-and-back"]) as "loop" | "out-and-back";
      const newTrail = await createTrail("https://api.3geonames.org/randomland.us.json");
      let name =  newTrail.name? newTrail.name : `${faker.animal.type()} ${faker.word.noun()}`;
      name = routeType === "loop" ? `${name} Loop` : `${name} Trail` ;
      const trail = await prisma.trail.create({
        data: {
          name,
          description: faker.lorem.paragraph(1),
          lat: newTrail.lat,
          long: newTrail.long,
          routeType,
          distance: faker.datatype.number({ min: 1, max: 20 }),
          elevation: Number(newTrail.elevation),
        },
      });
      return trail;
    })
  );
  console.timeEnd("Created Trails... 🚶‍♀️");

  console.time("Created Users ... 👤");
  const totalUsers = 100;

  const users = await Promise.all(
    Array.from({ length: totalUsers }, async () => {
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
        },
      });
      return user;
    })
  );

  console.timeEnd("Created Users ... 👤");

  console.time("Created Admins... 👩‍💼");
  const totalAdmins = Math.floor(totalUsers * 0.1);
  const adminIds = users.slice(0, totalAdmins).map((user) => user.id);
  const admins = Promise.all(
    adminIds.map(async (id) => {
      const admin = await prisma.admin.create({
        data: {
          userId: id,
        },
      });
      return admin;
    })
  );
  console.timeEnd("Created Admins... 👩‍💼");

  console.time("Created Hikers... 🥾");
  const totalHikers = Math.floor(totalUsers * 0.6);
  const hikerIds = users
    .slice(totalAdmins, totalAdmins + totalHikers)
    .map((user) => user.id);

  const hikers = Promise.all(
    hikerIds.map(async (id) => {
      const hiker = await prisma.hiker.create({
        data: {
          userId: id,
          bio: faker.lorem.paragraph(1),
        },
      });

      return hiker;
    })
  );

  console.timeEnd("Created Hikers... 🥾");

  const totalSherpas = Math.floor(
    totalUsers - totalAdmins - totalHikers + totalHikers * 0.15
  );
  console.time(`Created ${totalSherpas} Sherpas... 🧗‍♀️`);
  const sherpaIds = users.slice(totalSherpas).map((user) => user.id);
  const sherpas = Promise.all(
    sherpaIds.map(async (id) => {
      const newSherpa = await prisma.sherpa.create({
        data: {
          userId: id,
          bio: faker.lorem.sentence(2),
        },
      });
      const totalSherpaTrails = faker.datatype.number({ min: 1, max: 10 });
      const sherpaTrails = await Promise.all(
        Array.from({ length: totalSherpaTrails }, async () => {
          const trailId = faker.helpers.arrayElement(allTrails).id;
          const newSherpaTrail = await prisma.sherpaTrail.create({
            data: {
              trailId,
              sherpaId: id,
            },
          });
          return newSherpaTrail;
        })
      );
      return newSherpa;
    })
  );

  console.timeEnd(`Created ${totalSherpas} Sherpas... 🧗‍♀️`);

  console.time("Created Hikes... 🥾");
  const hikes = await Promise.all(
    await (
      await hikers
    ).map(async (hiker) => {
      const hikerId = hiker.userId;
      const trailId = faker.helpers.arrayElement(allTrails).id;
      const totalHikerHikes = faker.datatype.number({ min: 1, max: 10 });

      const hikerHikes = await Promise.all(
        Array.from({ length: totalHikerHikes }, async () => {
          await prisma.hike.create({
            data: {
              hikerId,
              trailId,
              date: faker.date.past(),
              imageUrl: faker.image.nature(),
              review: faker.lorem.paragraph(1),
              rating: faker.datatype.number({ min: 1, max: 5 }),
            },
          });
        })
      );
      return hikerHikes;
    })
  );
  console.timeEnd("Created Hikes... 🥾");

  // console time Adventures
  console.time("Created Adventures... 🏕");
  const oneDay = 1000 * 60 * 60 * 24;
  const sherpasWithAdventures = faker.helpers.arrayElements(
    (await sherpas).flatMap((sherpa) => sherpa),
    20
  );
  const hikersWithAdventures = faker.helpers.arrayElements(await hikers, 30);

  const adventures = await Promise.all(
    await hikersWithAdventures.map(async (curHiker) => {
      const hikerId = curHiker.userId;
      const trailId = faker.helpers.arrayElement(allTrails).id;
      const hasPastAdventures = faker.datatype.boolean();
      const hasPresentAdventures = faker.datatype.boolean();
      const hasFutureAdventures = faker.datatype.boolean();

      const dates = [
        hasPastAdventures && {
          startDate: new Date(
            Date.now() - oneDay * faker.datatype.number({ min: 20, max: 50 })
          ),
          endDate: new Date(
            Date.now() - oneDay * faker.datatype.number({ min: 1, max: 5 })
          ),
          sherpa: faker.helpers.arrayElement(sherpasWithAdventures),
        },
        hasPresentAdventures && {
          startDate: new Date(
            Date.now() - oneDay * faker.datatype.number({ min: 1, max: 5 })
          ),
          endDate: new Date(
            Date.now() + oneDay * faker.datatype.number({ min: 1, max: 2 })
          ),
          sherpa: faker.helpers.arrayElement(sherpasWithAdventures),
        },
        hasFutureAdventures && {
          startDate: new Date(
            Date.now() + oneDay * faker.datatype.number({ min: 1, max: 5 })
          ),
          endDate: new Date(
            Date.now() + oneDay * faker.datatype.number({ min: 20, max: 50 })
          ),
          sherpa: faker.helpers.arrayElement(sherpasWithAdventures),
        },
      ].filter(typedBoolean);

      const hikerAdventures = await Promise.all(
        dates.map(async ({ startDate, endDate, sherpa }) => {
          const newAdventure = await prisma.adventure.create({
            data: {
              hikerId,
              trailId,
              startDate,
              endDate,
              sherpaId: sherpa.userId,
            },
          });
          return newAdventure;
        })
      );
      return hikerAdventures;
    })
  ).then((adventures) => adventures.flat());

  console.timeEnd("Created Adventures... 🏕");

  // console time Chats
  console.time("Created Chats... 💬");
  const chats = await Promise.all(
    adventures.map(async (adventure) => {
      const createdAt = faker.date.between(
        adventure.createdAt.getTime() - oneDay,
        adventure.createdAt.getTime() + oneDay
      );
      const totalMessages = faker.datatype.number({ min: 1, max: 6 });

      const chat = await prisma.chat.create({
        data: {
          users: {
            connect: [{ id: adventure.hikerId }, { id: adventure.sherpaId }],
          },
          createdAt,
          messages: {
            create:
              Array.from({ length: totalMessages }, (_, index) => {
                const sentAt = new Date(createdAt.getTime() + 1000 * 3 * index);
                return {
                  createdAt: sentAt,
                  updatedAt: sentAt,
                  content: faker.lorem.sentences(
                    faker.datatype.number({ min: 1, max: 3 })
                  ),
                  senderId: faker.datatype.boolean()
                    ? adventure.hikerId
                    : adventure.sherpaId,
                };
              })
          },
        },
      });
      return chat;
    })
  );

  console.timeEnd("Created Chats... 💬");

  // console time Reviews
  console.time("Created Reviews... 📝");
  // an array of all the adventures that have ended
  const adventuresReadyToReview = adventures.filter((adventure) => {
    const today = new Date();
    return adventure.endDate.getTime() < today.getTime();
  });
  const reviews = await Promise.all(
    adventuresReadyToReview.map(async (adventure) => {
      const createdAt = faker.date.between(
        adventure.endDate.getTime() - oneDay,
        adventure.endDate.getTime() + oneDay
      );
      const hostReview =
        Math.random() > 0.3
          ? await prisma.sherpaReview.create({
              data: {
                createdAt,
                updatedAt: createdAt,
                review: faker.lorem.paragraph(
                  faker.datatype.number({ min: 1, max: 3 })
                ),
                rating: faker.datatype.number({ min: 1, max: 5 }),
                adventureId: adventure.id,
                sherpaId: adventure.sherpaId,
                hikerId: adventure.hikerId,
              },
            })
          : null;

      const hikerReview =
        Math.random() > 0.3
          ? await prisma.hikerReview.create({
              data: {
                createdAt,
                updatedAt: createdAt,
                review: faker.lorem.paragraph(
                  faker.datatype.number({ min: 1, max: 3 })
                ),
                rating: faker.datatype.number({ min: 1, max: 5 }),
                adventureId: adventure.id,
                sherpaId: adventure.sherpaId,
                hikerId: adventure.hikerId,
              },
            })
          : null;

      const hike =
        Math.random() > 0.3
          ? await prisma.hike.create({
              data: {
                createdAt,
                updatedAt: createdAt,
                hikerId: adventure.hikerId,
                review: faker.lorem.paragraph(
                  faker.datatype.number({ min: 1, max: 3 })
                ),
                rating: faker.datatype.number({ min: 1, max: 5 }),
                Adventure: {
                  connect: {
                    id: adventure.id,
                  },
                },
                trailId: adventure.trailId,
                imageUrl: faker.image.nature(),
                date: adventure.startDate,
              },
            })
          : null;

      return [hostReview, hikerReview, hike];
    })
  ).then((reviews) => reviews.flat().filter(typedBoolean));

  console.timeEnd("Created Reviews... 📝");

  console.time("Indy Created... 🐶");
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
    },
  });
  console.timeEnd("Indy Created... 🐶");

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
