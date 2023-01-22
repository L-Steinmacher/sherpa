import type * as P from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

export function createContactInfo(): Omit<
  P.ContactInfo,
  "id" | "userId" | "createdAt" | "updatedAt"
> {
  return {
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.address.streetAddress(),
    city: faker.address.city(),
    state: faker.address.state(),
    zip: faker.address.zipCode(),
    country: faker.address.country(),
  };
}

export function createUser(): Omit<P.User, "id" | "createdAt" | "updatedAt"> {
  const gender = faker.helpers.arrayElement([`male`, `female`]) as
    | "male"
    | "female";
  const firstName = faker.name.firstName(gender);
  const lastName = faker.name.lastName();

  const username = faker.helpers.unique(faker.internet.userName, [
    firstName.toLocaleLowerCase(),
    lastName.toLocaleLowerCase(),
  ]);

  const avatarGender = gender === "female" ? "women" : "men";
  const avatarIndex = faker.datatype.number({ min: 0, max: 99 });
  const avatarUrl = `https://randomuser.me/api/portraits/${avatarGender}/${avatarIndex}.jpg`;

  return {
    username,
    name: `${firstName} ${lastName}`,
    email: `${username}@example.com`,
    imageUrl: avatarUrl,
  };
}

export function createPassword(
  username: string = faker.internet.userName()
): Omit<P.Password, "id" | "userId" | "createdAt" | "updatedAt"> {
  return { hash: bcrypt.hashSync(username, 10) };
}
