// tests/user.test.ts

import db from "@/test/db-setup";

describe("User Model Tests", () => {
  beforeAll(async () => {
    await db.migrate.latest(); // Menjalankan migrasi terbaru
    await db.seed.run(); // Menjalankan seeder jika diperlukan
  });

  afterAll(async () => {
    await db.destroy(); // Menutup koneksi database setelah semua test
  });

  it("should create a new user", async () => {
    const newUser = {
      email: "test@example.com",
      password: "password",
    };

    const [userId] = await db("user").insert(newUser);
    const createdUser = await db("user").where({ id: userId }).first();

    expect(createdUser).toMatchObject(newUser);
  });

  it("should fetch a user by email", async () => {
    const email = "test@example.com";
    const user = await db("user").where({ email }).first();

    expect(user).toBeTruthy();
    expect(user.email).toBe(email);
  });

  it("should update a user's email", async () => {
    const email = "test@example.com";
    const newEmail = "updated@example.com";

    await db("user").where({ email }).update({ email: newEmail });
    const updatedUser = await db("user").where({ email: newEmail }).first();

    expect(updatedUser).toBeTruthy();
    expect(updatedUser.email).toBe(newEmail);
  });

  it("should delete a user", async () => {
    const email = "updated@example.com";
    const user = await db("user").where({ email }).first();

    await db("user").where({ id: user.id }).del();
    const deletedUser = await db("user").where({ id: user.id }).first();

    expect(deletedUser).toBeFalsy();
  });
});
