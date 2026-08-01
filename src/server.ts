import app from "./app";
import { configs } from "./app/configs";
import { connectDB } from "./app/utils/connect-db";
import { createServer, Server } from "http";
import { seedSuperAdmin } from "./app/utils/seed-super-admin";
import { initSocket } from "./app/configs/socket";
let server: Server;
//  boostrap function :
const boostrap = async () => {
   try {
      await connectDB(configs?.databaseUrl);
      console.log("✅ Database connected  successfully!");

      const httpServer = createServer(app);

      // Initialize Socket Server with the HTTP wrapper
      initSocket(httpServer);

      await seedSuperAdmin();
      // server listen :
      server = httpServer.listen(configs?.port, () => {
         console.log(
            `🧑‍🚀🚀 Server is running with WebSockets on ${configs?.port}`,
         );
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
