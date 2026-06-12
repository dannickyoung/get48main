// Creates (or resets) the single admin account with a temporary password and a
// "must change password on first login" flag.
// Run with:  node --env-file=.env.local scripts/create-admin.mjs
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "dannyrongda@gmail.com";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Readable but strong temp password, e.g. Get48-9f3a-7c1b
const temp = `Get48-${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`;

const meta = { must_change_password: true };

const { error } = await supabase.auth.admin.createUser({
  email,
  password: temp,
  email_confirm: true,
  user_metadata: meta,
});

if (error && /already|registered|exists/i.test(error.message)) {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("List failed:", listErr.message);
    process.exit(1);
  }
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error("User reported as existing but not found.");
    process.exit(1);
  }
  const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
    password: temp,
    email_confirm: true,
    user_metadata: meta,
  });
  if (updErr) {
    console.error("Update failed:", updErr.message);
    process.exit(1);
  }
  console.log("RESULT=updated");
} else if (error) {
  console.error("Create failed:", error.message);
  process.exit(1);
} else {
  console.log("RESULT=created");
}

console.log(`ADMIN_EMAIL=${email}`);
console.log(`TEMP_PASSWORD=${temp}`);
