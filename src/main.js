import BootScene from "./scenes/BootScene.js";
import LoginScene from "./scenes/LoginScene.js";
import HomeScene from "./scenes/HomeScene.js";
import SummonScene from "./scenes/SummonScene.js";
import MonstersScene from "./scenes/MonstersScene.js";
import TeamScene from "./scenes/TeamScene.js";
import BattleScene from "./scenes/BattleScene.js";

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  parent: "game-container",
  backgroundColor: "#1b1b1b",

  dom: {
    createContainer: true,
  },

  scene: [
    BootScene,
    LoginScene,
    HomeScene,
    SummonScene,
    MonstersScene,
    TeamScene,
    BattleScene,
  ],
};

new Phaser.Game(config);