
import ApiClient from "../api/ApiClient.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  async create() {
    this.add.text(40, 40, "IdleMon Legends", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.statusText = this.add.text(40, 100, "Booting...", {
      fontSize: "20px",
      color: "#ffffff",
    });

    await this.bootstrap();
  }

  async bootstrap() {
    const token = ApiClient.getToken();

    if (!token) {
      this.statusText.setText("No saved login. Redirecting to Login...");
      this.goToLogin();
      return;
    }

    try {
      this.statusText.setText("Loading player data...");

      const profile = await PlayerApi.me();
      GameState.setProfile(profile);

      this.statusText.setText("Login restored. Redirecting...");
      this.scene.start("HomeScene");
    } catch (error) {
      ApiClient.clearToken();
      GameState.clear();

      this.statusText.setText("Session expired. Redirecting to Login...");
      this.goToLogin();
    }
  }

  goToLogin() {
    this.time.delayedCall(400, () => {
      this.scene.start("LoginScene");
    });
  }
}