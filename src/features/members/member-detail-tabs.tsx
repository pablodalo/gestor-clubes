"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getStatusLabel, getStatusVariant } from "@/lib/status-badges";
import { cn } from "@/lib/utils";
import {
  createMemberAccount,
  setMemberAccountStatus,
  resetMemberPassword,
} from "@/actions/member-account";
import { createMemberNotification } from "@/actions/member-notifications";
import { adjustMemberBalance, deleteMemberBalanceAdjustment } from "@/actions/member-balance";
import { AlertDialog } from "@/components/alert-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { updateMember } from "@/actions/members";
import {
  User,
  CreditCard,
  Settings,
  History,
  Bell,
  KeyRound,
  Trash2,
} from "lucide-react";

type MemberData = {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  documentType: string | null;
  documentNumber: string | null;
  birthDate: Date | null;
  address: string | null;
  city: string | null;
  stateOrProvince: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status: string;
  statusReason: string | null;
  avatarUrl: string | null;
  reprocannNumber: string | null;
  reprocannAffiliateNumber: string | null;
  reprocannStartDate: Date | null;
  reprocannEndDate: Date | null;
  reprocannActive: boolean;
  membershipPlan: string | null;
  membershipType: string | null;
  membershipStatus: string | null;
  membershipStartDate: Date | null;
  membershipEndDate: Date | null;
  membershipRenewalDate: Date | null;
  membershipNotes: string | null;
  membershipRecurring: boolean;
  membershipRecurrenceDay: number | null;
  membershipLastPaidAt: Date | null;
  membershipLastAmount: { toString: () => string } | null;
  membershipCurrency: string | null;
  monthlyLimit: { toString: () => string } | null;
  dailyLimit: { toString: () => string } | null;
  remainingBalance: { toString: () => string } | null;
  consumedThisPeriod: { toString: () => string } | null;
  canReserveProducts: boolean;
  canPreorder: boolean;
  canAccessEvents: boolean;
  canInviteGuest: boolean;
  internalNotes: string | null;
  createdAt: Date;
};

type PaymentRow = { id: string; paidAt: Date; amount: { toString: () => string }; currency: string; method: string | null };
type NotifRow = { id: string; title: string; body: string | null; type: string | null; read: boolean; createdAt: Date };
type AdjustRow = { id: string; amount: { toString: () => string }; type: string; note: string | null; createdAt: Date };
type AuditRow = { id: string; action: string; actorName: string | null; createdAt: Date; afterJson: string | null };

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleDateString("es-AR") : "—");

type TabId = "datos" | "membresia" | "operativa" | "historial" | "notificaciones" | "cuenta";

type Props = {
  tenantSlug: string;
  member: MemberData;
  /** Si el usuario puede eliminar movimientos de saldo (permiso members_update) */
  canDeleteMovement?: boolean;
  membershipPlan?: {
    name: string;
    tier: string | null;
    price?: { toString: () => string } | null;
    currency?: string;
    monthlyLimit?: { toString: () => string } | null;
    dailyLimit?: { toString: () => string } | null;
  } | null;
  usageByCategory: {
    plant_material: {
      monthlyLimit: number | null;
      dailyLimit: number | null;
      consumedMonthly: number;
      consumedDaily: number;
      remainingMonthly: number | null;
    };
    extract: {
      monthlyLimit: number | null;
      dailyLimit: number | null;
      consumedMonthly: number;
      consumedDaily: number;
      remainingMonthly: number | null;
    };
  };
  payments: PaymentRow[];
  account: { id: string; email: string; status: string } | null;
  notifications: NotifRow[];
  balanceAdjustments: AdjustRow[];
  auditLogs: AuditRow[];
};

