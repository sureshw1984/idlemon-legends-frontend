
import MonsterApi from "../api/MonsterApi.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class SummonScene extends Phaser.Scene {
  constructor() {
    super("SummonScene");
  }

  create() {
    this.add.text(30, 20, "Summon", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.infoText = this.add.text(30, 80, "", {
      fontSize: "22px",
      color: "#ffffff",
    });

    this.resultText = this.add.text(30, 200, "", {
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
    this.makeButton(30, 140, "Summon x1", async () => {
      await this.handleSummon();
    });

    this.makeButton(200, 140, "Back", () => {
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
    ]);
  }

  async handleSummon() {
    this.setStatus("Summoning...");
    this.resultText.setText("");

    try {
      const result = await MonsterApi.summon();

      await this.refreshProfile();

      const reward = result.reward;

      this.resultText.setText([
        `🎉 You got:`,
        `${reward.pieces}x ${reward.item_name}`,
        `Rarity: ${reward.rarity}`,
      ]);

      this.renderInfo();
      this.setStatus("Summon successful!", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Summon failed.", "#ff6666");
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