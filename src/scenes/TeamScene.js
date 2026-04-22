import TeamApi from "../api/TeamApi.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class TeamScene extends Phaser.Scene {
  constructor() {
    super("TeamScene");
    this.selectedMonster = null;

    this.monsterScrollY = 0;
    this.monsterViewportHeight = 360;
    this.monsterContentHeight = 0;
    this.monsterBaseY = 120;
  }

  create() {
    this.add.text(30, 20, "Team", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.add.text(30, 70, "Current Team", {
      fontSize: "24px",
      color: "#66ccff",
    });

    this.add.text(470, 70, "Owned Monsters", {
      fontSize: "24px",
      color: "#66ff99",
    });

    this.statusText = this.add.text(30, 550, "", {
      fontSize: "18px",
      color: "#ffcc00",
      wordWrap: { width: 840 },
    });

    this.selectionText = this.add.text(470, 500, "Selected: none", {
      fontSize: "18px",
      color: "#ffffff",
      wordWrap: { width: 360 },
    });

    this.teamContainer = this.add.container(30, 110);

    this.monsterPanelBg = this.add.rectangle(
      460,
      this.monsterBaseY - 10,
      400,
      this.monsterViewportHeight + 20,
      0x1e1e1e,
      0.35
    ).setOrigin(0, 0);

    this.monsterContainer = this.add.container(470, this.monsterBaseY);

    this.monsterMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
    this.monsterMaskShape.fillStyle(0xffffff);
    this.monsterMaskShape.fillRect(470, this.monsterBaseY, 340, this.monsterViewportHeight);

    this.monsterMask = this.monsterMaskShape.createGeometryMask();
    this.monsterContainer.setMask(this.monsterMask);

    this.scrollTrack = this.add.rectangle(
      820,
      this.monsterBaseY,
      12,
      this.monsterViewportHeight,
      0x444444,
      0.8
    ).setOrigin(0, 0);

    this.scrollThumb = this.add.rectangle(
      820,
      this.monsterBaseY,
      12,
      60,
      0x888888,
      1
    )
      .setOrigin(0, 0)
      .setInteractive({ draggable: true, useHandCursor: true });

    this.input.setDraggable(this.scrollThumb);

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      if (gameObject === this.scrollThumb) {
        this.handleThumbDrag(dragY);
      }
    });

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      this.handleMonsterScroll(deltaY);
    });

    this.createBottomButtons();
    this.renderAll();
  }

  createBottomButtons() {
    this.makeButton(30, 500, "Auto Fill", async () => {
      await this.handleAutoFill();
    });

    this.makeButton(170, 500, "Clear All", async () => {
      await this.handleClearAll();
    });

    this.makeButton(310, 500, "Refresh", async () => {
      await this.handleRefresh();
    });

    this.makeButton(470, 530, "Back", () => {
      this.scene.start("HomeScene");
    });
  }

  makeButton(x, y, label, callback, bg = "#333333") {
    const button = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: "22px",
      backgroundColor: bg,
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
    this.updateMonsterScrollVisuals();
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

      const card = this.add.rectangle(0, y, 390, 72, 0x202020, 0.75).setOrigin(0, 0);
      this.teamContainer.add(card);

      const slotLabel = this.add.text(12, y + 10, `Slot ${slot}`, {
        fontSize: "18px",
        color: "#66ccff",
      });
      this.teamContainer.add(slotLabel);

      if (row) {
        const info = this.add.text(
          12,
          y + 34,
          `${row.name} (${row.rarity})  |  Lv ${row.level}  |  ATK ${row.base_attack}`,
          {
            fontSize: "16px",
            color: "#ffffff",
            wordWrap: { width: 210 },
          }
        );
        this.teamContainer.add(info);

        const clearBtn = this.add.text(275, y + 18, "[ Clear ]", {
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
        const empty = this.add.text(12, y + 34, "Empty slot", {
          fontSize: "16px",
          color: "#aaaaaa",
        });
        this.teamContainer.add(empty);
      }

      if (this.selectedMonster) {
        const assignBtn = this.add.text(275, y + 18 + (row ? 34 : 0), "[ Assign ]", {
          fontSize: "18px",
          backgroundColor: "#2e7d32",
          color: "#ffffff",
          padding: { x: 10, y: 6 },
        }).setInteractive({ useHandCursor: true });

        assignBtn.on("pointerdown", async () => {
          await this.handleSetSlot(slot, this.selectedMonster.user_monster_id);
        });

        this.teamContainer.add(assignBtn);
      }

      y += 82;
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
      this.monsterContentHeight = 40;
      this.monsterScrollY = 0;
      return;
    }

    let y = 0;

    monsters.forEach((monster, index) => {
      const isSelected =
        this.selectedMonster &&
        this.selectedMonster.user_monster_id === monster.user_monster_id;

      const card = this.add.rectangle(0, y, 330, 74, isSelected ? 0x234d23 : 0x202020, 0.8)
        .setOrigin(0, 0);
      this.monsterContainer.add(card);

      const info = this.add.text(
        12,
        y + 10,
        `${index + 1}. ${monster.name} (${monster.rarity})\nLv ${monster.level} | Star ${monster.star} | ATK ${monster.base_attack}`,
        {
          fontSize: "16px",
          color: isSelected ? "#b8ffb8" : "#ffffff",
          lineSpacing: 4,
          wordWrap: { width: 220 },
        }
      );
      this.monsterContainer.add(info);

      const selectBtn = this.add.text(240, y + 18, isSelected ? "[ Selected ]" : "[ Select ]", {
        fontSize: "18px",
        backgroundColor: isSelected ? "#2e7d32" : "#333333",
        color: "#ffffff",
        padding: { x: 10, y: 6 },
      }).setInteractive({ useHandCursor: true });

      selectBtn.on("pointerdown", () => {
        this.selectedMonster =
          isSelected ? null : monster;
        this.renderAll();
        this.setStatus(
          this.selectedMonster ? `${monster.name} selected.` : "Selection cleared."
        );
      });

      this.monsterContainer.add(selectBtn);

      y += 84;
    });

    this.monsterContentHeight = y;
    this.clampMonsterScroll();
  }

  handleMonsterScroll(deltaY) {
    if (this.monsterContentHeight <= this.monsterViewportHeight) {
      return;
    }

    this.monsterScrollY -= deltaY * 0.5;
    this.clampMonsterScroll();
    this.updateMonsterScrollVisuals();
  }

  clampMonsterScroll() {
    const maxScroll = Math.max(0, this.monsterContentHeight - this.monsterViewportHeight);

    if (this.monsterScrollY > 0) {
      this.monsterScrollY = 0;
    }

    if (this.monsterScrollY < -maxScroll) {
      this.monsterScrollY = -maxScroll;
    }
  }

  updateMonsterScrollVisuals() {
    this.monsterContainer.y = this.monsterBaseY + this.monsterScrollY;

    const maxScroll = Math.max(0, this.monsterContentHeight - this.monsterViewportHeight);

    if (maxScroll <= 0) {
      this.scrollThumb.setVisible(false);
      this.scrollTrack.setVisible(false);
      return;
    }

    this.scrollThumb.setVisible(true);
    this.scrollTrack.setVisible(true);

    const thumbMinHeight = 40;
    const thumbHeight = Math.max(
      thumbMinHeight,
      (this.monsterViewportHeight / this.monsterContentHeight) * this.monsterViewportHeight
    );

    this.scrollThumb.height = thumbHeight;

    const availableTrack = this.monsterViewportHeight - thumbHeight;
    const progress = Math.abs(this.monsterScrollY) / maxScroll;
    const thumbY = this.monsterBaseY + availableTrack * progress;

    this.scrollThumb.y = thumbY;
  }

  handleThumbDrag(dragY) {
    const thumbHeight = this.scrollThumb.height;
    const minY = this.monsterBaseY;
    const maxY = this.monsterBaseY + this.monsterViewportHeight - thumbHeight;

    const clampedY = Phaser.Math.Clamp(dragY, minY, maxY);
    this.scrollThumb.y = clampedY;

    const maxScroll = Math.max(0, this.monsterContentHeight - this.monsterViewportHeight);
    const availableTrack = this.monsterViewportHeight - thumbHeight;

    if (availableTrack <= 0 || maxScroll <= 0) {
      this.monsterScrollY = 0;
    } else {
      const progress = (clampedY - minY) / availableTrack;
      this.monsterScrollY = -maxScroll * progress;
    }

    this.monsterContainer.y = this.monsterBaseY + this.monsterScrollY;
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
      this.selectedMonster = null;
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
      this.selectedMonster = null;
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