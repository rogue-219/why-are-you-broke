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
        <p><strong>Matched address:</strong> ${data.matchedAddress}</p>
        <p><strong>Congressional district:</strong> ${data.congressionalDistrictName}</p>
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
