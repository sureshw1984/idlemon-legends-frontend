import ApiClient from "./ApiClient.js";

export default class AuthApi {
  static async register(username, password) {
    return ApiClient.post(
      "/auth/register",
      {
        username,
        password,
      },
      false
    );
  }

  static async login(username, password) {
    return ApiClient.post(
      "/auth/login",
      {
        username,
        password,
      },
      false
    );
  }

  static logout() {
    ApiClient.clearToken();
  }
}