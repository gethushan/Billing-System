import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ✅ function to fetch base price
function getBasePrice(serviceLevel, country, backfillOption) {
  const fileName = `extracted_data ${serviceLevel}.json`;
  const filePath = path.join(process.cwd(), "src", "database", fileName);
  if (!fs.existsSync(filePath)) throw new Error(`File ${fileName} not found`);

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const record = data.find(
    (entry) => entry.Country.toLowerCase() === country.toLowerCase()
  );
  if (!record) throw new Error(`No data for ${country} in ${fileName}`);

  const prefix =
    backfillOption.toLowerCase() === "with"
      ? "With Backfill Yearly Rate"
      : "Without Backfill Yearly Rate";
  const field = `${prefix} ${serviceLevel}`;

  const price = record[field];
  if (price === undefined) throw new Error(`Price not found for ${field}`);
  return price;
}

// ✅ function to fetch duration price
function getDurationPrice(
  contractDuration,
  country,
  serviceLevel,
  projectDuration
) {
  const fileName =
    contractDuration.toLowerCase() === "short-term"
      ? "shorttermprojectrate.json"
      : "longtermprojectrate.json";
  const filePath = path.join(process.cwd(), "src", "database", fileName);
  if (!fs.existsSync(filePath)) throw new Error(`File ${fileName} not found`);

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const record = data.find(
    (entry) => entry.Country.toLowerCase() === country.toLowerCase()
  );
  if (!record) throw new Error(`No data for ${country} in ${fileName}`);

  const pricePerMonth = record[serviceLevel];
  if (pricePerMonth === undefined)
    throw new Error(`Price not found for ${serviceLevel} in ${fileName}`);

  return pricePerMonth * projectDuration;
}

// ✅ function to fetch visit price
function getVisitPrice(visitType, country, serviceLevel, dayVisitCount) {
  const fileName =
    visitType.toLowerCase() === "full-day"
      ? "fulldayvisitrate.json"
      : "halfdayvisitrate.json";
  const filePath = path.join(process.cwd(), "src", "database", fileName);
  if (!fs.existsSync(filePath)) throw new Error(`File ${fileName} not found`);

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const record = data.find(
    (entry) => entry.Country.toLowerCase() === country.toLowerCase()
  );
  if (!record) throw new Error(`No data for ${country} in ${fileName}`);

  const pricePerVisit = record[serviceLevel];
  if (pricePerVisit === undefined)
    throw new Error(`Price not found for ${serviceLevel} in ${fileName}`);

  return pricePerVisit * dayVisitCount;
}

// ✅ function to fetch dispatch price
function getDispatchPrice(country, dispatchPriority) {
  const fileName = "dispatchticketprice.json";
  const filePath = path.join(process.cwd(), "src", "database", fileName);
  if (!fs.existsSync(filePath)) throw new Error(`File ${fileName} not found`);

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const record = data.find(
    (entry) => entry.Country.toLowerCase() === country.toLowerCase()
  );
  if (!record) throw new Error(`No data for ${country} in ${fileName}`);

  const price = record[dispatchPriority];
  if (price === undefined)
    throw new Error(
      `Price not found for dispatchPriority "${dispatchPriority}"`
    );
  return price;
}

const calculateExtraDistanceCharge = (distanceFromProjectSite) => {
  const allowedDistance = 50;
  const perKmCharge = 0.4;

  let extraDistanceCharge = 0;
  if (distanceFromProjectSite > allowedDistance) {
    const extraKm = distanceFromProjectSite - allowedDistance;
    extraDistanceCharge = extraKm * perKmCharge;
  }

  return extraDistanceCharge;
};

// ✅ NEW function to fetch dispatch extra price
function getDispatchExtraPrice(country, dispatchPricing) {
  const fileName = "dispatchprice.json";
  const filePath = path.join(process.cwd(), "src", "database", fileName);
  if (!fs.existsSync(filePath)) throw new Error(`File ${fileName} not found`);

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const record = data.find(
    (entry) => entry.Country.toLowerCase() === country.toLowerCase()
  );
  if (!record) throw new Error(`No data for ${country} in ${fileName}`);

  const price = record[dispatchPricing];
  if (price === undefined)
    throw new Error(`Price not found for dispatchPricing "${dispatchPricing}"`);
  return price;
}

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log("Form Data received:", formData);

    const requiredFields = [
      "companyName",
      "region",
      "country",
      "serviceLevel",
      "backfillOption",
      "contractDuration",
      "projectDuration",
      "visitType",
      "dayVisitCount",
      "dispatchPriority",
      "dispatchPricing",
      "distanceFromProjectSite",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const basePrice = getBasePrice(
      formData.serviceLevel,
      formData.country,
      formData.backfillOption
    );
    const durationPrice = getDurationPrice(
      formData.contractDuration,
      formData.country,
      formData.serviceLevel,
      formData.projectDuration
    );
    const visitPrice = getVisitPrice(
      formData.visitType,
      formData.country,
      formData.serviceLevel,
      formData.dayVisitCount
    );
    const dispatchPrice = getDispatchPrice(
      formData.country,
      formData.dispatchPriority
    );
    const dispatchExtraPrice = getDispatchExtraPrice(
      formData.country,
      formData.dispatchPricing
    );
    const distanceCharge = calculateExtraDistanceCharge(
      formData.distanceFromProjectSite
    );

    const totalPrice =
      basePrice +
      durationPrice +
      visitPrice +
      dispatchPrice +
      dispatchExtraPrice +
      distanceCharge;

    console.log(`Base Price: ${basePrice}`);
    console.log(`Duration Price: ${durationPrice}`);
    console.log(`Visit Price: ${visitPrice}`);
    console.log(`Dispatch Price: ${dispatchPrice}`);
    console.log(`Dispatch Extra Price: ${dispatchExtraPrice}`);
    console.log(`Distance Charge: ${distanceCharge}`);
    console.log(`Total Price: ${totalPrice}`);

    const detailedBreakdown = {
      basePrice,
      durationPrice,
      visitPrice,
      dispatchPrice,
      dispatchExtraPrice,
      distanceCharge,
      totalPrice,
    };

    console.log("Detailed price breakdown:", detailedBreakdown);

    return NextResponse.json(
      {
        message: "Form submitted successfully",
        data: detailedBreakdown,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
