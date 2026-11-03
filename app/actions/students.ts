"use server";

import "server-only";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

export type StudentFormState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

const optionalText = z
  .preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().optional(),
  )
  .transform((value) => value ?? null);

const optionalDate = z
  .preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.date().optional(),
  )
  .transform((value) => value ?? null);

const studentSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  studentCode: z.string().trim().min(1, "Student code is required"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  dateOfBirth: optionalDate,
  gender: optionalText,
  address: optionalText,
  institution: optionalText,
  guardianName: z.string().trim().min(2, "Guardian name is required"),
  guardianPhone: z.string().trim().min(7, "Enter a valid guardian phone"),
  guardianRelation: optionalText,
  checkInDate: optionalDate,
});

const registrationSchema = studentSchema.extend({
  password: z.string().min(8, "Password must contain at least 8 characters"),
});

const formFields = [
  "name",
  "email",
  "studentCode",
  "phone",
  "dateOfBirth",
  "gender",
  "address",
  "institution",
  "guardianName",
  "guardianPhone",
  "guardianRelation",
  "checkInDate",
];

function getFormValues(formData: FormData) {
  return Object.fromEntries(
    formFields.map((field) => [field, String(formData.get(field) ?? "")]),
  );
}

function getFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");

    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function getDatabaseError(error: unknown) {
  if (isUniqueConstraintError(error)) {
    return "This email or student code is already registered.";
  }

  return "Something went wrong. Please try again.";
}

export async function registerStudent(
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  await requireRole("ADMIN", "WARDEN");

  const values = getFormValues(formData);

  const parsed = registrationSchema.safeParse({
    ...values,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error),
      values,
    };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        error: "An account with this email already exists.",
        fieldErrors: {
          email: "Email is already registered.",
        },
        values,
      };
    }

    const existingStudent = await prisma.student.findUnique({
      where: { studentCode: data.studentCode },
      select: { id: true },
    });

    if (existingStudent) {
      return {
        error: "This student code is already registered.",
        fieldErrors: {
          studentCode: "Student code is already in use.",
        },
        values,
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email,
          passwordHash,
          role: "STUDENT",
          isActive: true,
        },
      });

      await tx.student.create({
        data: {
          userId: user.id,
          studentCode: data.studentCode,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          institution: data.institution,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone,
          guardianRelation: data.guardianRelation,
          checkInDate: data.checkInDate,
        },
      });
    });

    revalidatePath("/students");
    revalidatePath("/dashboard");

    return {
      success: "Student registered successfully.",
      values: {},
    };
  } catch (error) {
    console.error("Student registration error:", error);

    return {
      error: getDatabaseError(error),
      values,
    };
  }
}

export async function updateStudent(
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  await requireRole("ADMIN", "WARDEN");

  const studentId = String(formData.get("studentId") ?? "");
  const values = getFormValues(formData);

  if (!studentId) {
    return {
      error: "Student ID is missing.",
      values,
    };
  }

  const parsed = studentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: getFieldErrors(parsed.error),
      values,
    };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true },
    });

    if (!student) {
      return {
        error: "Student not found.",
        values,
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== student.userId) {
      return {
        error: "This email is already registered.",
        fieldErrors: {
          email: "Email is already in use.",
        },
        values,
      };
    }

    const existingCode = await prisma.student.findUnique({
      where: { studentCode: data.studentCode },
      select: { id: true },
    });

    if (existingCode && existingCode.id !== studentId) {
      return {
        error: "This student code is already registered.",
        fieldErrors: {
          studentCode: "Student code is already in use.",
        },
        values,
      };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: student.userId },
        data: {
          name: data.name,
          email,
        },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: {
          studentCode: data.studentCode,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          institution: data.institution,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone,
          guardianRelation: data.guardianRelation,
          checkInDate: data.checkInDate,
        },
      }),
    ]);

    revalidatePath("/students");
    revalidatePath(`/students/${studentId}`);
    revalidatePath(`/students/${studentId}/edit`);

    return {
      success: "Student information updated successfully.",
      values,
    };
  } catch (error) {
    console.error("Student update error:", error);

    return {
      error: getDatabaseError(error),
      values,
    };
  }
}

export async function getStudents(search = "") {
  await requireRole("ADMIN", "WARDEN");

  const term = search.trim();

  return prisma.student.findMany({
    where: term
      ? {
          OR: [
            {
              user: {
                is: {
                  name: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              user: {
                is: {
                  email: {
                    contains: term,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              studentCode: {
                contains: term,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: term,
                mode: "insensitive",
              },
            },
            {
              guardianName: {
                contains: term,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function setStudentActive(studentId: string, isActive: boolean) {
  await requireRole("ADMIN", "WARDEN");

  if (!studentId) {
    return {
      error: "Student ID is required.",
    };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });

    if (!student) {
      return {
        error: "Student not found.",
      };
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive },
    });

    revalidatePath("/students");
    revalidatePath(`/students/${studentId}`);
    revalidatePath("/dashboard");

    return {
      success: isActive
        ? "Student account activated successfully."
        : "Student account deactivated successfully.",
    };
  } catch (error) {
    console.error("Student status update error:", error);

    return {
      error: "Unable to update student status.",
    };
  }
}
