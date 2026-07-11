document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const navItems =
        document.querySelectorAll(".nav-item");

    const supervisorPages =
        document.querySelectorAll(".supervisor-page");

    const currentPageTitle =
        document.getElementById("currentPageTitle");


    const supervisorAvatar =
        document.getElementById("supervisorAvatar");

    const sidebarSupervisorName =
        document.getElementById("sidebarSupervisorName");

    const sidebarCompanyName =
        document.getElementById("sidebarCompanyName");

    const topbarSupervisorAvatar =
        document.getElementById("topbarSupervisorAvatar");

    const topbarSupervisorName =
        document.getElementById("topbarSupervisorName");

    const topbarCompanyName =
        document.getElementById("topbarCompanyName");


    const overviewPending =
        document.getElementById("overviewPending");

    const overviewApproved =
        document.getElementById("overviewApproved");

    const overviewRejected =
        document.getElementById("overviewRejected");


    const pendingEntryList =
        document.getElementById("pendingEntryList");

    const refreshReviewButton =
        document.getElementById("refreshReviewButton");


    const statusFilter =
        document.getElementById("statusFilter");

    const allEntriesBody =
        document.getElementById("allEntriesBody");

    const refreshAllButton =
        document.getElementById("refreshAllButton");


    const reviewModal =
        document.getElementById("reviewModal");

    const reviewModalTitle =
        document.getElementById("reviewModalTitle");

    const reviewModalDetails =
        document.getElementById("reviewModalDetails");

    const reviewNotes =
        document.getElementById("reviewNotes");

    const cancelReviewButton =
        document.getElementById("cancelReviewButton");

    const approveButton =
        document.getElementById("approveButton");

    const rejectButton =
        document.getElementById("rejectButton");


    let activeReviewEntryId = null;



    /* =====================================================
       INITIALISE
    ===================================================== */

    loadSupervisorProfile();
    loadOverview();
    loadPendingEntries();



    /* =====================================================
       PAGE NAVIGATION
    ===================================================== */

    navItems.forEach(button => {

        button.addEventListener("click", () => {

            navItems.forEach(item => item.classList.remove("active"));
            button.classList.add("active");

            const targetPage = button.dataset.page;

            supervisorPages.forEach(page => {
                page.classList.toggle("active", page.id === targetPage);
            });

            currentPageTitle.textContent = button.dataset.title;

            if (targetPage === "allEntriesPage") {
                loadAllEntries();
            } else {
                loadPendingEntries();
            }

        });

    });



    /* =====================================================
       LOAD SUPERVISOR PROFILE (name, company)
       Reuses the collector-style setup pattern via a
       lightweight inline call since we only need name +
       company here, sourced from the session itself.
    ===================================================== */

    async function loadSupervisorProfile() {

        try {

            const response =
                await fetch("/api/supervisor/setup");

            if (!response.ok) {
                throw new Error("Unable to load profile");
            }

            const data =
                await response.json();

            const initials =
                data.supervisor.name
                    .split(" ")
                    .map(part => part.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

            supervisorAvatar.textContent = initials;
            topbarSupervisorAvatar.textContent = initials;

            sidebarSupervisorName.textContent = data.supervisor.name;
            topbarSupervisorName.textContent = data.supervisor.name;

            sidebarCompanyName.textContent = data.company.company_name;
            topbarCompanyName.textContent = data.company.company_name;

        } catch (error) {

            console.log(error);

            sidebarCompanyName.textContent = "Unable to load";
            topbarCompanyName.textContent = "Unable to load";

        }

    }



    /* =====================================================
       LOAD OVERVIEW COUNTS
    ===================================================== */

    async function loadOverview() {

        try {

            const response =
                await fetch("/api/supervisor/overview");

            if (!response.ok) {
                throw new Error("Unable to load overview");
            }

            const data =
                await response.json();

            overviewPending.textContent = data.pending;
            overviewApproved.textContent = data.approved;
            overviewRejected.textContent = data.rejected;

        } catch (error) {

            console.log(error);

            overviewPending.textContent = "—";
            overviewApproved.textContent = "—";
            overviewRejected.textContent = "—";

        }

    }



    /* =====================================================
       LOAD PENDING ENTRIES (card view)
    ===================================================== */

    async function loadPendingEntries() {

        pendingEntryList.innerHTML = `
            <div class="empty-state">Loading entries...</div>
        `;

        try {

            const response =
                await fetch("/api/supervisor/entries?status=Pending");

            if (!response.ok) {
                throw new Error("Unable to load entries");
            }

            const entries =
                await response.json();


            if (entries.length === 0) {

                pendingEntryList.innerHTML = `
                    <div class="empty-state">
                        No entries pending review. 🎉
                    </div>
                `;

                return;
            }


            pendingEntryList.innerHTML =
                entries.map(entry => `
                    <div class="entry-card" data-entry-id="${entry.id}">

                        <div class="entry-card-info">

                            <span class="entry-card-title">
                                ${escapeHTML(entry.plant_name || "Unknown Plant")}
                                · ${escapeHTML(entry.scope)}
                                · ${escapeHTML(entry.activity_category || "—")}
                            </span>

                            <span class="entry-card-meta">
                                ${escapeHTML(entry.source_name || "—")}
                                · ${entry.quantity !== null ? entry.quantity : "—"} ${escapeHTML(entry.unit || "")}
                                · Reporting: ${escapeHTML(entry.reporting_period || "—")}
                                · Submitted by ${escapeHTML(entry.submitted_by || "—")}
                            </span>

                        </div>

                        <div class="entry-card-actions">

                            ${
                                entry.evidence_path
                                    ? `<a href="${entry.evidence_path}" target="_blank" rel="noopener" class="evidence-link">View Evidence</a>`
                                    : ""
                            }

                            <button class="danger-btn" data-action="open-review" data-entry-id="${entry.id}" data-default-action="Rejected">
                                Reject
                            </button>

                            <button class="primary-btn" data-action="open-review" data-entry-id="${entry.id}" data-default-action="Approved">
                                Approve
                            </button>

                        </div>

                    </div>
                `).join("");


            attachEntryCardListeners(entries);

        } catch (error) {

            console.log(error);

            pendingEntryList.innerHTML = `
                <div class="empty-state">Unable to load entries.</div>
            `;

        }

    }


    function attachEntryCardListeners(entries) {

        document.querySelectorAll('[data-action="open-review"]').forEach(button => {

            button.addEventListener("click", () => {

                const entryId =
                    parseInt(button.dataset.entryId, 10);

                const defaultAction =
                    button.dataset.defaultAction;

                const entry =
                    entries.find(e => e.id === entryId);

                openReviewModal(entry, defaultAction);

            });

        });

    }



    /* =====================================================
       REVIEW MODAL
    ===================================================== */

    function openReviewModal(entry, defaultAction) {

        activeReviewEntryId = entry.id;

        reviewModalTitle.textContent =
            `Review Entry #${entry.id}`;

        reviewModalDetails.innerHTML = `
            <strong>${escapeHTML(entry.plant_name || "—")}</strong> · ${escapeHTML(entry.scope)}<br>
            ${escapeHTML(entry.activity_category || "—")} — ${escapeHTML(entry.source_name || "—")}<br>
            Quantity: ${entry.quantity !== null ? entry.quantity : "—"} ${escapeHTML(entry.unit || "")}<br>
            Reporting Month: ${escapeHTML(entry.reporting_period || "—")}<br>
            Submitted by: ${escapeHTML(entry.submitted_by || "—")}
        `;

        reviewNotes.value = "";

        reviewModal.classList.add("visible");


        if (defaultAction === "Rejected") {
            rejectButton.focus();
        } else {
            approveButton.focus();
        }

    }


    cancelReviewButton.addEventListener("click", () => {

        reviewModal.classList.remove("visible");
        activeReviewEntryId = null;

    });


    approveButton.addEventListener("click", () => {
        submitReview("Approved");
    });


    rejectButton.addEventListener("click", () => {
        submitReview("Rejected");
    });


    async function submitReview(action) {

        if (!activeReviewEntryId) return;

        approveButton.disabled = true;
        rejectButton.disabled = true;

        try {

            const response =
                await fetch(`/api/supervisor/entries/${activeReviewEntryId}/review`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: action,
                        notes: reviewNotes.value
                    })
                });

            const result =
                await response.json();

            if (!response.ok) {
                alert(result.message || "Unable to update entry.");
            } else {

                reviewModal.classList.remove("visible");
                activeReviewEntryId = null;

                loadOverview();
                loadPendingEntries();

                const allEntriesPageActive =
                    document.getElementById("allEntriesPage").classList.contains("active");

                if (allEntriesPageActive) {
                    loadAllEntries();
                }

            }

        } catch (error) {

            console.log(error);
            alert("Network error. Please try again.");

        } finally {

            approveButton.disabled = false;
            rejectButton.disabled = false;

        }

    }



    /* =====================================================
       ALL ENTRIES TABLE
    ===================================================== */

    refreshReviewButton.addEventListener("click", loadPendingEntries);
    refreshAllButton.addEventListener("click", loadAllEntries);
    statusFilter.addEventListener("change", loadAllEntries);


    async function loadAllEntries() {

        allEntriesBody.innerHTML = `
            <tr class="table-empty-row">
                <td colspan="10">Loading submissions...</td>
            </tr>
        `;

        try {

            const status = statusFilter.value;

            const url =
                status
                    ? `/api/supervisor/entries?status=${encodeURIComponent(status)}`
                    : "/api/supervisor/entries";

            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error("Unable to load entries");
            }

            const entries =
                await response.json();


            if (entries.length === 0) {

                allEntriesBody.innerHTML = `
                    <tr class="table-empty-row">
                        <td colspan="10">No submissions found.</td>
                    </tr>
                `;

                return;
            }


            allEntriesBody.innerHTML =
                entries.map(entry => `
                    <tr>
                        <td>${entry.id}</td>
                        <td>${escapeHTML(entry.plant_name || "—")}</td>
                        <td>${escapeHTML(entry.scope)}</td>
                        <td>${escapeHTML(entry.reporting_period || "—")}</td>
                        <td>${escapeHTML(entry.activity_category || "—")}</td>
                        <td>${escapeHTML(entry.source_name || "—")}</td>
                        <td>${entry.quantity !== null ? entry.quantity : "—"} ${escapeHTML(entry.unit || "")}</td>
                        <td>${escapeHTML(entry.submitted_by || "—")}</td>
                        <td><span class="status-badge ${entry.status}">${escapeHTML(entry.status)}</span></td>
                        <td>${
                            entry.evidence_path
                                ? `<a href="${entry.evidence_path}" target="_blank" rel="noopener" class="evidence-link">View</a>`
                                : "—"
                        }</td>
                    </tr>
                `).join("");

        } catch (error) {

            console.log(error);

            allEntriesBody.innerHTML = `
                <tr class="table-empty-row">
                    <td colspan="10">Unable to load submissions.</td>
                </tr>
            `;

        }

    }



    /* =====================================================
       SECURITY: ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        const div = document.createElement("div");
        div.textContent = String(value);
        return div.innerHTML;

    }


});