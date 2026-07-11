document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const plantSelect = document.getElementById("plantSelect");
    const reportingPeriod = document.getElementById("reportingPeriod");
    const scopeSelect = document.getElementById("scopeSelect");
    const factorSource = document.getElementById("factorSource");

    const startBatchButton =
        document.getElementById("startBatchButton");

    const editContextButton =
        document.getElementById("editContextButton");

    const contextFormGrid =
        document.getElementById("contextFormGrid");

    const lockedContext =
        document.getElementById("lockedContext");

    const entryWorkspace =
        document.getElementById("entryWorkspace");

    const entryRows =
        document.getElementById("entryRows");

    const addRowButton =
        document.getElementById("addRowButton");

    const saveAllButton =
        document.getElementById("saveAllButton");

    const batchMessage =
        document.getElementById("batchMessage");

    const savedCount =
        document.getElementById("savedCount");

    const refreshHistoryButton =
        document.getElementById("refreshHistoryButton");


    // =====================================================
    // STATE
    // =====================================================

    let factors = [];

    let savedEntries = 0;

    let rowCounter = 0;


    // =====================================================
    // INITIALIZE
    // =====================================================

    initialize();


    async function initialize() {

        await loadCollectorSetup();

        bindNavigation();

        bindEvents();

    }


    // =====================================================
    // LOAD COMPANY + COLLECTOR + PLANTS
    // =====================================================

    async function loadCollectorSetup() {

        try {

            const response =
                await fetch("/api/data-collector/setup");


            if (!response.ok) {

                throw new Error(
                    "Unable to load collector setup"
                );

            }


            const data = await response.json();


            // Collector names

            setText(
                "sidebarCollectorName",
                data.collector?.name || "Data Collector"
            );

            setText(
                "topbarCollectorName",
                data.collector?.name || "Data Collector"
            );


            // Company names

            setText(
                "sidebarCompanyName",
                data.company?.company_name || "Company"
            );

            setText(
                "topbarCompanyName",
                data.company?.company_name || "Company"
            );


            // Avatar initials

            const initials = getInitials(
                data.collector?.name || "Data Collector"
            );


            setText(
                "collectorAvatar",
                initials
            );

            setText(
                "topbarCollectorAvatar",
                initials
            );


            // Plants

            plantSelect.innerHTML =
                `<option value="">
                    Select plant
                </option>`;


            const plants = data.plants || [];


            plants.forEach((plant) => {

                const option =
                    new Option(
                        `${plant.plant_name} (${plant.plant_code})`,
                        plant.id
                    );

                plantSelect.add(option);

            });


            if (plants.length === 0) {

                plantSelect.innerHTML =
                    `<option value="">
                        No plants assigned
                    </option>`;

                plantSelect.disabled = true;

            }

        }

        catch (error) {

            console.error(
                "Collector setup error:",
                error
            );


            setText(
                "sidebarCompanyName",
                "Unable to load company"
            );

            setText(
                "topbarCompanyName",
                "Unable to load company"
            );


            plantSelect.innerHTML =
                `<option value="">
                    Unable to load plants
                </option>`;


            showMessage(
                "Company details could not be loaded. Refresh or login again.",
                true
            );

        }

    }


    // =====================================================
    // EVENTS
    // =====================================================

    function bindEvents() {

        scopeSelect.addEventListener(
            "change",
            loadFactorsForScope
        );


        startBatchButton.addEventListener(
            "click",
            startBatch
        );


        editContextButton.addEventListener(
            "click",
            editContext
        );


        addRowButton.addEventListener(
            "click",
            () => addEntryRow()
        );


        saveAllButton.addEventListener(
            "click",
            saveAllRows
        );


        if (refreshHistoryButton) {

            refreshHistoryButton.addEventListener(
                "click",
                loadSubmissionHistory
            );

        }

    }


    // =====================================================
    // SIDEBAR NAVIGATION
    // =====================================================

    function bindNavigation() {

        const navItems =
            document.querySelectorAll(
                ".nav-item[data-page]"
            );


        navItems.forEach((item) => {

            item.addEventListener(
                "click",
                async () => {


                    navItems.forEach((nav) => {

                        nav.classList.remove("active");

                    });


                    item.classList.add("active");


                    document
                        .querySelectorAll(".collector-page")
                        .forEach((page) => {

                            page.classList.remove("active");

                        });


                    const targetPage =
                        document.getElementById(
                            item.dataset.page
                        );


                    if (targetPage) {

                        targetPage.classList.add(
                            "active"
                        );

                    }


                    const title =
                        document.getElementById(
                            "currentPageTitle"
                        );


                    if (
                        title &&
                        item.dataset.title
                    ) {

                        title.textContent =
                            item.dataset.title;

                    }


                    if (
                        item.dataset.page ===
                        "historyPage"
                    ) {

                        await loadSubmissionHistory();

                    }

                }
            );

        });

    }


    // =====================================================
    // LOAD FACTORS
    // =====================================================

    async function loadFactorsForScope() {

        factors = [];


        factorSource.disabled = true;


        factorSource.innerHTML =
            `<option value="">
                Loading...
            </option>`;


        if (!scopeSelect.value) {

            factorSource.innerHTML =
                `<option value="">
                    Select source
                </option>`;

            return;

        }


        try {

            const response = await fetch(

                `/api/data-collector/emission-factors?scope=${
                    encodeURIComponent(
                        scopeSelect.value
                    )
                }`

            );


            if (!response.ok) {

                throw new Error(
                    "Unable to load factors"
                );

            }


            factors = await response.json();


            const sources = unique(

                factors.map(
                    factor =>
                        factor.factor_source
                )

            );


            fillSelect(

                factorSource,

                sources,

                "Select source"

            );


            factorSource.disabled = false;

        }

        catch (error) {

            console.error(error);


            factorSource.innerHTML =
                `<option value="">
                    Unable to load sources
                </option>`;


            showMessage(
                "Emission factors could not be loaded.",
                true
            );

        }

    }


    // =====================================================
    // START SESSION
    // =====================================================

    function startBatch() {

        if (
            !plantSelect.value ||
            !reportingPeriod.value ||
            !scopeSelect.value ||
            !factorSource.value
        ) {

            showMessage(
                "Select Plant, Filing Period, Scope and Data Source.",
                true
            );

            return;

        }


        document.getElementById(
            "lockedPlant"
        ).textContent =

            plantSelect.options[
                plantSelect.selectedIndex
            ].text;


        document.getElementById(
            "lockedPeriod"
        ).textContent =
            reportingPeriod.value;


        document.getElementById(
            "lockedScope"
        ).textContent =
            scopeSelect.value;


        document.getElementById(
            "lockedSource"
        ).textContent =
            factorSource.value;


        contextFormGrid.classList.add(
            "hidden"
        );


        lockedContext.classList.remove(
            "hidden"
        );


        editContextButton.classList.remove(
            "hidden"
        );


        entryWorkspace.classList.remove(
            "hidden"
        );


        entryRows.innerHTML = "";


        addEntryRow();


        showMessage("");


        setTimeout(() => {

            entryWorkspace.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        }, 100);

    }


    // =====================================================
    // EDIT SESSION
    // =====================================================

    function editContext() {

        contextFormGrid.classList.remove(
            "hidden"
        );


        lockedContext.classList.add(
            "hidden"
        );


        editContextButton.classList.add(
            "hidden"
        );


        entryWorkspace.classList.add(
            "hidden"
        );


        entryRows.innerHTML = "";

    }


    // =====================================================
    // ADD TABLE ROW
    // =====================================================

    function addEntryRow() {

        rowCounter++;


        const row =
            document.createElement("tr");


        row.dataset.rowId =
            rowCounter;


        row.innerHTML = `

            <td>

                <select class="row-category">

                    <option value="">
                        Select category
                    </option>

                </select>

            </td>


            <td>

                <div class="dynamic-cells">
                </div>

            </td>


            <td>

                <input
                    class="row-quantity"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                >

            </td>


            <td>

                <select
                    class="row-unit"
                    disabled
                >

                    <option value="">
                        Unit
                    </option>

                </select>

            </td>


            <td>

                <div class="file-cell">

                    <input
                        class="file-input"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                    >


                    <button
                        type="button"
                        class="attach-button"
                    >

                        📎

                        <span class="file-name">
                            Attach
                        </span>

                    </button>

                </div>

            </td>


            <td>

                <div class="co2-value">
                    —
                </div>

            </td>


            <td>

                <button
                    type="button"
                    class="icon-button remove-row-button"
                    title="Remove row"
                >
                    ×
                </button>

            </td>

        `;


        entryRows.appendChild(row);


        setupRow(row);

    }


    // =====================================================
    // SETUP ROW
    // =====================================================

    function setupRow(row) {

        const categorySelect =
            row.querySelector(
                ".row-category"
            );


        const dynamicContainer =
            row.querySelector(
                ".dynamic-cells"
            );


        const quantityInput =
            row.querySelector(
                ".row-quantity"
            );


        const unitSelect =
            row.querySelector(
                ".row-unit"
            );


        const fileInput =
            row.querySelector(
                ".file-input"
            );


        const attachButton =
            row.querySelector(
                ".attach-button"
            );


        const removeButton =
            row.querySelector(
                ".remove-row-button"
            );


        const sourceFactors =

            factors.filter(

                factor =>

                    factor.factor_source ===
                    factorSource.value

            );


        const categories = unique(

            sourceFactors.map(
                factor =>
                    factor.category
            )

        );


        fillSelect(

            categorySelect,

            categories,

            "Select category"

        );


        // CATEGORY CHANGE

        categorySelect.addEventListener(

            "change",

            () => {


                dynamicContainer.innerHTML = "";


                row.selectedFactor = null;

                row.calculatedEmissions = null;


                resetRowCalculation(row);


                unitSelect.innerHTML =
                    `<option value="">
                        Unit
                    </option>`;


                unitSelect.disabled = true;


                if (!categorySelect.value) {

                    return;

                }


                const candidates =

                    sourceFactors.filter(

                        factor =>

                            factor.category ===
                            categorySelect.value

                    );


                buildHierarchy(

                    row,

                    candidates,

                    0

                );

            }

        );


        quantityInput.addEventListener(

            "input",

            () => calculateRow(row)

        );


        unitSelect.addEventListener(

            "change",

            () => calculateRow(row)

        );


        attachButton.addEventListener(

            "click",

            () => fileInput.click()

        );


        fileInput.addEventListener(

            "change",

            () => {


                const file =
                    fileInput.files[0];


                const fileName =
                    row.querySelector(
                        ".file-name"
                    );


                if (file) {

                    fileName.textContent =
                        file.name;


                    attachButton.classList.add(
                        "has-file"
                    );

                }

                else {

                    fileName.textContent =
                        "Attach";


                    attachButton.classList.remove(
                        "has-file"
                    );

                }

            }

        );


        removeButton.addEventListener(

            "click",

            () => {


                if (
                    entryRows.children.length === 1
                ) {

                    resetRow(row);

                }

                else {

                    row.remove();

                }

            }

        );

    }


    // =====================================================
    // DYNAMIC HIERARCHY
    // =====================================================

    function buildHierarchy(

        row,

        candidates,

        depth

    ) {

        const fields = [

            "level1",

            "level2",

            "level3",

            "level4"

        ];


        if (depth >= fields.length) {

            finishFactorSelection(
                row,
                candidates
            );

            return;

        }


        const field =
            fields[depth];


        const values = unique(

            candidates.map(

                factor =>
                    clean(
                        factor[field]
                    )

            )

        );


        if (values.length === 0) {

            buildHierarchy(

                row,

                candidates,

                depth + 1

            );

            return;

        }


        const select =
            document.createElement(
                "select"
            );


        const category =

            row.querySelector(
                ".row-category"
            ).value;


        fillSelect(

            select,

            values,

            getHierarchyLabel(
                category,
                depth
            )

        );


        const container =

            row.querySelector(
                ".dynamic-cells"
            );


        container.appendChild(select);


        select.addEventListener(

            "change",

            () => {


                while (
                    select.nextElementSibling
                ) {

                    select
                        .nextElementSibling
                        .remove();

                }


                row.selectedFactor = null;

                row.calculatedEmissions = null;


                resetRowCalculation(row);


                if (!select.value) {

                    return;

                }


                const filtered =

                    candidates.filter(

                        factor =>

                            clean(
                                factor[field]
                            ) ===
                            select.value

                    );


                buildHierarchy(

                    row,

                    filtered,

                    depth + 1

                );

            }

        );

    }


    // =====================================================
    // FINAL FACTOR SELECTION
    // =====================================================

    function finishFactorSelection(

        row,

        candidates

    ) {

        const sourceNames = unique(

            candidates.map(

                factor =>
                    factor.source_name

            )

        );


        if (sourceNames.length > 1) {

            const select =
                document.createElement(
                    "select"
                );


            fillSelect(

                select,

                sourceNames,

                "Select activity"

            );


            row.querySelector(
                ".dynamic-cells"
            ).appendChild(select);


            select.addEventListener(

                "change",

                () => {


                    const selected =

                        candidates.filter(

                            factor =>

                                factor.source_name ===
                                select.value

                        );


                    selectFactor(

                        row,

                        selected

                    );

                }

            );

        }

        else {

            selectFactor(

                row,

                candidates

            );

        }

    }


    // =====================================================
    // SELECT FACTOR
    // =====================================================

    function selectFactor(

        row,

        candidates

    ) {

        const factor =
            candidates[0];


        if (!factor) {

            return;

        }


        row.selectedFactor =
            factor;


        const unitSelect =

            row.querySelector(
                ".row-unit"
            );


        const units =

            getCompatibleUnits(

                factor.quantity_unit

            );


        fillSelect(

            unitSelect,

            units,

            "Unit"

        );


        unitSelect.disabled = false;


        if (units.length === 1) {

            unitSelect.value =
                units[0];


            calculateRow(row);

        }

    }


    // =====================================================
    // CALCULATION
    // =====================================================

    function calculateRow(row) {

        const factor =
            row.selectedFactor;


        const quantity = Number(

            row.querySelector(
                ".row-quantity"
            ).value

        );


        const inputUnit =

            row.querySelector(
                ".row-unit"
            ).value;


        if (
            !factor ||
            !quantity ||
            !inputUnit
        ) {

            resetRowCalculation(row);

            return;

        }


        const baseQuantity =

            convertToBase(

                quantity,

                inputUnit,

                factor.quantity_unit

            );


        if (
            !Number.isFinite(
                baseQuantity
            )
        ) {

            resetRowCalculation(row);

            return;

        }


        const emissions =

            baseQuantity *

            Number(
                factor.factor_value
            );


        row.calculatedEmissions =
            emissions;


        row.querySelector(
            ".co2-value"
        ).textContent =

            `${emissions.toFixed(2)} kg`;

    }


    // =====================================================
    // SAVE ALL ROWS
    // =====================================================

    async function saveAllRows() {

        const rows = [

            ...entryRows.querySelectorAll(
                "tr"
            )

        ].filter(

            row =>
                !row.classList.contains(
                    "saved-row"
                )

        );


        if (rows.length === 0) {

            showMessage(
                "No unsaved rows.",
                true
            );

            return;

        }


        saveAllButton.disabled = true;


        let successful = 0;

        let failed = 0;


        for (const row of rows) {


            const categorySelect =

                row.querySelector(
                    ".row-category"
                );


            const quantityInput =

                row.querySelector(
                    ".row-quantity"
                );


            const unitSelect =

                row.querySelector(
                    ".row-unit"
                );


            const fileInput =

                row.querySelector(
                    ".file-input"
                );


            if (
                !categorySelect.value ||
                !row.selectedFactor ||
                !quantityInput.value ||
                !unitSelect.value
            ) {

                failed++;

                row.classList.add(
                    "row-error"
                );

                continue;

            }


            const formData =
                new FormData();


            formData.append(

                "plant_id",

                plantSelect.value

            );


            formData.append(

                "scope",

                scopeSelect.value

            );


            formData.append(

                "reporting_period",

                reportingPeriod.value

            );


            formData.append(

                "activity_category",

                categorySelect.value

            );


            formData.append(

                "source_name",

                row.selectedFactor
                    .source_name

            );


            formData.append(

                "quantity",

                quantityInput.value

            );


            formData.append(

                "unit",

                unitSelect.value

            );


            formData.append(

                "emission_factor_id",

                row.selectedFactor.id

            );


            formData.append(

                "emission_factor",

                row.selectedFactor
                    .factor_value

            );


            formData.append(

                "calculated_emissions",

                row.calculatedEmissions || ""

            );


            if (fileInput.files[0]) {

                formData.append(

                    "evidence",

                    fileInput.files[0]

                );

            }


            try {

                const response =
                    await fetch(

                        "/api/emission-entries",

                        {

                            method: "POST",

                            body: formData

                        }

                    );


                if (!response.ok) {

                    throw new Error(
                        "Unable to save row"
                    );

                }


                row.classList.remove(
                    "row-error"
                );


                row.classList.add(
                    "saved-row"
                );


                row
                    .querySelectorAll(
                        "input, select, button"
                    )
                    .forEach(

                        element =>

                            element.disabled = true

                    );


                successful++;

                savedEntries++;

            }

            catch (error) {

                console.error(error);

                failed++;


                row.classList.add(
                    "row-error"
                );

            }

        }


        savedCount.textContent =
            savedEntries;


        saveAllButton.disabled = false;


        if (failed > 0) {

            showMessage(

                `${successful} saved, ${failed} row(s) need attention.`,

                true

            );

        }

        else {

            showMessage(

                `${successful} row(s) saved successfully.`

            );


            addEntryRow();

        }

    }


    // =====================================================
    // HISTORY
    // =====================================================

    async function loadSubmissionHistory() {

        const body = document.getElementById("submissionHistoryBody");
        if (!body) return;

        body.innerHTML = `<tr><td colspan="12">Loading submissions...</td></tr>`;

        try {
            const response = await fetch("/api/data-collector/submissions");
            if (!response.ok) throw new Error("Unable to load submissions");

            const submissions = await response.json();

            if (!submissions || submissions.length === 0) {
                body.innerHTML = `<tr><td colspan="12">No submissions yet.</td></tr>`;
                return;
            }

            body.innerHTML = submissions.map(entry => {
                const status = entry.status || "Pending";
                const statusClass = status.toLowerCase().replace(/\s+/g, "-");
                const editButton = status === "Rejected"
                    ? `<button type="button" class="secondary-btn correct-entry-btn" data-entry-id="${entry.id}">Edit & Resubmit</button>`
                    : "";

                const deleteButton = ["Pending", "Rejected"].includes(status)
                    ? `<button type="button" class="secondary-btn delete-entry-btn" data-entry-id="${entry.id}">Delete</button>`
                    : "";

                const action = editButton || deleteButton
                    ? `<div class="history-actions">${editButton}${deleteButton}</div>`
                    : "—";

                return `
                    <tr>
                        <td>${entry.id ?? "—"}</td>
                        <td>${escapeHTML(entry.plant_name || "—")}</td>
                        <td>${escapeHTML(entry.scope || "—")}</td>
                        <td>${escapeHTML(entry.reporting_period || "—")}</td>
                        <td>${escapeHTML(entry.activity_category || "—")}</td>
                        <td>${escapeHTML(entry.source_name || "—")}</td>
                        <td>${entry.quantity ?? "—"} ${escapeHTML(entry.unit || "")}</td>
                        <td>${entry.created_at ? new Date(entry.created_at).toLocaleDateString("en-IN") : "—"}</td>
                        <td><span class="status-badge status-${escapeHTML(statusClass)}">${escapeHTML(status)}</span></td>
                        <td><div class="review-comment">${escapeHTML(entry.review_notes || "—")}</div></td>
                        <td>${action}</td>
                        <td>${entry.evidence_path ? "Uploaded" : "—"}</td>
                    </tr>`;
            }).join("");

            body.querySelectorAll(".correct-entry-btn").forEach(button => {
                button.addEventListener("click", () => {
                    const entry = submissions.find(item => String(item.id) === String(button.dataset.entryId));
                    openCorrectionPrompt(entry);
                });
            });

            body.querySelectorAll(".delete-entry-btn").forEach(button => {
                button.addEventListener("click", async () => {
                    const entryId = button.dataset.entryId;
                    const confirmed = window.confirm(`Delete entry #${entryId}? This cannot be undone.`);
                    if (!confirmed) return;
                    try {
                        const response = await fetch(`/api/data-collector/submissions/${entryId}`, { method: "DELETE" });
                        const result = await response.json().catch(() => ({}));
                        if (!response.ok) throw new Error(result.message || "Unable to delete entry");
                        alert(result.message || "Entry deleted successfully.");
                        await loadSubmissionHistory();
                    } catch (error) {
                        console.error(error);
                        alert(error.message);
                    }
                });
            });

        } catch (error) {
            console.error(error);
            body.innerHTML = `<tr><td colspan="12">Unable to load submissions.</td></tr>`;
        }
    }


    async function openCorrectionPrompt(entry) {
        if (!entry) return;

        const correctedQuantity = window.prompt(
            `Supervisor comment:\n${entry.review_notes || "No comment"}\n\nEnter corrected quantity:`,
            entry.quantity ?? ""
        );

        if (correctedQuantity === null) return;

        const quantity = Number(correctedQuantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            alert("Enter a valid quantity.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("quantity", quantity);
            formData.append("unit", entry.unit || "");

            const response = await fetch(`/api/data-collector/submissions/${entry.id}/resubmit`, {
                method: "PUT",
                body: formData
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Unable to resubmit entry");

            alert(result.message || "Entry corrected and resubmitted.");
            await loadSubmissionHistory();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }


    // =====================================================
    // RESET ROW
    // =====================================================

    function resetRow(row) {

        row.classList.remove(
            "row-error"
        );


        row.selectedFactor = null;

        row.calculatedEmissions = null;


        const category =

            row.querySelector(
                ".row-category"
            );


        category.value = "";


        row.querySelector(
            ".dynamic-cells"
        ).innerHTML = "";


        row.querySelector(
            ".row-quantity"
        ).value = "";


        const unit =

            row.querySelector(
                ".row-unit"
            );


        unit.innerHTML =

            `<option value="">
                Unit
            </option>`;


        unit.disabled = true;


        const fileInput =

            row.querySelector(
                ".file-input"
            );


        fileInput.value = "";


        row.querySelector(
            ".file-name"
        ).textContent = "Attach";


        row.querySelector(
            ".attach-button"
        ).classList.remove(
            "has-file"
        );


        resetRowCalculation(row);

    }


    function resetRowCalculation(row) {

        row.calculatedEmissions = null;


        row.querySelector(
            ".co2-value"
        ).textContent = "—";

    }


    // =====================================================
    // CATEGORY LABELS
    // =====================================================

    function getHierarchyLabel(

        category,

        depth

    ) {

        const labels = {


            "Mobile Combustion": [

                "Select activity type",

                "Select vehicle type",

                "Select fuel type",

                "Select variant"

            ],


            "Stationary Combustion": [

                "Select fuel group",

                "Select fuel type",

                "Select variant",

                "Select detail"

            ],


            "Electricity": [

                "Select method",

                "Select region type",

                "Select eGRID region",

                "Select detail"

            ],


            "Steam and Heat": [

                "Select energy type",

                "Select method",

                "Select detail",

                "Select variant"

            ],


            "Waste": [

                "Select waste treatment",

                "Select treatment method",

                "Select material type",

                "Select variant"

            ],


            "Business Travel and Commuting": [

                "Select travel basis",

                "Select transport mode",

                "Select travel type",

                "Select variant"

            ],


            "Transportation and Distribution": [

                "Select calculation basis",

                "Select transport mode",

                "Select freight type",

                "Select variant"

            ]

        };


        return (

            labels[category]?.[depth] ||

            `Select level ${depth + 1}`

        );

    }


    // =====================================================
    // UNIT OPTIONS
    // =====================================================

    function getCompatibleUnits(

        baseUnit

    ) {

        const unitMap = {


            "gallon": [

                "gallon",

                "litre",

                "m3"

            ],


            "MWh": [

                "kWh",

                "MWh",

                "GWh"

            ],


            "mmBtu": [

                "Btu",

                "kWh",

                "MWh",

                "mmBtu"

            ],


            "short ton": [

                "kg",

                "tonne",

                "short ton"

            ],


            "vehicle-mile": [

                "vehicle-km",

                "vehicle-mile"

            ],


            "passenger-mile": [

                "passenger-km",

                "passenger-mile"

            ],


            "short ton-mile": [

                "tonne-km",

                "short ton-mile"

            ],


            "scf": [

                "scf",

                "Nm3"

            ]

        };


        return (

            unitMap[baseUnit] ||

            [baseUnit]

        );

    }


    // =====================================================
    // UNIT CONVERSION
    // =====================================================

    function convertToBase(

        quantity,

        inputUnit,

        baseUnit

    ) {

        if (
            inputUnit === baseUnit
        ) {

            return quantity;

        }


        const conversion = {


            "litre->gallon":
                1 / 3.785411784,


            "m3->gallon":
                1000 / 3.785411784,


            "kWh->MWh":
                0.001,


            "GWh->MWh":
                1000,


            "Btu->mmBtu":
                0.000001,


            "kWh->mmBtu":
                0.003412141633,


            "MWh->mmBtu":
                3.412141633,


            "kg->short ton":
                1 / 907.18474,


            "tonne->short ton":
                1000 / 907.18474,


            "vehicle-km->vehicle-mile":
                1 / 1.609344,


            "passenger-km->passenger-mile":
                1 / 1.609344,


            "tonne-km->short ton-mile":
                0.684944,


            "Nm3->scf":
                37.3267

        };


        const key =

            `${inputUnit}->${baseUnit}`;


        const multiplier =

            conversion[key];


        if (
            multiplier === undefined
        ) {

            return NaN;

        }


        return quantity * multiplier;

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function fillSelect(

        select,

        values,

        placeholder

    ) {

        select.innerHTML = "";


        select.add(

            new Option(

                placeholder,

                ""

            )

        );


        values.forEach(

            value => {

                select.add(

                    new Option(

                        value,

                        value

                    )

                );

            }

        );

    }


    function unique(values) {

        return [

            ...new Set(

                values.filter(

                    value =>

                        value !== null &&

                        value !== undefined &&

                        String(value).trim() !== ""

                )

            )

        ].sort(

            (a, b) =>

                String(a).localeCompare(
                    String(b)
                )

        );

    }


    function clean(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value).trim();

    }


    function setText(

        id,

        value

    ) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value;

        }

    }


    function getInitials(name) {

        return String(name)

            .trim()

            .split(/\s+/)

            .slice(0, 2)

            .map(
                part =>
                    part.charAt(0)
            )

            .join("")

            .toUpperCase() ||

            "DC";

    }


    function showMessage(

        text,

        isError = false

    ) {

        if (!batchMessage) {

            return;

        }


        batchMessage.textContent =
            text;


        batchMessage.classList.toggle(

            "error",

            isError

        );

    }


    function escapeHTML(value) {

        return String(value).replace(

            /[&<>"']/g,

            character => ({

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                '"': "&quot;",

                "'": "&#039;"

            })[character]

        );

    }

});