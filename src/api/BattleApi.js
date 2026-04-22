import ApiClient from "./ApiClient.js";

export default class BattleApi {
  /**
   * Run one battle tick
   */
  static async tick() {
    return ApiClient.post("/battle/tick", {});
  }

  /**
   * Claim offline reward
   */
  static async offlineReward() {
    return ApiClient.post("/battle/offline-reward", {});
  }
}