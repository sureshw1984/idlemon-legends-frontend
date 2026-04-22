import TeamApi from "../api/TeamApi.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class TeamScene extends Phaser.Scene {
  constructor() {
    super("TeamScene");
    this.selectedMonster = null;
  }

  create() {
    this.add.text(30, 20, "Team", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.statusText = this.add.text(30, 540, "", {
      fontSize: "18px",
      color: "#ffcc00",
      wordWrap: { width: 820 },
    });

    this.teamTitle = this.add.text(30, 70, "Current Team", {
      fontSize: "24px",
      color: "#66ccff",
    });

    this.monsterTitle = this.add.text(430, 70, "Owned Monsters", {
      fontSize: "24px",
      color: "#66ff99",
    });

    this.selectionText = this.add.text(430, 500, "Selected: none", {
      fontSize: "18px",
      color: "#ffffff",
      wordWrap: { width: 360 },
    });

    this.teamContainer = this.add.container(30, 110);
    this.monsterContainer = this.add.container(430, 110);

    this.makeButton(30, 490, "Auto Fill", async () => {
      await this.handleAutoFill();
    });

    this.makeButton(170, 490, "Clear All", async () => {
      await this.handleClearAll();
    });

    this.makeButton(310, 490, "Refresh", async () => {
      await this.handleRefresh();
    });

    this.makeButton(430, 540, "Back", () => {
      this.scene.start("HomeScene");
    });

    this.renderAll();
  }

  makeButton(x, y, label, callback) {
    const button = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: "24px",
      backgroundColor: "#333333",
      color: "#ffffff",
      padding: { x: 12, y: 8 },
    }).setInteractive({ useHandCursor: true });

    button.on("pointerdown", callback);
    return button;
  }

  clearContainer(container) {
    container.removeAll(true);
  }

  renderAll() {
    this.renderTeam();
    this.renderOwnedMonsters();
    this.renderSelectedMonster();
  }

  renderSelectedMonster() {
    if (!this.selectedMonster) {
      this.selectionText.setText("Selected: none");
      return;
    }

    this.selectionText.setText(
      `Selected: ${this.selectedMonster.name} (Lv ${this.selectedMonster.level}, ${this.selectedMonster.rarity})`
    );
  }

  renderTeam() {
    this.clearContainer(this.teamContainer);

    const team = GameState.getTeam();
    const teamBySlot = {};

    team.forEach((row) => {
      teamBySlot[row.slot_no] = row;
    });

    let y = 0;

    for (let slot = 1; slot <= 5; slot++) {
      const row = teamBySlot[slot];

      const slotText = this.add.text(0, y, `Slot ${slot}`, {
        fontSize: "20px",
        color: "#ffffff",
      });
      this.teamContainer.add(slotText);

      if (row) {
        const info = this.add.text(0, y + 28, [
          `${row.name} (${row.rarity})`,
          `Lv ${row.level} | Star ${row.star}`,
          `ATK ${row.base_attack} | HP ${row.base_hp}`,
        ].join("\n"), {
          fontSize: "16px",
          color: "#ffffff",
          lineSpacing: 4,
          wordWrap: { width: 240 },
        });
        this.teamContainer.add(info);

        const clearBtn = this.add.text(250, y + 18, "[ Clear ]", {
          fontSize: "18px",
          backgroundColor: "#7a1f1f",
          color: "#ffffff",
          padding: { x: 10, y: 6 },
        }).setInteractive({ useHandCursor: true });

        clearBtn.on("pointerdown", async () => {
          await this.handleClearSlot(slot);
        });

        this.teamContainer.add(clearBtn);
      } else {
        const empty = this.add.text(0, y + 28, "Empty slot", {
          fontSize: "16px",
          color: "#aaaaaa",
        });
        this.teamContainer.add(empty);
      }

      const assignBtn = this.add.text(250, y + 58, "[ Assign ]", {
        fontSize: "18px",
        backgroundColor: this.selectedMonster ? "#2e7d32" : "#555555",
        color: "#ffffff",
        padding: { x: 10, y: 6 },
      });

      if (this.selectedMonster) {
        assignBtn.setInteractive({ useHandCursor: true });
        assignBtn.on("pointerdown", async () => {
          await this.handleSetSlot(slot, this.selectedMonster.user_monster_id);
        });
      }

      this.teamContainer.add(assignBtn);

      y += 95;
    }
  }

  renderOwnedMonsters() {
    this.clearContainer(this.monsterContainer);

    const monsters = GameState.getMonsters();

    if (!monsters.length) {
      const text = this.add.text(0, 0, "No owned monsters.", {
        fontSize: "18px",
        color: "#ffffff",
      });
      this.monsterContainer.add(text);
      return;
    }

    let y = 0;

    monsters.forEach((monster, index) => {
      const isSelected =
        this.selectedMonster &&
        this.selectedMonster.user_monster_id === monster.user_monster_id;

      const info = this.add.text(0, y, [
        `${index + 1}. ${monster.name} (${monster.rarity})`,
        `Lv ${monster.level} | Star ${monster.star}`,
        `ATK ${monster.base_attack} | HP ${monster.base_hp}`,
      ].join("\n"), {
        fontSize: "16px",
        color: isSelected ? "#a5ffb2" : "#ffffff",
        lineSpacing: 4,
        wordWrap: { width: 230 },
      });

      this.monsterContainer.add(info);

      const selectBtn = this.add.text(250, y + 18, isSelected ? "[ Selected ]" : "[ Select ]", {
        fontSize: "18px",
        backgroundColor: isSelected ? "#2e7d32" : "#333333",
        color: "#ffffff",
        padding: { x: 10, y: 6 },
      }).setInteractive({ useHandCursor: true });

      selectBtn.on("pointerdown", () => {
        this.selectedMonster = monster;
        this.renderAll();
        this.setStatus(`${monster.name} selected.`);
      });

      this.monsterContainer.add(selectBtn);

      y += 88;
    });
  }

  async handleSetSlot(slotNo, userMonsterId) {
    this.setStatus(`Assigning monster to slot ${slotNo}...`);

    try {
      const result = await TeamApi.setSlot(slotNo, userMonsterId);
      await this.refreshProfileFromResult(result);
      this.renderAll();
      this.setStatus(`Slot ${slotNo} updated.`, "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Failed to set slot.", "#ff6666");
    }
  }

  async handleClearSlot(slotNo) {
    this.setStatus(`Clearing slot ${slotNo}...`);

    try {
      const result = await TeamApi.clearSlot(slotNo);
      await this.refreshProfileFromResult(result);
      this.renderAll();
      this.setStatus(`Slot ${slotNo} cleared.`, "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Failed to clear slot.", "#ff6666");
    }
  }

  async handleClearAll() {
    this.setStatus("Clearing full team...");

    try {
      const result = await TeamApi.clearAll();
      await this.refreshProfileFromResult(result);
      this.renderAll();
      this.setStatus("Team cleared.", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Failed to clear team.", "#ff6666");
    }
  }

  async handleAutoFill() {
    this.setStatus("Auto-filling team...");

    try {
      const result = await TeamApi.autoFill();
      await this.refreshProfileFromResult(result);
      this.renderAll();
      this.setStatus("Team auto-filled.", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Failed to auto-fill team.", "#ff6666");
    }
  }

  async handleRefresh() {
    this.setStatus("Refreshing...");
    try {
      await this.refreshProfile();
      this.renderAll();
      this.setStatus("Team data refreshed.", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Refresh failed.", "#ff6666");
    }
  }

  async refreshProfile() {
    const profile = await PlayerApi.me();
    GameState.setProfile(profile);
  }

  async refreshProfileFromResult(result) {
    if (result && result.team) {
      GameState.updateTeam(result.team);
      await this.refreshProfile();
      return;
    }

    await this.refreshProfile();
  }

  setStatus(message, color = "#ffcc00") {
    this.statusText.setColor(color);
    this.statusText.setText(message);
  }
}