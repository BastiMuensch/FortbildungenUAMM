import { z } from "zod";
import { ROLLEN } from "@/constants/fortbildung";

/** Auch aus der Datenbank gelesene Rollen müssen zu den unterstützten Rollen gehören. */
export const RolleSchema = z.enum(ROLLEN.map(({ value }) => value));
