const STATE_FIPS = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
  "60": "AS", "66": "GU", "69": "MP", "72": "PR", "78": "VI"
};

function currentChamber(member) {
  const terms = member?.terms?.item || [];
  if (!terms.length) return null;

  const currentTerm =
    [...terms].reverse().find(term => !term.endYear) ||
    terms[terms.length - 1];

  return currentTerm?.chamber || null;
}

function cleanMember(member) {
  return {
    bioguideId: member.bioguideId,
    name: member.name,
    party: member.partyName,
    state: member.state,
    imageUrl: member.depiction?.imageUrl || null
  };
}

module.exports = async function handler(req, res) {
  const address = req.query.address;

  if (!address) {
    return res.status(400).json({
      error: "Address is required."
    });
  }

  const congressApiKey = process.env.CONGRESS_API_KEY;

  if (!congressApiKey) {
    return res.status(500).json({
      error: "Congress API key is not configured."
    });
  }

  try {
    /* -----------------------------
       1. MATCH ADDRESS WITH CENSUS
    ----------------------------- */

    const params = new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
      vintage: "Current_Current",
      format: "json"
    });

    const censusUrl =
      `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?${params.toString()}`;

    const censusResponse = await fetch(censusUrl);

    if (!censusResponse.ok) {
      throw new Error(`Census API returned ${censusResponse.status}`);
    }

    const censusText = await censusResponse.text();

let censusData;

try {
  censusData = JSON.parse(censusText);
} catch {
  throw new Error(`Census returned non-JSON: ${censusText.slice(0, 120)}`);
}

    const matches = censusData?.result?.addressMatches || [];

    if (matches.length === 0) {
      return res.status(404).json({
        error:
          "We couldn't match that address. Try including street, city, state, and ZIP code."
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
        error:
          "We found the address, but couldn't determine its congressional district."
      });
    }

    const stateFips = congressionalDistrict.STATE;
    const state = STATE_FIPS[stateFips];
    const district = String(
      parseInt(congressionalDistrict.BASENAME, 10)
    );

    if (!state) {
      return res.status(500).json({
        error: "We found your district but couldn't identify the state."
      });
    }

    /* -----------------------------
       2. GET HOUSE MEMBER
    ----------------------------- */

    const houseUrl =
      `https://api.congress.gov/v3/member/${state}/${district}` +
      `?currentMember=true&format=json&api_key=${encodeURIComponent(congressApiKey)}`;

    const houseResponse = await fetch(houseUrl);

    if (!houseResponse.ok) {
  const errorText = await houseResponse.text();

  throw new Error(
    `Congress House lookup returned ${houseResponse.status}: ${errorText.slice(0, 300)}`
  );
}

    const houseText = await houseResponse.text();

let houseData;

try {
  houseData = JSON.parse(houseText);
} catch {
  throw new Error(`Congress House returned non-JSON: ${houseText.slice(0, 120)}`);
}

    const houseMember = (houseData.members || []).find(member =>
      currentChamber(member) === "House of Representatives"
    );

    /* -----------------------------
       3. GET STATE'S SENATORS
    ----------------------------- */

    const senateUrl =
      `https://api.congress.gov/v3/member/${state}` +
      `?currentMember=true&limit=250&format=json&api_key=${encodeURIComponent(congressApiKey)}`;

    const senateResponse = await fetch(senateUrl);

    if (!senateResponse.ok) {
      throw new Error(
        `Congress Senate lookup returned ${senateResponse.status}`
      );
    }

    const senateText = await senateResponse.text();

let senateData;

try {
  senateData = JSON.parse(senateText);
} catch {
  throw new Error(`Congress Senate returned non-JSON: ${senateText.slice(0, 120)}`);
}

    const senators = (senateData.members || [])
      .filter(member => currentChamber(member) === "Senate")
      .map(cleanMember);

    /* -----------------------------
       4. RETURN RESULTS
    ----------------------------- */

    return res.status(200).json({
      matchedAddress: match.matchedAddress,
      state,
      district,
      congressionalDistrictName: congressionalDistrict.NAME,
      houseMember: houseMember ? cleanMember(houseMember) : null,
      senators
    });

  } catch (error) {
  console.error(error);

  return res.status(500).json({
    error: "Representative lookup is temporarily unavailable.",
    detail: error.message
  });
}
};
