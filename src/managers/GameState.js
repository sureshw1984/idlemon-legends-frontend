export default class GameState {
  static profile = null;

  /**
   * Store full profile payload from /player/me
   */
  static setProfile(profile) {
    this.profile = profile;
  }

  /**
   * Get full profile
   */
  static getProfile() {
    return this.profile;
  }

  /**
   * Clear all runtime state (logout, auth fail, etc.)
   */
  static clear() {
    this.profile = null;
  }

  /**
   * Convenience getters
   */
  static getUser() {
    return this.profile?.user || null;
  }

  static getPlayer() {
    return this.profile?.player || null;
  }

  static getStats() {
    return this.profile?.stats || null;
  }

  static getMonsters() {
    return this.profile?.monsters || [];
  }

  static getTeam() {
    return this.profile?.team || [];
  }

  static getInventory() {
    return this.profile?.inventory || [];
  }

  /**
   * Partial updates
   */
  static updatePlayer(player) {
    if (!this.profile) return;
    this.profile.player = player;
  }

  static updateStats(stats) {
    if (!this.profile) return;
    this.profile.stats = stats;
  }

  static updateMonsters(monsters) {
    if (!this.profile) return;
    this.profile.monsters = monsters;
  }

  static updateTeam(team) {
    if (!this.profile) return;
    this.profile.team = team;
  }

  static updateInventory(inventory) {
    if (!this.profile) return;
    this.profile.inventory = inventory;
  }

  /**
   * Utility helpers
   */
  static getGold() {
    return this.profile?.player?.gold ?? 0;
  }

  static getGems() {
    return this.profile?.player?.gems ?? 0;
  }

  static getCurrentStage() {
    return this.profile?.player?.current_stage ?? 1;
  }

  /**
   * Get current quantity for a specific inventory item code
   * Example: piece_pyron
   */
  static getInventoryQuantityByCode(code) {
    const item = this.getInventory().find((row) => row.code === code);
    return item ? item.quantity : 0;
  }

  /**
   * Get piece count for a monster by monster_id
   */
  static getPiecesForMonster(monsterId) {
    const item = this.getInventory().find(
      (row) => row.linked_monster_id === monsterId
    );

    return item ? item.quantity : 0;
  }

  /**
   * Check if monster is craftable from pieces
   */
  static canCraftMonster(monsterId, piecesRequired) {
    return this.getPiecesForMonster(monsterId) >= piecesRequired;
  }
}