import "dotenv/config";
import { ensureDemoAccounts } from "../src/lib/bootstrap/ensure-system-admin";

ensureDemoAccounts()
  .then(() => {
    console.log("[ensure-admin] Demo accounts ready (admin@gcu.edu.in, developer@gcu.edu.in)");
  })
  .catch((error) => {
    console.error("[ensure-admin] Failed:", error);
    process.exit(1);
  });
