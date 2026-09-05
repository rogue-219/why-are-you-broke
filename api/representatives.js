export default async function handler(req, res) {
  const address = req.query.address;

  if (!address) {
    return res.status(400).json({
      error: "Address is required."
    });
  }

  try {
    const params = new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
      vintage: "Current_Current",
      format: "json"
    });

    const censusUrl =
      `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?${params.toString()}`;

    const response = await fetch(censusUrl);

    if (!response.ok) {
      throw new Error(`Census API returned ${response.status}`);
    }

    const data = await response.json();

    const matches = data?.result?.addressMatches || [];

    if (matches.length === 0) {
      return res.status(404).json({
        error: "We couldn't match that address. Try including street, city, state, and ZIP code."
      });
    }

    const match = matches[0];
    const geographies = match.geographies || {};

    const congressionalKey = Object.keys(geographies).find(key =>
      key.toLowerCase().includes("congressional district")
    );

    const congressionalDistrict =
      congressionalKey && geographies[congressionalKey]?.[0]
        ? geographies[congressionalKey][0]
        : null;

    if (!congressionalDistrict) {
      return res.status(404).json({
        error: "We found the address, but couldn't determine its congressional district."
      });
    }

    return res.status(200).json({
      matchedAddress: match.matchedAddress,
      stateCode: congressionalDistrict.STATE,
      district: congressionalDistrict.BASENAME,
      congressionalDistrictName: congressionalDistrict.NAME
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Representative lookup is temporarily unavailable."
    });
  }
}
