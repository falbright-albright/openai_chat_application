import { beforeEach, describe, expect, test } from "bun:test";
import { createInMemoryApp } from "../src/controllers/main";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { resetORMDB } from "./utils";
import { createSQLApp } from "../src/controllers/main";
import { createORMApp } from "../src/controllers/main";
import { resetSQLDB } from "./utils";

describe("chat tests", () => {
  let app = createORMApp();

  let prisma = new PrismaClient();

  // let pool = new Pool({
  //   connectionString: Bun.env.DATABASE_URL,
  // });

  beforeEach(async () => {
    await resetORMDB(prisma);
  });

  async function getToken(email = "test@test.com"): Promise<string> {
    await app.request("/api/v1/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: "password123",
        name: "Chat User",
      }),
    });
    const loginResponse = await app.request("/api/v1/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: "password123",
      }),
    });
    const token = (await loginResponse.json()).token;
    return token!;
  }

  async function createChat(token: string) {
    const createChatResponse = await app.request("/api/v1/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "Test Chat" }),
    });
    const response = await createChatResponse.json();
    const chatId = response.data.id;
    return chatId;
  }

  test("GET /chat/ - get user chats", async () => {
    const token = await getToken();
    const chatId = await createChat(token);
    const response = await app.request("/api/v1/chat/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const responseData = await response.json();
    const data = responseData.data;
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(chatId);
  });

  test("GET /chat/ - get user chats when multiple chat and users are available", async () => {
    const token = await getToken();
    const token2 = await getToken("email@email.com");
    const chatId = await createChat(token);
    const chatId2 = await createChat(token2);
    const response = await app.request("/api/v1/chat/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const responseData = await response.json();
    const data = responseData.data;
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(chatId);
    const response2 = await app.request("/api/v1/chat/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token2}` },
    });
    expect(response.status).toBe(200);
    const responseData2 = await response2.json();
    const data2 = responseData2.data;
    expect(Array.isArray(data2)).toBeTruthy();
    expect(data2.length).toBe(1);
    expect(data2[0].id).toBe(chatId2);
  });

  test("POST, GET /chat/:id/message/ - create and get chat messages", async () => {
    const token = await getToken();
    const chatId = await createChat(token);

    await app.request(`/api/v1/chat/${chatId}/message/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: "Hello World" }),
    });
    const response = await app.request(`/api/v1/chat/${chatId}/message/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const messages = await response.json();
    expect(messages.data).toBeInstanceOf(Array);
    expect(messages.data.length).toBe(2);
    expect(messages.data[0].message).toBe("Hello World");
    expect(messages.data[1].message?.length).toBeGreaterThan(0);
    console.log("Messages:", messages.data);
  });

  test("POST /chat - incorrect body", async () => {
    const token = await getToken();
    const jsonBody = {
      name: "",
    };
    const response = await app.request("/api/v1/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jsonBody),
    });
    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.error.name).toBe("ZodError");

    const parsed = JSON.parse(body.error.message);

    expect(parsed).toEqual([
      {
        code: "too_small",
        inclusive: true,
        message: "Too small: expected string to have >=1 characters",
        minimum: 1,
        origin: "string",
        path: ["name"],
      },
    ]);
  });
});
