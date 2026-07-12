import { initials } from "@/lib/utils";

export interface User {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  /** the constituency this user belongs to (department / ward) */
  constituency: string;
  avatarInitials: string;
}

function u(
  id: string,
  tenantId: string,
  name: string,
  role: string,
  constituency: string,
): User {
  return { id, tenantId, name, role, constituency, avatarInitials: initials(name) };
}

export const SEED_USERS: User[] = [
  // St. Xavier's College — students & council
  u("xa-u1", "xaviers", "Aditi Rao", "3rd yr · Computer Science", "Computer Science"),
  u("xa-u2", "xaviers", "Kabir Menon", "Union President", "Economics"),
  u("xa-u3", "xaviers", "Sara Fernandes", "2nd yr · Mass Media", "Mass Media"),
  u("xa-u4", "xaviers", "Rohan Iyer", "4th yr · Physics", "Physics"),

  // Devgaon Panchayat — residents & officials
  u("dv-u1", "devgaon", "Sunita Devi", "Ward member", "Ward 3 · Rampara"),
  u("dv-u2", "devgaon", "Ramesh Patil", "Sarpanch", "Ward 1 · Devgaon Khurd"),
  u("dv-u3", "devgaon", "Imran Shaikh", "Resident", "Ward 5 · Naya Basti"),
  u("dv-u4", "devgaon", "Lakshmi Naidu", "Resident", "Ward 2 · Talav Side"),
];
