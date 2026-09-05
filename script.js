const searchInput = document.getElementById("rep-search");
const lookupButton = document.querySelector(".lookup button");
const resultBox = document.getElementById("lookup-result");

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

    if (!response.ok) {
      throw new Error(data.error || "Lookup failed.");
    }

    resultBox.innerHTML = `
  <div class="district-result">
    <h3>YOUR REPRESENTATIVES</h3>

    <div class="member-result">
      <p><strong>U.S. HOUSE</strong></p>
      <p><strong>${data.houseMember.name}</strong></p>
      <p>${data.houseMember.party} · ${data.state} District ${data.district}</p>
    </div>

    <div class="member-result">
      <p><strong>U.S. SENATE</strong></p>

      ${data.senators.map(senator => `
        <div class="senator-result">
          <p><strong>${senator.name}</strong></p>
          <p>${senator.party} · ${data.state}</p>
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
