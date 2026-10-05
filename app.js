const STORAGE_KEY = "nexus_state_v2";

const DEFAULT_MODELS = [
    {
        id: "local-free",
        name: "Local AI",
        type: "local",
        provider: "Local",
        status: "available",
        description:
            "A locally running AI model with no per-message cost."
    }
];

const defaultState = {
    models: DEFAULT_MODELS,

    activeModelId: null,

    agents: [
        {
            id: "general",
            name: "General",
            description: "General-purpose AI assistant.",
            instructions: "Help the user accomplish their objective.",
            personality: "Helpful, direct, capable.",
            permissions: { files: true, web: true, tools: true },
            builtIn: true
        },
        {
            id: "researcher",
            name: "Researcher",
            description: "Research and information analysis.",
            instructions: "Research topics and organize useful information.",
            personality: "Thorough, analytical, skeptical.",
            permissions: { files: true, web: true, tools: true },
            builtIn: true
        },
        {
            id: "coder",
            name: "Coder",
            description: "Software development and debugging.",
            instructions: "Write, analyze, debug, and improve software.",
            personality: "Precise, technical, systematic.",
            permissions: { files: true, web: true, tools: true },
            builtIn: true
        },
        {
            id: "writer",
            name: "Writer",
            description: "Writing and content creation.",
            instructions: "Create clear, polished written content.",
            personality: "Creative, clear, adaptable.",
            permissions: { files: true, web: false, tools: false },
            builtIn: true
        },
        {
            id: "analyst",
            name: "Analyst",
            description: "Analysis and decision support.",
            instructions: "Break down information and identify useful conclusions.",
            personality: "Logical, objective, detail-oriented.",
            permissions: { files: true, web: true, tools: true },
            builtIn: true
        },
        {
            id: "manager",
            name: "Manager",
            description: "Coordinates agents and tasks.",
            instructions: "Break objectives into tasks and coordinate execution.",
            personality: "Organized, strategic, decisive.",
            permissions: { files: true, web: true, tools: true },
            builtIn: true
        }
    ],

    tasks: [],
    projects: [],
    activity: [],

    settings: {
        theme: "dark"
    }
};


function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return defaultState;
        }

        const parsed = JSON.parse(saved);

        return {
            ...defaultState,
            ...parsed,

models: Array.isArray(parsed.models)
    ? parsed.models
    : DEFAULT_MODELS,

activeModelId:
    parsed.activeModelId || null,
    
            agents: Array.isArray(parsed.agents)
                ? parsed.agents
                : defaultState.agents,

            tasks: Array.isArray(parsed.tasks)
                ? parsed.tasks
                : [],

            projects: Array.isArray(parsed.projects)
                ? parsed.projects
                : [],

            activity: Array.isArray(parsed.activity)
                ? parsed.activity
                : []
        };

    } catch (error) {
        console.error("Nexus state could not be loaded:", error);
        return defaultState;
    }
}


let state = loadState();


function saveState() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error(
            "Nexus state could not be saved:",
            error
        );
    }
}


function generateId(prefix = "id") {
    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


function escapeHTML(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function addActivity(message) {

    state.activity.unshift({
        id: generateId("activity"),
        message: message,
        timestamp: new Date().toISOString()
    });

    state.activity =
        state.activity.slice(0, 50);

    saveState();
    renderActivity();
}


function showView(viewId) {

    document
        .querySelectorAll(".view")
        .forEach(view => {
            view.classList.remove("active");
        });

    const target =
        document.getElementById(viewId);

    if (target) {
        target.classList.add("active");
    }

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove("active");

            if (
                item.dataset.view === viewId
            ) {
                item.classList.add("active");
            }
        });

    renderAll();
}

/* ================================
   MODELS
   ================================ */

