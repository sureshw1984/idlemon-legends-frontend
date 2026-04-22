
import ApiClient from "../api/ApiClient.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";
import AuthApi from "../api/AuthApi.js";

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super("HomeScene");
  }

  async create() {
    this.add.text(30, 20, "IdleMon Legends", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.statusText = this.add.text(30, 520, "", {
      fontSize: "18px",
      color: "#ffcc00",
      wordWrap: { width: 700 },
    });

    this.infoText = this.add.text(30, 80, "", {
      fontSize: "22px",
      color: "#ffffff",
      lineSpacing: 10,
    });

    this.createButtons();
    await this.refreshProfile();
    this.renderProfile();
  }

  createButtons() {
    this.makeButton(30, 250, "Summon", () => {
      this.scene.start("SummonScene");
    });

    this.makeButton(180, 250, "Monsters", () => {
      this.scene.start("MonstersScene");
    });

    this.makeButton(360, 250, "Team", () => {
      this.scene.start("TeamScene");
    });

    this.makeButton(500, 250, "Battle", () => {
      this.scene.start("BattleScene");
    });

    this.makeButton(30, 340, "Refresh", async () => {
      await this.handleRefresh();
    });

    this.makeButton(180, 340, "Logout", () => {
      this.handleLogout();
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

  async refreshProfile() {
    const profile = await PlayerApi.me();
    GameState.setProfile(profile);
  }

  renderProfile() {
    const user = GameState.getUser();
    const player = GameState.getPlayer();
    const stats = GameState.getStats();
    const monsters = GameState.getMonsters();
    const team = GameState.getTeam();
    const inventory = GameState.getInventory();

    if (!user || !player) {
      this.infoText.setText("No player data loaded.");
      return;
    }

    this.infoText.setText([
      `Player: ${user.username}`,
      `Gold: ${player.gold}`,
      `Gems: ${player.gems}`,
      `Current Stage: ${player.current_stage}`,
      `Enemy HP: ${player.enemy_current_hp ?? "-"}`,
      `Owned Monsters: ${monsters.length}`,
      `Team Slots Used: ${team.length}`,
      `Inventory Stacks: ${inventory.length}`,
      `Total Kills: ${stats?.total_kills ?? 0}`,
      `Total Summons: ${stats?.total_summons ?? 0}`,
      `Total Pieces Collected: ${stats?.total_pieces_collected ?? 0}`,
      `Total Monsters Crafted: ${stats?.total_monsters_crafted ?? 0}`,
    ]);
  }

  async handleRefresh() {
    this.setStatus("Refreshing profile...");

    try {
      await this.refreshProfile();
      this.renderProfile();
      this.setStatus("Profile refreshed.", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Failed to refresh profile.", "#ff6666");
    }
  }

  handleLogout() {
    AuthApi.logout();
    ApiClient.clearToken();
    GameState.clear();
    this.scene.start("LoginScene");
  }

  setStatus(message, color = "#ffcc00") {
    this.statusText.setColor(color);
    this.statusText.setText(message);
  }
}