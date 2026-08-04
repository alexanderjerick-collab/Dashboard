import axios from "axios";

const groupsApi = axios.create({
  baseURL: "https://groups.roblox.com",
  timeout: 10000,
});

const usersApi = axios.create({
  baseURL: "https://users.roblox.com",
  timeout: 10000,
});

const thumbnailsApi = axios.create({
  baseURL: "https://thumbnails.roblox.com",
  timeout: 10000,
});

function getCookieHeaders(cookie: string) {
  return {
    Cookie: `.ROBLOSECURITY=${cookie.replace(".ROBLOSECURITY=", "")}`,
    "X-CSRF-TOKEN": "",
  };
}

async function getXcsrfToken(cookie: string): Promise<string> {
  try {
    await axios.post(
      "https://auth.roblox.com/v2/logout",
      {},
      { headers: getCookieHeaders(cookie), validateStatus: () => true }
    );
  } catch (e: unknown) {
    const err = e as { response?: { headers?: Record<string, string> } };
    return err?.response?.headers?.["x-csrf-token"] || "";
  }
  return "";
}

export const robloxClient = {
  async getGroup(groupId: string) {
    const res = await groupsApi.get(`/v1/groups/${groupId}`);
    return res.data;
  },

  async getGroupMembers(groupId: string, cursor?: string) {
    const params: Record<string, string> = { limit: "100" };
    if (cursor) params.cursor = cursor;
    const res = await groupsApi.get(`/v2/groups/${groupId}/users`, { params });
    return res.data;
  },

  async getRoles(groupId: string) {
    const res = await groupsApi.get(`/v1/groups/${groupId}/roles`);
    return res.data;
  },

  async getMemberRole(groupId: string, userId: string) {
    const res = await groupsApi.get(`/v2/groups/${groupId}/users`, {
      params: { userId },
    });
    return res.data;
  },

  async setRank(groupId: string, userId: string, rankId: number, cookie: string) {
    const token = await getXcsrfToken(cookie);
    const res = await groupsApi.patch(
      `/v1/groups/${groupId}/users/${userId}`,
      { roleId: rankId },
      {
        headers: {
          ...getCookieHeaders(cookie),
          "X-CSRF-TOKEN": token,
        },
      }
    );
    return res.data;
  },

  async exile(groupId: string, userId: string, cookie: string) {
    const token = await getXcsrfToken(cookie);
    const res = await groupsApi.delete(`/v1/groups/${groupId}/users/${userId}`, {
      headers: {
        ...getCookieHeaders(cookie),
        "X-CSRF-TOKEN": token,
      },
    });
    return res.data;
  },

  async acceptJoinRequest(groupId: string, userId: string, cookie: string) {
    const token = await getXcsrfToken(cookie);
    const res = await groupsApi.post(
      `/v1/groups/${groupId}/join-requests/users/${userId}`,
      {},
      {
        headers: {
          ...getCookieHeaders(cookie),
          "X-CSRF-TOKEN": token,
        },
      }
    );
    return res.data;
  },

  async declineJoinRequest(groupId: string, userId: string, cookie: string) {
    const token = await getXcsrfToken(cookie);
    const res = await groupsApi.delete(
      `/v1/groups/${groupId}/join-requests/users/${userId}`,
      {
        headers: {
          ...getCookieHeaders(cookie),
          "X-CSRF-TOKEN": token,
        },
      }
    );
    return res.data;
  },

  async getJoinRequests(groupId: string, cursor?: string) {
    const params: Record<string, string> = { limit: "100" };
    if (cursor) params.cursor = cursor;
    const res = await groupsApi.get(`/v1/groups/${groupId}/join-requests`, { params });
    return res.data;
  },

  async getUserInfo(userId: string) {
    const res = await usersApi.get(`/v1/users/${userId}`);
    return res.data;
  },

  async getUserAvatar(userId: string) {
    const res = await thumbnailsApi.get(`/v1/users/avatar-headshot`, {
      params: { userIds: userId, size: "48x48", format: "Png" },
    });
    return res.data?.data?.[0]?.imageUrl || null;
  },

  async getUsersByUsernames(usernames: string[]) {
    const res = await usersApi.post("/v1/usernames/users", { usernames, excludeBannedUsers: false });
    return res.data;
  },

  async searchUsers(keyword: string) {
    const res = await usersApi.get("/v1/users/search", { params: { keyword, limit: 10 } });
    return res.data;
  },
};
