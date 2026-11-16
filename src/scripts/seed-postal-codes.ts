import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectDB } from "../app/utils/connect-db";
import { configs } from "../app/configs";
import { PostalCodeServices } from "../app/modules/PostalCode";

const run = async () => {
   try {
      console.log("Connecting to MongoDB:", configs.databaseUrl?.replace(/:([^@]+)@/, ":****@"));
      await connectDB(configs.databaseUrl);
      console.log("Connected to MongoDB successfully!");

      const jsonPath = path.resolve(
         process.cwd(),
         "..",
         "Issues_given_by_client",
         "client_given_postal_codes_json.json",
      );

      console.log(`Starting seed from ${jsonPath}...`);
      const startTime = Date.now();
      const result = await PostalCodeServices.seedPostalCodesFromJSON(jsonPath);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n🎉 Seed Completed in ${elapsed}s!`);
      console.log(`Total found: ${result.totalFound}`);
      console.log(`Processed: ${result.processed}`);
      console.log(`Upserted/Updated: ${result.upsertedCount}`);

      const stats = await PostalCodeServices.getPostalCodeStats();
      console.log(`\n📊 DB Stats:`);
      console.log(`Total records in DB: ${stats.totalRecords}`);
      console.log(`Unique Postal Codes: ${stats.uniquePostalCodes}`);
      console.log(`Total States: ${stats.states.length}`);

      process.exit(0);
   } catch (err) {
      console.error("Seed error:", err);
      process.exit(1);
   }
};

run();
