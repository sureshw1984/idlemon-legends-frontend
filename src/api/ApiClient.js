export default class ApiClient {
  static baseUrl = "http://idlemon.api";

  static getToken() {
    return localStorage.getItem("idlemon_token") || "";
  }

  static setToken(token) {
    localStorage.setItem("idlemon_token", token);
  }

  static clearToken() {
    localStorage.removeItem("idlemon_token");
  }

  static async request(method, path, body = null, requiresAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (requiresAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    let data = null;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Invalid server response.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  static get(path, requiresAuth = true) {
    return this.request("GET", path, null, requiresAuth);
  }

  static post(path, body = {}, requiresAuth = true) {
    return this.request("POST", path, body, requiresAuth);
  }
}