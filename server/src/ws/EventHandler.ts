import { GameCoordinator } from "./GameCoordinator.js";
import { SocketManager } from "./SocketManager.js";
import { ClientMessage, AdminMessage, LobbyPlayer } from "./types.js";
import {
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
    if (player) {
      // Mark as timed out in DB if we have an instance
      const inst = this.coordinator.getPlayerInstance(connId);
      if (inst) {
        updateInstancePlayerStatus(inst.instanceId, player.databaseId, "TIMEOUT");
      }

      this.socketManager.broadcastToAdmins({
        type: "player_left",
        displayName: player.displayName,
      });
      this.socketManager.broadcastToAdmins({
        type: "lobby_update",
        players: this.coordinator.getLobby(),
        count: this.coordinator.getLobbyCount(),
      });

      // Check if all remaining players have finished
      if (this.coordinator.allPlayersFinished()) {
        void this.finishGame();
      }
    }
  }

  /**
   * Each player who joins gets their own independent game instance
   * with their own tasks, starting immediately.
   */
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

    // Create an independent instance for this player
    const { instanceId, tasks } = this.coordinator.createPlayerInstance(
      connId,
      message.mapId,
    );

    // Persist the event instance in the database
    const dbInstance = createEventInstance(message.mapId);
    updateInstanceStatus(dbInstance.id, "IN_PLAY");
    registerPlayerForInstance(
      dbInstance.id,
      message.playerId,
      connId,
      player.characterType,
      player.mapId,
    );
    updateInstancePlayerStatus(dbInstance.id, message.playerId, "PLAYING");

    // Send game_start to this player immediately
    this.socketManager.sendToClient(connId, {
      type: "game_start",
      instanceId: dbInstance.id,
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

    // If this is the first player, notify admins the event is now active
    if (this.coordinator.getLobbyCount() === 1) {
      this.socketManager.broadcastToAdmins({
        type: "game_started",
        instanceId: dbInstance.id,
      });
    }

    // Notify admins
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
    const result = this.coordinator.playerComplete(
      connId,
      message.score,
      message.completionTime,
    );
    if (!result) return;

    const lobbyPlayer = this.coordinator
      .getLobby()
      .find((l) => l.playerId === connId);

    // Update DB for this player's instance
    const inst = this.coordinator.getPlayerInstance(connId);
    if (inst && lobbyPlayer) {
      updateInstancePlayerStatus(
        inst.instanceId,
        lobbyPlayer.databaseId,
        "COMPLETED",
        message.score,
        message.completionTime,
      );
      insertLeaderboardEntry(
        inst.instanceId,
        lobbyPlayer.databaseId,
        result.rank,
        message.score,
        message.completionTime,
      );
    }

    // Broadcast updated leaderboard to admins
    this.socketManager.broadcastToAdmins({
      type: "leaderboard_update",
      entries: this.coordinator
        .getTopPlayers()
        .map((p) => ({
          rank: p.rank,
          playerId: p.playerId,
          displayName:
            this.coordinator.getLobby().find((l) => l.databaseId === p.playerId)
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
    // Only finalize once
    if (this.coordinator.allPlayersFinished() === false) return;

    const { leaderboard } = this.coordinator.endGame();

    this.socketManager.broadcastToAdmins({
      type: "game_finished",
      leaderboard,
    });

    // Send game_finished to each player in the leaderboard
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

    // Also send game_finished to players who didn't complete (timed out)
    for (const player of this.coordinator.getLobby()) {
      const inLeaderboard = leaderboard.some(
        (e) => e.playerId === player.databaseId,
      );
      if (!inLeaderboard) {
        this.socketManager.sendToClient(player.playerId, {
          type: "game_finished",
          leaderboard,
          yourRank: leaderboard.length + 1,
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
