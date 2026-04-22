import AuthApi from "../api/AuthApi.js";
import ApiClient from "../api/ApiClient.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super("LoginScene");
  }

  create() {
    this.add.text(40, 30, "IdleMon Legends", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.add.text(40, 80, "Username", {
      fontSize: "20px",
      color: "#ffffff",
    });

    this.add.text(40, 150, "Password", {
      fontSize: "20px",
      color: "#ffffff",
    });

    this.statusText = this.add.text(40, 320, "", {
      fontSize: "18px",
      color: "#ffcc00",
      wordWrap: { width: 500 },
    });

    this.createHtmlInputs();
    this.createButtons();
  }

  createHtmlInputs() {
    this.usernameInput = this.add.dom(40, 110, "input", {
      width: "260px",
      height: "40px",
      fontSize: "18px",
      padding: "4px 8px",
      boxSizing: "border-box",
    }).setOrigin(0, 0);

    this.passwordInput = this.add.dom(40, 180, "input", {
      width: "260px",
      height: "40px",
      fontSize: "18px",
      padding: "4px 8px",
      boxSizing: "border-box",
    }).setOrigin(0, 0);

    this.usernameInput.node.type = "text";
    this.passwordInput.node.type = "password";

    this.usernameInput.node.value = "player1";
    this.passwordInput.node.value = "123456";
  }

  createButtons() {
    this.loginButton = this.add.text(40, 250, "[ Login ]", {
      fontSize: "26px",
      backgroundColor: "#1e88e5",
      color: "#ffffff",
      padding: { x: 12, y: 8 },
    }).setInteractive({ useHandCursor: true });

    this.registerButton = this.add.text(200, 250, "[ Register ]", {
      fontSize: "26px",
      backgroundColor: "#43a047",
      color: "#ffffff",
      padding: { x: 12, y: 8 },
    }).setInteractive({ useHandCursor: true });

    this.loginButton.on("pointerdown", async () => {
      await this.handleLogin();
    });

    this.registerButton.on("pointerdown", async () => {
      await this.handleRegister();
    });
  }

  getFormValues() {
    const username = this.usernameInput.node.value.trim();
    const password = this.passwordInput.node.value.trim();

    return { username, password };
  }

  setStatus(message, color = "#ffcc00") {
    this.statusText.setColor(color);
    this.statusText.setText(message);
  }

  setInputsDisabled(disabled) {
    this.usernameInput.node.disabled = disabled;
    this.passwordInput.node.disabled = disabled;
    this.loginButton.disableInteractive();
    this.registerButton.disableInteractive();

    if (!disabled) {
      this.loginButton.setInteractive({ useHandCursor: true });
      this.registerButton.setInteractive({ useHandCursor: true });
    }
  }

  async handleLogin() {
    const { username, password } = this.getFormValues();

    if (!username || !password) {
      this.setStatus("Username and password are required.", "#ff6666");
      return;
    }

    this.setInputsDisabled(true);
    this.setStatus("Logging in...");

    try {
      const authResult = await AuthApi.login(username, password);
      ApiClient.setToken(authResult.user.access_token);

      const profile = await PlayerApi.me();
      GameState.setProfile(profile);

      this.setStatus("Login successful.", "#66ff99");

      this.time.delayedCall(300, () => {
        this.scene.start("HomeScene");
      });
    } catch (error) {
      ApiClient.clearToken();
      GameState.clear();
      this.setStatus(error.message || "Login failed.", "#ff6666");
    } finally {
      this.setInputsDisabled(false);
    }
  }

  async handleRegister() {
    const { username, password } = this.getFormValues();

    if (!username || !password) {
      this.setStatus("Username and password are required.", "#ff6666");
      return;
    }

    this.setInputsDisabled(true);
    this.setStatus("Registering...");

    try {
      const authResult = await AuthApi.register(username, password);
      ApiClient.setToken(authResult.user.access_token);

      const profile = await PlayerApi.me();
      GameState.setProfile(profile);

      this.setStatus("Registration successful.", "#66ff99");

      this.time.delayedCall(300, () => {
        this.scene.start("HomeScene");
      });
    } catch (error) {
      ApiClient.clearToken();
      GameState.clear();
      this.setStatus(error.message || "Registration failed.", "#ff6666");
    } finally {
      this.setInputsDisabled(false);
    }
  }
}