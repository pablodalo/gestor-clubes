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
  "revenue.read", "payments.read", "payments.create",
  "cultivation.read", "cultivation.manage",
  "products.read", "products.manage",
  "sales.read", "sales.manage",
  "compliance.read",
  "suppliers.read", "suppliers.manage",
  "supplies.read", "supplies.manage",
  "stock.read", "stock.manage",
  "strains.read", "strains.manage",
  "plants.read", "plants.manage",
  "controls.read", "controls.manage",
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
    update: {
      name: "LeWyd",
      status: "active",
      timezone: "America/Argentina/Buenos_Aires",
      locale: "es-AR",
      currency: "ARS",
    },
    create: {
      name: "LeWyd",
      slug: "demo-club",
      status: "active",
      timezone: "America/Argentina/Buenos_Aires",
      locale: "es-AR",
      currency: "ARS",
    },
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant1.id },
    update: {
      appName: "LeWyd",
      shortName: "LW",
      primaryColor: "#4f2d7f",
      secondaryColor: "#e8dcff",
      accentColor: "#b88cff",
      backgroundColor: "#f7f1ff",
      fontFamily: "var(--font-tdc)",
      radiusScale: "0.5",
      darkModeDefault: false,
      navigationLayout: "vertical",
      loginTitle: "Bienvenido a LeWyd",
      loginSubtitle: "Gestión integral del club y su cultivo.",
    },
    create: {
      tenantId: tenant1.id,
      appName: "LeWyd",
      shortName: "LW",
      primaryColor: "#4f2d7f",
      secondaryColor: "#e8dcff",
      accentColor: "#b88cff",
      backgroundColor: "#f7f1ff",
      fontFamily: "var(--font-tdc)",
      radiusScale: "0.5",
      darkModeDefault: false,
      navigationLayout: "vertical",
      loginTitle: "Bienvenido a LeWyd",
      loginSubtitle: "Gestión integral del club y su cultivo.",
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: "the-dab-club" },
    update: {
      name: "The Dab Club",
      status: "active",
      timezone: "America/Argentina/Buenos_Aires",
      locale: "es-AR",
      currency: "ARS",
    },
    create: {
      name: "The Dab Club",
      slug: "the-dab-club",
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
      primaryColor: "#1a1a1a",
      secondaryColor: "#e6dcc8",
      accentColor: "#c6a15b",
      backgroundColor: "#f7f2e8",
      fontFamily: "var(--font-tdc)",
      radiusScale: "0.5",
      darkModeDefault: false,
      navigationLayout: "vertical",
      loginTitle: "Bienvenido a The Dab Club",
      loginSubtitle: "Ingresá a tu portal de socios.",
    },
    create: {
      tenantId: tenant2.id,
      appName: "The Dab Club",
      shortName: "TDC",
      primaryColor: "#1a1a1a",
      secondaryColor: "#e6dcc8",
      accentColor: "#c6a15b",
      backgroundColor: "#f7f2e8",
      fontFamily: "var(--font-tdc)",
      radiusScale: "0.5",
      darkModeDefault: false,
      navigationLayout: "vertical",
      loginTitle: "Bienvenido a The Dab Club",
      loginSubtitle: "Ingresá a tu portal de socios.",
    },
  });

  console.log("Tenants: demo-club (LeWyd), the-dab-club (The Dab Club)");

  const membershipPlansDemo = [
    { name: "Básico", description: "30 g flores / mes", price: 25000, recurrenceDay: 10 },
    { name: "Premium", description: "30 g flores + 10 g extractos / mes", price: 45000, recurrenceDay: 10 },
    { name: "Premium -1", description: "Plan premium nivel 1", price: 45000, recurrenceDay: 10 },
  ];
  for (const plan of membershipPlansDemo) {
    await prisma.membershipPlan.upsert({
      where: {
        tenantId_name: { tenantId: tenant1.id, name: plan.name },
      },
      update: { description: plan.description, price: plan.price, recurrenceDay: plan.recurrenceDay },
      create: {
        tenantId: tenant1.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        recurrenceDay: plan.recurrenceDay,
        currency: "ARS",
        status: "active",
      },
    });
  }
  for (const plan of membershipPlansDemo) {
    await prisma.membershipPlan.upsert({
      where: {
        tenantId_name: { tenantId: tenant2.id, name: plan.name },
      },
      update: { description: plan.description, price: plan.price, recurrenceDay: plan.recurrenceDay },
      create: {
        tenantId: tenant2.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        recurrenceDay: plan.recurrenceDay,
        currency: "ARS",
        status: "active",
      },
    });
  }
  const planBasico1 = await prisma.membershipPlan.findUnique({
    where: { tenantId_name: { tenantId: tenant1.id, name: "Básico" } },
  });
  const planPremium12 = await prisma.membershipPlan.findUnique({
    where: { tenantId_name: { tenantId: tenant2.id, name: "Premium -1" } },
  });
  console.log("Membership plans: Básico, Premium, Premium -1 (por tenant)");

  const OPERADOR_PERMISSION_KEYS = [
    "members.read", "members.create", "members.update",
    "inventory.read", "inventory.create", "inventory.move", "inventory.adjust",
    "lots.read", "lots.create", "qr.generate", "qr.resolve",
    "weighings.read", "weighings.create", "scales.manage",
    "devices.read", "devices.manage", "reports.read", "revenue.read",
    "payments.read", "payments.create",
    "cultivation.read", "cultivation.manage",
    "products.read", "products.manage",
    "sales.read", "sales.manage",
    "compliance.read",
    "suppliers.read", "suppliers.manage",
    "supplies.read", "supplies.manage",
    "stock.read", "stock.manage",
    "strains.read", "strains.manage",
    "plants.read", "plants.manage",
    "controls.read", "controls.manage",
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

    const paymentPerms = permissions
      .filter((p) => p.key === "payments.read" || p.key === "payments.create")
      .map((p) => p.id);
    for (const permId of paymentPerms) {
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
    const planForMember =
      tenant.id === tenant1.id ? planBasico1 : planPremium12;
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
        membershipPlanId: planForMember?.id ?? null,
        membershipPlan: "Flores + Extractos",
        membershipStatus: "active",
        membershipRecurring: true,
        membershipRecurrenceDay: 10,
        membershipLastPaidAt: new Date("2024-12-01"),
        membershipLastAmount: 35000,
        membershipCurrency: "ARS",
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
        membershipPlanId: planForMember?.id ?? null,
        membershipPlan: "Flores + Extractos",
        membershipStatus: "active",
        membershipRecurring: true,
        membershipRecurrenceDay: 10,
        membershipLastPaidAt: new Date("2024-12-01"),
        membershipLastAmount: 35000,
        membershipCurrency: "ARS",
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

    if (tenant.slug === "the-dab-club") {
      const planBasico2 = await prisma.membershipPlan.findUnique({
        where: { tenantId_name: { tenantId: tenant2.id, name: "Básico" } },
      });
      const memberCarla = await prisma.member.upsert({
        where: { tenantId_memberNumber: { tenantId: tenant.id, memberNumber: "TDC-002" } },
        update: {
          membershipPlanId: planBasico2?.id ?? null,
          membershipStatus: "active",
        },
        create: {
          tenantId: tenant.id,
          memberNumber: "TDC-002",
          firstName: "Carla",
          lastName: "Dominguez",
          email: "carla@the-dab-club.com",
          status: "active",
          documentType: "DNI",
          documentNumber: "27123456",
          membershipPlanId: planBasico2?.id ?? null,
          membershipPlan: "Básico",
          membershipStatus: "active",
          membershipRecurring: true,
          membershipRecurrenceDay: 10,
          membershipLastPaidAt: new Date("2024-12-01"),
          membershipLastAmount: 25000,
          membershipCurrency: "ARS",
        },
      });
      await prisma.memberAccount.upsert({
        where: { memberId: memberCarla.id },
        update: {},
        create: {
          memberId: memberCarla.id,
          email: memberCarla.email!,
          passwordHash: await hash("Socio123!", 10),
          status: "active",
        },
      });
      console.log(`Member: ${memberCarla.email} (Básico)`);
    }

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
          membershipPlan: "Flores",
          membershipRecurring: false,
          membershipRecurrenceDay: null,
          membershipLastPaidAt: new Date("2024-11-20"),
          membershipLastAmount: 18000,
          membershipCurrency: "ARS",
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
          membershipPlan: "Extractos premium",
          membershipRecurring: true,
          membershipRecurrenceDay: 5,
          membershipLastPaidAt: new Date("2024-12-05"),
          membershipLastAmount: 52000,
          membershipCurrency: "ARS",
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
          membershipPlan: "Flores + Extractos",
          membershipRecurring: true,
          membershipRecurrenceDay: 18,
          membershipLastPaidAt: new Date("2024-12-18"),
          membershipLastAmount: 42000,
          membershipCurrency: "ARS",
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
            membershipPlan: m.membershipPlan,
            membershipRecurring: m.membershipRecurring,
            membershipRecurrenceDay: m.membershipRecurrenceDay,
            membershipLastPaidAt: m.membershipLastPaidAt,
            membershipLastAmount: m.membershipLastAmount,
            membershipCurrency: m.membershipCurrency,
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
            membershipPlan: m.membershipPlan,
            membershipRecurring: m.membershipRecurring,
            membershipRecurrenceDay: m.membershipRecurrenceDay,
            membershipLastPaidAt: m.membershipLastPaidAt,
            membershipLastAmount: m.membershipLastAmount,
            membershipCurrency: m.membershipCurrency,
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

        await prisma.membershipPayment.create({
          data: {
            tenantId: tenant.id,
            memberId: member.id,
            amount: m.membershipLastAmount ?? 0,
            currency: m.membershipCurrency ?? "ARS",
            paidAt: m.membershipLastPaidAt ?? new Date(),
            method: "transferencia",
            reference: `TDC-${member.memberNumber}`,
            notes: "Pago seed",
          },
        });
      }

      // Pagos de ejemplo para el año actual (Ene, Feb, Mar) para que el gráfico de ingresos muestre "Cobrado"
      const now = new Date();
      const year = now.getFullYear();
      const jan1 = new Date(year, 0, 1);
      const mar31 = new Date(year, 2, 31, 23, 59, 59);
      await prisma.membershipPayment.deleteMany({
        where: {
          tenantId: tenant.id,
          paidAt: { gte: jan1, lte: mar31 },
          notes: "Pago seed año actual",
        },
      });
      const membersForPayments = await prisma.member.findMany({
        where: { tenantId: tenant.id, status: "active" },
        select: { id: true, membershipLastAmount: true, membershipCurrency: true, memberNumber: true },
      });
      for (const member of membersForPayments) {
        const amount = Number(member.membershipLastAmount ?? 0);
        const curr = member.membershipCurrency ?? "ARS";
        for (const month of [0, 1, 2]) {
          await prisma.membershipPayment.create({
            data: {
              tenantId: tenant.id,
              memberId: member.id,
              amount,
              currency: curr,
              paidAt: new Date(year, month, 15),
              method: "transferencia",
              reference: `TDC-${member.memberNumber}-${year}-${String(month + 1).padStart(2, "0")}`,
              notes: "Pago seed año actual",
            },
          });
        }
      }
      if (membersForPayments.length > 0) {
        console.log(`Pagos ejemplo año ${year} (Ene–Mar) para ${membersForPayments.length} socios.`);
      }

      console.log("Extra members for The Dab Club: TDC-002, TDC-003, TDC-004");

      const cultivationLot = await prisma.cultivationLot.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: "TDC-LOT-01" } },
        update: {
          strain: "Gelato 41",
          stage: "floracion",
          plantsCount: 24,
          estimatedYieldGrams: 1200,
          startedAt: new Date("2024-09-15"),
          estimatedHarvestAt: new Date("2024-12-20"),
          nextWateringAt: new Date("2024-12-08"),
          nextFeedingAt: new Date("2024-12-10"),
        },
        create: {
          tenantId: tenant.id,
          code: "TDC-LOT-01",
          strain: "Gelato 41",
          stage: "floracion",
          plantsCount: 24,
          estimatedYieldGrams: 1200,
          startedAt: new Date("2024-09-15"),
          estimatedHarvestAt: new Date("2024-12-20"),
          nextWateringAt: new Date("2024-12-08"),
          nextFeedingAt: new Date("2024-12-10"),
        },
      });

      const cultivationEvents = [
        { type: "riego", happenedAt: new Date("2024-11-28"), note: "Riego 12L por planta" },
        { type: "fertilizacion", happenedAt: new Date("2024-12-02"), note: "NPK 2-1-3" },
        { type: "observacion", happenedAt: new Date("2024-12-05"), note: "Tricomas 70% lechosos" },
      ];

      for (const ev of cultivationEvents) {
        await prisma.cultivationEvent.create({
      data: {
            tenantId: tenant.id,
            cultivationLotId: cultivationLot.id,
            type: ev.type,
            happenedAt: ev.happenedAt,
            note: ev.note,
          },
        });
      }

      const productsData = [
        {
          name: "Flores Gelato 41",
          category: "flores",
          unit: "g",
          price: 4500,
          currency: "ARS",
          notes: "Indoor premium",
        },
        {
          name: "Rosin Full Spectrum",
          category: "extractos",
          unit: "g",
          price: 12000,
          currency: "ARS",
          notes: "Extracción en frío",
        },
        {
          name: "Kit Dab Básico",
          category: "accesorios",
          unit: "u",
          price: 35000,
          currency: "ARS",
          notes: "Kit de inicio para socios",
        },
      ];

      const createdProducts = [];
      for (const p of productsData) {
        const existing = await prisma.product.findFirst({
          where: { tenantId: tenant.id, name: p.name },
        });
        const product = existing
          ? await prisma.product.update({
              where: { id: existing.id },
              data: {
                category: p.category,
                unit: p.unit,
                price: p.price,
                currency: p.currency,
                status: "active",
                notes: p.notes,
              },
            })
          : await prisma.product.create({
              data: {
                tenantId: tenant.id,
                name: p.name,
                category: p.category,
                unit: p.unit,
                price: p.price,
                currency: p.currency,
                status: "active",
                notes: p.notes,
              },
            });
        createdProducts.push(product);
      }

      if (createdProducts.length > 0) {
        const product = createdProducts[0];
        const quantity = 2;
        const total = product.price.mul(quantity);
        await prisma.salesOrder.create({
          data: {
            tenantId: tenant.id,
            memberId: member1.id,
            status: "paid",
            totalAmount: total,
            currency: product.currency,
            paidAt: new Date("2024-12-12"),
            items: {
              create: {
                productId: product.id,
                quantity,
                unitPrice: product.price,
                total,
              },
            },
          },
        });
      }

      const supplier = await prisma.supplier.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "Grow Supply BA" } },
        update: {
          suppliesProvided: "Fertilizantes, sustratos y bioestimulantes",
          paymentStatus: "pending",
          pendingPayment: true,
          pendingDelivery: true,
          nextDeliveryAt: new Date("2024-12-14"),
        },
        create: {
          tenantId: tenant.id,
          name: "Grow Supply BA",
          email: "ventas@growsupply.com",
          phone: "+54 11 4444-5555",
          suppliesProvided: "Fertilizantes, sustratos y bioestimulantes",
          paymentStatus: "pending",
          pendingPayment: true,
          pendingDelivery: true,
          nextDeliveryAt: new Date("2024-12-14"),
          status: "active",
        },
      });

      await prisma.supplier.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "Envases & Frascos SRL" } },
        update: {
          suppliesProvided: "Frascos, envases, etiquetas",
          paymentStatus: "ok",
          pendingPayment: false,
          pendingDelivery: false,
          nextDeliveryAt: null,
        },
        create: {
          tenantId: tenant.id,
          name: "Envases & Frascos SRL",
          email: "pedidos@envasesfrascos.com",
          phone: "+54 11 5555-0101",
          suppliesProvided: "Frascos, envases, etiquetas",
          paymentStatus: "ok",
          pendingPayment: false,
          pendingDelivery: false,
          status: "active",
        },
      });

      await prisma.supplier.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "Herramientas Cultivo Pro" } },
        update: {
          suppliesProvided: "Herramientas, medidores, riego",
          paymentStatus: "pending",
          pendingPayment: true,
          pendingDelivery: false,
          nextDeliveryAt: new Date("2024-12-18"),
        },
        create: {
          tenantId: tenant.id,
          name: "Herramientas Cultivo Pro",
          email: "info@cultivopro.com",
          phone: "+54 11 4444-0202",
          suppliesProvided: "Herramientas, medidores, riego",
          paymentStatus: "pending",
          pendingPayment: true,
          pendingDelivery: false,
          nextDeliveryAt: new Date("2024-12-18"),
          status: "active",
        },
      });

      // Proveedores extra de ejemplo
      await prisma.supplier.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "Packaging Verde" } },
        update: {
          suppliesProvided: "Bolsas compostables, cajas, etiquetas",
          paymentStatus: "ok",
          pendingPayment: false,
          pendingDelivery: true,
          nextDeliveryAt: new Date("2024-12-20"),
        },
        create: {
          tenantId: tenant.id,
          name: "Packaging Verde",
          email: "ventas@packagingverde.com",
          phone: "+54 11 5555-3030",
          suppliesProvided: "Bolsas compostables, cajas, etiquetas",
          paymentStatus: "ok",
          pendingPayment: false,
          pendingDelivery: true,
          nextDeliveryAt: new Date("2024-12-20"),
          status: "active",
        },
      });

      await prisma.supplier.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "Laboratorio Analítico CBD" } },
        update: {
          suppliesProvided: "Análisis de potencia, metales pesados",
          paymentStatus: "pending",
          pendingPayment: true,
          pendingDelivery: false,
          nextDeliveryAt: null,
        },
        create: {
          tenantId: tenant.id,
          name: "Laboratorio Analítico CBD",
          email: "turnos@labcbd.com",
          phone: "+54 11 5555-9090",
          suppliesProvided: "Análisis de potencia, metales pesados",
          paymentStatus: "pending",
          pendingPayment: true,
          pendingDelivery: false,
          status: "active",
        },
      });

      await prisma.supplier.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "ClimaPro Sistemas" } },
        update: {
          suppliesProvided: "Aires, filtros, control de clima",
          paymentStatus: "ok",
          pendingPayment: false,
          pendingDelivery: false,
          nextDeliveryAt: null,
        },
        create: {
          tenantId: tenant.id,
          name: "ClimaPro Sistemas",
          email: "proyectos@climapro.com",
          phone: "+54 11 5555-4545",
          suppliesProvided: "Aires, filtros, control de clima",
          paymentStatus: "ok",
          pendingPayment: false,
          pendingDelivery: false,
          status: "active",
        },
      });

      const supplies = [
        { name: "Fertilizante A", category: "fertilizante", unit: "l", minQty: 5, currentQty: 3, isMissing: true, renewalAt: new Date("2024-12-11") },
        { name: "Sustrato Premium", category: "sustrato", unit: "kg", minQty: 20, currentQty: 40, isMissing: false, renewalAt: new Date("2024-12-20") },
        { name: "Bioestimulante", category: "insumo", unit: "l", minQty: 2, currentQty: 1, isMissing: true, renewalAt: new Date("2024-12-09") },
      ];

      for (const s of supplies) {
        await prisma.supplyItem.upsert({
          where: { tenantId_name: { tenantId: tenant.id, name: s.name } },
          update: {
            currentQty: s.currentQty,
            minQty: s.minQty,
            isMissing: s.isMissing,
            renewalAt: s.renewalAt,
          },
          create: {
            tenantId: tenant.id,
            supplierId: supplier.id,
            name: s.name,
            category: s.category,
            unit: s.unit,
            minQty: s.minQty,
            currentQty: s.currentQty,
            isMissing: s.isMissing,
            renewalAt: s.renewalAt,
            status: "active",
          },
        });
      }

      const strainGelato = await prisma.plantStrain.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "Gelato 41" } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: "Gelato 41",
          genetics: "Sunset Sherbet x Thin Mint GSC",
          thcPct: 24.5,
          cbdPct: 0.8,
          cycleDays: 65,
        },
      });

      await prisma.cultivationLotStrain.upsert({
        where: { cultivationLotId_strainId: { cultivationLotId: cultivationLot.id, strainId: strainGelato.id } },
        update: {
          plantsCount: 24,
          estimatedYieldGrams: 1200,
        },
        create: {
          tenantId: tenant.id,
          cultivationLotId: cultivationLot.id,
          strainId: strainGelato.id,
          plantsCount: 24,
          estimatedYieldGrams: 1200,
        },
      });

      await prisma.plant.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: "TDC-PL-001" } },
        update: {
          cultivationLot: { connect: { id: cultivationLot.id } },
        },
        create: {
          tenantId: tenant.id,
          cultivationLotId: cultivationLot.id,
          strainId: strainGelato.id,
          code: "TDC-PL-001",
          stage: "floracion",
          status: "active",
          plantedAt: new Date("2024-10-01"),
        },
      });

      await prisma.inventoryStock.upsert({
        where: {
          tenantId_category_strainId: {
            tenantId: tenant.id,
            category: "flores",
            strainId: strainGelato.id,
          },
        },
        update: { availableGrams: 750 },
        create: {
          tenantId: tenant.id,
          category: "flores",
          strainId: strainGelato.id,
          availableGrams: 750,
        },
      });

      // Extra stock para extractos de Gelato
      await prisma.inventoryStock.upsert({
        where: {
          tenantId_category_strainId: {
            tenantId: tenant.id,
            category: "extractos",
            strainId: strainGelato.id,
          },
        },
        update: { availableGrams: 120 },
        create: {
          tenantId: tenant.id,
          category: "extractos",
          strainId: strainGelato.id,
          availableGrams: 120,
        },
      });

      // Otra genética de ejemplo: OG Kush
      const strainOgKush = await prisma.plantStrain.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: "OG Kush" } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: "OG Kush",
          genetics: "Chemdawg x Hindu Kush",
          thcPct: 22.0,
          cbdPct: 0.5,
          cycleDays: 63,
        },
      });

      await prisma.cultivationLotStrain.upsert({
        where: { cultivationLotId_strainId: { cultivationLotId: cultivationLot.id, strainId: strainOgKush.id } },
        update: {
          plantsCount: 18,
          estimatedYieldGrams: 900,
        },
        create: {
          tenantId: tenant.id,
          cultivationLotId: cultivationLot.id,
          strainId: strainOgKush.id,
          plantsCount: 18,
          estimatedYieldGrams: 900,
        },
      });

      await prisma.inventoryStock.upsert({
        where: {
          tenantId_category_strainId: {
            tenantId: tenant.id,
            category: "flores",
            strainId: strainOgKush.id,
          },
        },
        update: { availableGrams: 420 },
        create: {
          tenantId: tenant.id,
          category: "flores",
          strainId: strainOgKush.id,
          availableGrams: 420,
        },
      });

      await prisma.inventoryStock.upsert({
        where: {
          tenantId_category_strainId: {
            tenantId: tenant.id,
            category: "extractos",
            strainId: strainOgKush.id,
          },
        },
        update: { availableGrams: 80 },
        create: {
          tenantId: tenant.id,
          category: "extractos",
          strainId: strainOgKush.id,
          availableGrams: 80,
        },
      });

      // Dispensation (Fase 2): category/strainId ya no existen; el ancla real es `productId`.
      const productForDispensation = await prisma.product.findFirst({
        where: {
          tenantId: tenant.id,
          strainId: strainGelato.id,
          // En DB ya debería estar canónico por migraciones (flores -> plant_material),
          // pero dejamos fallback por si el seed corre en otra variante de datos.
          category: { in: ["plant_material", "flores"] },
        },
        select: { id: true },
      });

      if (!productForDispensation) {
        throw new Error("Seed: no se encontró Product para la dispensación demo (strainGelato)");
      }

      await prisma.dispensation.create({
        data: {
          tenantId: tenant.id,
          memberId: member1.id,
          productId: productForDispensation.id,
          grams: 10,
          note: "Dispensación demo",
        },
      });

      await prisma.cultivationControl.create({
        data: {
          tenantId: tenant.id,
          cultivationLotId: cultivationLot.id,
          controlDate: new Date("2024-12-06"),
          temperature: 24.5,
          humidity: 55,
          ph: 6.2,
          ec: 1.4,
          pests: "sin plagas",
          note: "Ambiente estable",
        },
      });
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
