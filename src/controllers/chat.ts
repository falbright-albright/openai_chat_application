import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { ContextVariables } from "../constants";
import type {
  DBChat,
  DBCreateChat,
  DBCreateMessage,
  DBMessage,
} from "../models/db";
import type { IDatabaseResource } from "../storage/types";
import { generateMessageResponse } from "../integrations/generate_message";

export const CHAT_PREFIX = "/chat/";
const CHAT_ROUTE = "";
const CHAT_MESSAGE_ROUTE = ":id/message/";

const idSchema = z.object({
  id: z.string().min(1),
});
const chatSchema = z.object({
  name: z.string().min(1),
});
const messageSchema = z.object({
  message: z.string().min(1),
});

export function createChatApp(
  chatResource: IDatabaseResource<DBChat, DBCreateChat>,
  messageResource: IDatabaseResource<DBMessage, DBCreateMessage>,
) {
  const chatApp = new Hono<ContextVariables>();

  chatApp.post(CHAT_ROUTE, zValidator("json", chatSchema), async (c) => {
    const userId = c.get("userId"); // userId is set by attachUserId middleware
    const { name } = c.req.valid("json"); // name of chat
    const data = await chatResource.create({ name, ownerId: userId });
    return c.json({ data });
  });

  chatApp.get(CHAT_ROUTE, async (c) => {
    const userId = c.get("userId"); // userId is set by attachUserId middleware
    const data = await chatResource.findAll({ ownerId: userId });
    return c.json({ data });
  });

  chatApp.get(CHAT_MESSAGE_ROUTE, zValidator("param", idSchema), async (c) => {
    const { id: chatId } = c.req.param();
    const data = await messageResource.findAll({ chatId });
    return c.json({ data });
  });

  chatApp.post(
    CHAT_MESSAGE_ROUTE,
    zValidator("param", idSchema),
    zValidator("json", messageSchema),
    async (c) => {
      const { id: chatId } = c.req.valid("param");
      const { message } = c.req.valid("json");
      const userMessage: DBCreateMessage = { message, chatId, type: "user" };
      await messageResource.create(userMessage);

      const allMessage = await messageResource.findAll({ chatId });
      const response = await generateMessageResponse(allMessage);
      const responseMessage: DBCreateMessage = {
        message: response,
        chatId,
        type: "user",
      };
      const data = await messageResource.create(responseMessage);
      const res = { data };
      if (c.get("cache")) {
        c.get("cache").clearPath(c.req.path);
      }
      return c.json(res);
    },
  );
  return chatApp;
}