function renderModels() {

    const container =
        document.getElementById(
            "modelsContainer"
        );

    const activeName =
        document.getElementById(
            "activeModelName"
        );

    const activeType =
        document.getElementById(
            "activeModelType"
        );

    if (!container) {
        return;
    }


    const activeModel =
        state.models.find(
            model =>
                model.id ===
                state.activeModelId
        );


    if (activeName) {

        activeName.textContent =
            activeModel
                ? activeModel.name
                : "No model selected";

    }


    if (activeType) {

        activeType.textContent =
            activeModel
                ? `${activeModel.provider} • ${activeModel.type}`
                : "Nexus is waiting for an AI model.";

    }


    if (!state.models.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    AI
                </div>

                <strong>
                    No models configured
                </strong>

                <span>
                    Add a model to begin using Nexus AI.
                </span>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.models
            .map(model => `

                <div
                    class="model-card"
                    data-model-id="${escapeHTML(model.id)}"
                >

                    <div class="model-icon">
                        AI
                    </div>

                    <div class="model-info">

                        <strong>
                            ${escapeHTML(model.name)}
                        </strong>

                        <span>
                            ${escapeHTML(model.description)}
                        </span>

                        <span>
                            ${escapeHTML(model.provider)}
                            •
                            ${escapeHTML(model.type)}
                        </span>

                    </div>

                    <div class="model-status">

                        ${
                            model.id ===
                            state.activeModelId
                                ? "Active"
                                : "Available"
                        }

                    </div>

                </div>

            `)
            .join("");


    container
        .querySelectorAll(
            ".model-card[data-model-id]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    selectModel(
                        card.dataset.modelId
                    );

                }
            );

        });
}


function selectModel(modelId) {

    const model =
        state.models.find(
            item =>
                item.id === modelId
        );

    if (!model) {
        return;
    }


    state.activeModelId =
        model.id;


    saveState();


    addActivity(
        `Selected AI model: ${model.name}`
    );


    renderAll();
}

function testWebGPU() {

    const status =
        document.getElementById(
            "webgpuStatus"
        );

    if (!status) {
        return;
    }


    if (!("gpu" in navigator)) {

        status.textContent =
            "WebGPU is not available in this browser.";

        return;
    }


    status.textContent =
        "WebGPU detected. Checking GPU adapter...";


    navigator.gpu.requestAdapter()
        .then(adapter => {

            if (!adapter) {

                status.textContent =
                    "WebGPU is available, but no compatible GPU adapter was found.";

                return;
            }


            const info =
                adapter.info || {};


            const vendor =
                info.vendor ||
                "Unknown";

            const architecture =
                info.architecture ||
                "Unknown";


            status.textContent =
                `WebGPU is ready.\n\n` +
                `Vendor: ${vendor}\n` +
                `Architecture: ${architecture}\n\n` +
                `Nexus can attempt local AI inference on this device.`;

        })
        .catch(error => {

            status.textContent =
                `WebGPU test failed: ${error.message}`;

        });
}

async function testActiveModel() {

    const input =
        document.getElementById(
            "modelTestInput"
        );

    const output =
        document.getElementById(
            "modelTestOutput"
        );

    if (!input || !output) {
        return;
    }


    const prompt =
        input.value.trim();


    if (!prompt) {

        output.textContent =
            "Enter a prompt first.";

        return;
    }


    output.textContent =
        "Connecting to model...";


    try {

        const response =
            await generateAIResponse(
                prompt
            );

        output.textContent =
            response;

    } catch (error) {

        output.textContent =
            `Model error: ${error.message}`;

    }
}

/* ================================
   AI MODEL GATEWAY
   ================================ */

async function generateAIResponse(prompt) {

    const activeModel =
        state.models.find(
            model =>
                model.id ===
                state.activeModelId
        );

    if (!activeModel) {
        throw new Error(
            "No AI model is currently selected."
        );
    }


    /*
     * The model gateway is intentionally
     * separate from the task engine.
     *
     * This lets Nexus eventually support:
     *
     * Local models
     * Free self-hosted models
     * OpenAI-compatible local servers
     * Other compatible providers
     *
     * without changing the rest of Nexus.
     */


    if (activeModel.type === "local") {

        throw new Error(
            "The local AI runtime has not been connected yet."
        );

    }


    throw new Error(
        `No model gateway exists for ${activeModel.name}.`
    );
}