export function MemberDetailTabs({
  tenantSlug,
  member,
  canDeleteMovement = false,
  membershipPlan,
  usageByCategory,
  payments,
  account,
  notifications,
  balanceAdjustments,
  auditLogs,
}: Props) {
  const [tab, setTab] = useState<TabId>("datos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [canReserveProducts, setCanReserveProducts] = useState(member.canReserveProducts);
  const [canPreorder, setCanPreorder] = useState(member.canPreorder);
  const [canAccessEvents, setCanAccessEvents] = useState(member.canAccessEvents);
  const [canInviteGuest, setCanInviteGuest] = useState(member.canInviteGuest);
  const [operativaSaving, setOperativaSaving] = useState<null | "reserve" | "preorder" | "events" | "invite">(null);
  const [accountEmail, setAccountEmail] = useState(member.email ?? "");
  const [accountPassword, setAccountPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);
  const [movementSearch, setMovementSearch] = useState("");
  const [movementToDeleteId, setMovementToDeleteId] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "Aviso", message: "" });
  const router = useRouter();

  const filteredBalanceAdjustments = movementSearch.trim()
    ? balanceAdjustments.filter((a) => {
        const q = movementSearch.trim().toLowerCase();
        const type = (a.type ?? "").toLowerCase();
        const note = (a.note ?? "").toLowerCase();
        const amount = a.amount?.toString() ?? "";
        return type.includes(q) || note.includes(q) || amount.includes(q);
      })
    : balanceAdjustments;

  const categoryUsage = usageByCategory;

  const setOperativaField = async (field: "reserve" | "preorder" | "events" | "invite", next: boolean) => {
    setError("");
    setOperativaSaving(field);
    const prev = { canReserveProducts, canPreorder, canAccessEvents, canInviteGuest };
    if (field === "reserve") setCanReserveProducts(next);
    if (field === "preorder") setCanPreorder(next);
    if (field === "events") setCanAccessEvents(next);
    if (field === "invite") setCanInviteGuest(next);

    const payload =
      field === "reserve"
        ? { canReserveProducts: next }
        : field === "preorder"
          ? { canPreorder: next }
          : field === "events"
            ? { canAccessEvents: next }
            : { canInviteGuest: next };

    try {
      const res = await updateMember(member.id, payload);
      if (res?.error) {
        setError(res.error);
        setCanReserveProducts(prev.canReserveProducts);
        setCanPreorder(prev.canPreorder);
        setCanAccessEvents(prev.canAccessEvents);
        setCanInviteGuest(prev.canInviteGuest);
      }
    } catch {
      setError("No se pudo guardar el cambio");
      setCanReserveProducts(prev.canReserveProducts);
      setCanPreorder(prev.canPreorder);
      setCanAccessEvents(prev.canAccessEvents);
      setCanInviteGuest(prev.canInviteGuest);
    } finally {
      setOperativaSaving(null);
    }
  };

  const OperativaToggle = ({
    label,
    helper,
    value,
    onToggle,
    saving,
  }: {
    label: string;
    helper?: string;
    value: boolean;
    onToggle: (next: boolean) => void;
    saving: boolean;
  }) => (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/40 px-3 py-2">
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {helper && <p className="text-[11px] text-muted-foreground mt-0.5">{helper}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{value ? "Sí" : "No"}</span>
        <Switch
          checked={value}
          disabled={saving}
          onCheckedChange={(next) => onToggle(next)}
          aria-label={label}
        />
      </div>
    </div>
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "datos", label: "Datos", icon: <User className="h-4 w-4" /> },
    { id: "membresia", label: "Membresía", icon: <CreditCard className="h-4 w-4" /> },
    { id: "operativa", label: "Cupo y permisos", icon: <Settings className="h-4 w-4" /> },
    { id: "historial", label: "Historial", icon: <History className="h-4 w-4" /> },
    { id: "notificaciones", label: "Notificaciones", icon: <Bell className="h-4 w-4" /> },
    { id: "cuenta", label: "Cuenta de acceso", icon: <KeyRound className="h-4 w-4" /> },
  ];

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await createMemberAccount({
      memberId: member.id,
      email: accountEmail,
      password: accountPassword,
    });
    setLoading(false);
    if (res.error) setError(res.error);
    else window.location.reload();
  }

  async function handleSetAccountStatus(status: "active" | "inactive") {
    setError("");
    setLoading(true);
    const res = await setMemberAccountStatus({ memberId: member.id, status });
    setLoading(false);
    if (res.error) setError(res.error);
    else window.location.reload();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (resetPassword.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    const res = await resetMemberPassword({ memberId: member.id, newPassword: resetPassword });
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setResetPassword("");
      window.location.reload();
    }
  }

  async function handleCreateNotification(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await createMemberNotification({
      memberId: member.id,
      title: notifTitle,
      body: notifBody || undefined,
    });
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setNotifTitle("");
      setNotifBody("");
      window.location.reload();
    }
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amount = Number(adjustAmount);
    if (Number.isNaN(amount) || amount === 0) {
      setError("Monto inválido");
      return;
    }
    setLoading(true);
    const res = await adjustMemberBalance({
      memberId: member.id,
      amount: String(amount),
      type: "adjustment",
      note: adjustNote || undefined,
    });
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setAdjustAmount("");
      setAdjustNote("");
      window.location.reload();
    }
  }

  async function doDeleteMovement() {
    if (!movementToDeleteId) return;
    setDeletingMovementId(movementToDeleteId);
    const res = await deleteMemberBalanceAdjustment(movementToDeleteId, member.id);
    setDeletingMovementId(null);
    if (res.error) {
      setAlertMessage({ title: "Error", message: res.error });
      setAlertOpen(true);
    } else {
      router.refresh();
    }
  }

  return (
    <>
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-1">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-2">Secciones del socio</p>
        <div className="flex gap-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
      )}

      {tab === "datos" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Datos personales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Número de socio</p>
                <p className="font-medium">{member.memberNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant={getStatusVariant(member.status)}>
                  {getStatusLabel(member.status) ?? member.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{member.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium">{member.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Documento</p>
                <p className="font-medium">
                  {member.documentType ?? "—"} {member.documentNumber ?? ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                <p className="font-medium">{formatDate(member.birthDate)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="font-medium">
                  {[member.address, member.city, member.stateOrProvince, member.country]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contacto de emergencia</p>
                <p className="font-medium">
                  {member.emergencyContactName ?? "—"}
                  {member.emergencyContactPhone ? ` · ${member.emergencyContactPhone}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Motivo del estado</p>
                <p className="font-medium">{member.statusReason ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de alta</p>
                <p className="font-medium">{formatDate(member.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reprocann</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Estado</p>
                <Badge variant={member.reprocannActive ? "success" : "secondary"}>
                  {member.reprocannActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nº Reprocann</p>
                <p className="font-medium">{member.reprocannNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nº de afiliado</p>
                <p className="font-medium">{member.reprocannAffiliateNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inicio</p>
                <p className="font-medium">{formatDate(member.reprocannStartDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencimiento</p>
                <p className="font-medium">{formatDate(member.reprocannEndDate)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "membresia" && (
        <Card>
          <CardHeader>
            <CardTitle>Membresía</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Tipo / Plan</p>
              <p className="font-medium">{member.membershipType ?? membershipPlan?.name ?? member.membershipPlan ?? "—"}</p>
              {membershipPlan?.tier ? (
                <p className="text-xs text-muted-foreground mt-1">Tier: <span className="font-medium text-foreground">{membershipPlan.tier}</span></p>
              ) : null}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado membresía</p>
              <Badge variant={getStatusVariant(member.membershipStatus ?? "")}>
                {getStatusLabel(member.membershipStatus ?? "") ?? member.membershipStatus ?? "—"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inicio</p>
              <p className="font-medium">{formatDate(member.membershipStartDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencimiento</p>
              <p className="font-medium">{formatDate(member.membershipEndDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Próxima renovación</p>
              <p className="font-medium">{formatDate(member.membershipRenewalDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recurrente</p>
              <Badge variant={member.membershipRecurring ? "success" : "secondary"}>
                {member.membershipRecurring ? "Sí" : "No"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Día de cobro</p>
              <p className="font-medium">{member.membershipRecurrenceDay ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monto membresía</p>
              <p className="font-medium">
                {membershipPlan?.price?.toString?.() ?? "—"} {membershipPlan?.currency ?? ""}
              </p>
            </div>
            {member.membershipNotes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="font-medium">{member.membershipNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "operativa" && (
        <Card>
          <CardHeader>
            <CardTitle>Cupo y permisos</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Uso de cupo, saldo, ajustes y permisos operativos del socio.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Uso de cupo
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { cat: "plant_material" as const, title: "Materia vegetal" },
                    { cat: "extract" as const, title: "Extracto" },
                  ] as const
                ).map(({ cat, title }) => {
                  const u = categoryUsage[cat];
                  const pct =
                    u.monthlyLimit != null && u.monthlyLimit > 0
                      ? Math.min(Math.max((u.consumedMonthly / u.monthlyLimit) * 100, 0), 100)
                      : 100;

                  return (
                    <div key={cat} className="rounded-md border bg-muted/30 px-3 py-2 space-y-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{title}</span>
                        <span className="text-sm font-semibold tabular-nums">
                          {u.monthlyLimit != null ? u.monthlyLimit.toString() : "Sin tope"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Consumido período</span>
                          <span className="font-medium text-foreground">
                            {u.monthlyLimit != null
                              ? `${u.consumedMonthly.toFixed(2)} / ${u.monthlyLimit.toFixed(2)}`
                              : `${u.consumedMonthly.toFixed(2)} (sin tope)`}
                          </span>
                        </div>
                        <div className="h-3 sm:h-4 w-full rounded-full bg-muted/70 overflow-hidden ring-1 ring-border">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <p className="text-[11px] text-muted-foreground">
                          Saldo mensual:{" "}
                          <span className="font-medium text-foreground">
                            {u.remainingMonthly != null ? u.remainingMonthly.toFixed(2) : "—"}
                          </span>
                        </p>
                      </div>

                      {u.dailyLimit != null && (
                        <div className="pt-1">
                          <p className="text-[11px] text-muted-foreground">
                            Hoy: {u.consumedDaily.toFixed(2)} / {u.dailyLimit.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <OperativaToggle
              label="Puede reservar productos"
              helper="Permite que el socio reserve productos desde el portal."
              value={canReserveProducts}
              saving={operativaSaving === "reserve"}
              onToggle={(next) => setOperativaField("reserve", next)}
            />
            <OperativaToggle
              label="Preorden"
              helper="Habilita precompras antes de que el stock esté disponible."
              value={canPreorder}
              saving={operativaSaving === "preorder"}
              onToggle={(next) => setOperativaField("preorder", next)}
            />
            <OperativaToggle
              label="Acceso a eventos"
              helper="Controla acceso a eventos del club desde su membresía."
              value={canAccessEvents}
              saving={operativaSaving === "events"}
              onToggle={(next) => setOperativaField("events", next)}
            />
            <OperativaToggle
              label="Puede invitar invitados"
              helper="Permite que el socio registre invitados a las visitas."
              value={canInviteGuest}
              saving={operativaSaving === "invite"}
              onToggle={(next) => setOperativaField("invite", next)}
            />
            {member.internalNotes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Notas internas</p>
                <p className="font-medium">{member.internalNotes}</p>
              </div>
            )}

            {/* Saldo y movimientos: card aparte para diferenciar de Uso de cupo */}
            <div className="sm:col-span-2 mt-6">
              <Card className="border-l-4 border-l-primary/50 bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Saldo y movimientos</CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    Ajustes de saldo e historial de movimientos del cupo.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAdjustBalance} className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="adjustAmount">Ajuste de saldo (+ o -)</Label>
                      <Input
                        id="adjustAmount"
                        type="number"
                        step="0.01"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        placeholder="Ej. 10 o -5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adjustNote">Nota (opcional)</Label>
                      <Input
                        id="adjustNote"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        placeholder="Motivo del ajuste"
                      />
                    </div>
                    <Button type="submit" disabled={loading}>Aplicar ajuste</Button>
                  </form>
                  <div className="border-t pt-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                      <p className="text-sm font-medium">Últimos movimientos</p>
                      <Input
                        type="search"
                        placeholder="Buscar por tipo, nota o monto..."
                        value={movementSearch}
                        onChange={(e) => setMovementSearch(e.target.value)}
                        className="h-8 w-full sm:w-56 text-sm"
                      />
                    </div>
                    {filteredBalanceAdjustments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {balanceAdjustments.length === 0 ? "No hay movimientos." : "Ningún movimiento coincide con la búsqueda."}
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {filteredBalanceAdjustments.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
                            <span className="min-w-0 flex-1">
                              <span>{formatDate(a.createdAt)} · {a.type}</span>
                              <span className="ml-2">{a.amount.toString()} {a.note ? `· ${a.note}` : ""}</span>
                            </span>
                            {canDeleteMovement && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                aria-label="Eliminar movimiento"
                                disabled={deletingMovementId === a.id}
                                onClick={() => setMovementToDeleteId(a.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "historial" && (
        <Card>
          <CardHeader>
            <CardTitle>Historial (auditoría)</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay registros.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {auditLogs.map((log) => (
                  <li key={log.id} className="flex flex-wrap gap-2 items-baseline border-b pb-2">
                    <span className="text-muted-foreground">{formatDate(log.createdAt)}</span>
                    <span className="font-medium">{log.action}</span>
                    {log.actorName && <span className="text-muted-foreground">· {log.actorName}</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "notificaciones" && (
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones del socio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateNotification} className="flex flex-col gap-3 border-b pb-4">
              <div className="space-y-2">
                <Label htmlFor="notifTitle">Nueva notificación · Título</Label>
                <Input
                  id="notifTitle"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Título"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notifBody">Mensaje (opcional)</Label>
                <Input
                  id="notifBody"
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="Cuerpo del mensaje"
                />
              </div>
              <Button type="submit" disabled={loading}>Enviar notificación</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground">No hay notificaciones.</p>
              ) : (
                notifications.map((n) => (
                  <li key={n.id} className="flex justify-between items-start border-b pb-2">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      {n.body && <p className="text-muted-foreground">{n.body}</p>}
                      <p className="text-xs text-muted-foreground">{formatDate(n.createdAt)} {n.read ? "· Leída" : ""}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {tab === "cuenta" && (
        <Card>
          <CardHeader>
            <CardTitle>Cuenta de acceso al portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {account ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Email de la cuenta</p>
                  <p className="font-medium">{account.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge variant={account.status === "active" ? "success" : "secondary"}>
                    {account.status === "active" ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetAccountStatus(account.status === "active" ? "inactive" : "active")}
                    disabled={loading}
                  >
                    {account.status === "active" ? "Desactivar cuenta" : "Activar cuenta"}
                  </Button>
                </div>
                <form onSubmit={handleResetPassword} className="border-t pt-4 space-y-3">
                  <Label htmlFor="resetPassword">Nueva contraseña (mín. 6 caracteres)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resetPassword"
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Nueva contraseña"
                      minLength={6}
                    />
                    <Button type="submit" disabled={loading || resetPassword.length < 6}>
                      Resetear contraseña
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  El socio aún no tiene cuenta para entrar al portal. Creá una con email y contraseña.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="accountEmail">Email</Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountPassword">Contraseña (mín. 6 caracteres)</Label>
                  <Input
                    id="accountPassword"
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>Crear cuenta</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    <ConfirmDialog
      open={!!movementToDeleteId}
      onOpenChange={(open) => !open && setMovementToDeleteId(null)}
      title="Eliminar movimiento"
      description="¿Eliminar este movimiento? Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      destructive
      onConfirm={doDeleteMovement}
    />
    <AlertDialog
      open={alertOpen}
      onOpenChange={setAlertOpen}
      title={alertMessage.title}
      message={alertMessage.message}
    />
    </>
  );
}
