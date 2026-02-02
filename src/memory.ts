export class ChatMemory {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    const { message } = await request.json<{ message: string }>();

    const history = (await this.state.storage.get<string[]>("history")) ?? [];
    history.push(message);

    const recent = history.slice(-10); // 只保留最近 10 条
    await this.state.storage.put("history", recent);

    return new Response(JSON.stringify({ history: recent }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