/* ================================
   AGENTS
   ================================ */

function renderAgents() {

    const dashboardContainer =
        document.getElementById("agentsContainer");

    const fullContainer =
        document.getElementById("fullAgentsContainer");

    const agentHTML =
        state.agents
            .map(agent => `

                <div class="agent-card">

                    <div class="agent-avatar">
                        ${escapeHTML(
                            agent.name.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div class="agent-info">

                        <strong>
                            ${escapeHTML(agent.name)}
                        </strong>

                        <span>
                            ${escapeHTML(agent.description)}
                        </span>

                    </div>

                </div>

            `)
            .join("");

    if (dashboardContainer) {
        dashboardContainer.innerHTML =
            agentHTML;
    }

    if (fullContainer) {
        fullContainer.innerHTML =
            agentHTML;
    }
}


function openAgentModal() {

    const modal =
        document.getElementById("agentModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");
    modal.classList.add("active");
}


function closeAgentModal() {

    const modal =
        document.getElementById("agentModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
    modal.classList.remove("active");
}


function saveAgent() {

    const name =
        document.getElementById("agentName")
            ?.value.trim();

    const description =
        document.getElementById("agentDescription")
            ?.value.trim();

    const instructions =
        document.getElementById("agentInstructions")
            ?.value.trim();

    const personality =
        document.getElementById("agentPersonality")
            ?.value.trim();

    if (!name) {
        alert("Please enter an agent name.");
        return;
    }

    const agent = {

        id: generateId("agent"),

        name: name,

        description:
            description ||
            "Custom Nexus agent.",

        instructions:
            instructions ||
            "Complete the user's objective.",

        personality:
            personality ||
            "Helpful and capable.",

        permissions: {

            files:
                document.getElementById(
                    "permissionFiles"
                )?.checked || false,

            web:
                document.getElementById(
                    "permissionWeb"
                )?.checked || false,

            tools:
                document.getElementById(
                    "permissionTools"
                )?.checked || false
        },

        builtIn: false
    };

    state.agents.push(agent);

    saveState();

    addActivity(
        `Created agent: ${agent.name}`
    );

    [
        "agentName",
        "agentDescription",
        "agentInstructions",
        "agentPersonality"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.value = "";
        }

    });

    closeAgentModal();

    renderAll();
}


/* ================================
   TASK ENGINE
   ================================ */

function createTask(objective) {

    objective =
        String(objective || "").trim();

    if (!objective) {
        alert("Enter an objective first.");
        return;
    }

    const agent =
        state.agents[0];

    const task = {

        id: generateId("task"),

        objective: objective,

        agentId:
            agent?.id || "general",

        agentName:
            agent?.name || "General",

        status: "queued",

        progress: 0,

        createdAt:
            new Date().toISOString(),

        startedAt: null,

        completedAt: null,

        cancelledAt: null,

        output: "",

        steps: [

            {
                name: "Understand objective",
                status: "pending"
            },

            {
                name: "Create execution plan",
                status: "pending"
            },

            {
                name: "Execute work",
                status: "pending"
            },

            {
                name: "Evaluate result",
                status: "pending"
            }

        ]
    };

    state.tasks.unshift(task);

    saveState();

    addActivity(
        `Created task: ${task.objective}`
    );

    renderAll();

    showView("tasksView");

    startTask(task.id);
}


function startTask(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    task.status = "running";

    task.startedAt =
        new Date().toISOString();

    task.progress = 10;

    task.steps[0].status =
        "completed";

    saveState();

    renderAll();

    setTimeout(() => {
        advanceTask(taskId);
    }, 1000);
}


function advanceTask(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    if (task.status !== "running") {
        return;
    }

    const pendingIndex =
        task.steps.findIndex(
            step =>
                step.status === "pending"
        );

    if (pendingIndex === -1) {
        completeTask(taskId);
        return;
    }

    task.steps[pendingIndex].status =
        "completed";

    task.progress =
        Math.min(
            100,
            Math.round(
                (
                    task.steps.filter(
                        step =>
                            step.status ===
                            "completed"
                    ).length /
                    task.steps.length
                ) * 100
            )
        );

    saveState();

    renderAll();

    setTimeout(() => {
        advanceTask(taskId);
    }, 1000);
}


