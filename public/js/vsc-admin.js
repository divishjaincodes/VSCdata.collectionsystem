document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // GLOBAL STATE
    // =====================================================

    let currentStep = 1;
    let allCompanies = [];
    let currentDataRows = [];


    // =====================================================
    // MAIN ELEMENTS
    // =====================================================

    const createCompanyModal =
        document.getElementById("createCompanyModal");

    const companyDetailsModal =
        document.getElementById("companyDetailsModal");

    const createCompanyForm =
        document.getElementById("createCompanyForm");

    const plantsContainer =
        document.getElementById("plantsContainer");

    const adminsContainer =
        document.getElementById("adminsContainer");

    const supervisorsContainer =
        document.getElementById("supervisorsContainer");

    const collectorsContainer =
        document.getElementById("collectorsContainer");

    const companyFormMessage =
        document.getElementById("companyFormMessage");

    const previousStepButton =
        document.getElementById("previousStepButton");

    const nextStepButton =
        document.getElementById("nextStepButton");

    const createCompanySubmitButton =
        document.getElementById("createCompanySubmitButton");

    const addPlantButton =
        document.getElementById("addPlantButton");

    const addAdminButton =
        document.getElementById("addAdminButton");

    const addSupervisorButton =
        document.getElementById("addSupervisorButton");

    const addCollectorButton =
        document.getElementById("addCollectorButton");


    // =====================================================
    // SIDEBAR NAVIGATION
    // =====================================================

    const navItems =
        document.querySelectorAll(".nav-item");

    const pages =
        document.querySelectorAll(".admin-page");

    navItems.forEach(function (navItem) {

        navItem.addEventListener("click", function () {

            const pageId =
                navItem.dataset.page;

            const pageTitle =
                navItem.dataset.title;


            navItems.forEach(function (item) {

                item.classList.remove("active");

            });


            pages.forEach(function (page) {

                page.classList.remove("active");

            });


            navItem.classList.add("active");


            const selectedPage =
                document.getElementById(pageId);

            if (selectedPage) {

                selectedPage.classList.add("active");

            }


            document.getElementById(
                "currentPageTitle"
            ).textContent = pageTitle;

        });

    });


    // =====================================================
    // DASHBOARD MANAGE COMPANIES BUTTON
    // =====================================================

    const dashboardManageCompanies =
        document.getElementById(
            "dashboardManageCompanies"
        );

    if (dashboardManageCompanies) {

        dashboardManageCompanies.addEventListener(
            "click",
            function () {

                const companiesNav =
                    document.querySelector(
                        '[data-page="companiesPage"]'
                    );

                if (companiesNav) {

                    companiesNav.click();

                }

            }
        );

    }


    // =====================================================
    // CREATE COMPANY MODAL
    // =====================================================

    document
        .querySelectorAll(".open-company-modal")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                openCreateCompanyModal
            );

        });


    function openCreateCompanyModal() {

        resetCreateCompanyForm();

        createCompanyModal.classList.add(
            "visible"
        );

        document.body.classList.add(
            "modal-open"
        );

    }


    function closeCreateCompanyModal() {

        createCompanyModal.classList.remove(
            "visible"
        );

        document.body.classList.remove(
            "modal-open"
        );

    }


    const closeCompanyModal =
        document.getElementById(
            "closeCompanyModal"
        );

    const cancelCompanyButton =
        document.getElementById(
            "cancelCompanyButton"
        );


    closeCompanyModal.addEventListener(
        "click",
        closeCreateCompanyModal
    );


    cancelCompanyButton.addEventListener(
        "click",
        closeCreateCompanyModal
    );


    createCompanyModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                createCompanyModal
            ) {

                closeCreateCompanyModal();

            }

        }
    );


    // =====================================================
    // RESET CREATE COMPANY FORM
    // =====================================================

    function resetCreateCompanyForm() {

        createCompanyForm.reset();

        companyFormMessage.textContent = "";

        currentStep = 1;


        const plantCards =
            plantsContainer.querySelectorAll(
                "[data-plant-card]"
            );


        plantCards.forEach(function (
            card,
            index
        ) {

            if (index > 0) {

                card.remove();

            }

        });


        updatePlantNumbers();

        showStep(1);

    }


    // =====================================================
    // MULTI STEP FORM
    // =====================================================

    function showStep(stepNumber) {

        currentStep = stepNumber;


        document
            .querySelectorAll(".form-step")
            .forEach(function (step) {

                const stepValue =
                    Number(
                        step.dataset.formStep
                    );

                step.classList.toggle(
                    "active",
                    stepValue === stepNumber
                );

            });


        document
            .querySelectorAll(
                "[data-step-indicator]"
            )
            .forEach(function (indicator) {

                const indicatorStep =
                    Number(
                        indicator.dataset
                            .stepIndicator
                    );


                indicator.classList.remove(
                    "active",
                    "completed"
                );


                if (
                    indicatorStep ===
                    stepNumber
                ) {

                    indicator.classList.add(
                        "active"
                    );

                }


                if (
                    indicatorStep <
                    stepNumber
                ) {

                    indicator.classList.add(
                        "completed"
                    );

                }

            });


        previousStepButton.classList.toggle(
            "visible",
            stepNumber > 1
        );


        if (stepNumber === 3) {

            nextStepButton.style.display =
                "none";

            createCompanySubmitButton.classList.add(
                "visible"
            );

        }
        else {

            nextStepButton.style.display =
                "inline-block";

            createCompanySubmitButton.classList.remove(
                "visible"
            );

        }


        companyFormMessage.textContent = "";

    }


    nextStepButton.addEventListener(
        "click",
        function () {

            if (!validateCurrentStep()) {

                return;

            }


            if (currentStep < 3) {

                showStep(currentStep + 1);

            }

        }
    );


    previousStepButton.addEventListener(
        "click",
        function () {

            if (currentStep > 1) {

                showStep(currentStep - 1);

            }

        }
    );


    // =====================================================
    // STEP VALIDATION
    // =====================================================

    function validateCurrentStep() {

        const currentSection =
            document.querySelector(
                `[data-form-step="${currentStep}"]`
            );


        const requiredFields =
            currentSection.querySelectorAll(
                "[required]"
            );


        for (
            const field of requiredFields
        ) {

            if (!field.value.trim()) {

                field.focus();

                companyFormMessage.textContent =
                    "Please complete all required fields.";

                return false;

            }


            if (
                field.type === "email" &&
                !field.checkValidity()
            ) {

                field.focus();

                companyFormMessage.textContent =
                    "Please enter a valid email address.";

                return false;

            }

        }


        companyFormMessage.textContent = "";

        return true;

    }


    // =====================================================
    // ADD MULTIPLE PLANTS
    // =====================================================

    addPlantButton.addEventListener(
        "click",
        function () {

            const plantCard =
                document.createElement(
                    "article"
                );


            plantCard.className =
                "plant-form-card";


            plantCard.setAttribute(
                "data-plant-card",
                ""
            );


            plantCard.innerHTML = `

                <div class="plant-card-heading">

                    <div>

                        <span class="plant-number-label">
                            PLANT
                        </span>

                        <strong>
                            Plant Information
                        </strong>

                    </div>


                    <button
                        type="button"
                        class="remove-plant-btn"
                    >
                        Remove Plant
                    </button>

                </div>


                <div class="form-grid">


                    <div class="form-field">

                        <label>
                            Plant Name
                        </label>

                        <input
                            type="text"
                            class="plant-name-input"
                            placeholder="Enter plant name"
                            required
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Plant Code
                        </label>

                        <input
                            type="text"
                            class="plant-code-input"
                            placeholder="Example: PLT-001"
                            required
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            City
                        </label>

                        <input
                            type="text"
                            class="plant-city-input"
                            placeholder="Enter city"
                            required
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            State
                        </label>

                        <input
                            type="text"
                            class="plant-state-input"
                            placeholder="Enter state"
                            required
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Country
                        </label>

                        <input
                            type="text"
                            class="plant-country-input"
                            placeholder="Enter country"
                            required
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            PIN / Postal Code
                        </label>

                        <input
                            type="text"
                            class="plant-pincode-input"
                            placeholder="Enter postal code"
                        >

                    </div>


                    <div class="form-field full-width">

                        <label>
                            Plant Address
                        </label>

                        <textarea
                            class="plant-address-input"
                            placeholder="Enter complete plant address"
                            required
                        ></textarea>

                    </div>


                </div>

            `;


            plantsContainer.appendChild(
                plantCard
            );


            const removeButton =
                plantCard.querySelector(
                    ".remove-plant-btn"
                );


            removeButton.addEventListener(
                "click",
                function () {

                    plantCard.remove();

                    updatePlantNumbers();

                }
            );


            updatePlantNumbers();

        }
    );


    function updatePlantNumbers() {

        const cards =
            plantsContainer.querySelectorAll(
                "[data-plant-card]"
            );


        cards.forEach(function (
            card,
            index
        ) {

            const numberLabel =
                card.querySelector(
                    ".plant-card-heading span"
                );


            if (numberLabel) {

                numberLabel.textContent =
                    `PLANT ${index + 1}`;

            }

        });

    }


    // =====================================================
    // ADD ADMIN / SUPERVISOR / COLLECTOR (generic pattern)
    // =====================================================

    function createPersonCard(config) {

        const card =
            document.createElement("article");

        card.className = "plant-form-card";
        card.setAttribute(config.dataAttr, "");

        card.innerHTML = `

            <div class="plant-card-heading">

                <div>
                    <span class="plant-number-label">${config.label} </span>
                    <strong>${config.title}</strong>
                </div>

                <button type="button" class="remove-plant-btn">
                    Remove ${config.label}
                </button>

            </div>

            <div class="form-grid">

                <div class="form-field">
                    <label>Full Name</label>
                    <input type="text" class="${config.prefix}-name-input" placeholder="Enter full name" required>
                </div>

                <div class="form-field">
                    <label>Email Address</label>
                    <input type="email" class="${config.prefix}-email-input" placeholder="Enter email" required>
                </div>

                <div class="form-field">
                    <label>Password</label>
                    <div class="password-wrapper">
                        <input type="password" class="${config.prefix}-password-input" placeholder="Create password" required>
                        <button type="button" class="password-toggle" data-inline-toggle>Show</button>
                    </div>
                </div>

                <div class="form-field">
                    <label>Confirm Password</label>
                    <div class="password-wrapper">
                        <input type="password" class="${config.prefix}-confirm-password-input" placeholder="Confirm password" required>
                        <button type="button" class="password-toggle" data-inline-toggle>Show</button>
                    </div>
                </div>

            </div>

        `;

        config.container.appendChild(card);

        const removeButton =
            card.querySelector(".remove-plant-btn");

        removeButton.addEventListener("click", function () {

            card.remove();
            updatePersonNumbers(config);

        });

        updatePersonNumbers(config);

    }


    function updatePersonNumbers(config) {

        const cards =
            config.container.querySelectorAll(`[${config.dataAttr}]`);

        cards.forEach(function (card, index) {

            const numberLabel =
                card.querySelector(".plant-card-heading span");

            if (numberLabel) {
                numberLabel.textContent = `${config.label} ${index + 1}`;
            }

        });

    }


    const adminCardConfig = {
        container: adminsContainer,
        dataAttr: "data-admin-card",
        prefix: "admin",
        label: "ADMIN",
        title: "Administrator Account"
    };

    const supervisorCardConfig = {
        container: supervisorsContainer,
        dataAttr: "data-supervisor-card",
        prefix: "supervisor",
        label: "SUPERVISOR",
        title: "Supervisor Account"
    };

    const collectorCardConfig = {
        container: collectorsContainer,
        dataAttr: "data-collector-card",
        prefix: "collector",
        label: "COLLECTOR",
        title: "Data Collector Account"
    };


    addAdminButton.addEventListener("click", function () {
        createPersonCard(adminCardConfig);
    });

    addSupervisorButton.addEventListener("click", function () {
        createPersonCard(supervisorCardConfig);
    });

    addCollectorButton.addEventListener("click", function () {
        createPersonCard(collectorCardConfig);
    });


    // =====================================================
    // PASSWORD SHOW / HIDE
    // (delegated so it also works on dynamically added
    // admin / supervisor / collector cards)
    // =====================================================

    document.addEventListener("click", function (event) {

        const button =
            event.target.closest(".password-toggle");

        if (!button) {
            return;
        }

        let input = null;

        const targetId =
            button.dataset.passwordTarget;

        if (targetId) {

            input =
                document.getElementById(targetId);

        } else {

            const wrapper =
                button.closest(".password-wrapper");

            if (wrapper) {
                input = wrapper.querySelector("input");
            }

        }

        if (!input) {
            return;
        }

        if (input.type === "password") {

            input.type = "text";
            button.textContent = "Hide";

        } else {

            input.type = "password";
            button.textContent = "Show";

        }

    });


    // =====================================================
    // CREATE COMPANY FORM SUBMIT
    // =====================================================

    createCompanyForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!validateCurrentStep()) {

                return;

            }


            function validatePersonPasswords(config, roleLabel) {

                const cards =
                    config.container.querySelectorAll(`[${config.dataAttr}]`);

                for (const card of cards) {

                    const password =
                        card.querySelector(`.${config.prefix}-password-input`).value;

                    const confirmPassword =
                        card.querySelector(`.${config.prefix}-confirm-password-input`).value;

                    if (password !== confirmPassword) {

                        companyFormMessage.textContent =
                            `${roleLabel} passwords do not match.`;

                        return false;

                    }

                }

                return true;

            }


            if (!validatePersonPasswords(adminCardConfig, "Company Admin")) {
                return;
            }

            if (!validatePersonPasswords(supervisorCardConfig, "Supervisor")) {
                return;
            }

            if (!validatePersonPasswords(collectorCardConfig, "Data Collector")) {
                return;
            }



            const payload =
                buildCompanyPayload();


            createCompanySubmitButton.disabled =
                true;


            createCompanySubmitButton.textContent =
                "Creating...";


            companyFormMessage.textContent =
                "";


            try {

                const response =
                    await fetch(
                        "/api/companies",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Unable to create company."
                    );

                }


                closeCreateCompanyModal();


                await Promise.all([

                    loadDashboardStats(),

                    loadCompanies()

                ]);


                alert(
                    "Company created successfully."
                );

            }
            catch (error) {

                companyFormMessage.textContent =
                    error.message;

            }
            finally {

                createCompanySubmitButton.disabled =
                    false;


                createCompanySubmitButton.textContent =
                    "Create Company";

            }

        }
    );


    // =====================================================
    // BUILD COMPANY PAYLOAD
    // =====================================================

    function collectPersonArray(config) {

        const people = [];

        document
            .querySelectorAll(`[${config.dataAttr}]`)
            .forEach(function (card) {

                people.push({

                    name:
                        card.querySelector(`.${config.prefix}-name-input`)
                            .value.trim(),

                    email:
                        card.querySelector(`.${config.prefix}-email-input`)
                            .value.trim(),

                    password:
                        card.querySelector(`.${config.prefix}-password-input`)
                            .value

                });

            });

        return people;

    }


    function buildCompanyPayload() {

        const plants = [];


        document
            .querySelectorAll(
                "[data-plant-card]"
            )
            .forEach(function (card) {

                plants.push({

                    plant_name:
                        card.querySelector(
                            ".plant-name-input"
                        ).value.trim(),

                    plant_code:
                        card.querySelector(
                            ".plant-code-input"
                        ).value.trim(),

                    city:
                        card.querySelector(
                            ".plant-city-input"
                        ).value.trim(),

                    state:
                        card.querySelector(
                            ".plant-state-input"
                        ).value.trim(),

                    country:
                        card.querySelector(
                            ".plant-country-input"
                        ).value.trim(),

                    pincode:
                        card.querySelector(
                            ".plant-pincode-input"
                        ).value.trim(),

                    plant_address:
                        card.querySelector(
                            ".plant-address-input"
                        ).value.trim()

                });

            });


        return {

            company_name:
                document.getElementById(
                    "companyName"
                ).value.trim(),

            company_code:
                document.getElementById(
                    "companyCode"
                ).value.trim(),

            plants: plants,

            admins:
                collectPersonArray(adminCardConfig),

            supervisors:
                collectPersonArray(supervisorCardConfig),

            collectors:
                collectPersonArray(collectorCardConfig)

        };

    }


    // =====================================================
    // LOAD DASHBOARD STATS
    // =====================================================

    async function loadDashboardStats() {

        try {

            const response =
                await fetch(
                    "/api/vsc/dashboard"
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load dashboard."
                );

            }


            const data =
                await response.json();


            document.getElementById(
                "companyCount"
            ).textContent =
                data.companies || 0;


            document.getElementById(
                "plantCount"
            ).textContent =
                data.plants || 0;


            document.getElementById(
                "adminCount"
            ).textContent =
                data.admins || 0;


            document.getElementById(
                "collectorCount"
            ).textContent =
                data.collectors || 0;

        }
        catch (error) {

            console.error(
                "Dashboard Error:",
                error
            );

        }

    }


    // =====================================================
    // LOAD COMPANIES
    // =====================================================

    async function loadCompanies() {

        try {

            const response =
                await fetch(
                    "/api/companies"
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load companies."
                );

            }


            allCompanies =
                await response.json();


            renderCompaniesTable(
                allCompanies
            );


            renderDashboardCompanies(
                allCompanies
            );


            populateCompanySelect(
                allCompanies
            );

        }
        catch (error) {

            console.error(
                "Company Load Error:",
                error
            );

        }

    }


    // =====================================================
    // RENDER COMPANIES TABLE
    // =====================================================

    function renderCompaniesTable(
        companies
    ) {

        const tableBody =
            document.getElementById(
                "companiesTableBody"
            );


        if (!companies.length) {

            tableBody.innerHTML = `

                <tr class="table-empty-row">

                    <td colspan="7">
                        No companies available.
                    </td>

                </tr>

            `;

            return;

        }


        tableBody.innerHTML = "";


        companies.forEach(function (
            company
        ) {

            const row =
                document.createElement("tr");


            const createdDate =
                company.created_at
                    ? new Date(
                        company.created_at
                    ).toLocaleDateString()
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        company.company_code
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(
                            company.company_name
                        )}
                    </strong>
                </td>

                <td>
                    ${company.plant_count || 0}
                </td>

                <td>
                    ${escapeHtml(
                        company.admin_name || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        company.collector_name || "-"
                    )}
                </td>

                <td>
                    ${createdDate}
                </td>

                <td>

                    <button
                        type="button"
                        class="table-action-btn manage-company-btn"
                        data-company-id="${company.id}"
                    >
                        Manage
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        });


        document
            .querySelectorAll(
                ".manage-company-btn"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openCompanyDetails(
                            button.dataset
                                .companyId
                        );

                    }
                );

            });

    }


    // =====================================================
    // DASHBOARD COMPANY LIST
    // =====================================================

    function renderDashboardCompanies(
        companies
    ) {

        const container =
            document.getElementById(
                "dashboardCompanyList"
            );


        if (!companies.length) {

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        +
                    </div>

                    <h3>
                        No companies created yet
                    </h3>

                    <p>
                        Create the first company workspace
                        to begin onboarding.
                    </p>

                    <button
                        type="button"
                        class="primary-btn dashboard-create-company"
                    >
                        + Create Company
                    </button>

                </div>

            `;


            const dashboardCreateButton =
                container.querySelector(
                    ".dashboard-create-company"
                );


            dashboardCreateButton.addEventListener(
                "click",
                openCreateCompanyModal
            );


            return;

        }


        container.innerHTML = "";


        companies
            .slice(0, 5)
            .forEach(function (company) {

                const row =
                    document.createElement("div");


                row.className =
                    "company-dashboard-row";


                row.innerHTML = `

                    <strong>
                        ${escapeHtml(
                            company.company_name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            company.company_code
                        )}
                    </span>

                    <span>
                        ${company.plant_count || 0}
                        Plant(s)
                    </span>

                    <button
                        type="button"
                        class="table-action-btn dashboard-manage-btn"
                        data-company-id="${company.id}"
                    >
                        Manage
                    </button>

                `;


                container.appendChild(row);

            });


        container
            .querySelectorAll(
                ".dashboard-manage-btn"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openCompanyDetails(
                            button.dataset
                                .companyId
                        );

                    }
                );

            });

    }


    // =====================================================
    // COMPANY SEARCH + FILTER
    // =====================================================

    const companySearchInput =
        document.getElementById(
            "companySearchInput"
        );


    const companyStatusFilter =
        document.getElementById(
            "companyStatusFilter"
        );


    companySearchInput.addEventListener(
        "input",
        filterCompanies
    );


    companyStatusFilter.addEventListener(
        "change",
        filterCompanies
    );


    function filterCompanies() {

        const searchText =
            companySearchInput.value
                .trim()
                .toLowerCase();


        const status =
            companyStatusFilter.value;


        const filtered =
            allCompanies.filter(
                function (company) {

                    const matchesSearch =

                        company.company_name
                            .toLowerCase()
                            .includes(searchText)

                        ||

                        company.company_code
                            .toLowerCase()
                            .includes(searchText);


                    let matchesStatus = true;


                    if (status === "active") {

                        matchesStatus =
                            Boolean(
                                company.is_active
                            );

                    }


                    if (status === "inactive") {

                        matchesStatus =
                            !Boolean(
                                company.is_active
                            );

                    }


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        renderCompaniesTable(
            filtered
        );

    }


    // =====================================================
    // POPULATE VIEW DATA COMPANY SELECT
    // =====================================================

    function populateCompanySelect(
        companies
    ) {

        const select =
            document.getElementById(
                "viewCompanySelect"
            );


        const previousValue =
            select.value;


        select.innerHTML = `

            <option value="">
                Select Company
            </option>

        `;


        companies.forEach(function (
            company
        ) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                company.id;


            option.textContent =
                `${company.company_name} (${company.company_code})`;


            select.appendChild(option);

        });


        if (
            companies.some(
                company =>
                    String(company.id) ===
                    String(previousValue)
            )
        ) {

            select.value =
                previousValue;

        }

    }


    // =====================================================
    // VIEW DATA ELEMENTS
    // =====================================================

    const viewCompanySelect =
        document.getElementById(
            "viewCompanySelect"
        );


    const viewPlantSelect =
        document.getElementById(
            "viewPlantSelect"
        );


    const viewScopeSelect =
        document.getElementById(
            "viewScopeSelect"
        );


    const selectCompanyState =
        document.getElementById(
            "selectCompanyState"
        );


    const dataResultsArea =
        document.getElementById(
            "dataResultsArea"
        );


    // =====================================================
    // COMPANY CHANGE
    // =====================================================

    viewCompanySelect.addEventListener(
        "change",
        async function () {

            const companyId =
                viewCompanySelect.value;


            viewPlantSelect.innerHTML = `

                <option value="">
                    All Plants
                </option>

            `;


            if (!companyId) {

                viewPlantSelect.disabled =
                    true;


                selectCompanyState.style.display =
                    "flex";


                dataResultsArea.classList.remove(
                    "visible"
                );


                return;

            }


            viewPlantSelect.disabled =
                false;


            await loadCompanyPlants(
                companyId
            );


            await loadCompanyData();

        }
    );


    viewPlantSelect.addEventListener(
        "change",
        loadCompanyData
    );


    viewScopeSelect.addEventListener(
        "change",
        loadCompanyData
    );


    // =====================================================
    // LOAD COMPANY PLANTS
    // =====================================================

    async function loadCompanyPlants(
        companyId
    ) {

        try {

            const response =
                await fetch(
                    `/api/companies/${companyId}/plants`
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load plants."
                );

            }


            const plants =
                await response.json();


            viewPlantSelect.innerHTML = `

                <option value="">
                    All Plants
                </option>

            `;


            plants.forEach(function (
                plant
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    plant.id;


                option.textContent =
                    plant.plant_name;


                viewPlantSelect.appendChild(
                    option
                );

            });

        }
        catch (error) {

            console.error(
                "Plant Load Error:",
                error
            );

        }

    }


    // =====================================================
    // LOAD COMPANY DATA
    // =====================================================

    async function loadCompanyData() {

        const companyId =
            viewCompanySelect.value;


        if (!companyId) {

            return;

        }


        const params =
            new URLSearchParams();


        if (viewPlantSelect.value) {

            params.append(
                "plant_id",
                viewPlantSelect.value
            );

        }


        if (viewScopeSelect.value) {

            params.append(
                "scope",
                viewScopeSelect.value
            );

        }


        const loadingIndicator =
            document.getElementById(
                "dataLoadingIndicator"
            );


        loadingIndicator.classList.add(
            "visible"
        );


        try {

            const response =
                await fetch(

                    `/api/companies/${companyId}/data?${params.toString()}`

                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load company data."
                );

            }


            currentDataRows =
                await response.json();


            selectCompanyState.style.display =
                "none";


            dataResultsArea.classList.add(
                "visible"
            );


            updateSelectedCompanyTitle();


            renderCompanyData(
                currentDataRows
            );


            updateDataSummary(
                currentDataRows
            );

        }
        catch (error) {

            console.error(
                "Data Load Error:",
                error
            );


            document.getElementById(
                "companyDataTableBody"
            ).innerHTML = `

                <tr class="table-empty-row">

                    <td colspan="11">
                        ${escapeHtml(error.message)}
                    </td>

                </tr>

            `;

        }
        finally {

            loadingIndicator.classList.remove(
                "visible"
            );

        }

    }


    // =====================================================
    // SELECTED COMPANY TITLE
    // =====================================================

    function updateSelectedCompanyTitle() {

        const selectedCompany =
            allCompanies.find(
                function (company) {

                    return (
                        String(company.id) ===
                        String(
                            viewCompanySelect.value
                        )
                    );

                }
            );


        document.getElementById(
            "selectedCompanyDataTitle"
        ).textContent =
            selectedCompany
                ? `${selectedCompany.company_name} Data`
                : "Company Data";

    }


    // =====================================================
    // RENDER COMPANY DATA
    // =====================================================

    function renderCompanyData(rows) {

        const tableBody =
            document.getElementById(
                "companyDataTableBody"
            );


        if (!rows.length) {

            tableBody.innerHTML = `

                <tr class="table-empty-row">

                    <td colspan="11">
                        No submitted data found.
                    </td>

                </tr>

            `;

            return;

        }


        tableBody.innerHTML = "";


        rows.forEach(function (row) {

            const tableRow =
                document.createElement("tr");


            const submittedAt =
                row.created_at
                    ? new Date(
                        row.created_at
                    ).toLocaleString()
                    : "-";


            let evidenceHtml = "-";


            if (row.evidence_path) {

                evidenceHtml = `

                    <button
                        type="button"
                        class="evidence-btn"
                        data-evidence="${escapeAttribute(
                            row.evidence_path
                        )}"
                    >
                        View Evidence
                    </button>

                `;

            }


            tableRow.innerHTML = `

                <td>
                    ${row.id}
                </td>

                <td>
                    ${escapeHtml(
                        row.plant_name || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.scope || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.reporting_period || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.activity_category || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.source_name || "-"
                    )}
                </td>

                <td>
                    ${
                        row.quantity !== null
                            ? escapeHtml(
                                String(row.quantity)
                            )
                            : "-"
                    }

                    ${escapeHtml(
                        row.unit || ""
                    )}
                </td>

                <td>
                    ${
                        row.calculated_emissions !== null
                            ? escapeHtml(
                                String(
                                    row.calculated_emissions
                                )
                            )
                            : "-"
                    }
                </td>

                <td>
                    ${escapeHtml(
                        row.submitted_by || "-"
                    )}
                </td>

                <td>
                    ${submittedAt}
                </td>

                <td>
                    ${evidenceHtml}
                </td>

            `;


            tableBody.appendChild(
                tableRow
            );

        });


        tableBody
            .querySelectorAll(
                ".evidence-btn"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const evidencePath =
                            button.dataset
                                .evidence;


                        if (evidencePath) {

                            window.open(
                                evidencePath,
                                "_blank",
                                "noopener,noreferrer"
                            );

                        }

                    }
                );

            });

    }


    // =====================================================
    // UPDATE DATA SUMMARY
    // =====================================================

    function updateDataSummary(rows) {

        const scope1Count =
            rows.filter(
                row =>
                    row.scope === "Scope 1"
            ).length;


        const scope2Count =
            rows.filter(
                row =>
                    row.scope === "Scope 2"
            ).length;


        const plantIds =
            new Set(
                rows
                    .map(row => row.plant_id)
                    .filter(Boolean)
            );


        document.getElementById(
            "totalRecordCount"
        ).textContent =
            rows.length;


        document.getElementById(
            "scope1RecordCount"
        ).textContent =
            scope1Count;


        document.getElementById(
            "scope2RecordCount"
        ).textContent =
            scope2Count;


        document.getElementById(
            "plantsWithDataCount"
        ).textContent =
            plantIds.size;

    }


    // =====================================================
    // COMPANY DETAILS MODAL
    // =====================================================

    const closeCompanyDetailsModal =
        document.getElementById(
            "closeCompanyDetailsModal"
        );


    closeCompanyDetailsModal.addEventListener(
        "click",
        closeDetailsModal
    );


    companyDetailsModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                companyDetailsModal
            ) {

                closeDetailsModal();

            }

        }
    );


    function closeDetailsModal() {

        companyDetailsModal.classList.remove(
            "visible"
        );


        document.body.classList.remove(
            "modal-open"
        );

    }


    async function openCompanyDetails(
        companyId
    ) {

        const company =
            allCompanies.find(
                item =>
                    String(item.id) ===
                    String(companyId)
            );


        if (!company) {

            return;

        }


        document.getElementById(
            "detailsCompanyName"
        ).textContent =
            company.company_name;


        document.getElementById(
            "detailsCompanyCode"
        ).textContent =
            `Company Code: ${company.company_code}`;


        document.getElementById(
            "detailsPlantList"
        ).innerHTML =
            `<div class="details-empty">Loading plants...</div>`;


        document.getElementById(
            "detailsUserList"
        ).innerHTML =
            `<div class="details-empty">Loading users...</div>`;


        companyDetailsModal.classList.add(
            "visible"
        );


        document.body.classList.add(
            "modal-open"
        );


        try {

            const [
                plantsResponse,
                usersResponse
            ] = await Promise.all([

                fetch(
                    `/api/companies/${companyId}/plants`
                ),

                fetch(
                    `/api/companies/${companyId}/users`
                )

            ]);


            if (
                !plantsResponse.ok ||
                !usersResponse.ok
            ) {

                throw new Error(
                    "Unable to load company details."
                );

            }


            const plants =
                await plantsResponse.json();


            const users =
                await usersResponse.json();


            renderDetailsPlants(plants);

            renderDetailsUsers(users);

        }
        catch (error) {

            document.getElementById(
                "detailsPlantList"
            ).innerHTML = `

                <div class="details-empty">
                    ${escapeHtml(error.message)}
                </div>

            `;


            document.getElementById(
                "detailsUserList"
            ).innerHTML = `

                <div class="details-empty">
                    ${escapeHtml(error.message)}
                </div>

            `;

        }

    }


    // =====================================================
    // DETAILS PLANTS
    // =====================================================

    function renderDetailsPlants(plants) {

        const container =
            document.getElementById(
                "detailsPlantList"
            );


        if (!plants.length) {

            container.innerHTML = `

                <div class="details-empty">
                    No plants found.
                </div>

            `;

            return;

        }


        container.innerHTML = "";


        plants.forEach(function (plant) {

            const item =
                document.createElement("div");


            item.className =
                "company-dashboard-row";


            item.innerHTML = `

                <strong>
                    ${escapeHtml(
                        plant.plant_name
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        plant.plant_code
                    )}
                </span>

                <span>
                    ${escapeHtml(
                        plant.city || "-"
                    )},
                    ${escapeHtml(
                        plant.state || "-"
                    )}
                </span>

                <span>
                    ${escapeHtml(
                        plant.country || "-"
                    )}
                </span>

            `;


            container.appendChild(item);

        });

    }


    // =====================================================
    // DETAILS USERS
    // =====================================================

    function renderDetailsUsers(users) {

        const container =
            document.getElementById(
                "detailsUserList"
            );


        if (!users.length) {

            container.innerHTML = `

                <div class="details-empty">
                    No users found.
                </div>

            `;

            return;

        }


        container.innerHTML = "";


        users.forEach(function (user) {

            const item =
                document.createElement("div");


            item.className =
                "company-dashboard-row";


            item.innerHTML = `

                <strong>
                    ${escapeHtml(
                        user.name
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        user.email
                    )}
                </span>

                <span>
                    ${formatRole(
                        user.role
                    )}
                </span>

                <span class="status-badge ${
                    user.is_active
                        ? "active"
                        : "inactive"
                }">
                    ${
                        user.is_active
                            ? "Active"
                            : "Inactive"
                    }
                </span>

            `;


            container.appendChild(item);

        });

    }


    // =====================================================
    // FORMAT ROLE
    // =====================================================

    function formatRole(role) {

        if (
            role === "company_admin"
        ) {

            return "Company Admin";

        }


        if (
            role === "data_collector"
        ) {

            return "Data Collector";

        }


        if (
            role === "vsc_admin"
        ) {

            return "VSC Admin";

        }


        return role || "-";

    }


    // =====================================================
    // ESCAPE HELPERS
    // =====================================================

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .replaceAll("&", "&amp;")

            .replaceAll("<", "&lt;")

            .replaceAll(">", "&gt;")

            .replaceAll('"', "&quot;")

            .replaceAll("'", "&#039;");

    }


    function escapeAttribute(value) {

        return escapeHtml(value);

    }


    // =====================================================
    // ESC KEY CLOSE MODALS
    // =====================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {

                return;

            }


            if (
                createCompanyModal.classList
                    .contains("visible")
            ) {

                closeCreateCompanyModal();

            }


            if (
                companyDetailsModal.classList
                    .contains("visible")
            ) {

                closeDetailsModal();

            }

        }
    );


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    async function initializeAdminPanel() {

        await Promise.all([

            loadDashboardStats(),

            loadCompanies()

        ]);

    }


    initializeAdminPanel();

});