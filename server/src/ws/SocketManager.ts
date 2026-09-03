import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'node:http';
import { Server } from 'node:http';
import { GameCoordinator } from './GameCoordinator.js';
import { EventHandler } from './EventHandler.js';
import { ClientMessage, AdminMessage, ServerMessage, AdminBroadcast } from './types.js';
import { getSession } from '../storage/database.js';

export interface PlayerConnection {
  ws: WebSocket;
  playerId: string;
  sessionId: string;
  isAdmin: boolean;
  lastPong: number;
}

export class SocketManager {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, PlayerConnection> = new Map();
  private coordinator: GameCoordinator;
  private handler: EventHandler;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(coordinator: GameCoordinator) {
    this.coordinator = coordinator;
    this.handler = new EventHandler(coordinator, this);
  }

  attachToServer(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const sessionId = url.searchParams.get('sessionId');
      const isAdmin = url.searchParams.get('admin') === 'true';
      const adminToken = url.searchParams.get('adminToken');
      if (!sessionId && !isAdmin) { ws.close(4001, 'Session ID required'); return; }
      if (isAdmin) {
        if (adminToken !== process.env.ADMIN_TOKEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'Admin authorization failed.' }));
          ws.close(4003, 'Unauthorized');
          return;
        }
      } else if (sessionId) {
        const session = getSession(sessionId);
        if (!session) { ws.close(4002, 'Invalid session'); return; }
      }
      const connId = sessionId ?? `admin-${Date.now()}`;
      const connection: PlayerConnection = { ws, playerId: sessionId ?? connId, sessionId: sessionId ?? '', isAdmin, lastPong: Date.now() };
      this.connections.set(connId, connection);

      ws.on('message', (data: Buffer | string) => {
        try {
          const message = JSON.parse(typeof data === 'string' ? data : data.toString());
          if (isAdmin) this.handler.handleAdminMessage(connId, message as AdminMessage);
          else this.handler.handleClientMessage(connId, message as ClientMessage);
        } catch { /* ignore */ }
      });
      ws.on('pong', () => { connection.lastPong = Date.now(); });
      ws.on('close', () => { if (!isAdmin) this.handler.handleDisconnect(connId); this.connections.delete(connId); });
      ws.on('error', () => { this.connections.delete(connId); });
    });

    this.pingInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, conn] of this.connections) {
        if (now - conn.lastPong > 35000) { conn.ws.terminate(); this.connections.delete(id); }
        else conn.ws.ping();
      }
    }, 30000);
  }

  sendToClient(playerId: string, message: ServerMessage): void {
    const conn = this.connections.get(playerId);
    if (conn && conn.ws.readyState === WebSocket.OPEN && !conn.isAdmin) conn.ws.send(JSON.stringify(message));
  }

  broadcastToClients(message: ServerMessage): void {
    for (const conn of this.connections.values()) {
      if (!conn.isAdmin && conn.ws.readyState === WebSocket.OPEN) conn.ws.send(JSON.stringify(message));
    }
  }

  broadcastToAdmins(message: AdminBroadcast): void {
    for (const conn of this.connections.values()) {
      if (conn.isAdmin && conn.ws.readyState === WebSocket.OPEN) conn.ws.send(JSON.stringify(message));
    }
  }

  getCoordinator(): GameCoordinator { return this.coordinator; }

  destroy(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.wss?.close();
  }
}
