import { getSession, getPlayer } from '../storage/database.js';
import type { ClientMessage, AdminMessage } from './types.js';
import type { PlayerConnection } from './SocketManager.js';
import type { SocketManager } from './SocketManager.js';
import { GameCoordinator } from './GameCoordinator.js';

export class EventHandler {
  private coordinator: GameCoordinator;

  constructor(private socketManager: SocketManager) {
    this.coordinator = new GameCoordinator(socketManager);

    // Wire up callbacks
    socketManager.onClientMessage = (conn, msg) => this.handleClientMessage(conn, msg);
    socketManager.onAdminMessage = (conn, msg) => this.handleAdminMessage(conn, msg);
    socketManager.onPlayerDisconnect = (conn) => this.handleDisconnect(conn);
  }

  // ── Client messages ───────────────────────────────────────────

  private handleClientMessage(conn: PlayerConnection, msg: ClientMessage): void {
    switch (msg.type) {
      case 'join_lobby': {
        // Validate session
        const session = getSession(msg.sessionId);
        if (!session) {
          this.socketManager.sendTo(conn, { type: 'error', message: 'Invalid session.' });
          return;
        }

        const player = getPlayer(session.player_id);
        if (!player) {
          this.socketManager.sendTo(conn, { type: 'error', message: 'Player not found.' });
          return;
        }

        this.coordinator.joinLobby(
          conn,
          msg.playerId || session.player_id,
          msg.displayName || player.display_name || 'Player',
          msg.characterType || 'male',
          msg.mapId || 'rwanda',
        );
        break;
      }

      case 'player_ready': {
        // Could track readiness per player
        console.info(`[Event] Player ${msg.playerId} marked ready`);
        break;
      }

      case 'game_complete': {
        if (!this.coordinator.isGameActive()) {
          this.socketManager.sendTo(conn, { type: 'error', message: 'No active game.' });
          return;
        }

        this.coordinator.playerComplete(msg.playerId, msg.score, msg.completionTime);
        break;
      }

      default: {
        this.socketManager.sendTo(conn, { type: 'error', message: 'Unknown message type.' });
      }
    }
  }

  // ── Admin messages ────────────────────────────────────────────

  private handleAdminMessage(conn: PlayerConnection, msg: AdminMessage): void {
    switch (msg.type) {
      case 'admin_start_game': {
        if (this.coordinator.isGameActive()) {
          this.socketManager.sendTo(conn, { type: 'error', message: 'A game is already in progress.' });
          return;
        }

        if (this.coordinator.getLobbySize() === 0) {
          this.socketManager.sendTo(conn, { type: 'error', message: 'No players in lobby.' });
          return;
        }

        this.coordinator.startGame(msg.mapId || 'rwanda');
        break;
      }

      case 'admin_end_game': {
        if (!this.coordinator.isGameActive()) {
          this.socketManager.sendTo(conn, { type: 'error', message: 'No active game to end.' });
          return;
        }

        this.coordinator.endGame();
        break;
      }

      default: {
        this.socketManager.sendTo(conn, { type: 'error', message: 'Unknown admin message type.' });
      }
    }
  }

  // ── Disconnect ────────────────────────────────────────────────

  private handleDisconnect(conn: PlayerConnection): void {
    if (conn.playerId) {
      this.coordinator.removeFromLobby(conn.playerId);
    }
  }

  // ── Public accessors ──────────────────────────────────────────

  getCoordinator(): GameCoordinator {
    return this.coordinator;
  }
}
