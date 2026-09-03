import { GameCoordinator } from "./GameCoordinator.js";
import { SocketManager } from "./SocketManager.js";
import { ClientMessage, AdminMessage, LobbyPlayer } from "./types.js";
import {
  getPlayer,
  registerPlayerForInstance,
  updateInstancePlayerStatus,
  insertLeaderboardEntry,
  createEventInstance,
  updateInstanceStatus,
  getPlayer as getPlayerDb,
  markCouponSent,
} from "../storage/database.js";
import { CouponService } from "../services/CouponService.js";
import { createEmailService } from "../services/EmailService.js";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "dev-admin-token-change-me";
const couponService = new CouponService();
const emailService = createEmailService();

export class EventHandler {
  constructor(
    private coordinator: GameCoordinator,
    private socketManager: SocketManager,
  ) {}

  handleClientMessage(connId: string, message: ClientMessage): void {
    switch (message.type) {
      case "join_lobby":
        this.handleJoinLobby(connId, message);
        break;
      case "player_ready":
        break;
      case "game_complete":
        this.handleGameComplete(connId, message);
        break;
    }
  }

  handleAdminMessage(connId: string, message: AdminMessage): void {
    switch (message.type) {
      case "admin_start_game":
        this.handleAdminStartGame(message, connId);
        break;
      case "admin_end_game":
        this.handleAdminEndGame();
        break;
    }
  }

  handleDisconnect(connId: string): void {
    const player = this.coordinator.removeFromLobby(connId);
    if (player && this.coordinator.getStatus() === "WAITING") {
      this.socketManager.broadcastToClients({
        type: "lobby_update",
        players: this.coordinator.getLobby(),
        count: this.coordinator.getLobbyCount(),
      });
      this.socketManager.broadcastToAdmins({
        type: "player_left",
        displayName: player.displayName,
      });
    } else if (player && this.coordinator.getStatus() === "IN_PLAY") {
      const instanceId = this.coordinator.getCurrentInstanceId();
      if (instanceId)
        updateInstancePlayerStatus(instanceId, player.databaseId, "TIMEOUT");
    }
  }

  private handleJoinLobby(
    connId: string,
    message: {
      playerId: string;
      sessionId: string;
      displayName: string;
      characterType: string;
      mapId: string;
    },
  ): void {
    // Use connId (the sessionId from the URL) as the playerId so it matches the WebSocket connection key
    // Store the original database playerId in databaseId for DB operations
    const player: LobbyPlayer = {
      playerId: connId,
      databaseId: message.playerId,
      sessionId: connId,
      displayName: message.displayName || "Player",
      characterType: message.characterType,
      mapId: message.mapId,
    };
    this.coordinator.joinLobby(player);
    const instanceId = this.coordinator.getCurrentInstanceId();
    if (instanceId)
      registerPlayerForInstance(
        instanceId,
        message.playerId,
        connId,
        player.characterType,
        player.mapId,
      );
    this.socketManager.broadcastToClients({
      type: "lobby_update",
      players: this.coordinator.getLobby(),
      count: this.coordinator.getLobbyCount(),
    });
    this.socketManager.broadcastToAdmins({
      type: "player_joined",
      displayName: player.displayName,
      characterType: player.characterType,
      mapId: player.mapId,
    });
    this.socketManager.broadcastToAdmins({
      type: "lobby_update",
      players: this.coordinator.getLobby(),
      count: this.coordinator.getLobbyCount(),
    });
  }

