"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function assertPlatform() {
  return new Promise<void>((resolve, reject) => {
    getServerSession(authOptions).then((session) => {
      const ctx = (session as unknown as { context?: string })?.context;
      if (ctx === "platform") resolve();
      else reject(new Error("Unauthorized"));
    }).catch(reject);
  });
}

export async function deleteErrorLog(id: string): Promise<{ error?: string }> {
  try {
    await assertPlatform();
    await prisma.errorLog.delete({ where: { id } });
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al eliminar" };
  }
}

export async function clearAllErrorLogs(): Promise<{ error?: string }> {
  try {
    await assertPlatform();
    await prisma.errorLog.deleteMany({});
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al limpiar" };
  }
}