function completeTask(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    task.status = "completed";

    task.progress = 100;

    task.completedAt =
        new Date().toISOString();

    task.output =
        "This task was completed by the Nexus task engine. Actual AI-generated output will be connected in the AI model phase.";

    saveState();

    addActivity(
        `Completed task: ${task.objective}`
    );

    renderAll();
}


function cancelTask(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    task.status = "cancelled";

    task.cancelledAt =
        new Date().toISOString();

    saveState();

    addActivity(
        `Cancelled task: ${task.objective}`
    );

    renderAll();
}


/* ================================
   TASK DISPLAY
   ================================ */

function renderTasks() {

    const dashboardContainer =
        document.getElementById("tasksContainer");

    const fullContainer =
        document.getElementById("fullTasksContainer");

    const completedContainer =
        document.getElementById("completedTasksContainer");


    const activeTasks =
        state.tasks.filter(
            task =>
                task.status === "queued" ||
                task.status === "running"
        );


    const activeHTML =
        activeTasks.length

            ? activeTasks
                .map(task => `

                    <div
                        class="task-card"
                        data-task-id="${escapeHTML(task.id)}"
                    >

                        <div class="task-status">
                            <span class="status-dot"></span>
                        </div>

                        <div class="task-info">

                            <strong>
                                ${escapeHTML(task.objective)}
                            </strong>

                            <span>
                                Agent:
                                ${escapeHTML(task.agentName)}
                            </span>

                            <div class="task-progress">

                                <div
                                    class="task-progress-bar"
                                    style="width: ${task.progress}%"
                                ></div>

                            </div>

                        </div>

                        <div class="task-state">
                            ${task.progress}%
                        </div>

                    </div>

                `)
                .join("")

            : `

                <div class="empty-state compact">

                    <div class="empty-icon">✓</div>

                    <strong>
                        No active tasks
                    </strong>

                    <span>
                        Tasks will appear here when Nexus is working.
                    </span>

                </div>

            `;


    const completedTasks =
        state.tasks.filter(
            task =>
                task.status === "completed"
        );


    const completedHTML =
        completedTasks.length

            ? completedTasks
                .map(task => `

                    <div
                        class="task-card"
                        data-task-id="${escapeHTML(task.id)}"
                    >

                        <div class="task-status">
                            <span class="status-dot"></span>
                        </div>

                        <div class="task-info">

                            <strong>
                                ${escapeHTML(task.objective)}
                            </strong>

                            <span>
                                Agent:
                                ${escapeHTML(task.agentName)}
                            </span>

                            <span>
                                Completed:
                                ${
                                    task.completedAt
                                        ? new Date(
                                            task.completedAt
                                        ).toLocaleString()
                                        : "—"
                                }
                            </span>

                        </div>

                        <div class="task-state">
                            ✓ 100%
                        </div>

                    </div>

                `)
                .join("")

            : `

                <div class="empty-state compact">

                    <div class="empty-icon">✓</div>

                    <strong>
                        No completed tasks
                    </strong>

                    <span>
                        Completed objectives will appear here.
                    </span>

                </div>

            `;


    if (dashboardContainer) {
        dashboardContainer.innerHTML = activeHTML;
    }

    if (fullContainer) {
        fullContainer.innerHTML = activeHTML;
    }

    if (completedContainer) {
        completedContainer.innerHTML = completedHTML;
    }
}


/* ================================
   TASK DETAILS
   ================================ */

