import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export type Folder = {
  id: string;
  parent_id: string | null;
  name: string;
  description: string;
  share_slug: string;
  download_enabled: boolean;
  cover_key: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Track = {
  id: string;
  folder_id: string;
  title: string;
  file_key: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  duration_sec: number | null;
  peaks: number[] | null;
  bpm: number | null;
  music_key: string | null;
  position: number;
  created_at: string;
};
