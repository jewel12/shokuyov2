import { Hono } from "hono";
import type { FC } from "hono/jsx";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import OpenAI from "openai";

const app = new Hono();

const Top: FC = () => {
  return (
    <html>
      <head>
        <title>食用</title>
        <script
          src="https://unpkg.com/htmx.org@1.9.9"
          integrity="sha384-QFjmbokDn2DjBjq+fM+8LUIVrAgqcNW2s0PjAxHETgRn9l4fvX31ZxDxvwQnyMOX"
          crossorigin="anonymous"
        ></script>
        <script src="https://unpkg.com/htmx.org/dist/ext/response-targets.js"></script>
      </head>
      <body hx-ext="response-targets">
        <h1>食用建設予定地</h1>
        <form hx-post="/edible" hx-target="#result" hx-target-error="#result">
          <input type="text" name="name" />
          <input type="submit" value="食用" />
        </form>
        <div id="result"></div>
        <div id="any-errors"></div>
      </body>
    </html>
  );
};

const Shokuyo: FC<{ name: string; edible: boolean }> = (props: {
  name: string;
  edible: boolean;
}) => {
  return (
    <>
      <div>ここに画像</div>
      <b>
        {props.name}は{props.edible ? "食べられます！" : "食べられません"}
      </b>
      <p>
        判定結果は間違っていることががあります。食べられないものを食べて健康を害しても責任を負いかねます。
      </p>
    </>
  );
};

type Env = {
  OPENAI_API_KEY: string;
};

const edible = async (name: string, apiKey: string): Promise<boolean> => {
  const openai = new OpenAI({ apiKey: apiKey });
  const chatres = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: ` 
      あなたは入力されたものが食べられるかどうかを判定するAIです。
      「食べられる」もしくは「食べられない」とだけ答えてください。
      それ以外の入力は受け付けません。
      `,
      },
      {
        role: "user",
        content: name,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  return chatres.choices[0]?.message.content == "食べられる";
};

app.get("/", (c) => c.html(<Top />));

app.post(
  "/edible",
  zValidator("form", z.object({ name: z.string().max(20) })),
  async (c) => {
    const name = c.req.valid("form").name;
    const env = c.env as Env;
    const edi = await edible(name, env.OPENAI_API_KEY);
    return c.html(<Shokuyo name={name} edible={edi} />);
  }
);

export default app;
