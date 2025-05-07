// src/app/api/regions/route.js
import { NextResponse } from "next/server";
import countriesByRegion from "@/database/countriesbyregion.json";
import currencyData from "@/database/currency.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const withCurrency = searchParams.get("withCurrency");

    if (region) {
      const countries = countriesByRegion[region];
      if (!countries) {
        return NextResponse.json(
          { message: "Region not found" },
          { status: 404 }
        );
      }

      // Enhance countries with currency data if requested
      if (withCurrency) {
        const countriesWithCurrency = countries.map((country) => ({
          name: country,
          currency: currencyData[country] || "USD", // Default to USD if not found
        }));
        return NextResponse.json({ countries: countriesWithCurrency });
      }

      return NextResponse.json({ countries });
    }

    const regions = Object.keys(countriesByRegion);
    return NextResponse.json({ regions });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
