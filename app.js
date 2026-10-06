const STORAGE_KEY = "nexus_state_v2";

let webLLMEngine = null;
let webLLM = null;
let webLLMLoading = false;

const DEFAULT_MODELS = [
    {
        id: "local-free",
        name: "Local AI",
        type: "local",
        provider: "WebLLM",
        status: "available",
        description: "Local AI running directly on this device using WebGPU."
    }
];

const defaultState = {
    models: DEFAULT_MODELS,
    activeModelId: null,

    agents: [
        {
            id: "general",
            name: "General",
            description: "General-purpose personal AI assistant.",
            instructions: "You are Nexus, a helpful personal AI assistant.",
            personality: "Professional, helpful, concise.",
            permissions: {
                files: true,
                web: false,
                tools: false
            }
        },
        {
            id: "researcher",
            name: "Researcher",
            description: "Research and analyze information.",
            instructions: "You are a research-focused AI assistant. Analyze information carefully and present useful findings.",
            personality: "Analytical and thorough.",
            permissions: {
                files: true,
                web: false,
                tools: false
            }
        },
        {
            id: "coder",
            name: "Coder",
            description: "Programming and software development assistant.",
            instructions: "You are an expert programming assistant. Write, explain, debug, and improve code.",
            personality: "Technical, precise, and practical.",
            permissions: {
                files: true,
                web: false,
                tools: true
            }
        },
        {
            id: "writer",
            name: "Writer",
            description: "Writing and content creation assistant.",
            instructions: "You are an expert writing assistant. Help create, rewrite, organize, and improve written content.",
            personality: "Creative, polished, and clear.",
            permissions: {
                files: true,
                web: false,
                tools: false
            }
        },
        {
            id: "analyst",
            name: "Analyst",
            description: "Analyze information and identify patterns.",
            instructions: "You are an analytical AI assistant. Break complex information into clear conclusions and useful insights.",
            personality: "Logical and evidence-focused.",
            permissions: {
                files: true,
                web: false,
                tools: false
            }
        },
        {
            id: "manager",
            name: "Manager",
            description: "Coordinate objectives and tasks.",
            instructions: "You are a task-management AI. Break objectives into manageable steps and coordinate execution.",
            personality: "Organized and decisive.",
            permissions: {
                files: true,
                web: false,
                tools: true
            }
        }
    ],

    projects: [],

    tasks: [],

    activity: [],

    chatHistory: [],

    settings: {
        theme: "dark"
    }
};


function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultState);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultState),
            ...parsed,
            models: parsed.models || structuredClone(DEFAULT_MODELS),
            agents: parsed.agents || structuredClone(defaultState.agents),
            projects: parsed.projects || [],
            tasks: parsed.tasks || [],
            activity: parsed.activity || [],
            chatHistory: parsed.chatHistory || [],
            settings: {
                ...defaultState.settings,
                ...(parsed.settings || {})
            }
        };
    } catch (error) {
        console.error("Could not load Nexus state:", error);
        return structuredClone(defaultState);
    }
}


let state = loadState();


function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Could not save Nexus state:", error);
    }
}


function generateId(prefix = "id") {
    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).substring(2, 8)
    );
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function addActivity(message, type = "info") {
    state.activity.unshift({
        id: generateId("activity"),
        message,
        type,
        createdAt: new Date().toISOString()
    });

    state.activity = state.activity.slice(0, 50);

    saveState();
    renderActivity();
}


function showView(viewId) {
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    const target = document.getElementById(viewId);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.view === viewId
        );
    });
}


/* =========================================================
   MODELS
========================================================= */

