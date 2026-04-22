import BattleApi from "../api/BattleApi.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  create() {
    this.add.text(30, 20, "Battle", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.infoText = this.add.text(30, 80, "", {
      fontSize: "22px",
      color: "#ffffff",
      lineSpacing: 8,
    });

    this.resultText = this.add.text(30, 260, "", {
      fontSize: "20px",
      color: "#ffcc00",
      wordWrap: { width: 700 },
    });

    this.statusText = this.add.text(30, 520, "", {
      fontSize: "18px",
      color: "#ffcc00",
    });

    this.createButtons();
    this.renderInfo();
  }

  createButtons() {
    this.makeButton(30, 180, "Tick (Attack)", async () => {
      await this.handleTick();
    });

    this.makeButton(200, 180, "Claim Offline", async () => {
      await this.handleOfflineReward();
    });

    this.makeButton(400, 180, "Back", () => {
      this.scene.start("HomeScene");
    });
  }

  makeButton(x, y, label, callback) {
    const button = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: "26px",
      backgroundColor: "#333333",
      color: "#ffffff",
      padding: { x: 12, y: 8 },
    }).setInteractive({ useHandCursor: true });

    button.on("pointerdown", callback);
    return button;
  }

  renderInfo() {
    const player = GameState.getPlayer();

    if (!player) {
      this.infoText.setText("No player data.");
      return;
    }

    this.infoText.setText([
      `Gold: ${player.gold}`,
      `Gems: ${player.gems}`,
      `Stage: ${player.current_stage}`,
      `Enemy HP: ${player.enemy_current_hp ?? "-"}`,
    ]);
  }

  async handleTick() {
    this.setStatus("Attacking...");
    this.resultText.setText("");

    try {
      const result = await BattleApi.tick();

      await this.refreshProfile();

      this.resultText.setText([
        `⚔️ Attack Result`,
        `Damage: ${result.team_attack}`,
        `Gold Earned: ${result.gold_earned}`,
        `New Stage: ${result.player.current_stage}`,
      ]);

      this.renderInfo();
      this.setStatus("Attack complete!", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Battle failed.", "#ff6666");
    }
  }

  async handleOfflineReward() {
    this.setStatus("Calculating offline reward...");
    this.resultText.setText("");

    try {
      const result = await BattleApi.offlineReward();

      await this.refreshProfile();

      this.resultText.setText([
        `💰 Offline Reward`,
        `Time: ${result.offline_seconds}s`,
        `Gold Earned: ${result.gold_earned}`,
      ]);

      this.renderInfo();
      this.setStatus("Reward claimed!", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Failed to claim reward.", "#ff6666");
    }
  }

  async refreshProfile() {
    const profile = await PlayerApi.me();
    GameState.setProfile(profile);
  }

  setStatus(message, color = "#ffcc00") {
    this.statusText.setColor(color);
    this.statusText.setText(message);
  }
}