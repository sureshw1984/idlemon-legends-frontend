import ApiClient from "./ApiClient.js";

export default class TeamApi {
  /**
   * Get current team
   */
  static async getTeam() {
    return ApiClient.get("/team");
  }

  /**
   * Set one monster into one slot
   */
  static async setSlot(slotNo, userMonsterId) {
    return ApiClient.post("/team/set-slot", {
      slot_no: slotNo,
      user_monster_id: userMonsterId,
    });
  }

  /**
   * Clear one slot
   */
  static async clearSlot(slotNo) {
    return ApiClient.post("/team/clear-slot", {
      slot_no: slotNo,
    });
  }

  /**
   * Clear full team
   */
  static async clearAll() {
    return ApiClient.post("/team/clear-all", {});
  }

  /**
   * Auto-fill best available monsters
   */
  static async autoFill() {
    return ApiClient.post("/team/auto-fill", {});
  }
}