function openTaskDetails(taskId) {

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    const modal =
        document.getElementById(
            "taskDetailsModal"
        );

    if (!modal) {
        return;
    }


    const objective =
        document.getElementById(
            "taskDetailsObjective"
        );

    const agent =
        document.getElementById(
            "taskDetailsAgent"
        );

    const stateElement =
        document.getElementById(
            "taskDetailsState"
        );

    const status =
        document.getElementById(
            "taskDetailsStatus"
        );

    const steps =
        document.getElementById(
            "taskDetailsSteps"
        );

    const output =
        document.getElementById(
            "taskDetailsOutput"
        );

    const created =
        document.getElementById(
            "taskDetailsCreated"
        );

    const completed =
        document.getElementById(
            "taskDetailsCompleted"
        );


    if (objective) {
        objective.textContent =
            task.objective;
    }

    if (agent) {
        agent.textContent =
            task.agentName;
    }

    if (stateElement) {
        stateElement.textContent =
            task.status.toUpperCase();
    }

    if (status) {
        status.textContent =
            `${task.progress}% complete`;
    }


    if (steps) {

        steps.innerHTML =
            task.steps
                .map(step => `

                    <div
                        class="
                            task-detail-step
                            ${
                                step.status ===
                                "completed"
                                    ? "completed"
                                    : "pending"
                            }
                        "
                    >

                        <div
                            class="task-detail-step-icon"
                        >
                            ${
                                step.status ===
                                "completed"
                                    ? "✓"
                                    : "•"
                            }
                        </div>

                        <span>
                            ${escapeHTML(
                                step.name
                            )}
                        </span>

                    </div>

                `)
                .join("");
    }


    if (output) {
        output.textContent =
            task.output ||
            "No output generated yet.";
    }


    if (created) {
        created.textContent =
            task.createdAt
                ? new Date(
                    task.createdAt
                ).toLocaleString()
                : "—";
    }


    if (completed) {
        completed.textContent =
            task.completedAt
                ? new Date(
                    task.completedAt
                ).toLocaleString()
                : "—";
    }


    modal.dataset.taskId =
        task.id;

    modal.classList.remove("hidden");
    modal.classList.add("active");
}


function closeTaskDetails() {

    const modal =
        document.getElementById(
            "taskDetailsModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
    modal.classList.remove("active");
}


function retryTask() {

    const modal =
        document.getElementById(
            "taskDetailsModal"
        );

    if (!modal) {
        return;
    }

    const taskId =
        modal.dataset.taskId;

    if (!taskId) {
        return;
    }

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }


    /*
     * Reset the task so it can
     * actually execute again.
     */

    task.status = "queued";

    task.progress = 0;

    task.startedAt = null;

    task.completedAt = null;

    task.cancelledAt = null;

    task.output = "";


    task.steps.forEach(
        step => {
            step.status = "pending";
        }
    );


    saveState();

    addActivity(
        `Retried task: ${task.objective}`
    );

    closeTaskDetails();

    renderAll();

    startTask(task.id);
}

function deleteTask() {

    const modal =
        document.getElementById(
            "taskDetailsModal"
        );

    if (!modal) {
        return;
    }

    const taskId =
        modal.dataset.taskId;

    if (!taskId) {
        return;
    }

    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    if (
        !confirm(
            "Delete this task?"
        )
    ) {
        return;
    }

    state.tasks =
        state.tasks.filter(
            item => item.id !== taskId
        );

    saveState();

    addActivity(
        `Deleted task: ${task.objective}`
    );

    closeTaskDetails();

    renderAll();
}


/* ================================
   ACTIVITY
   ================================ */

