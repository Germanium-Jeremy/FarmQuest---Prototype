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
        // Deprecated: admin can no longer start games.
        // Games auto-start when the first player joins.
        this.socketManager.sendToClient(connId, {
          type: "error",
          message: "Games start automatically when players join.",
        });
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
      // Check if all remaining active players have finished
      if (this.coordinator.allPlayersFinished()) {
        void this.finishGame();
      }
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
    const player: LobbyPlayer = {
      playerId: connId,
      databaseId: message.playerId,
      sessionId: connId,
      displayName: message.displayName || "Player",
      characterType: message.characterType,
      mapId: message.mapId,
    };
    this.coordinator.joinLobby(player);

    // Auto-start game on first player join
    if (this.coordinator.getStatus() === "WAITING" && this.coordinator.getLobbyCount() === 1) {
      this.autoStartGame(player, message.mapId);
      return;
    }

    // If game is already in play, register player for existing instance
    const instanceId = this.coordinator.getCurrentInstanceId();
    if (instanceId) {
      registerPlayerForInstance(
        instanceId,
        message.playerId,
        connId,
        player.characterType,
        player.mapId,
      );
      updateInstancePlayerStatus(instanceId, message.playerId, "PLAYING");
    }

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

  private autoStartGame(player: LobbyPlayer, mapId: string): void {
    try {
      const result = this.coordinator.autoStartGame(mapId);
      if (!result) return; // Already started

      // Persist event instance
      const instance = createEventInstance(mapId);
      updateInstanceStatus(instance.id, "IN_PLAY");

      // Register all lobby players
      for (const p of this.coordinator.getLobby()) {
        registerPlayerForInstance(
          instance.id,
          p.databaseId,
          p.playerId,
          p.characterType,
          p.mapId,
        );
        updateInstancePlayerStatus(instance.id, p.databaseId, "PLAYING");
      }

      this.socketManager.broadcastToAdmins({
        type: "game_started",
        instanceId: instance.id,
      });

      // Send game_start to all lobby players
      for (const p of this.coordinator.getLobby()) {
        this.socketManager.sendToClient(p.playerId, {
          type: "game_start",
          instanceId: instance.id,
          mapId,
          tasks: result.tasks.map((t) => ({
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
      console.error("Auto-start failed:", error);
    }
  }

  private handleGameComplete(
    connId: string,
    message: { playerId: string; score: number; completionTime: number },
  ): void {
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

    // Check if all active players have finished → auto-finish
    if (this.coordinator.allPlayersFinished()) {
      void this.finishGame();
    }
  }

  private async handleAdminEndGame(): Promise<void> {
    await this.finishGame();
  }

  private async finishGame(): Promise<void> {
    if (this.coordinator.getStatus() !== "IN_PLAY") return;
    const { leaderboard } = this.coordinator.endGame();
    const instanceId = this.coordinator.getCurrentInstanceId();
    if (instanceId) updateInstanceStatus(instanceId, "FINISHED");

    this.socketManager.broadcastToAdmins({
      type: "game_finished",
      leaderboard,
    });

    // Send game_finished to each player
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
    }

    // Issue rewards for top min(completed, 10)
    const topPlayers = this.coordinator.getTopPlayers();
    for (const entry of topPlayers) {
      try {
        const player = getPlayerDb(entry.playerId);
        const lobbyPlayer = this.coordinator
          .getLobby()
          .find((l) => l.databaseId === entry.playerId);
        if (!player || !lobbyPlayer) continue;

        // Idempotent: get existing coupon or create new one
        const { coupon, alreadyIssued } = couponService.getOrCreateCoupon(
          player.id,
          lobbyPlayer.sessionId,
        );

        // Only send email if not already sent
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
