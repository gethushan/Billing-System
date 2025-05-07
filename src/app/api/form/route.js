// src/app/api/regions/route.js
import { NextResponse } from "next/server";
import countriesByRegion from "@/database/countriesbyregion.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");

    if (region) {
      // Return countries for specific region
      const countries = countriesByRegion[region];
      if (!countries) {
        return NextResponse.json(
          { message: "Region not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ countries });
    }

    // Return all regions if no specific region requested
    const regions = Object.keys(countriesByRegion);
    return NextResponse.json({ regions });
  } catch (error) {
    console.error("Error fetching region data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