function renderActivity() {

    const container =
        document.getElementById(
            "activityContainer"
        );

    if (!container) {
        return;
    }

    if (!state.activity.length) {

        container.innerHTML = `

            <div class="empty-state compact">

                <div class="empty-icon">
                    •
                </div>

                <strong>
                    No activity yet
                </strong>

                <span>
                    Nexus activity will appear here.
                </span>

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.activity
            .slice(0, 10)
            .map(item => `

                <div class="activity-item">

                    <span class="activity-dot">
                    </span>

                    <div>

                        <strong>
                            ${escapeHTML(
                                item.message
                            )}
                        </strong>

                        <span>
                            ${new Date(
                                item.timestamp
                            ).toLocaleString()}
                        </span>

                    </div>

                </div>

            `)
            .join("");
}


/* ================================
   COMMANDS
   ================================ */

function executeCommand() {

    const input =
        document.getElementById(
            "commandInput"
        );

    if (!input) {
        return;
    }

    const objective =
        input.value.trim();

    if (!objective) {
        alert(
            "Enter an objective for Nexus."
        );
        return;
    }

    input.value = "";

    createTask(objective);
}


function handleQuickAction(action) {

    switch (action) {

        case "agent":
            openAgentModal();
            break;

        case "project":
            showView("projectsView");
            break;

        case "task":
            showView("tasksView");
            break;

        case "chat":
            alert(
                "Chat engine will be connected in a later phase."
            );
            break;

        default:
            break;
    }
}


/* ================================
   RENDER
   ================================ */

function renderAll() {

    renderAgents();
    renderTasks();
    renderActivity();
    renderModels();
}


/* ================================
   EVENTS
   ================================ */

function initializeEvents() {

const testWebGPUButton =
    document.getElementById(
        "testWebGPUButton"
    );

if (testWebGPUButton) {

    testWebGPUButton.addEventListener(
        "click",
        testWebGPU
    );

}

const testModelButton =
    document.getElementById(
        "testModelButton"
    );

if (testModelButton) {

    testModelButton.addEventListener(
        "click",
        testActiveModel
    );

}

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const view =
                        item.dataset.view;

                    if (view) {
                        showView(view);
                    }

                }
            );

document.addEventListener(
    "click",
    event => {

        const card =
            event.target.closest(
                ".task-card[data-task-id]"
            );

        if (!card) {
            return;
        }

        const taskId =
            card.dataset.taskId;

        openTaskDetails(taskId);
    }
);
        });


    const executeButton =
        document.getElementById(
            "executeCommand"
        );

    if (executeButton) {

        executeButton.addEventListener(
            "click",
            executeCommand
        );

    }


    const commandInput =
        document.getElementById(
            "commandInput"
        );

    if (commandInput) {

        commandInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    executeCommand();

                }

            }
        );

    }


    document
        .querySelectorAll(".action-card")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    handleQuickAction(
                        button.dataset.action
                    );

                }
            );

        });


    const createAgentButton =
        document.getElementById(
            "createAgentButton"
        );

    if (createAgentButton) {

        createAgentButton.addEventListener(
            "click",
            openAgentModal
        );

    }


    const closeAgentButton =
        document.getElementById(
            "closeAgentModal"
        );

    if (closeAgentButton) {

        closeAgentButton.addEventListener(
            "click",
            closeAgentModal
        );

    }


    const saveAgentButton =
        document.getElementById(
            "saveAgent"
        );

    if (saveAgentButton) {

        saveAgentButton.addEventListener(
            "click",
            saveAgent
        );

    }


    const agentModal =
        document.getElementById(
            "agentModal"
        );

    if (agentModal) {

        agentModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === agentModal
                ) {

                    closeAgentModal();

                }

            }
        );

    }


    const closeTaskDetailsButton =
        document.getElementById(
            "closeTaskDetails"
        );

    if (closeTaskDetailsButton) {

        closeTaskDetailsButton.addEventListener(
            "click",
            closeTaskDetails
        );

    }


    const retryTaskButton =
        document.getElementById(
            "retryTaskButton"
        );

    if (retryTaskButton) {

        retryTaskButton.addEventListener(
            "click",
            retryTask
        );

    }


    const deleteTaskButton =
        document.getElementById(
            "deleteTaskButton"
        );

    if (deleteTaskButton) {

        deleteTaskButton.addEventListener(
            "click",
            deleteTask
        );

    }


    const taskDetailsModal =
        document.getElementById(
            "taskDetailsModal"
        );

    if (taskDetailsModal) {

        taskDetailsModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    taskDetailsModal
                ) {

                    closeTaskDetails();

                }

            }
        );

    }
}


/* ================================
   START
   ================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeEvents();

        renderAll();

    }
);