"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  registerStudent,
  updateStudent,
  type StudentFormState,
} from "@/app/actions/students";

type StudentData = {
  id: string;
  studentCode: string;
  phone: string;
  dateOfBirth: Date | string | null;
  gender: string | null;
  address: string | null;
  institution: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string | null;
  checkInDate: Date | string | null;
  user: {
    name: string;
    email: string;
  };
};

type Props = {
  mode: "create" | "edit";
  student?: StudentData;
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Please wait..."
        : mode === "create"
          ? "Register Student"
          : "Update Student"}
    </button>
  );
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

export default function StudentForm({ mode, student }: Props) {
  const action = mode === "create" ? registerStudent : updateStudent;

  const [state, formAction] = useActionState<StudentFormState, FormData>(
    action,
    {},
  );

  const initialValues: Record<string, string> = {
    name: student?.user.name ?? "",
    email: student?.user.email ?? "",
    studentCode: student?.studentCode ?? "",
    phone: student?.phone ?? "",
    dateOfBirth: formatDate(student?.dateOfBirth),
    gender: student?.gender ?? "",
    address: student?.address ?? "",
    institution: student?.institution ?? "",
    guardianName: student?.guardianName ?? "",
    guardianPhone: student?.guardianPhone ?? "",
    guardianRelation: student?.guardianRelation ?? "",
    checkInDate: formatDate(student?.checkInDate),
  };

  const values = {
    ...initialValues,
    ...(state.values ?? {}),
  };

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  function inputClass(name: string) {
    return `mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
      fieldError(name)
        ? "border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
    }`;
  }

  function renderInput(
    name: string,
    label: string,
    type = "text",
    required = false,
  ) {
    return (
      <div key={name}>
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={values[name]}
          className={inputClass(name)}
        />

        {fieldError(name) && (
          <p className="mt-1 text-xs text-red-600">{fieldError(name)}</p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      {mode === "edit" && student && (
        <input type="hidden" name="studentId" value={student.id} />
      )}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {state.success}
        </div>
      )}

      {/* Personal Information */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {renderInput("name", "Full Name", "text", true)}
          {renderInput("email", "Email Address", "email", true)}
          {renderInput("studentCode", "Student Code", "text", true)}
          {renderInput("phone", "Phone Number", "tel", true)}
          {renderInput("dateOfBirth", "Date of Birth", "date")}

          <div>
            <label
              htmlFor="gender"
              className="text-sm font-medium text-gray-700"
            >
              Gender
            </label>

            <select
              id="gender"
              name="gender"
              defaultValue={values.gender}
              className={inputClass("gender")}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {fieldError("gender") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldError("gender")}
              </p>
            )}
          </div>

          {renderInput("institution", "Institution")}
          <div className="md:col-span-2">
            <label
              htmlFor="address"
              className="text-sm font-medium text-gray-700"
            >
              Address
            </label>

            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={values.address}
              className={inputClass("address")}
            />
          </div>
        </div>
      </section>

      {/* Guardian Information */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Guardian Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {renderInput("guardianName", "Guardian Name", "text", true)}
          {renderInput("guardianPhone", "Guardian Phone", "tel", true)}
          {renderInput("guardianRelation", "Relationship")}
        </div>
      </section>

      {/* Hostel Information */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Hostel Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {renderInput("checkInDate", "Check-in Date", "date")}
        </div>
      </section>

      {/* Account Information */}
      {mode === "create" && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Student Login Information
          </h2>

          <div className="max-w-md">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Initial Password
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className={inputClass("password")}
              placeholder="Enter initial password"
            />

            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters.</p>

            {fieldError("password") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldError("password")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-5">
        <a
          href="/students"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Cancel
        </a>

        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
