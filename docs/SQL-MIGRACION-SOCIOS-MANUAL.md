# Migración módulo socios — ejecución manual en editor SQL

Si el script del build falla o preferís aplicar los cambios a mano, conectate a la base de producción (Neon, etc.) y ejecutá este SQL en el editor. Podés pegar todo de una vez o por bloques.

**Importante:** Si tu tabla de socios se llama `member` (minúscula) en lugar de `Member`, reemplazá `"Member"` por `"member"` en todo el script. Podés ver el nombre real en el explorador de tablas de tu proveedor.

---

## 1. Nuevas columnas en la tabla Member

```sql
-- Datos del socio
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "state_or_province" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "emergency_contact_name" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "status_reason" TEXT;

-- Membresía
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_type" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_status" TEXT DEFAULT 'pending';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_start_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_end_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_renewal_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "membership_notes" TEXT;

-- Config operativa y saldo
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "member_tier" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "monthly_limit" DECIMAL(12,2);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "daily_limit" DECIMAL(12,2);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "remaining_balance" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "consumed_this_period" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "period_start_date" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_reserve_products" BOOLEAN DEFAULT true;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_preorder" BOOLEAN DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_access_events" BOOLEAN DEFAULT true;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "can_invite_guest" BOOLEAN DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "allowed_categories" JSONB;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "allowed_products" JSONB;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;
```

---

## 2. Tabla de ajustes de saldo

```sql
CREATE TABLE IF NOT EXISTS "MemberBalanceAdjustment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "created_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberBalanceAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MemberBalanceAdjustment_tenantId_idx" ON "MemberBalanceAdjustment"("tenantId");
CREATE INDEX IF NOT EXISTS "MemberBalanceAdjustment_memberId_idx" ON "MemberBalanceAdjustment"("memberId");
CREATE INDEX IF NOT EXISTS "MemberBalanceAdjustment_memberId_createdAt_idx" ON "MemberBalanceAdjustment"("memberId", "createdAt");

ALTER TABLE "MemberBalanceAdjustment" ADD CONSTRAINT "MemberBalanceAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberBalanceAdjustment" ADD CONSTRAINT "MemberBalanceAdjustment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Si al ejecutar los `ALTER TABLE ... ADD CONSTRAINT` te dice que el constraint ya existe, podés ignorar ese error (la tabla ya estaba creada).

---

## 3. Columna en Notification

```sql
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);
```

---

## 4. Índice opcional (Member)

```sql
CREATE INDEX IF NOT EXISTS "Member_tenantId_documentNumber_idx" ON "Member"("tenantId", "documentNumber");
```

---

## Comprobación rápida

Después de ejecutar todo, verificá que la columna exista:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Member'
ORDER BY ordinal_position;
```

Deberías ver, entre otras, `address`, `city`, `state_or_province`, `remaining_balance`, etc.