function renderModels() {
    const container = document.getElementById("modelsContainer");

    if (!container) return;

    const models = state.models || [];

    if (models.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">AI</div>
                <strong>No models available</strong>
                <span>No AI models have been configured.</span>
            </div>
        `;

        return;
    }

    container.innerHTML = models
        .map(model => {
            const active =
                state.activeModelId === model.id;

            return `
                <div class="agent-card">
                    <div class="agent-card-top">
                        <div>
                            <strong>${escapeHTML(model.name)}</strong>
                            <div class="muted">
                                ${escapeHTML(model.provider || "Local")}
                            </div>
                        </div>

                        <span class="status-badge">
                            ${active ? "ACTIVE" : "AVAILABLE"}
                        </span>
                    </div>

                    <p>
                        ${escapeHTML(model.description || "")}
                    </p>

                    <button
                        class="${active ? "secondary-button" : "primary-button"}"
                        type="button"
                        data-model-id="${escapeHTML(model.id)}"
                    >
                        ${active ? "Selected" : "Select Model"}
                    </button>
                </div>
            `;
        })
        .join("");

    container.querySelectorAll("[data-model-id]").forEach(button => {
        button.addEventListener("click", () => {
            selectModel(button.dataset.modelId);
        });
    });

    const activeModel = models.find(
        model => model.id === state.activeModelId
    );

    const name = document.getElementById("activeModelName");
    const type = document.getElementById("activeModelType");

    if (activeModel) {
        if (name) {
            name.textContent = activeModel.name;
        }

        if (type) {
            type.textContent =
                activeModel.type === "local"
                    ? "Local • WebLLM • WebGPU"
                    : activeModel.type;
        }
    } else {
        if (name) {
            name.textContent = "No model selected";
        }

        if (type) {
            type.textContent = "Select a model below";
        }
    }
}


function selectModel(modelId) {
    const model = state.models.find(
        item => item.id === modelId
    );

    if (!model) return;

    state.activeModelId = modelId;

    saveState();
    renderModels();

    addActivity(
        `Selected model: ${model.name}`,
        "model"
    );
}


/* =========================================================
   WEBGPU
========================================================= */

async function testWebGPU() {
    const status = document.getElementById("webgpuStatus");

    if (!status) return;

    status.textContent = "Testing WebGPU...";

    try {
        if (!navigator.gpu) {
            status.textContent =
                "WebGPU is not available on this device/browser.";
            return;
        }

        const adapter =
            await navigator.gpu.requestAdapter();

        if (!adapter) {
            status.textContent =
                "WebGPU is available but no GPU adapter was found.";
            return;
        }

        status.textContent = "WebGPU is ready.";

        addActivity(
            "WebGPU hardware test passed.",
            "system"
        );

    } catch (error) {
        console.error(error);

        status.textContent =
            "WebGPU test failed: " + error.message;
    }
}


/* =========================================================
   LOCAL AI
========================================================= */

async function loadLocalModel() {
    if (webLLMEngine) {
        addActivity(
            "Local AI model is already loaded.",
            "model"
        );

        return;
    }

    if (webLLMLoading) {
        return;
    }

    const status =
        document.getElementById("webgpuStatus");

    webLLMLoading = true;

    if (status) {
        status.textContent =
            "Loading Local AI library...";
    }

    try {
        webLLM = await import(
            "https://esm.run/@mlc-ai/web-llm"
        );

        if (status) {
            status.textContent =
                "Downloading/loading local AI model...";
        }

        const modelId =
            "Llama-3.2-1B-Instruct-q4f16_1-MLC";

        webLLMEngine =
            await webLLM.CreateMLCEngine(
                modelId,
                {
                    initProgressCallback:
                        progress => {
                            if (status) {
                                status.textContent =
                                    progress.text ||
                                    "Loading local model...";
                            }
                        }
                }
            );

        state.activeModelId = "local-free";

        saveState();
        renderModels();

        const activeModelName =
            document.getElementById(
                "activeModelName"
            );

        const activeModelType =
            document.getElementById(
                "activeModelType"
            );

        if (activeModelName) {
            activeModelName.textContent =
                "Local AI";
        }

        if (activeModelType) {
            activeModelType.textContent =
                "Local • WebLLM • WebGPU";
        }

        if (status) {
            status.textContent =
                "Local AI model is ready.";
        }

        addActivity(
            "Local AI model loaded successfully.",
            "model"
        );

    } catch (error) {
        console.error(
            "Local model loading error:",
            error
        );

        if (status) {
            status.textContent =
                "Model loading failed: " +
                error.message;
        }

        alert(
            "Nexus could not load the local AI model.\n\n" +
            error.message
        );

    } finally {
        webLLMLoading = false;
    }
}


/* =========================================================
   AI GATEWAY
========================================================= */

async function generateAIResponse(prompt, agent = null) {
    const activeModel =
        state.models.find(
            model => model.id === state.activeModelId
        );

    if (!activeModel) {
        throw new Error(
            "No AI model selected."
        );
    }

    if (activeModel.type === "local") {
        if (!webLLMEngine) {
            throw new Error(
                "Load the local AI model first."
            );
        }

        const systemPrompt =
            agent?.instructions ||
            "You are Nexus, a personal AI assistant.";

        const response =
            await webLLMEngine.chat.completions.create(
                {
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 256
                }
            );

        return (
            response?.choices?.[0]?.message?.content ||
            "The model returned no response."
        );
    }

    throw new Error(
        "This model provider is not configured."
    );
}


/* =========================================================
   MODEL TEST
========================================================= */

async function testActiveModel() {
    const input =
        document.getElementById(
            "modelTestInput"
        );

    const output =
        document.getElementById(
            "modelTestOutput"
        );

    if (!input || !output) return;

    const prompt = input.value.trim();

    if (!prompt) {
        output.textContent =
            "Enter a test prompt first.";

        return;
    }

    output.textContent =
        "Nexus is thinking...";

    try {
        const response =
            await generateAIResponse(prompt);

        output.textContent = response;

    } catch (error) {
        console.error(error);

        output.textContent =
            "Error: " + error.message;
    }
}


/* =========================================================
   AGENTS
========================================================= */

function renderAgents() {
    const dashboard =
        document.getElementById(
            "agentsContainer"
        );

    const full =
        document.getElementById(
            "fullAgentsContainer"
        );

    const html =
        state.agents
            .map(agent => `
                <div class="agent-card">
                    <div class="agent-card-top">
                        <div>
                            <strong>
                                ${escapeHTML(agent.name)}
                            </strong>

                            <div class="muted">
                                ${escapeHTML(agent.personality || "")}
                            </div>
                        </div>

                        <span class="status-badge">
                            READY
                        </span>
                    </div>

                    <p>
                        ${escapeHTML(agent.description || "")}
                    </p>

                    <div class="agent-permissions">
                        ${agent.permissions?.files ? "Files " : ""}
                        ${agent.permissions?.web ? "Web " : ""}
                        ${agent.permissions?.tools ? "Tools" : ""}
                    </div>
                </div>
            `)
            .join("");

    if (dashboard) {
        dashboard.innerHTML =
            html ||
            `
                <div class="empty-state">
                    <strong>No agents</strong>
                </div>
            `;
    }

    if (full) {
        full.innerHTML =
            html ||
            `
                <div class="empty-state">
                    <strong>No agents</strong>
                </div>
            `;
    }
}


function openAgentModal() {
    const modal =
        document.getElementById(
            "agentModal"
        );

    if (modal) {
        modal.classList.remove("hidden");
    }
}


function closeAgentModal() {
    const modal =
        document.getElementById(
            "agentModal"
        );

    if (modal) {
        modal.classList.add("hidden");
    }
}


function saveAgent() {
    const name =
        document.getElementById(
            "agentName"
        )?.value.trim();

    const description =
        document.getElementById(
            "agentDescription"
        )?.value.trim();

    const instructions =
        document.getElementById(
            "agentInstructions"
        )?.value.trim();

    const personality =
        document.getElementById(
            "agentPersonality"
        )?.value.trim();

    if (!name) {
        alert("Agent name is required.");
        return;
    }

    const agent = {
        id: generateId("agent"),
        name,
        description,
        instructions:
            instructions ||
            "You are a helpful AI assistant.",
        personality:
            personality ||
            "Professional and helpful.",
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
        }
    };

    state.agents.push(agent);

    saveState();
    renderAgents();
    closeAgentModal();

    addActivity(
        `Created agent: ${agent.name}`,
        "agent"
    );

    const fields = [
        "agentName",
        "agentDescription",
        "agentInstructions",
        "agentPersonality"
    ];

    fields.forEach(id => {
        const element =
            document.getElementById(id);

        if (element) {
            element.value = "";
        }
    });
}


/* =========================================================
   TASK ENGINE
========================================================= */

function createTask(objective, agentId = "general") {
    const agent =
        state.agents.find(
            item => item.id === agentId
        ) ||
        state.agents[0];

    const task = {
        id: generateId("task"),

        objective,

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
                completed: false
            },
            {
                name: "Create execution plan",
                completed: false
            },
            {
                name: "Execute work",
                completed: false
            },
            {
                name: "Evaluate result",
                completed: false
            }
        ]
    };

    state.tasks.unshift(task);

    saveState();

    addActivity(
        `Created task: ${objective}`,
        "task"
    );

    renderTasks();

    startTask(task.id);

    return task;
}


function startTask(taskId) {
    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    task.status = "running";

    task.startedAt =
        task.startedAt ||
        new Date().toISOString();

    task.progress = 10;

    task.steps[0].completed = true;

    saveState();
    renderTasks();

    advanceTask(task.id);
}


function advanceTask(taskId) {
    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task || task.status !== "running") {
        return;
    }

    const nextIndex =
        task.steps.findIndex(
            step => !step.completed
        );

    if (nextIndex === -1) {
        completeTask(task.id);
        return;
    }

    setTimeout(() => {
        const current =
            state.tasks.find(
                item => item.id === taskId
            );

        if (
            !current ||
            current.status !== "running"
        ) {
            return;
        }

        current.steps[nextIndex].completed =
            true;

        current.progress =
            Math.min(
                100,
                Math.round(
                    ((nextIndex + 2) /
                        current.steps.length) *
                        100
                )
            );

        saveState();
        renderTasks();

        advanceTask(taskId);
    }, 1000);
}


function completeTask(taskId) {
    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    task.status = "completed";
    task.progress = 100;

    task.completedAt =
        new Date().toISOString();

    task.steps.forEach(
        step => {
            step.completed = true;
        }
    );

    task.output =
        `Nexus completed the objective:\n\n${task.objective}`;

    saveState();
    renderTasks();

    addActivity(
        `Completed task: ${task.objective}`,
        "success"
    );
}


function retryTask(taskId) {
    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    task.status = "queued";
    task.progress = 0;
    task.startedAt = null;
    task.completedAt = null;
    task.cancelledAt = null;
    task.output = "";

    task.steps.forEach(
        step => {
            step.completed = false;
        }
    );

    saveState();

    closeTaskDetails();
    renderTasks();

    addActivity(
        `Retrying task: ${task.objective}`,
        "task"
    );

    startTask(task.id);
}


function deleteTask(taskId) {
    const index =
        state.tasks.findIndex(
            task => task.id === taskId
        );

    if (index === -1) return;

    const task =
        state.tasks[index];

    state.tasks.splice(index, 1);

    saveState();

    closeTaskDetails();
    renderTasks();

    addActivity(
        `Deleted task: ${task.objective}`,
        "task"
    );
}


/* =========================================================
   TASK DISPLAY
========================================================= */

function renderTasks() {
    const running =
        document.getElementById(
            "fullTasksContainer"
        );

    const completed =
        document.getElementById(
            "completedTasksContainer"
        );

    const runningTasks =
        state.tasks.filter(
            task =>
                task.status === "queued" ||
                task.status === "running"
        );

    const completedTasks =
        state.tasks.filter(
            task =>
                task.status === "completed" ||
                task.status === "cancelled"
        );

    if (running) {
        running.innerHTML =
            runningTasks.length
                ? runningTasks
                      .map(renderTaskCard)
                      .join("")
                : `
                    <div class="empty-state">
                        <div class="empty-icon">✓</div>
                        <strong>No active tasks</strong>
                        <span>
                            Tasks will appear here when Nexus is working.
                        </span>
                    </div>
                `;
    }

    if (completed) {
        completed.innerHTML =
            completedTasks.length
                ? completedTasks
                      .map(renderTaskCard)
                      .join("")
                : `
                    <div class="empty-state">
                        <div class="empty-icon">✓</div>
                        <strong>No completed tasks</strong>
                        <span>
                            Completed objectives will appear here.
                        </span>
                    </div>
                `;
    }
}


function renderTaskCard(task) {
    return `
        <div
            class="task-card"
            data-task-id="${escapeHTML(task.id)}"
        >
            <div class="task-card-top">
                <strong>
                    ${escapeHTML(task.objective)}
                </strong>

                <span class="status-badge">
                    ${escapeHTML(task.status.toUpperCase())}
                </span>
            </div>

            <div class="muted">
                Agent: ${escapeHTML(task.agentName)}
            </div>

            <div class="task-progress">
                <div
                    class="task-progress-bar"
                    style="width:${task.progress}%"
                ></div>
            </div>

            <div class="muted">
                ${task.progress}% complete
            </div>
        </div>
    `;
}


/* =========================================================
   TASK DETAILS
========================================================= */

function openTaskDetails(taskId) {
    const task =
        state.tasks.find(
            item => item.id === taskId
        );

    if (!task) return;

    const modal =
        document.getElementById(
            "taskDetailsModal"
        );

    if (!modal) return;

    const status =
        document.getElementById(
            "taskDetailsStatus"
        );

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

    const retry =
        document.getElementById(
            "retryTaskButton"
        );

    const deleteButton =
        document.getElementById(
            "deleteTaskButton"
        );

    if (status) {
        status.textContent =
            task.status.toUpperCase();
    }

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
            `${task.status} — ${task.progress}%`;
    }

    if (steps) {
        steps.innerHTML =
            task.steps
                .map(step => `
                    <div class="task-detail-step ${
                        step.completed
                            ? "completed"
                            : "pending"
                    }">
                        <div class="task-detail-step-icon">
                            ${
                                step.completed
                                    ? "✓"
                                    : "•"
                            }
                        </div>

                        <span>
                            ${escapeHTML(step.name)}
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
            new Date(
                task.createdAt
            ).toLocaleString();
    }

    if (completed) {
        completed.textContent =
            task.completedAt
                ? new Date(
                      task.completedAt
                  ).toLocaleString()
                : "—";
    }

    if (retry) {
        retry.onclick = () =>
            retryTask(task.id);
    }

    if (deleteButton) {
        deleteButton.onclick = () =>
            deleteTask(task.id);
    }

    modal.classList.remove("hidden");
}


