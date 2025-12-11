import dotenv from "dotenv";
import { join } from "path";

// Load environment variables from config/.env.local
dotenv.config({ path: join(process.cwd(), "config/.env.local") });


async function main() {

  console.log("Ingesting sample text...");

}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
