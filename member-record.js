async function loadMemberRecord() {
  const container = document.getElementById("member-record-content");

  try {
    const params = new URLSearchParams(window.location.search);
    const memberKey = params.get("member");

    if (!memberKey) {
      throw new Error("No member was specified.");
    }

    const [scoresResponse, votesResponse] = await Promise.all([
      fetch("/data/working-class-scores.json"),
      fetch("/data/working-class-vote-details.json")
    ]);

    if (!scoresResponse.ok || !votesResponse.ok) {
      throw new Error("Could not load voting record.");
    }

    const scoresData = await scoresResponse.json();
    const votesData = await votesResponse.json();

    const member = scoresData.members[memberKey];
    const voteRecord = votesData.members[memberKey];

    if (!member) {
      throw new Error("Member record not found.");
    }

    const chamber =
      String(member.chamber || "").toLowerCase() === "house"
        ? "House"
        : "Senate";

    const score =
      member.score === null || member.score === undefined
        ? "—"
        : Math.round(member.score * 10) / 10;

    const participation =
      member.participationPct === null ||
      member.participationPct === undefined
        ? "—"
        : `${Math.round(member.participationPct)}%`;

    const alignedCast =
      member.cast === 0
        ? "—"
        : `${member.aligned} / ${member.cast}`;

    const votes = voteRecord?.votes || [];

    container.innerHTML = `
      <div class="member-record-header">
        <p class="eyebrow">119TH CONGRESS</p>

        <p class="member-record-chamber">${chamber.toUpperCase()}</p>

        <h1>${member.member}</h1>

        <p class="member-record-meta">
          ${member.party} · ${member.state}
        </p>

        <div class="member-record-summary">
          <div>
            <span>WORKING-CLASS SCORE</span>
            <strong>${score}</strong>
          </div>

          <div>
            <span>ALIGNED / CAST</span>
            <strong>${alignedCast}</strong>
          </div>

          <div>
            <span>PARTICIPATION</span>
            <strong>${participation}</strong>
          </div>
        </div>
      </div>

      <div class="member-record-votes">
        <h2>EVERY QUALIFYING VOTE</h2>

        ${
          votes.length
            ? votes.map(vote => `
                <article class="member-vote-card">
                  <div class="member-vote-heading">
                    <div>
                      <p class="member-vote-date">${vote.date}</p>
                      <h3>${vote.measure}</h3>
                    </div>

                    <span class="member-vote-status">
                      ${vote.status}
                    </span>
                  </div>

                  <p class="member-vote-decision">
                    ${vote.decision}
                  </p>

                  <div class="member-vote-result">
                    <p>
                      Working-class position
                      <strong>${vote.workingClassPosition}</strong>
                    </p>

                    <p>
                      Member vote
                      <strong>${vote.memberVote}</strong>
                    </p>
                  </div>

                  <a
                    href="${vote.officialSource}"
                    target="_blank"
                    rel="noopener"
                  >
                    VIEW OFFICIAL ROLL CALL
                  </a>
                </article>
              `).join("")
            : `<p>No qualifying votes are available for this member.</p>`
        }
      </div>
    `;

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="member-record-error">
        <h1>RECORD NOT FOUND</h1>
        <p>${error.message}</p>
        <a href="methodology.html#full-record">RETURN TO THE FULL RECORD</a>
      </div>
    `;
  }
}

loadMemberRecord();
