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
    paymentMethod: "", // New field
    visitType: "",
    dispatchPriority: "", // '9x5x4', '24x7x4', 'SBD', 'NBD', '2BD', '3BD'
    dispatchPricing: "",
    dayVisitCount: 1, // Default to 1 day
    projectDuration: 1,
    distanceFromProjectSite: 1, // Default to 1 km
  });

  // UI state
  const [regions, setRegions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [detailedData, setDetailedData] = useState(null);

  // Fetch regions on component mount
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

  // Fetch countries when region changes
  useEffect(() => {
    if (!formData.region) {
      setCountries([]);
      return;
    }

    const fetchCountries = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/regions?region=${encodeURIComponent(
            formData.region
          )}&withCurrency=true`
        );
        if (!response.ok) throw new Error("Failed to fetch countries");
        const data = await response.json();
        setCountries(data.countries);
      } catch (err) {
        setError("Failed to load countries. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [formData.region]);

  // Update payment method when country changes
  useEffect(() => {
    if (formData.country && countries.length > 0) {
      const selectedCountryData = countries.find(
        (c) => c.name === formData.country
      );
      if (selectedCountryData) {
        setFormData((prev) => ({
          ...prev,
          paymentMethod: selectedCountryData.currency,
        }));
      }
    }
  }, [formData.country, countries]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Submitting:", formData); // Log what we're sending

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Submission failed");
      }

      const responseData = await response.json();
      console.log("API Response:", responseData); // Log the raw response

      setDetailedData(responseData);
      setSuccess(true);
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detailedData) {
      console.log("Updated detailedData:", detailedData.data);
    }
  }, [detailedData]);

  const dispatchOptions = [
    { value: "9x5x4 Incident Response", label: "9x5x4 (Business Hours)" },
    { value: "24x7x4 Response to site", label: "24x7x4 (Urgent)" },
    {
      value: "SBD Business Day Resolution to site",
      label: "SBD (Same Business Day)",
    },
    { value: "NBD Resolution to site", label: "NBD (Next Business Day)" },
    { value: "2BD Resolution to site", label: "2 Business Days" },
    { value: "3BD Resolution to site", label: "3 Business Days" },
  ];
  const currencySymbol = formData.paymentMethod === "USD" ? "$" : "€";

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Teceze Service Request Form
      </h1>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
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
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Region/Country Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-700"
            >
              Region <span className="text-red-500">*</span>
            </label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700"
            >
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={!formData.region || loading}
              required
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Payment Method (read-only) */}
        <div className="space-y-2">
          <label
            htmlFor="paymentMethod"
            className="block text-sm font-medium text-gray-700"
          >
            Payment Method
          </label>
          <input
            type="text"
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            readOnly
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
          />
          <p className="text-xs text-gray-500">
            Automatically determined by selected country
          </p>
        </div>

        {/* Service Level */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Service Level Required <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {["L1", "L2", "L3", "L4", "L5"].map((level) => (
              <label key={level} className="inline-flex items-center">
                <input
                  type="radio"
                  name="serviceLevel"
                  value={level}
                  checked={formData.serviceLevel === level}
                  onChange={handleChange}
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Backfill Option */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Pricing Option <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="backfillOption"
                value="with"
                checked={formData.backfillOption === "with"}
                onChange={handleChange}
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">With Backfill</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="backfillOption"
                value="without"
                checked={formData.backfillOption === "without"}
                onChange={handleChange}
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Without Backfill
              </span>
            </label>
          </div>
        </div>

        {/* Contract Duration */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Contract Duration <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="contractDuration"
                value="short-term"
                checked={formData.contractDuration === "short-term"}
                onChange={handleChange}
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Short-term (up to 3 months)
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="contractDuration"
                value="long-term"
                checked={formData.contractDuration === "long-term"}
                onChange={handleChange}
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Long-term (more than 3 months)
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="visitType"
            className="block text-sm font-medium text-gray-700"
          >
            Visit Type <span className="text-red-500">*</span>
          </label>
          <select
            id="visitType"
            name="visitType"
            value={formData.visitType}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, visitType: e.target.value }))
            }
            required
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select visit type</option>
            <option value="full-day">Full Day Visit</option>
            <option value="half-day">Half Day Visit</option>
          </select>
        </div>

        {/* Day Visit Count */}
        <div className="space-y-2">
          <label
            htmlFor="dayVisitCount"
            className="block text-sm font-medium text-gray-700"
          >
            Day Visit Count <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="dayVisitCount"
            name="dayVisitCount"
            min="1"
            max="365"
            value={formData.dayVisitCount}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                dayVisitCount: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            required
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500">
            Number of days required (1-365)
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="dispatchPriority"
            className="block text-sm font-medium text-gray-700"
          >
            Dispatch Priority <span className="text-red-500">*</span>
          </label>
          <select
            id="dispatchPriority"
            name="dispatchPriority"
            value={formData.dispatchPriority}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                dispatchPriority: e.target.value,
              }))
            }
            required
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select dispatch priority</option>
            {dispatchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="visitType"
            className="block text-sm font-medium text-gray-700"
          >
            Visit Type <span className="text-red-500">*</span>
          </label>
          <select
            id="dispatchPricing"
            name="dispatchPricing"
            value={formData.dispatchPricing}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                dispatchPricing: e.target.value,
              }))
            }
            required
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select dispatch pricing</option>
            <option value="2 BD Resolution to site">
              2 BD Resolution to site
            </option>
            <option value="3 BD Resolution to site">
              3 BD Resolution to site
            </option>
            <option value="4 BD Resolution to site">
              4 BD Resolution to site
            </option>
          </select>
        </div>

        {/* Project Duration */}
        <div className="space-y-2">
          <label
            htmlFor="projectDuration"
            className="block text-sm font-medium text-gray-700"
          >
            Project Duration (months) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="projectDuration"
            name="projectDuration"
            min="1"
            max="60"
            value={formData.projectDuration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                projectDuration: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            required
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500">Duration in months (1-60)</p>
        </div>
        {/* Distance from Project Site */}
        <div className="space-y-2">
          <label
            htmlFor="distanceFromProjectSite"
            className="block text-sm font-medium text-gray-700"
          >
            Distance from the Project Site (km){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="distanceFromProjectSite"
            name="distanceFromProjectSite"
            min="0"
            max="1000"
            value={formData.distanceFromProjectSite}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                distanceFromProjectSite: Math.max(
                  0,
                  parseFloat(e.target.value) || 0
                ),
              }))
            }
            required
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500">
            Enter distance from the project site in kilometers (0-1000)
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
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
      </form>

      {success && detailedData && (
        <div className="p-4 mb-6 text-green-700 bg-green-100 rounded-lg">
          <p className="font-semibold text-lg">Form submitted successfully!</p>
          <p className="mt-1">Here is the detailed price breakdown:</p>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
            <li>
              Service Level Price: {currencySymbol}
              {detailedData.data.basePrice?.toFixed(2) ?? "0.00"}
            </li>
            <li>
              Duration Price(Long/Short Term): {currencySymbol}
              {detailedData.data.durationPrice?.toFixed(2) ?? "0.00"}
            </li>
            <li>
              Field Visit Price: {currencySymbol}
              {detailedData.data.visitPrice?.toFixed(2) ?? "0.00"}
            </li>
            <li>
              Dispatch Ticket Price: {currencySymbol}
              {detailedData.data.dispatchPrice?.toFixed(2) ?? "0.00"}
            </li>
            <li>
              Dispatch Extra Pricing: {currencySymbol}
              {detailedData.data.dispatchExtraPrice?.toFixed(2) ?? "0.00"}
            </li>
            <li>
              Distance Charge: {currencySymbol}
              {detailedData.data.distanceCharge?.toFixed(2) ?? "0.00"}
            </li>
            <li className="font-semibold text-green-800">
              Total Price: {currencySymbol}
              {detailedData.data.totalPrice?.toFixed(2) ?? "0.00"}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
