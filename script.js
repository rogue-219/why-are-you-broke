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

const voteDetailsResponse = await fetch(
  "/data/working-class-vote-details.json"
);
const voteDetailsData = await voteDetailsResponse.json();

const scoreMembers = scoresData.members;
    const voteDetails = voteDetailsData.members;
    if (!response.ok) {
      throw new Error(data.error || "Lookup failed.");
    }
const houseScore =
  scoreMembers[
    buildScoreKey("house", data.state, data.houseMember.name)
  ];
const houseVoteDetails =
  voteDetails[
    buildScoreKey("house", data.state, data.houseMember.name)
  ];
    const houseVoteHistory = houseVoteDetails?.votes || [];
const senatorsWithScores = data.senators.map(senator => {
  const senatorKey = buildScoreKey(
    "senate",
    data.state,
    senator.name
  );

  return {
    ...senator,
    scoreData: scoreMembers[senatorKey],
    voteHistory: voteDetails[senatorKey]?.votes || []
  };
});
  resultBox.innerHTML = `
  <div class="district-result">
    <h3>YOUR REPRESENTATIVES</h3>

    <div class="representative-grid">

      <div class="representative-card">
        <img
          src="${data.houseMember.imageUrl}"
          alt="${formatMemberName(data.houseMember.name)}"
          class="representative-photo"
        >

        <div class="representative-card-body">
          <p class="representative-chamber">U.S. HOUSE</p>
          <h4>${formatMemberName(data.houseMember.name)}</h4>
          <p class="representative-meta">
            ${data.houseMember.party} · ${data.state} District ${data.district}
          </p>

          <div class="score-block">
            <span class="score-label">WORKING-CLASS SCORE</span>
            <span class="score-number">
              ${houseScore ? Math.round(houseScore.score) : "N/A"}
            </span>
          </div>

          ${
            houseScore
              ? `<p class="participation-line">
                   ${houseScore.aligned}/${houseScore.cast} qualifying votes aligned ·
                   ${Math.round(houseScore.participationPct)}% participation
                 </p>`
              : ""
          }
          <details class="vote-details">
  <summary>SEE EVERY VOTE</summary>

  <div class="vote-list">
    ${houseVoteHistory.map(vote => `
      <div class="vote-row">
        <div class="vote-row-top">
          <strong>${vote.measure}</strong>
          <span>${vote.status}</span>
        </div>

        <p>${vote.date} · ${vote.decision}</p>

        <p>
          Working-class position:
          <strong>${vote.workingClassPosition}</strong>
          · Member vote:
          <strong>${vote.memberVote}</strong>
        </p>

        <a href="${vote.officialSource}" target="_blank" rel="noopener">
          VIEW OFFICIAL ROLL CALL
        </a>
      </div>
    `).join("")}
  </div>
</details>
        </div>
      </div>

      ${senatorsWithScores.map(senator => `
        <div class="representative-card">
          <img
            src="${senator.imageUrl}"
            alt="${formatMemberName(senator.name)}"
            class="representative-photo"
          >

          <div class="representative-card-body">
            <p class="representative-chamber">U.S. SENATE</p>
            <h4>${formatMemberName(senator.name)}</h4>
            <p class="representative-meta">
              ${senator.party} · ${data.state}
            </p>

            <div class="score-block">
              <span class="score-label">WORKING-CLASS SCORE</span>
              <span class="score-number">
                ${senator.scoreData ? Math.round(senator.scoreData.score) : "N/A"}
              </span>
            </div>

            ${
              senator.scoreData
                ? `<p class="participation-line">
                     ${senator.scoreData.aligned}/${senator.scoreData.cast} qualifying votes aligned ·
                     ${Math.round(senator.scoreData.participationPct)}% participation
                   </p>`
                : ""
            }
          </div>
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
