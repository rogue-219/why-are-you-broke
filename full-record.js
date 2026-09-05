async function loadFullRecord() {
  const container = document.getElementById("full-record-results");

  try {
    const response = await fetch("/data/working-class-scores.json");

    if (!response.ok) {
      throw new Error("Could not load score data.");
    }

    const data = await response.json();

    const members = Object.values(data.members).map(member => ({
      ...member,
      chamberNormalized: String(member.chamber || "").toLowerCase()
    }));

    members.sort((a, b) => {
      if (a.chamberNormalized !== b.chamberNormalized) {
        return a.chamberNormalized.localeCompare(b.chamberNormalized);
      }

      if (a.state !== b.state) {
        return a.state.localeCompare(b.state);
      }

      return a.member.localeCompare(b.member);
    });

    const formatScore = score => {
      if (score === null || score === undefined) {
        return "—";
      }

      return Number.isInteger(score)
        ? score
        : Math.round(score * 10) / 10;
    };

    container.innerHTML = `
      <div class="record-controls">
        <button type="button" class="record-filter active" data-chamber="all">
          ALL
        </button>

        <button type="button" class="record-filter" data-chamber="house">
          HOUSE
        </button>

        <button type="button" class="record-filter" data-chamber="senate">
          SENATE
        </button>
      </div>

      <div class="record-table-wrap">
        <table class="record-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>PARTY</th>
              <th>STATE</th>
              <th>CHAMBER</th>
              <th>SCORE</th>
              <th>ALIGNED / CAST</th>
              <th>PARTICIPATION</th>
            </tr>
          </thead>

          <tbody>
            ${members.map(member => `
              <tr data-chamber="${member.chamberNormalized}">
                <td>
  <button
    type="button"
    class="member-record-link"
    data-member-key="${member.lookupKey}"
  >
    ${member.member}
  </button>
</td>
                <td>${member.party}</td>
                <td>${member.state}</td>
                <td>
                  ${member.chamberNormalized === "house"
                    ? "House"
                    : "Senate"}
                </td>

                <td class="record-score">
                  ${formatScore(member.score)}
                </td>

                <td>
                  ${member.cast === 0
                    ? "—"
                    : `${member.aligned} / ${member.cast}`}
                </td>

                <td>
                  ${member.participationPct === null ||
                    member.participationPct === undefined
                    ? "—"
                    : `${Math.round(member.participationPct)}%`}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const filters = container.querySelectorAll(".record-filter");
    const rows = container.querySelectorAll(".record-table tbody tr");
const memberLinks = container.querySelectorAll(".member-record-link");

memberLinks.forEach(link => {
  link.addEventListener("click", () => {
    const memberKey = link.dataset.memberKey;
    window.location.href =
      `member-record.html?member=${encodeURIComponent(memberKey)}`;
  });
});
    filters.forEach(button => {
      button.addEventListener("click", () => {
        const chamber = button.dataset.chamber;

        filters.forEach(filter => {
          filter.classList.remove("active");
        });

        button.classList.add("active");

        rows.forEach(row => {
          row.hidden =
            chamber !== "all" &&
            row.dataset.chamber !== chamber;
        });
      });
    });

  } catch (error) {
    container.innerHTML = `
      <p>We couldn't load the congressional score record.</p>
    `;

    console.error(error);
  }
}

loadFullRecord();
