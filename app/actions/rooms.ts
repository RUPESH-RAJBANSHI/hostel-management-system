"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

export type FormState = { error?: string; success?: string } | undefined;

function refresh() {
  revalidatePath("/buildings");
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
}

// ───────── Buildings ─────────

const buildingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  address: z.string().trim().max(200).optional(),
  floors: z.coerce.number().int().min(1, "At least 1 floor").max(100),
});

export async function createBuilding(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("ADMIN", "WARDEN");

  const parsed = buildingSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    floors: formData.get("floors"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const exists = await prisma.building.findUnique({
    where: { name: parsed.data.name },
  });
  if (exists) return { error: "A building with this name already exists" };

  await prisma.building.create({ data: parsed.data });
  refresh();
  return { success: `Building "${parsed.data.name}" added` };
}

export async function deleteBuilding(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Safety: never delete a building that still has rooms.
  const rooms = await prisma.room.count({ where: { buildingId: id } });
  if (rooms > 0) return;

  await prisma.building.delete({ where: { id } });
  refresh();
}

// ───────── Rooms (beds are created automatically) ─────────

const roomSchema = z.object({
  buildingId: z.string().min(1, "Choose a building"),
  roomNumber: z.string().trim().min(1, "Room number is required").max(20),
  floor: z.coerce.number().int().min(0).max(100),
  type: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]),
  capacity: z.coerce
    .number()
    .int()
    .min(1, "Capacity must be at least 1")
    .max(12, "Capacity can be at most 12"),
  monthlyRent: z.coerce.number().min(0, "Rent cannot be negative").max(10_000_000),
  amenities: z.string().optional(),
});

export async function createRoom(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("ADMIN", "WARDEN");

  const parsed = roomSchema.safeParse({
    buildingId: formData.get("buildingId"),
    roomNumber: formData.get("roomNumber"),
    floor: formData.get("floor"),
    type: formData.get("type"),
    capacity: formData.get("capacity"),
    monthlyRent: formData.get("monthlyRent"),
    amenities: formData.get("amenities") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;

  const exists = await prisma.room.findUnique({
    where: {
      buildingId_roomNumber: { buildingId: d.buildingId, roomNumber: d.roomNumber },
    },
  });
  if (exists) return { error: `Room ${d.roomNumber} already exists in that building` };

  const amenities = (d.amenities ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  // Room + its beds are created together in one atomic operation.
  await prisma.room.create({
    data: {
      buildingId: d.buildingId,
      roomNumber: d.roomNumber,
      floor: d.floor,
      type: d.type,
      capacity: d.capacity,
      monthlyRent: d.monthlyRent,
      amenities,
      beds: {
        create: Array.from({ length: d.capacity }, (_, i) => ({
          label: String.fromCharCode(65 + i), // A, B, C...
        })),
      },
    },
  });

  refresh();
  return { success: `Room ${d.roomNumber} added with ${d.capacity} bed(s)` };
}

export async function toggleRoomActive(formData: FormData) {
  await requireRole("ADMIN", "WARDEN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const room = await prisma.room.findUnique({
    where: { id },
    include: { beds: { select: { status: true } } },
  });
  if (!room) return;

  // Cannot deactivate a room while someone is sleeping in it.
  if (room.isActive && room.beds.some((b) => b.status === "OCCUPIED")) return;

  await prisma.room.update({ where: { id }, data: { isActive: !room.isActive } });
  refresh();
}

export async function deleteRoom(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Keep history: a room whose beds were ever allocated cannot be deleted.
  const history = await prisma.allocation.count({ where: { bed: { roomId: id } } });
  if (history > 0) return;

  await prisma.room.delete({ where: { id } });
  refresh();
}

// ───────── Beds ─────────

export async function toggleBedMaintenance(formData: FormData) {
  await requireRole("ADMIN", "WARDEN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const bed = await prisma.bed.findUnique({ where: { id } });
  if (!bed || bed.status === "OCCUPIED") return;

  await prisma.bed.update({
    where: { id },
    data: { status: bed.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE" },
  });
  refresh();
}