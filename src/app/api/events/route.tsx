import { NextResponse } from 'next/server';
import { addClient, removeClient } from '@/lib/sse';

export async function GET() {
  const encoder = new TextEncoder();
  let heartbeat: NodeJS.Timeout | null = null;
  let client: ReturnType<typeof addClient> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enqueue = (chunk: Uint8Array) => controller.enqueue(chunk);
      const close = () => controller.close();
      // Register client
      client = addClient(enqueue, close);

      // Initial retry suggestion and comment to open the stream
      controller.enqueue(encoder.encode('retry: 5000\n\n'));

      // Heartbeat to keep proxies happy
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
        } catch {
          // stream likely closed; cleanup happens in cancel
        }
      }, 25000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (client) {
        removeClient(client);
        client = null;
      }
    },
  });

  const res = new NextResponse(stream);
  res.headers.set('Content-Type', 'text/event-stream');
  res.headers.set('Cache-Control', 'no-cache, no-transform');
  res.headers.set('Connection', 'keep-alive');

  return res;
}