function closeTaskDetails() {
    const modal =
        document.getElementById(
            "taskDetailsModal"
        );

    if (modal) {
        modal.classList.add("hidden");
    }
}


/* =========================================================
   ACTIVITY
========================================================= */

function renderActivity() {
    const container =
        document.getElementById(
            "activityContainer"
        );

    if (!container) return;

    if (!state.activity.length) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>No recent activity</strong>
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
                    <div>
                        ${escapeHTML(item.message)}
                    </div>

                    <span class="muted">
                        ${new Date(
                            item.createdAt
                        ).toLocaleTimeString()}
                    </span>
                </div>
            `)
            .join("");
}


/* =========================================================
   CHAT
========================================================= */

function getChatHistory() {
    if (!Array.isArray(state.chatHistory)) {
        state.chatHistory = [];
    }

    return state.chatHistory;
}


function saveChatHistory() {
    saveState();
}


function formatChatMessage(text) {
    if (!text) return "";

    let html = escapeHTML(text);

    /*
     * Protect code blocks before applying
     * other Markdown formatting.
     */

    const codeBlocks = [];

    html = html.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        (match, language, code) => {
            const placeholder =
                `___NEXUS_CODE_${codeBlocks.length}___`;

            codeBlocks.push(`
                <pre class="code-block"><code>${code.trim()}</code></pre>
            `);

            return placeholder;
        }
    );

    // Headings
    html = html.replace(
        /^### (.*)$/gm,
        "<h4>$1</h4>"
    );

    html = html.replace(
        /^## (.*)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^# (.*)$/gm,
        "<h2>$1</h2>"
    );

    // Bold
    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Inline code
    html = html.replace(
        /`([^`]+)`/g,
        '<code class="inline-code">$1</code>'
    );

    // Simple bullet lists
    html = html.replace(
        /^(?:[-*+] .+(?:\n|$))+?/gm,
        match => {
            const items = match
                .trim()
                .split("\n")
                .map(line =>
                    line.replace(
                        /^[-*+] (.+)$/,
                        "<li>$1</li>"
                    )
                )
                .join("");

            return `<ul>${items}</ul>`;
        }
    );

    // Ordered lists
    html = html.replace(
        /^(?:\d+\. .+(?:\n|$))+?/gm,
        match => {
            const items = match
                .trim()
                .split("\n")
                .map(line =>
                    line.replace(
                        /^\d+\. (.+)$/,
                        "<li>$1</li>"
                    )
                )
                .join("");

            return `<ol>${items}</ol>`;
        }
    );

    // Italic
    html = html.replace(
        /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
        "<em>$1</em>"
    );

    // Restore code blocks
    codeBlocks.forEach(
        (block, index) => {
            html = html.replace(
                `___NEXUS_CODE_${index}___`,
                block
            );
        }
    );

    html = html.replace(
        /\n/g,
        "<br>"
    );

    return html;
}


function renderChat() {
    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) return;

    const history =
        getChatHistory();

    if (!history.length) {
        container.innerHTML = `
            <div class="chat-empty">
                <div class="empty-icon">AI</div>
                <strong>Nexus is ready</strong>
                <span>
                    Start a conversation with your local AI.
                </span>
            </div>
        `;

        return;
    }

    container.innerHTML =
        history
            .map(message => {
                const label =
                    message.role === "user"
                        ? "YOU"
                        : "NEXUS";

                return `
                    <div class="chat-message ${message.role}-message">
                        <div class="chat-message-label">
                            ${label}
                        </div>

                        <div class="chat-message-content">
                            ${formatChatMessage(
                                message.content
                            )}
                        </div>
                    </div>
                `;
            })
            .join("");

    container.scrollTop =
        container.scrollHeight;
}


