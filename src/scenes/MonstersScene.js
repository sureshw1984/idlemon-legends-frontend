import MonsterApi from "../api/MonsterApi.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class MonstersScene extends Phaser.Scene {
  constructor() {
    super("MonstersScene");

    this.craftScrollY = 0;
    this.craftViewportHeight = 380;
    this.craftContentHeight = 0;
    this.craftBaseY = 110;
  }

  create() {
    this.add.text(30, 20, "Monsters", {
      fontSize: "32px",
      color: "#ffffff",
    });

    this.statusText = this.add.text(30, 540, "", {
      fontSize: "18px",
      color: "#ffcc00",
      wordWrap: { width: 820 },
    });

    this.ownedTitle = this.add.text(30, 70, "Owned Monsters", {
      fontSize: "24px",
      color: "#66ccff",
    });

    this.craftTitle = this.add.text(460, 70, "Craft From Pieces", {
      fontSize: "24px",
      color: "#66ff99",
    });

    this.ownedContainer = this.add.container(30, 110);

    // Craft panel background
    this.craftPanelBg = this.add.rectangle(
      450,
      this.craftBaseY - 10,
      410,
      this.craftViewportHeight + 20,
      0x1e1e1e,
      0.35
    ).setOrigin(0, 0);

    this.craftContainer = this.add.container(460, this.craftBaseY);

    // Mask graphics for craft panel
    this.craftMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
    this.craftMaskShape.fillStyle(0xffffff);
    this.craftMaskShape.fillRect(460, this.craftBaseY, 360, this.craftViewportHeight);

    this.craftMask = this.craftMaskShape.createGeometryMask();
    this.craftContainer.setMask(this.craftMask);

    // Scrollbar track
    this.scrollTrack = this.add.rectangle(
      835,
      this.craftBaseY,
      12,
      this.craftViewportHeight,
      0x444444,
      0.8
    ).setOrigin(0, 0);

    // Scrollbar thumb
    this.scrollThumb = this.add.rectangle(
      835,
      this.craftBaseY,
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
      this.handleCraftScroll(deltaY);
    });

    this.makeButton(30, 490, "Refresh", async () => {
      await this.handleRefresh();
    });

    this.makeButton(170, 490, "Back", () => {
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
    this.renderOwnedMonsters();
    this.renderCraftableMonsters();
    this.updateCraftScrollVisuals();
  }

  renderOwnedMonsters() {
    this.clearContainer(this.ownedContainer);

    const monsters = GameState.getMonsters();

    if (!monsters.length) {
      const text = this.add.text(0, 0, "No full monsters yet.", {
        fontSize: "18px",
        color: "#ffffff",
      });
      this.ownedContainer.add(text);
      return;
    }

    let y = 0;

    monsters.forEach((monster, index) => {
      const lines = [
        `${index + 1}. ${monster.name} (${monster.rarity})`,
        `Element: ${monster.element}`,
        `Level: ${monster.level} | Star: ${monster.star}`,
        `ATK: ${monster.base_attack} | HP: ${monster.base_hp}`,
      ];

      const block = this.add.text(0, y, lines.join("\n"), {
        fontSize: "17px",
        color: "#ffffff",
        lineSpacing: 4,
        wordWrap: { width: 360 },
      });

      this.ownedContainer.add(block);
      y += 95;
    });
  }

  renderCraftableMonsters() {
    this.clearContainer(this.craftContainer);

    const inventory = GameState.getInventory().filter(
      (item) => item.item_type === "monster_piece"
    );

    if (!inventory.length) {
      const text = this.add.text(0, 0, "No monster pieces found.", {
        fontSize: "18px",
        color: "#ffffff",
      });
      this.craftContainer.add(text);
      this.craftContentHeight = 40;
      this.craftScrollY = 0;
      return;
    }

    let y = 0;

    inventory.forEach((item) => {
      const ownedPieces = item.quantity;
      const requiredPieces = item.pieces_required ?? 0;
      const linkedMonsterId = item.linked_monster_id;
      const canCraft = linkedMonsterId && ownedPieces >= requiredPieces;

      const lines = [
        `${item.monster_name ?? item.name}`,
        `Rarity: ${item.rarity ?? "-"}`,
        `Pieces: ${ownedPieces}/${requiredPieces}`,
      ];

      const infoText = this.add.text(0, y, lines.join("\n"), {
        fontSize: "17px",
        color: canCraft ? "#a5ffb2" : "#ffffff",
        lineSpacing: 4,
        wordWrap: { width: 240 },
      });

      this.craftContainer.add(infoText);

      if (linkedMonsterId) {
        const button = this.add.text(250, y + 10, "[ Craft ]", {
          fontSize: "20px",
          backgroundColor: canCraft ? "#2e7d32" : "#555555",
          color: "#ffffff",
          padding: { x: 10, y: 6 },
        });

        if (canCraft) {
          button.setInteractive({ useHandCursor: true });
          button.on("pointerdown", async () => {
            await this.handleCraft(linkedMonsterId, item.monster_name ?? item.name);
          });
        }

        this.craftContainer.add(button);
      }

      y += 95;
    });

    this.craftContentHeight = y;
    this.clampCraftScroll();
  }

  handleCraftScroll(deltaY) {
    if (this.craftContentHeight <= this.craftViewportHeight) {
      return;
    }

    this.craftScrollY -= deltaY * 0.5;
    this.clampCraftScroll();
    this.updateCraftScrollVisuals();
  }

  clampCraftScroll() {
    const maxScroll = Math.max(0, this.craftContentHeight - this.craftViewportHeight);

    if (this.craftScrollY > 0) {
      this.craftScrollY = 0;
    }

    if (this.craftScrollY < -maxScroll) {
      this.craftScrollY = -maxScroll;
    }
  }

  updateCraftScrollVisuals() {
    this.craftContainer.y = this.craftBaseY + this.craftScrollY;

    const maxScroll = Math.max(0, this.craftContentHeight - this.craftViewportHeight);

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
      (this.craftViewportHeight / this.craftContentHeight) * this.craftViewportHeight
    );

    this.scrollThumb.height = thumbHeight;

    const availableTrack = this.craftViewportHeight - thumbHeight;
    const progress = Math.abs(this.craftScrollY) / maxScroll;
    const thumbY = this.craftBaseY + availableTrack * progress;

    this.scrollThumb.y = thumbY;
  }

  handleThumbDrag(dragY) {
    const thumbHeight = this.scrollThumb.height;
    const minY = this.craftBaseY;
    const maxY = this.craftBaseY + this.craftViewportHeight - thumbHeight;

    const clampedY = Phaser.Math.Clamp(dragY, minY, maxY);
    this.scrollThumb.y = clampedY;

    const maxScroll = Math.max(0, this.craftContentHeight - this.craftViewportHeight);
    const availableTrack = this.craftViewportHeight - thumbHeight;

    if (availableTrack <= 0 || maxScroll <= 0) {
      this.craftScrollY = 0;
    } else {
      const progress = (clampedY - minY) / availableTrack;
      this.craftScrollY = -maxScroll * progress;
    }

    this.craftContainer.y = this.craftBaseY + this.craftScrollY;
  }

  async handleCraft(monsterId, monsterName) {
    this.setStatus(`Crafting ${monsterName}...`);

    try {
      await MonsterApi.craft(monsterId);
      await this.refreshProfile();
      this.renderAll();
      this.setStatus(`${monsterName} crafted successfully!`, "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Craft failed.", "#ff6666");
    }
  }

  async handleRefresh() {
    this.setStatus("Refreshing...");
    try {
      await this.refreshProfile();
      this.renderAll();
      this.setStatus("Monster data refreshed.", "#66ff99");
    } catch (error) {
      this.setStatus(error.message || "Refresh failed.", "#ff6666");
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