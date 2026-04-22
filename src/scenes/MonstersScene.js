import MonsterApi from "../api/MonsterApi.js";
import PlayerApi from "../api/PlayerApi.js";
import GameState from "../managers/GameState.js";

export default class MonstersScene extends Phaser.Scene {
  constructor() {
    super("MonstersScene");
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
    this.craftContainer = this.add.container(460, 110);

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