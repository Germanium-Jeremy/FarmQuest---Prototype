<<<<<<< HEAD
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

      if (!sessionId && !isAdmin) {
        ws.close(4001, 'Session ID required');
        return;
      }

      if (!isAdmin && sessionId) {
        const session = getSession(sessionId);
        if (!session) {
          ws.close(4002, 'Invalid session');
          return;
        }
      }

      const connId = sessionId ?? `admin-${Date.now()}`;
      const connection: PlayerConnection = {
        ws,
        playerId: sessionId ?? connId,
        sessionId: sessionId ?? '',
        isAdmin,
        lastPong: Date.now(),
      };

      this.connections.set(connId, connection);

      ws.on('message', (data: Buffer | string) => {
        try {
          const message = JSON.parse(typeof data === 'string' ? data : data.toString());
          if (isAdmin) {
            this.handler.handleAdminMessage(connId, message as AdminMessage);
          } else {
            this.handler.handleClientMessage(connId, message as ClientMessage);
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.on('pong', () => {
        connection.lastPong = Date.now();
      });

      ws.on('close', () => {
        if (!isAdmin) {
          this.handler.handleDisconnect(connId);
        }
        this.connections.delete(connId);
      });

      ws.on('error', () => {
        this.connections.delete(connId);
      });
    });

    // Heartbeat
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, conn] of this.connections) {
        if (now - conn.lastPong > 35000) {
          conn.ws.terminate();
          this.connections.delete(id);
        } else {
          conn.ws.ping();
        }
      }
    }, 30000);
  }

  sendToClient(playerId: string, message: ServerMessage): void {
    const conn = this.connections.get(playerId);
    if (conn && conn.ws.readyState === WebSocket.OPEN && !conn.isAdmin) {
      conn.ws.send(JSON.stringify(message));
    }
  }

  broadcastToClients(message: ServerMessage): void {
    for (const conn of this.connections.values()) {
      if (!conn.isAdmin && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(message));
=======
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { AdminBroadcast, AdminMessage, ClientMessage, ServerMessage } from './types.js';

export interface PlayerConnection {
  id: string;
  playerId: string | null;
  sessionId: string;
  displayName: string | null;
  isAdmin: boolean;
  ws: WebSocket;
  alive: boolean;
}

export class SocketManager {
  private wss: WebSocketServer;
  private connections: Map<string, PlayerConnection> = new Map();
  private adminConnections: Set<string> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  /** External callbacks set by EventHandler */
  onClientMessage: ((conn: PlayerConnection, msg: ClientMessage) => void) | null = null;
  onAdminMessage: ((conn: PlayerConnection, msg: AdminMessage) => void) | null = null;
  onPlayerDisconnect: ((conn: PlayerConnection) => void) | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.startHeartbeat();
  }

  private handleConnection(ws: WebSocket, req: http.IncomingMessage): void {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const isAdmin = url.searchParams.get('admin') === 'true';
    const adminToken = url.searchParams.get('adminToken') ?? '';
    const sessionId = url.searchParams.get('sessionId') ?? randomUUID();

    // Basic admin token check (static token from env)
    if (isAdmin && adminToken !== (process.env.ADMIN_TOKEN ?? '')) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const connId = randomUUID();
    const conn: PlayerConnection = {
      id: connId,
      playerId: null,
      sessionId,
      displayName: null,
      isAdmin,
      ws,
      alive: true,
    };

    this.connections.set(connId, conn);
    if (isAdmin) this.adminConnections.add(connId);

    console.info(`[WS] Connection opened: ${connId} (admin=${isAdmin})`);

    ws.on('pong', () => {
      conn.alive = true;
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(String(data));
        if (isAdmin && this.onAdminMessage) {
          this.onAdminMessage(conn, msg as AdminMessage);
        } else if (this.onClientMessage) {
          this.onClientMessage(conn, msg as ClientMessage);
        }
      } catch {
        this.sendTo(conn, { type: 'error', message: 'Invalid message format.' });
      }
    });

    ws.on('close', () => {
      console.info(`[WS] Connection closed: ${connId}`);
      this.connections.delete(connId);
      this.adminConnections.delete(connId);
      if (this.onPlayerDisconnect) this.onPlayerDisconnect(conn);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error on ${connId}:`, err.message);
    });
  }

  // ── Send helpers ──────────────────────────────────────────────

  sendTo(conn: PlayerConnection, msg: ServerMessage | AdminBroadcast): void {
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(msg));
    }
  }

  broadcastToClients(msg: ServerMessage): void {
    for (const conn of this.connections.values()) {
      if (!conn.isAdmin && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(msg));
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
      }
    }
  }

<<<<<<< HEAD
  broadcastToAdmins(message: AdminBroadcast): void {
    for (const conn of this.connections.values()) {
      if (conn.isAdmin && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(message));
=======
  broadcastToAdmins(msg: AdminBroadcast): void {
    for (const connId of this.adminConnections) {
      const conn = this.connections.get(connId);
      if (conn && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(msg));
      }
    }
  }

  broadcastToAll(msg: ServerMessage | AdminBroadcast): void {
    for (const conn of this.connections.values()) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(msg));
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
      }
    }
  }

<<<<<<< HEAD
  getCoordinator(): GameCoordinator {
    return this.coordinator;
  }

  destroy(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.wss?.close();
=======
  // ── Connection tracking ───────────────────────────────────────

  getConnectionByPlayerId(playerId: string): PlayerConnection | undefined {
    for (const conn of this.connections.values()) {
      if (conn.playerId === playerId) return conn;
    }
    return undefined;
  }

  getConnectionById(connId: string): PlayerConnection | undefined {
    return this.connections.get(connId);
  }

  setPlayerInfo(connId: string, playerId: string, displayName: string): void {
    const conn = this.connections.get(connId);
    if (conn) {
      conn.playerId = playerId;
      conn.displayName = displayName;
    }
  }

  getClientCount(): number {
    let count = 0;
    for (const conn of this.connections.values()) {
      if (!conn.isAdmin) count++;
    }
    return count;
  }

  getAllClientConnections(): PlayerConnection[] {
    const clients: PlayerConnection[] = [];
    for (const conn of this.connections.values()) {
      if (!conn.isAdmin) clients.push(conn);
    }
    return clients;
  }

  // ── Heartbeat ─────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [id, conn] of this.connections) {
        if (!conn.alive) {
          console.info(`[WS] Terminating stale connection: ${id}`);
          conn.ws.terminate();
          this.connections.delete(id);
          this.adminConnections.delete(id);
          continue;
        }
        conn.alive = false;
        conn.ws.ping();
      }
    }, 30_000);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ── Shutdown ──────────────────────────────────────────────────

  closeAll(): void {
    this.stopHeartbeat();
    for (const conn of this.connections.values()) {
      conn.ws.close(1001, 'Server shutting down');
    }
    this.connections.clear();
    this.adminConnections.clear();
    this.wss.close();
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  }
}
