// src/components/ServiceForm.js
"use client";
import { useState, useEffect } from "react";

export default function ServiceForm() {
  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    region: "",
    country: "",
    serviceLevel: "",
    backfillOption: "",
    contractDuration: "",
    paymentMethod: "",
    pricingOptions: [],
  });

  // Data state
  const [regions, setRegions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Region, 2: Country, 3: Service Level, 4: Pricing

  // Fetch all regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/regions");
        if (!response.ok) throw new Error("Failed to fetch regions");
        const data = await response.json();
        setRegions(data.regions);
      } catch (err) {
        setError("Failed to load regions. Please refresh the page.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  // Fetch countries when region is selected
  const fetchCountriesForRegion = async (region) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/regions?region=${encodeURIComponent(region)}&withCurrency=true`
      );
      if (!response.ok) throw new Error("Failed to fetch countries");
      const data = await response.json();
      setCountries(data.countries);
      setCurrentStep(2); // Move to country selection
    } catch (err) {
      setError("Failed to load countries. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pricing when service level is selected
  const fetchPricingForServiceLevel = async (country, serviceLevel) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/regions?region=${encodeURIComponent(
          formData.region
        )}&withPricing=true&serviceLevel=${serviceLevel}`
      );
      if (!response.ok) throw new Error("Failed to fetch pricing");
      const data = await response.json();

      // Find the selected country's pricing
      const selectedCountry = data.countries.find((c) => c.name === country);
      if (selectedCountry) {
        setFormData((prev) => ({
          ...prev,
          pricingOptions: selectedCountry.pricing || {},
          paymentMethod: selectedCountry.currency || "USD",
        }));
        setCurrentStep(4); // Move to pricing selection
      }
    } catch (err) {
      setError("Failed to load pricing. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionSelect = (region) => {
    setFormData((prev) => ({ ...prev, region }));
    fetchCountriesForRegion(region);
  };

  const handleCountrySelect = (country) => {
    setFormData((prev) => ({ ...prev, country }));
    setCurrentStep(3); // Move to service level selection
  };

  const handleServiceLevelSelect = (serviceLevel) => {
    setFormData((prev) => ({ ...prev, serviceLevel }));
    fetchPricingForServiceLevel(formData.country, serviceLevel);
  };

  const handleBackfillOptionSelect = (backfillOption) => {
    setFormData((prev) => ({ ...prev, backfillOption }));
  };

  const handleContractDurationSelect = (contractDuration) => {
    setFormData((prev) => ({ ...prev, contractDuration }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Submission failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit form. Please try again.");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceForOption = (option) => {
    const level = formData.serviceLevel;
    const key =
      option === "with"
        ? `With Backfill Yearly Rate L${level}`
        : `Without Backfill Yearly Rate L${level}`;

    return formData.pricingOptions[key] || "Price not available";
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Service Request Form
      </h1>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {success ? (
        <div className="p-4 mb-6 text-green-700 bg-green-100 rounded-lg">
          <p className="font-semibold">Form submitted successfully!</p>
          <p>We&apos;ll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name (always shown) */}
          <div className="space-y-2">
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-700"
            >
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
              required
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Step 1: Region Selection */}
          {currentStep >= 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Region <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => handleRegionSelect(region)}
                    className={`p-3 border rounded-md text-left ${
                      formData.region === region
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Country Selection */}
          {currentStep >= 2 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {countries.map((country) => (
                  <button
                    key={country.name}
                    type="button"
                    onClick={() => handleCountrySelect(country.name)}
                    className={`p-3 border rounded-md text-left ${
                      formData.country === country.name
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{country.name}</span>
                      <span className="text-sm text-gray-500">
                        {country.currency}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Service Level Selection */}
          {currentStep >= 3 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Service Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {["1", "2", "3", "4", "5"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleServiceLevelSelect(level)}
                    className={`p-2 border rounded-md text-center ${
                      formData.serviceLevel === level
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    L{level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Pricing Options */}
          {currentStep >= 4 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pricing Options <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {["with", "without"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleBackfillOptionSelect(option)}
                      className={`p-3 border rounded-md text-left ${
                        formData.backfillOption === option
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="capitalize">{option} Backfill</span>
                        <span className="text-sm font-medium">
                          {formData.paymentMethod} {getPriceForOption(option)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contract Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contract Duration <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["short-term", "long-term"].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => handleContractDurationSelect(duration)}
                      className={`p-3 border rounded-md text-center ${
                        formData.contractDuration === duration
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {duration === "short-term"
                        ? "Short-term (up to 3 months)"
                        : "Long-term (more than 3 months)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.backfillOption ||
                    !formData.contractDuration
                  }
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
