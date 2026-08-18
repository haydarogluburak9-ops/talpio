import { connect as tlsConnect } from 'node:tls';
import { Socket } from 'node:net';

export interface SmtpMailRequest {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}

function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

class SmtpSession {
  private buffer = '';

  constructor(private readonly socket: Socket) {}

  async read(code: number): Promise<string> {
    while (true) {
      const idx = this.buffer.indexOf('\r\n');
      if (idx >= 0) {
        const line = this.buffer.slice(0, idx);
        this.buffer = this.buffer.slice(idx + 2);
        if (!/^\d{3}-/.test(line)) {
          const numeric = Number(line.slice(0, 3));
          if (numeric !== code) {
            throw new Error(`SMTP beklenen ${code}, gelen: ${line}`);
          }
          return line;
        }
        continue;
      }
      const chunk: Buffer = await new Promise((resolve, reject) => {
        const onData = (data: Buffer) => {
          cleanup();
          resolve(data);
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          this.socket.off('data', onData);
          this.socket.off('error', onError);
        };
        this.socket.once('data', onData);
        this.socket.once('error', onError);
      });
      this.buffer += chunk.toString('utf8');
    }
  }

  write(command: string): void {
    this.socket.write(`${command}\r\n`);
  }

  end(): void {
    this.socket.end();
  }
}

function connectSocket(host: string, port: number, secure: boolean): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tlsConnect({ host, port, servername: host }, () => resolve(socket))
      : new Socket();
    if (!secure) {
      socket.connect(port, host, () => resolve(socket));
    }
    socket.once('error', reject);
  });
}

function upgradeToTls(socket: Socket, host: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const tlsSocket = tlsConnect({ socket, servername: host, host }, () => resolve(tlsSocket));
    tlsSocket.once('error', reject);
  });
}

export async function sendSmtpMail(request: SmtpMailRequest): Promise<void> {
  let socket = await connectSocket(request.host, request.port, request.secure);
  let session = new SmtpSession(socket);
  await session.read(220);
  session.write(`EHLO talpio`);
  await session.read(250);

  if (!request.secure && request.port === 587) {
    session.write('STARTTLS');
    await session.read(220);
    socket = await upgradeToTls(socket, request.host);
    session = new SmtpSession(socket);
    session.write(`EHLO talpio`);
    await session.read(250);
  }

  if (request.user && request.pass) {
    session.write('AUTH LOGIN');
    await session.read(334);
    session.write(Buffer.from(request.user).toString('base64'));
    await session.read(334);
    session.write(Buffer.from(request.pass).toString('base64'));
    await session.read(235);
  }

  session.write(`MAIL FROM:<${extractAddress(request.from)}>`);
  await session.read(250);
  session.write(`RCPT TO:<${extractAddress(request.to)}>`);
  await session.read(250);
  session.write('DATA');
  await session.read(354);
  const payload = [
    `From: ${request.from}`,
    `To: ${request.to}`,
    `Subject: ${request.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    request.text.replace(/\r?\n\./g, '\n..'),
    '.',
  ].join('\r\n');
  session.write(payload);
  await session.read(250);
  session.write('QUIT');
  session.end();
}
