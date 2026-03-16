import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSION_KEYS = [
  "tenants.read", "tenants.create", "tenants.update", "tenants.suspend",
  "branding.read", "branding.update",
  "users.read", "users.create", "users.update", "users.delete",
  "members.read", "members.create", "members.update", "members.delete",
  "inventory.read", "inventory.create", "inventory.move", "inventory.adjust",
  "lots.read", "lots.create", "qr.generate", "qr.resolve",
  "weighings.read", "weighings.create", "scales.manage",
  "devices.read", "devices.manage", "reports.read",
  "tickets.read", "tickets.manage", "audit.read",
];

async function main() {
  console.log("Seeding...");

  const platformOwner = await prisma.platformUser.upsert({
    where: { email: "admin@gestorclubes.com" },
    update: {},
    create: {
      email: "admin@gestorclubes.com",
      passwordHash: await hash("Admin123!", 10),
      name: "Platform Admin",
      role: "platform_owner",
      status: "active",
    },
  });
  console.log("Platform user:", platformOwner.email);

  const permissions = await Promise.all(
    PERMISSION_KEYS.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, name: key.replace(".", " "), module: key.split(".")[0] },
      })
    )
  );
  console.log("Permissions:", permissions.length);

  const tenant1 = await prisma.tenant.upsert({
    where: { slug: "demo-club" },
    update: {},
    create: {
      name: "Demo Club",
      slug: "demo-club",
      status: "active",
      timezone: "America/Argentina/Buenos_Aires",
      locale: "es-AR",
      currency: "ARS",
    },
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant1.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      appName: "Demo Club",
      shortName: "DC",
      primaryColor: "#0f766e",
      secondaryColor: "#134e4a",
      accentColor: "#2dd4bf",
      darkModeDefault: false,
      loginTitle: "Bienvenido a Demo Club",
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: "club-ejemplo" },
    update: {
      name: "The Dab Club",
      status: "active",
      timezone: "America/Argentina/Buenos_Aires",
      locale: "es-AR",
      currency: "ARS",
    },
    create: {
      name: "The Dab Club",
      slug: "club-ejemplo",
      status: "active",
      timezone: "America/Argentina/Buenos_Aires",
      locale: "es-AR",
      currency: "ARS",
    },
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant2.id },
    update: {
      appName: "The Dab Club",
      shortName: "TDC",
      primaryColor: "#d4af37",
      secondaryColor: "#8a6f2f",
      accentColor: "#f3d27a",
      backgroundColor: "#0b0b0b",
      fontFamily: "var(--font-tdc)",
      radiusScale: "0.25",
      darkModeDefault: true,
      navigationLayout: "vertical",
      loginTitle: "Bienvenido a The Dab Club",
      loginSubtitle: "Ingresá a tu portal de socios.",
    },
    create: {
      tenantId: tenant2.id,
      appName: "The Dab Club",
      shortName: "TDC",
      primaryColor: "#d4af37",
      secondaryColor: "#8a6f2f",
      accentColor: "#f3d27a",
      backgroundColor: "#0b0b0b",
      fontFamily: "var(--font-tdc)",
      radiusScale: "0.25",
      darkModeDefault: true,
      navigationLayout: "vertical",
      loginTitle: "Bienvenido a The Dab Club",
      loginSubtitle: "Ingresá a tu portal de socios.",
    },
  });

  console.log("Tenants: demo-club, club-ejemplo (The Dab Club)");

  const OPERADOR_PERMISSION_KEYS = [
    "members.read", "members.create", "members.update",
    "inventory.read", "inventory.create", "inventory.move", "inventory.adjust",
    "lots.read", "lots.create", "qr.generate", "qr.resolve",
    "weighings.read", "weighings.create", "scales.manage",
    "devices.read", "devices.manage", "reports.read",
    "tickets.read", "tickets.manage",
  ];
  const CULTIVADOR_PERMISSION_KEYS = [
    "lots.read", "lots.create",
    "inventory.read",
    "qr.generate", "qr.resolve",
    "weighings.read", "weighings.create", "scales.manage",
    "devices.read", "reports.read",
  ];
  const operadorPermIds = permissions.filter((p) => OPERADOR_PERMISSION_KEYS.includes(p.key)).map((p) => p.id);
  const cultivadorPermIds = permissions.filter((p) => CULTIVADOR_PERMISSION_KEYS.includes(p.key)).map((p) => p.id);

  for (const tenant of [tenant1, tenant2]) {
    const roleAdmin = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "tenant_admin" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "tenant_admin",
        description: "Administrador del club",
        isSystem: true,
      },
    });

    const roleOperador = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "operador" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "operador",
        description: "Operador con acceso a socios, inventario, lotes y tickets",
        isSystem: true,
      },
    });

    const roleCultivador = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "cultivador" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "cultivador",
        description: "Lotes, inventario, QR, pesaje y dispositivos; sin socios ni usuarios",
        isSystem: true,
      },
    });

    const permIds = permissions.map((p) => p.id);
    for (const permId of permIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roleAdmin.id, permissionId: permId },
        },
        update: {},
        create: { roleId: roleAdmin.id, permissionId: permId },
      });
    }
    for (const permId of operadorPermIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roleOperador.id, permissionId: permId },
        },
        update: {},
        create: { roleId: roleOperador.id, permissionId: permId },
      });
    }
    for (const permId of cultivadorPermIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roleCultivador.id, permissionId: permId },
        },
        update: {},
        create: { roleId: roleCultivador.id, permissionId: permId },
      });
    }

    const userAdmin = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: `admin@${tenant.slug}.com` } },
      update: {},
      create: {
        tenantId: tenant.id,
        roleId: roleAdmin.id,
        name: `Admin ${tenant.name}`,
        email: `admin@${tenant.slug}.com`,
        passwordHash: await hash("Admin123!", 10),
        status: "active",
      },
    });
    console.log(`Tenant admin: ${userAdmin.email}`);

    const userOperador = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: `operador@${tenant.slug}.com` } },
      update: {},
      create: {
        tenantId: tenant.id,
        roleId: roleOperador.id,
        name: `Operador ${tenant.name}`,
        email: `operador@${tenant.slug}.com`,
        passwordHash: await hash("Operador123!", 10),
        status: "active",
      },
    });
    console.log(`Tenant operador: ${userOperador.email}`);

    const loc1 = await prisma.location.create({
      data: {
        tenantId: tenant.id,
        name: "Depósito Central",
        type: "zone",
        description: "Zona principal",
      },
    });

    const memberNumber = `SOC-${tenant.slug.slice(0, 2).toUpperCase()}-001`;
    const member1 = await prisma.member.upsert({
      where: { tenantId_memberNumber: { tenantId: tenant.id, memberNumber } },
      update: {
        firstName: "Juan",
        lastName: "Socio",
        email: `socio@${tenant.slug}.com`,
        status: "active",
        documentType: "DNI",
        documentNumber: "12345678",
        reprocannNumber: `RPR-${tenant.slug.slice(0, 2).toUpperCase()}-1001`,
        reprocannAffiliateNumber: `AFI-${tenant.slug.slice(0, 2).toUpperCase()}-501`,
        reprocannStartDate: new Date("2024-01-15"),
        reprocannEndDate: new Date("2025-01-15"),
        reprocannActive: true,
      },
      create: {
        tenantId: tenant.id,
        memberNumber,
        firstName: "Juan",
        lastName: "Socio",
        email: `socio@${tenant.slug}.com`,
        status: "active",
        documentType: "DNI",
        documentNumber: "12345678",
        reprocannNumber: `RPR-${tenant.slug.slice(0, 2).toUpperCase()}-1001`,
        reprocannAffiliateNumber: `AFI-${tenant.slug.slice(0, 2).toUpperCase()}-501`,
        reprocannStartDate: new Date("2024-01-15"),
        reprocannEndDate: new Date("2025-01-15"),
        reprocannActive: true,
      },
    });

    await prisma.memberAccount.upsert({
      where: { memberId: member1.id },
      update: {},
      create: {
        memberId: member1.id,
        email: member1.email!,
        passwordHash: await hash("Socio123!", 10),
        status: "active",
      },
    });
    console.log(`Member: ${member1.email}`);

    if (tenant.slug === "club-ejemplo") {
      const extraMembers = [
        {
          memberNumber: "TDC-002",
          firstName: "Carla",
          lastName: "Dominguez",
          email: "carla@thedabclub.ar",
          documentType: "DNI",
          documentNumber: "27123456",
          reprocannNumber: "RPR-TDC-2002",
          reprocannAffiliateNumber: "AFI-TDC-602",
          reprocannStartDate: new Date("2023-06-01"),
          reprocannEndDate: new Date("2024-06-01"),
          reprocannActive: false,
        },
        {
          memberNumber: "TDC-003",
          firstName: "Matias",
          lastName: "Rossi",
          email: "matias@thedabclub.ar",
          documentType: "DNI",
          documentNumber: "30111222",
          reprocannNumber: "RPR-TDC-2003",
          reprocannAffiliateNumber: "AFI-TDC-603",
          reprocannStartDate: new Date("2024-02-10"),
          reprocannEndDate: new Date("2025-02-10"),
          reprocannActive: true,
        },
        {
          memberNumber: "TDC-004",
          firstName: "Agustina",
          lastName: "Vega",
          email: "agustina@thedabclub.ar",
          documentType: "DNI",
          documentNumber: "33999888",
          reprocannNumber: "RPR-TDC-2004",
          reprocannAffiliateNumber: "AFI-TDC-604",
          reprocannStartDate: new Date("2022-09-20"),
          reprocannEndDate: new Date("2023-09-20"),
          reprocannActive: false,
        },
      ];

      for (const m of extraMembers) {
        const member = await prisma.member.upsert({
          where: { tenantId_memberNumber: { tenantId: tenant.id, memberNumber: m.memberNumber } },
          update: {
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            status: "active",
            documentType: m.documentType,
            documentNumber: m.documentNumber,
            reprocannNumber: m.reprocannNumber,
            reprocannAffiliateNumber: m.reprocannAffiliateNumber,
            reprocannStartDate: m.reprocannStartDate,
            reprocannEndDate: m.reprocannEndDate,
            reprocannActive: m.reprocannActive,
          },
          create: {
            tenantId: tenant.id,
            memberNumber: m.memberNumber,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            status: "active",
            documentType: m.documentType,
            documentNumber: m.documentNumber,
            reprocannNumber: m.reprocannNumber,
            reprocannAffiliateNumber: m.reprocannAffiliateNumber,
            reprocannStartDate: m.reprocannStartDate,
            reprocannEndDate: m.reprocannEndDate,
            reprocannActive: m.reprocannActive,
          },
        });

        await prisma.memberAccount.upsert({
          where: { memberId: member.id },
          update: { email: m.email, status: "active" },
          create: {
            memberId: member.id,
            email: m.email,
            passwordHash: await hash("Socio123!", 10),
            status: "active",
          },
        });
      }
      console.log("Extra members for The Dab Club: TDC-002, TDC-003, TDC-004");
    }

    const lotCode = `LOT-${tenant.slug.slice(0, 2).toUpperCase()}-001`;
    const lot = await prisma.inventoryLot.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: lotCode } },
      update: {
        description: "Lote demo",
        status: "active",
        locationId: loc1.id,
      },
      create: {
        tenantId: tenant.id,
        code: lotCode,
        description: "Lote demo",
        status: "active",
        locationId: loc1.id,
      },
    });

    await prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        lotId: lot.id,
        code: `ITEM-001`,
        type: "product",
        unit: "kg",
        quantityCurrent: 10,
        status: "active",
        locationId: loc1.id,
      },
    });

    await prisma.ticket.create({
      data: {
        tenantId: tenant.id,
        createdByType: "user",
        createdById: userAdmin.id,
        subject: "Ticket demo",
        description: "Ejemplo de ticket",
        priority: "medium",
        status: "open",
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
