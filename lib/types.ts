import { z } from "zod";
const httpUrl = z
  .string()
  .trim()
  .url("Geçerli bir bağlantı girin.")
  .refine((v) => /^https?:\/\//i.test(v), "Bağlantı https:// veya http:// ile başlamalı.");
export const instructionSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(2, "Başlık en az 2 karakter olmalı.").max(100),
  description: z.string().trim().min(5, "En az 5 karakterlik bir açıklama girin.").max(4000),
});
export const placeSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2, "Mekan adı gerekli.").max(100),
  category: z.enum(["market", "pharmacy", "restaurant", "nature"]),
  distance: z.string().trim().min(1, "Mesafe gerekli.").max(40),
  mapsUrl: httpUrl,
  imageUrl: z.union([httpUrl, z.literal("")]),
});
export const guideSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().trim().min(3, "Ev adı en az 3 karakter olmalı.").max(100),
  coverImage: httpUrl,
  address: z.string().trim().min(5, "Lütfen açık adresi girin.").max(300),
  location: z.string().max(100),
  mapsUrl: z.union([httpUrl, z.literal("")]),
  wifiName: z.string().trim().min(1, "Wi-Fi ağ adı gerekli.").max(100),
  wifiPassword: z.string().min(1, "Wi-Fi şifresi gerekli.").max(100),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[+\d\s()\-]+$/, "Geçerli bir telefon numarası girin.")
    .refine((v) => {
      const n = v.replace(/\D/g, "").replace(/^00/, "");
      return n.length >= 10 && n.length <= 15;
    }, "Telefon numarası 10–15 rakam içermeli."),
  checkIn: z.string(),
  checkOut: z.string(),
  instructions: z.array(instructionSchema).max(20),
  places: z.array(placeSchema).max(20),
  updatedAt: z.string(),
  publishedAt: z.string().nullable().optional(),
  revision: z.number().int().nonnegative().optional(),
});
export type Guide = z.infer<typeof guideSchema>;
export type Instruction = Guide["instructions"][number];
export type Place = Guide["places"][number];
export type Language = "tr" | "en" | "ar";
