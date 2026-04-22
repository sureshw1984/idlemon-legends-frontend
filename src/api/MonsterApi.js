import ApiClient from "./ApiClient.js";

export default class MonsterApi {
  /**
   * Get owned full monsters
   */
  static async getAll() {
    return ApiClient.get("/monsters");
  }

  /**
   * Summon (returns monster pieces)
   */
  static async summon(bannerId = null) {
    const body = {};

    if (bannerId !== null) {
      body.banner_id = bannerId;
    }

    return ApiClient.post("/monsters/summon", body);
  }

  /**
   * Craft full monster from pieces
   */
  static async craft(monsterId) {
    return ApiClient.post("/monsters/craft", {
      monster_id: monsterId,
    });
  }
}