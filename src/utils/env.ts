import { z } from "zod";
import dontenv from "dotenv";
dontenv.config();

const envSchema = z.object({
  APTIV_MQTT_CLIENT: z.string(),
});

const env = envSchema.parse(process.env);

export default env;
