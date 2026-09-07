jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    users: { findUnique: jest.fn() },
    tasks: { findMany: jest.fn() },
  },
}));

import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { getTasks } from "@/actions/projects/get-tasks";

const mockUser = (role: "user" | "manager" | "admin", id = "u1") => {
  (getSession as jest.Mock).mockResolvedValue({ user: { id } });
  (prismadb.users.findUnique as jest.Mock).mockResolvedValue({ id, role });
};

describe("getTasks scope", () => {
  beforeEach(() => jest.clearAllMocks());

  it("unauthenticated returns []", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await getTasks();
    expect(res).toEqual([]);
    expect(prismadb.tasks.findMany).not.toHaveBeenCalled();
  });

  it("user role: keeps board scope and includes own standalone tasks", async () => {
    mockUser("user", "u1");
    (prismadb.tasks.findMany as jest.Mock).mockResolvedValue([]);
    await getTasks();
    const call = (prismadb.tasks.findMany as jest.Mock).mock.calls[0][0];
    const [boardTasks, standaloneTasks] = call.where.OR;
    expect(boardTasks.assigned_section.board_relation).toBeDefined();
    expect(Array.isArray(boardTasks.assigned_section.board_relation.OR)).toBe(true);
    expect(standaloneTasks).toEqual({
      section: null,
      OR: [{ createdBy: "u1" }, { user: "u1" }],
    });
  });

  it("user role: returns tasks", async () => {
    mockUser("user", "u1");
    (prismadb.tasks.findMany as jest.Mock).mockResolvedValue([{ id: "t1" }]);
    const res = await getTasks();
    expect(res).toEqual([{ id: "t1" }]);
  });

  it("manager: can read all standalone tasks and uses bare board scope", async () => {
    mockUser("manager", "m1");
    (prismadb.tasks.findMany as jest.Mock).mockResolvedValue([]);
    await getTasks();
    const call = (prismadb.tasks.findMany as jest.Mock).mock.calls[0][0];
    const [boardTasks, standaloneTasks] = call.where.OR;
    expect(boardTasks.assigned_section.board_relation.OR).toBeUndefined();
    expect(boardTasks.assigned_section.board_relation.deletedAt).toBeNull();
    expect(standaloneTasks).toEqual({ section: null });
  });
});