async function sendChatMessage() {
    const input =
        document.getElementById(
            "chatInput"
        );

    if (!input) return;

    const text =
        input.value.trim();

    if (!text) return;

    if (!webLLMEngine) {
        alert(
            "Load the Local AI model first."
        );

        return;
    }

    const history =
        getChatHistory();

    history.push({
        role: "user",
        content: text
    });

    input.value = "";

    const assistantMessage = {
        role: "assistant",
        content: ""
    };

    history.push(
        assistantMessage
    );

    saveChatHistory();
    renderChat();

    try {
        const messages =
            history
                .filter(message =>
                    message.content
                )
                .map(message => ({
                    role: message.role,
                    content: message.content
                }));

        const stream =
            await webLLMEngine
                .chat
                .completions
                .create({
                    messages,
                    temperature: 0.7,
                    max_tokens: 512,
                    stream: true
                });

        const container =
            document.getElementById(
                "chatMessages"
            );

        let messageElement = null;

        if (container) {
            const elements =
                container.querySelectorAll(
                    ".assistant-message"
                );

            messageElement =
                elements[
                    elements.length - 1
                ];
        }

        const contentElement =
            messageElement
                ? messageElement.querySelector(
                      ".chat-message-content"
                  )
                : null;

        for await (
            const chunk of stream
        ) {
            const token =
                chunk?.choices?.[0]?.delta?.content;

            if (!token) continue;

            assistantMessage.content +=
                token;

            /*
             * Update only the existing
             * message during streaming.
             *
             * This prevents Nexus from
             * rebuilding the entire chat
             * after every token.
             */

            if (contentElement) {
                contentElement.textContent =
                    assistantMessage.content;
            }

            if (container) {
                container.scrollTop =
                    container.scrollHeight;
            }
        }

        saveChatHistory();

        /*
         * Apply Markdown once the
         * response is complete.
         */

        renderChat();

    } catch (error) {
        console.error(
            "Nexus chat error:",
            error
        );

        assistantMessage.content =
            "Nexus encountered an error while generating the response.\n\n" +
            error.message;

        saveChatHistory();
        renderChat();
    }
}


