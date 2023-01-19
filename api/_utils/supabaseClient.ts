import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';

dotenv.config()
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
