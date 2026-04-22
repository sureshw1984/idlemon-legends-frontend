import ApiClient from "./ApiClient.js";

export default class PlayerApi {
  /**
   * Get full player profile
   * Includes:
   * - player stats
   * - monsters
   * - inventory
   * - team
   */
  static async me() {
    return ApiClient.get("/player/me");
  }
}