  private handleGameComplete(
    connId: string,
    message: { playerId: string; score: number; completionTime: number },
  ): void {
    // Use connId to look up the player in the lobby (keyed by sessionId)
    const result = this.coordinator.playerComplete(
      connId,
      message.score,
      message.completionTime,
    );
    if (!result) return;
    const lobbyPlayer = this.coordinator
      .getLobby()
      .find((l) => l.playerId === connId);
    const instanceId = this.coordinator.getCurrentInstanceId();
    if (instanceId) {
      // Use the original database playerId for DB operations
      const dbId = lobbyPlayer?.databaseId ?? message.playerId;
      updateInstancePlayerStatus(
        instanceId,
        dbId,
        "COMPLETED",
        message.score,
        message.completionTime,
      );
      insertLeaderboardEntry(
        instanceId,
        dbId,
        result.rank,
        message.score,
        message.completionTime,
      );
    }
    this.socketManager.broadcastToAdmins({
      type: "leaderboard_update",
      entries: this.coordinator
        .getTopPlayers()
        .map((p) => ({
          rank: p.rank,
          playerId: p.playerId,
          displayName:
            this.coordinator.getLobby().find((l) => l.playerId === p.playerId)
              ?.displayName ?? "Unknown",
          score: p.score,
          completionTime: p.completionTime,
          rewardType: p.rewardType,
        })),
    });
    this.socketManager.sendToClient(connId, {
      type: "player_completed",
      displayName: result.displayName,
      rank: result.rank,
      score: message.score,
    });
    if (this.coordinator.getTopPlayers().length >= 10) this.finishGame();
  }

  private handleAdminStartGame(
    message: { mapId: string; adminToken: string },
    connId: string,
  ): void {
    if (message.adminToken !== ADMIN_TOKEN) {
      this.socketManager.sendToClient(connId, {
        type: "error",
        message: "Admin authorization failed.",
      });
      return;
    }
    try {
      const { instanceId: coordinatorId, tasks } = this.coordinator.startGame(
        message.mapId,
      );

      // Persist event instance
      const instance = createEventInstance(message.mapId);
      updateInstanceStatus(instance.id, "IN_PLAY");

      // Register all lobby players to this instance
      for (const player of this.coordinator.getLobby()) {
        registerPlayerForInstance(
          instance.id,
          player.databaseId,
          player.playerId,
          player.characterType,
          player.mapId,
        );
        updateInstancePlayerStatus(instance.id, player.databaseId, "PLAYING");
      }

      this.socketManager.broadcastToAdmins({
        type: "game_started",
        instanceId: instance.id,
      });
      for (const player of this.coordinator.getLobby()) {
        this.socketManager.sendToClient(player.playerId, {
          type: "game_start",
          instanceId: instance.id,
          mapId: message.mapId,
          tasks: tasks.map((t) => ({
            id: t.id,
            type: t.type,
            cropType: t.cropType,
            targetAmount: t.targetAmount,
            currentAmount: t.currentAmount,
            timeLimit: t.timeLimit,
            scoreReward: t.scoreReward,
            description: t.description,
          })),
        });
      }
    } catch (error: any) {
      this.socketManager.sendToClient(connId, {
        type: "error",
        message: error.message ?? "Failed to start game.",
      });
    }
  }

  private async handleAdminEndGame(): Promise<void> {
    await this.finishGame();
  }

  private async finishGame(): Promise<void> {
    const { leaderboard } = this.coordinator.endGame();
    this.socketManager.broadcastToAdmins({
      type: "game_finished",
      leaderboard,
    });
    for (const entry of leaderboard) {
      const lobbyPlayer = this.coordinator
        .getLobby()
        .find((l) => l.databaseId === entry.playerId);
      if (lobbyPlayer) {
        this.socketManager.sendToClient(lobbyPlayer.playerId, {
          type: "game_finished",
          leaderboard,
          yourRank: entry.rank,
        });
      }

      if (entry.rank <= 10) {
        try {
          const player = getPlayerDb(entry.playerId);
          const lobbyPlayer = this.coordinator
            .getLobby()
            .find((l) => l.databaseId === entry.playerId);
          if (!player || !lobbyPlayer) continue;

          // Coupons belong to the player's game session, not the event instance.
          const { coupon } = couponService.getOrCreateCoupon(
            player.id,
            lobbyPlayer.sessionId,
          );

          if (coupon.status !== "SENT") {
            await emailService.sendCouponEmail({
              to: player.email,
              couponCode: coupon.code,
              rewardName: entry.rewardType ?? "Gift",
              score: entry.score,
            });
            markCouponSent(coupon.id);
          }
        } catch (error) {
          console.error(
            `Failed to issue reward for player ${entry.playerId}:`,
            error,
          );
        }
      }
    }
  }
}
