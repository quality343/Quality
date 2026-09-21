/**
 * Demo hearing-aid catalogue seed — SYNTHETIC SAMPLE DATA.
 *
 * Brand/model names are placeholders for development and demo purposes only.
 * They do not represent verified manufacturer specifications, prices, or
 * partnerships. Replace with real, verified catalogue data before go-live.
 *
 * Run: npx tsx scripts/seed-hearingaids.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FEATURES = [
  { key: "rechargeable", label: "Rechargeable", category: "power" },
  { key: "battery", label: "Battery-powered", category: "power" },
  { key: "bluetooth", label: "Bluetooth streaming", category: "connectivity" },
  { key: "smartphone-app", label: "Smartphone app", category: "connectivity" },
  { key: "noise-reduction", label: "Noise reduction", category: "sound" },
  { key: "directional-mic", label: "Directional microphones", category: "sound" },
  { key: "telecoil", label: "Telecoil", category: "connectivity" },
  { key: "water-resistance", label: "Water/dust resistance", category: "comfort" },
];

const BRANDS = [
  { name: "Aurora Acoustics (demo)", description: "Demo brand — sample catalogue entry for development." },
  { name: "ClearTone Labs (demo)", description: "Demo brand — sample catalogue entry for development." },
  { name: "SoundNest (demo)", description: "Demo brand — sample catalogue entry for development." },
];

const MODELS: {
  brandIdx: number;
  modelName: string;
  modelCode: string;
  deviceType: "BTE" | "RIC" | "ITE" | "ITC" | "CIC" | "IIC";
  technologyLevel: "PREMIUM" | "ADVANCED" | "MID" | "ESSENTIAL";
  featureKeys: string[];
  priceInr: number;
  warrantyMonths: number;
  description: string;
}[] = [
  { brandIdx: 0, modelName: "Horizon 9", modelCode: "AUR-H9", deviceType: "RIC", technologyLevel: "PREMIUM", featureKeys: ["rechargeable", "bluetooth", "smartphone-app", "noise-reduction", "directional-mic"], priceInr: 89000, warrantyMonths: 24, description: "Sample premium RIC with rechargeable battery and app control (demo data)." },
  { brandIdx: 0, modelName: "Horizon 5", modelCode: "AUR-H5", deviceType: "RIC", technologyLevel: "ADVANCED", featureKeys: ["rechargeable", "bluetooth", "noise-reduction"], priceInr: 62000, warrantyMonths: 24, description: "Sample advanced RIC (demo data)." },
  { brandIdx: 1, modelName: "PureEdge 7", modelCode: "CTL-P7", deviceType: "BTE", technologyLevel: "ADVANCED", featureKeys: ["rechargeable", "bluetooth", "telecoil", "water-resistance"], priceInr: 54000, warrantyMonths: 24, description: "Sample BTE with telecoil and moisture protection (demo data)." },
  { brandIdx: 1, modelName: "PureEdge 3", modelCode: "CTL-P3", deviceType: "BTE", technologyLevel: "MID", featureKeys: ["battery", "directional-mic"], priceInr: 32000, warrantyMonths: 12, description: "Sample battery-powered BTE (demo data)." },
  { brandIdx: 2, modelName: "Whisper Micro", modelCode: "SNW-M1", deviceType: "CIC", technologyLevel: "MID", featureKeys: ["battery", "noise-reduction"], priceInr: 38000, warrantyMonths: 12, description: "Sample CIC (demo data)." },
  { brandIdx: 2, modelName: "Whisper Nano", modelCode: "SNW-N1", deviceType: "IIC", technologyLevel: "PREMIUM", featureKeys: ["battery", "smartphone-app"], priceInr: 76000, warrantyMonths: 24, description: "Sample IIC (demo data)." },
];

const ACCESSORIES = [
  { name: "Standard domes (pack of 6, demo)", category: "DOME" as const, priceInr: 450 },
  { name: "Receiver wires L/R (demo)", category: "RECEIVER" as const, priceInr: 1800 },
  { name: "Charging case (demo)", category: "CHARGER" as const, priceInr: 4200 },
  { name: "Cleaning kit (demo)", category: "CLEANING" as const, priceInr: 600 },
];

async function main() {
  for (const f of FEATURES) {
    await prisma.hearingAidFeature.upsert({ where: { key: f.key }, create: f, update: {} });
  }
  console.log(`✔ features: ${FEATURES.length}`);

  const brandIds: string[] = [];
  for (const b of BRANDS) {
    const brand = await prisma.hearingAidBrand.upsert({
      where: { name: b.name },
      create: b,
      update: {},
    });
    brandIds.push(brand.id);
  }
  console.log(`✔ brands: ${BRANDS.length}`);

  const modelIds: string[] = [];
  for (const m of MODELS) {
    const model = await prisma.hearingAidModel.upsert({
      where: { modelCode: m.modelCode },
      create: {
        brandId: brandIds[m.brandIdx],
        modelName: m.modelName,
        modelCode: m.modelCode,
        deviceType: m.deviceType,
        technologyLevel: m.technologyLevel,
        description: m.description,
        priceInr: m.priceInr,
        warrantyMonths: m.warrantyMonths,
        status: "ACTIVE",
      },
      update: {},
    });
    modelIds.push(model.id);
    const features = await prisma.hearingAidFeature.findMany({ where: { key: { in: m.featureKeys } } });
    for (const f of features) {
      await prisma.hearingAidModelFeature.upsert({
        where: { modelId_featureId: { modelId: model.id, featureId: f.id } },
        create: { modelId: model.id, featureId: f.id },
        update: {},
      });
    }
  }
  console.log(`✔ models: ${MODELS.length}`);

  for (const a of ACCESSORIES) {
    const existing = await prisma.hearingAidAccessory.findFirst({ where: { name: a.name } });
    if (!existing) {
      await prisma.hearingAidAccessory.create({ data: { ...a, isActive: true } });
    }
  }
  console.log(`✔ accessories: ${ACCESSORIES.length}`);
  console.log("ℹ Demo devices (serial-numbered inventory) are NOT seeded — register real/sample units in the admin portal.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