function newChat() {
    const confirmed =
        state.chatHistory.length === 0 ||
        confirm(
            "Start a new chat? Your current conversation will be cleared."
        );

    if (!confirmed) return;

    state.chatHistory = [];

    saveChatHistory();
    renderChat();

    addActivity(
        "Started a new chat.",
        "chat"
    );
}


/* =========================================================
   COMMAND CENTER
========================================================= */

async function executeCommand() {
    const input =
        document.getElementById(
            "commandInput"
        );

    if (!input) return;

    const objective =
        input.value.trim();

    if (!objective) return;

    input.value = "";

    createTask(
        objective,
        "general"
    );

    addActivity(
        `Command received: ${objective}`,
        "command"
    );
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {
    renderAgents();
    renderTasks();
    renderActivity();
    renderModels();
    renderChat();
}


/* =========================================================
   EVENT INITIALIZATION
========================================================= */

function initializeEvents() {

    /*
     * Navigation
     */

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const view =
                        button.dataset.view;

                    if (view) {
                        showView(view);
                    }
                }
            );
        });


    /*
     * Create Agent
     */

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


    const closeAgent =
        document.getElementById(
            "closeAgentModal"
        );

    if (closeAgent) {
        closeAgent.addEventListener(
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


    /*
     * Task details
     */

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


    /*
     * Task cards
     *
     * Delegated listener means
     * dynamically-created cards work.
     */

    document.addEventListener(
        "click",
        event => {
            const card =
                event.target.closest(
                    ".task-card[data-task-id]"
                );

            if (!card) return;

            openTaskDetails(
                card.dataset.taskId
            );
        }
    );


    /*
     * Command execution
     */

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


    /*
     * WebGPU
     */

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


    /*
     * Local model loading
     *
     * If your Models page currently
     * uses a different button ID,
     * this safely does nothing.
     */

    const loadButton = document.getElementById("loadModelButton");

    if (loadModelButton) {
        loadModelButton.addEventListener(
            "click",
            loadLocalModel
        );
    }


    /*
     * Model test
     */

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


    /*
     * Chat
     */

    const sendChatButton =
        document.getElementById(
            "sendChatButton"
        );

    if (sendChatButton) {
        sendChatButton.addEventListener(
            "click",
            sendChatMessage
        );
    }


    const chatInput =
        document.getElementById(
            "chatInput"
        );

    if (chatInput) {
        chatInput.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();
                    sendChatMessage();
                }
            }
        );
    }


    const newChatButton =
        document.getElementById(
            "newChatButton"
        );

    if (newChatButton) {
        newChatButton.addEventListener(
            "click",
            newChat
        );
    }


    /*
     * Quick action cards
     */

    document
        .querySelectorAll(".action-card")
        .forEach(card => {
            card.addEventListener(
                "click",
                () => {
                    const action =
                        card.dataset.action;

                    if (action === "agent") {
                        openAgentModal();
                    }

                    if (action === "project") {
                        showView(
                            "projectsView"
                        );
                    }

                    if (action === "task") {
                        const command =
                            document.getElementById(
                                "commandInput"
                            );

                        if (command) {
                            command.focus();
                        }
                    }

                    if (action === "chat") {
                        showView(
                            "chatView"
                        );
                    }
                }
            );
        });
}


/* =========================================================
   START NEXUS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        renderAll();
        initializeEvents();

        /*
         * Start on Dashboard.
         */

        showView("dashboardView");
    }
);