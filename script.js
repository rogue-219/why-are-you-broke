const searchInput = document.getElementById("rep-search");
const lookupButton = document.querySelector(".lookup button");
const resultBox = document.getElementById("lookup-result");
function formatMemberName(name) {
  if (!name || !name.includes(",")) return name;

  const [last, first] = name.split(",");
  return `${first.trim()} ${last.trim()}`;
}
function getMemberSurname(name) {
  if (!name) return "";

  if (name.includes(",")) {
    return name.split(",")[0].trim().toLowerCase();
  }

  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

function buildScoreKey(chamber, state, name) {
  return `${chamber}|${state}|${getMemberSurname(name)}`;
}
async function findRepresentatives() {
  const address = searchInput.value.trim();

  if (!address) {
    resultBox.innerHTML = "<p>Please enter your full home address.</p>";
    return;
  }

  lookupButton.disabled = true;
  lookupButton.textContent = "LOOKING...";
  resultBox.innerHTML = "<p>Finding your congressional district...</p>";

  try {
    const response = await fetch(
      `/api/representatives?address=${encodeURIComponent(address)}`
    );

    const data = await response.json();
const scoresResponse = await fetch("/data/working-class-scores.json");
const scoresData = await scoresResponse.json();

const scoreMembers = scoresData.members;
    if (!response.ok) {
      throw new Error(data.error || "Lookup failed.");
    }
const houseScore =
  scoreMembers[
    buildScoreKey("house", data.state, data.houseMember.name)
  ];

const senatorsWithScores = data.senators.map(senator => ({
  ...senator,
  scoreData:
    scoreMembers[
      buildScoreKey("senate", data.state, senator.name)
    ]
}));
    resultBox.innerHTML = `
  <div class="district-result">
    <h3>YOUR REPRESENTATIVES</h3>

    <div class="member-result">
      <p><strong>U.S. HOUSE</strong></p>
      <p><strong>${formatMemberName(data.houseMember.name)}</strong></p>
      <p>${data.houseMember.party} · ${data.state} District ${data.district}</p>
      <p><strong>Working-Class Score:</strong> ${houseScore ? Math.round(houseScore.score) : "N/A"}</p>
    </div>

    <div class="member-result">
      <p><strong>U.S. SENATE</strong></p>

      ${senatorsWithScores.map(senator => ` `
        <div class="senator-result">
          <p><strong>${formatMemberName(senator.name)}</strong></p>
          <p>${senator.party} · ${data.state}</p>
          <p><strong>Working-Class Score:</strong> ${senator.scoreData ? Math.round(senator.scoreData.score) : "N/A"}</p>
        </div>
      `).join("")}
    </div>
  </div>
`;
  } catch (error) {
    resultBox.innerHTML = `<p>${error.message}</p>`;
  } finally {
    lookupButton.disabled = false;
    lookupButton.textContent = "FIND MY REPRESENTATIVES";
  }
}

lookupButton.addEventListener("click", findRepresentatives);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    findRepresentatives();
  }
});
