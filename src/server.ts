import app from "./app";
import { configs } from "./app/configs";
import { connectDB } from "./app/utils/connect-db";
import { Server } from "http";
import { seedSuperAdmin } from "./app/utils/seed-super-admin";
let server: Server;
//  boostrap function :
const boostrap = async () => {
   try {
      await connectDB(configs?.databaseUrl);

      console.log("✅ Database connected  successfully!");

      await seedSuperAdmin();
      // server listen :
      server = app.listen(configs?.port, () => {
         console.log(`🧑‍🚀🚀 Server is running on ${configs?.port}`);
      });
   } catch (err) {
      console.error("Bootstrap error", err);
   }
};

// bootstrap the project
boostrap();

// handle unhandled rejection
process.on("unhandledRejection", (reason) => {
   console.error("unhandledRejection > reason", reason);
   if (server) {
      server.close(() => {
         process.exit(1);
      });
   }

   process.exit(1);
});

// handled uncaughtException:
process.on("uncaughtException", (error) => {
   console.error("error", error);
   process.exit(1);
});
