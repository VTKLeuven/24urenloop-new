// Simple in-memory SSE bus for PR events
// Note: In-memory only; sufficient for a single server instance.

export type PREvent = {
  type: 'pr';
  runnerId: number;
  runnerName: string;
  oldBest: string; // formatted M:SS.HH
  newBest: string; // formatted M:SS.HH
};

const encoder = new TextEncoder();

type Client = {
  id: number;
  enqueue: (chunk: Uint8Array) => void;
  close: () => void;
};

let nextClientId = 1;
const clients = new Set<Client>();

export function addClient(enqueue: (chunk: Uint8Array) => void, close: () => void): Client {
  const client: Client = { id: nextClientId++, enqueue, close };
  clients.add(client);
  return client;
}

export function removeClient(client: Client) {
  try {
    clients.delete(client);
    client.close();
  } catch {
    // ignore
  }
}

export function broadcastEvent(eventName: string, data: unknown) {
  const payload = `event: ${eventName}\n` + `data: ${JSON.stringify(data)}\n\n`;
  const chunk = encoder.encode(payload);
  for (const c of Array.from(clients)) {
    try {
      c.enqueue(chunk);
    } catch {
      // drop broken client
      clients.delete(c);
    }
  }
}

export function emitPersonalRecord(evt: PREvent) {
  broadcastEvent('pr', evt);
}

