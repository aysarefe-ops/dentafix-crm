jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    users: { findUnique: jest.fn(), findMany: jest.fn() },
    crm_Leads: { findFirst: jest.fn() },
  },
}));

import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { getLead } from "@/actions/crm/get-lead";

const mockUser = (role: "user" | "manager" | "admin", id = "u1") => {
  (getSession as jest.Mock).mockResolvedValue({ user: { id } });
  (prismadb.users.findUnique as jest.Mock).mockResolvedValue({ id, role });
};

describe("getLead scope", () => {
  beforeEach(() => jest.clearAllMocks());

  it("unauthenticated returns null and does not query lead", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await getLead("l1");
    expect(res).toBeNull();
    expect(prismadb.crm_Leads.findFirst).not.toHaveBeenCalled();
  });

  it("user out-of-scope returns null (assert miss)", async () => {
    mockUser("user", "u1");
    (prismadb.crm_Leads.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await getLead("l1");
    expect(res).toBeNull();
    // only the assert call ran; detail call short-circuited
    expect(prismadb.crm_Leads.findFirst).toHaveBeenCalledTimes(1);
  });

  it("owner returns lead detail", async () => {
    mockUser("user", "u1");
    (prismadb.crm_Leads.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: "l1" })
      .mockResolvedValueOnce({ id: "l1", firstName: "Alice" });
    const res = await getLead("l1");
    expect(res).toMatchObject({ id: "l1", firstName: "Alice" });
    expect(prismadb.crm_Leads.findFirst).toHaveBeenCalledTimes(2);
  });

  it("manager returns lead detail (no OR in assert where)", async () => {
    mockUser("manager", "m1");
    (prismadb.crm_Leads.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: "l1" })
      .mockResolvedValueOnce({ id: "l1", firstName: "Alice" });
    const res = await getLead("l1");
    expect(res).toMatchObject({ id: "l1", firstName: "Alice" });
    const assertCall = (prismadb.crm_Leads.findFirst as jest.Mock).mock.calls[0][0];
    expect(assertCall.where.OR).toBeUndefined();
  });

  it("returns creator and updater metadata without fetching all users", async () => {
    mockUser("user", "u1");
    (prismadb.crm_Leads.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: "l1" })
      .mockResolvedValueOnce({
        id: "l1",
        firstName: "Alice",
        createdBy: "u2",
        updatedBy: "u3",
      });
    (prismadb.users.findMany as jest.Mock).mockResolvedValue([
      { id: "u2", name: "Oluşturan Kullanıcı" },
      { id: "u3", name: "Güncelleyen Kullanıcı" },
    ]);

    const res = await getLead("l1");

    expect(res).toMatchObject({
      created_by_user: { name: "Oluşturan Kullanıcı" },
      updated_by_user: { name: "Güncelleyen Kullanıcı" },
    });
    expect(prismadb.users.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["u2", "u3"] } },
      select: { id: true, name: true },
    });
  });
});
