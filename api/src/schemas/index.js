import { z } from "zod";

z.config(z.locales.pt());

export * from "./searchSchema.js";
export * from "./leadSchema.js";
export * from "./authSchema.js";
export * from "./adminSchema.js";
export * from "./apiTokenSchema.js";
export * from "./pitchSchema.js";
