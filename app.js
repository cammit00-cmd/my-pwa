/* =========================================================
   NEXUS — Phase 1 Frontend Engine
   Local-first application state + navigation + agents + tasks
   ========================================================= */

const STORAGE_KEY = "nexus_state_v1";

const defaultState = {
    agents: [
        {
            id: "general",
            name: "General",
            description: "General-purpose AI assistant",
            personality: "Helpful, precise, adaptable",
            instructions: "Assist with general tasks and coordinate with other agents when appropriate.",
            permissions: {
                files: true,
                web: true,
                tools: true
            },
            createdAt: Date.now()
        },
        {
            id: "researcher",
            name: "Researcher",
            description: "Research, investigation, and information analysis",
            personality: "Thorough, skeptical, evidence-driven",
            instructions: "Research topics, compare sources, identify important information, and summarize findings.",
            permissions: {
                files: true,
                web: true,
                tools: true
            },
            createdAt: Date.now()
        },
        {
            id: "coder",
            name: "Coder",
            description: "Software development and technical problem solving",
            personality: "Logical, methodical, solution-focused",
            instructions: "Write, debug, explain, and improve software.",
            permissions: {
                files: true,
                web: true,
                tools: true
            },
            createdAt: Date.now()
        },
        {
            id: "writer",
            name: "Writer",
            description: "Writing, editing, and content creation",
            personality: "Clear, creative, adaptable",
            instructions: "Create and improve written content according to the user's goals.",
            permissions: {
                files: true,
                web: false,
                tools: false
            },
            createdAt: Date.now()
        },
        {
            id: "analyst",
            name: "Analyst",
            description: "Data analysis and structured reasoning",
            personality: "Objective, analytical, detail-oriented",
            instructions: "Analyze information, identify patterns, and produce useful conclusions.",
            permissions: {
                files: true,
                web: true,
                tools: true
            },
            createdAt: Date.now()
        },
        {
            id: "manager",
            name: "Manager",
            description: "Task planning and multi-agent orchestration",
            personality: "Organized, strategic, decisive",
            instructions: "Break objectives into tasks and coordinate specialized agents.",
            permissions: {
                files: true,
                web: true,
                tools: true
            },
            createdAt: Date.now()
        }
    ],

    tasks: [],

    projects: [],

    activity: [],

    settings: {
        securityLevel: "LIMITED",
        autoApproveSafeActions: true,
        localFirst: true
    }
};


/* =========================================================
   STATE
   ========================================================= */

let state = loadState();

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            return {
                ...defaultState,
                ...JSON.parse(saved)
            };
        }
    } catch (error) {
        console.error("Could not load Nexus state:", error);
    }

    return structuredClone(defaultState);
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Could not save Nexus state:", error);
    }
}


/* =========================================================
   UTILITIES
   ========================================================= */

function createId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
}

function escapeHTML(value) {
    if (value === undefined || value === null) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}

function addActivity(message, type = "info") {
    state.activity.unshift({
        id: createId("activity"),
        message,
        type,
        timestamp: Date.now()
    });

    state.activity = state.activity.slice(0, 50);

    saveState();
    renderActivity();
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showView(viewName) {

    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    const target = document.getElementById(`${viewName}-view`);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll("[data-view]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.view === viewName
        );
    });

    renderCurrentView();
}

function renderCurrentView() {
    renderAgents();
    renderTasks();
    renderProjects();
    renderActivity();
}


/* =========================================================
   AGENTS
   ========================================================= */

function renderAgents() {

    const containers = document.querySelectorAll(".agent-list");

    containers.forEach(container => {

        if (!state.agents.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No agents yet</h3>
                    <p>Create your first AI agent to begin building Nexus.</p>
                    <button class="primary-btn" onclick="openAgentModal()">
                        Create Agent
                    </button>
                </div>
            `;

            return;
        }

        container.innerHTML = state.agents.map(agent => `
            <div class="agent-card">

                <div class="agent-avatar">
                    ${escapeHTML(agent.name.charAt(0).toUpperCase())}
                </div>

                <div class="agent-info">

                    <div class="agent-name">
                        ${escapeHTML(agent.name)}
                    </div>

                    <div class="agent-description">
                        ${escapeHTML(agent.description)}
                    </div>

                    <div class="agent-meta">
                        <span>LOCAL</span>
                        <span>${escapeHTML(agent.personality)}</span>
                    </div>

                </div>

            </div>
        `).join("");
    });
}


/* =========================================================
   TASKS
   ========================================================= */

function renderTasks() {

    const containers = document.querySelectorAll(".task-list");

    containers.forEach(container => {

        const activeTasks = state.tasks
            .filter(task =>
                task.status === "running" ||
                task.status === "queued"
            );

        if (!activeTasks.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No active tasks</h3>
                    <p>Nexus is standing by.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = activeTasks.map(task => `

            <div class="task-card">

                <div class="task-status">
                    <span class="status-dot"></span>
                </div>

                <div class="task-info">

                    <strong>
                        ${escapeHTML(task.objective)}
                    </strong>

                    <span>
                        ${escapeHTML(task.agentName)}
                    </span>

                </div>

                <div class="task-state">
                    ${escapeHTML(task.status)}
                </div>

            </div>

        `).join("");
    });
}


/* =========================================================
   PROJECTS
   ========================================================= */

function renderProjects() {

    const containers = document.querySelectorAll(".project-list");

    containers.forEach(container => {

        if (!state.projects.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Create a project when you're ready to organize agents, files, tasks, and memory.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = state.projects.map(project => `

            <div class="project-card">

                <div>
                    <strong>
                        ${escapeHTML(project.name)}
                    </strong>

                    <p>
                        ${escapeHTML(project.description || "No description")}
                    </p>
                </div>

            </div>

        `).join("");
    });
}


/* =========================================================
   ACTIVITY
   ========================================================= */

function renderActivity() {

    const containers = document.querySelectorAll(".activity-list");

    containers.forEach(container => {

        if (!state.activity.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No activity yet</h3>
                    <p>Your Nexus activity will appear here.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = state.activity
            .slice(0, 15)
            .map(item => `

                <div class="activity-item">

                    <div class="activity-indicator"></div>

                    <div class="activity-content">

                        <div>
                            ${escapeHTML(item.message)}
                        </div>

                        <small>
                            ${formatTime(item.timestamp)}
                        </small>

                    </div>

                </div>

            `)
            .join("");
    });
}


/* =========================================================
   COMMAND SYSTEM
   ========================================================= */

function executeCommand() {

    const input = document.getElementById("command-input");

    if (!input) return;

    const objective = input.value.trim();

    if (!objective) {
        input.focus();
        return;
    }

    const manager =
        state.agents.find(agent => agent.id === "manager") ||
        state.agents[0];

    const task = {
        id: createId("task"),
        objective,
        agentId: manager.id,
        agentName: manager.name,
        status: "queued",
        createdAt: Date.now()
    };

    state.tasks.unshift(task);

    saveState();

    addActivity(
        `New task created: ${objective}`,
        "task"
    );

    input.value = "";

    renderTasks();

    /*
       Phase 1 intentionally stops here.

       The task exists locally and is persistent.

       Later phases will replace this with:

       objective
          ↓
       manager
          ↓
       planning
          ↓
       agent selection
          ↓
       tool selection
          ↓
       tool execution
          ↓
       observation
          ↓
       evaluation
          ↓
       correction
          ↓
       completion
    */

    showView("tasks");
}


/* =========================================================
   AGENT CREATION
   ========================================================= */

function openAgentModal() {

    const modal = document.getElementById("agent-modal");

    if (!modal) return;

    modal.classList.add("active");

    const nameInput =
        document.getElementById("agent-name");

    if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
}

function closeAgentModal() {

    const modal = document.getElementById("agent-modal");

    if (!modal) return;

    modal.classList.remove("active");
}

function createAgent() {

    const name =
        document.getElementById("agent-name")?.value.trim();

    const description =
        document.getElementById("agent-description")?.value.trim();

    const instructions =
        document.getElementById("agent-instructions")?.value.trim();

    const personality =
        document.getElementById("agent-personality")?.value.trim();

    if (!name) {
        alert("Agent name is required.");
        return;
    }

    const agent = {
        id: createId("agent"),
        name,
        description: description || "Custom Nexus agent",
        instructions:
            instructions ||
            "Assist the user according to the assigned objective.",
        personality:
            personality ||
            "Professional, helpful, and adaptable",

        permissions: {
            files:
                document.getElementById("agent-files")?.checked ?? false,

            web:
                document.getElementById("agent-web")?.checked ?? false,

            tools:
                document.getElementById("agent-tools")?.checked ?? false
        },

        createdAt: Date.now()
    };

    state.agents.push(agent);

    saveState();

    addActivity(
        `Agent created: ${agent.name}`,
        "agent"
    );

    clearAgentForm();
    closeAgentModal();

    renderAgents();
}

function clearAgentForm() {

    [
        "agent-name",
        "agent-description",
        "agent-instructions",
        "agent-personality"
    ].forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.value = "";
        }
    });
}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function newProject() {

    const name = prompt("Project name:");

    if (!name) return;

    const project = {
        id: createId("project"),
        name: name.trim(),
        description: "",
        createdAt: Date.now()
    };

    state.projects.push(project);

    saveState();

    addActivity(
        `Project created: ${project.name}`,
        "project"
    );

    renderProjects();

    showView("projects");
}

function newTask() {

    const input = document.getElementById("command-input");

    if (input) {
        input.focus();
        showView("dashboard");
    }
}

function openChat() {

    const input = document.getElementById("command-input");

    if (input) {
        showView("dashboard");
        input.focus();
    }
}


/* =========================================================
   SETTINGS
   ========================================================= */

function toggleSetting(settingName) {

    if (!(settingName in state.settings)) return;

    state.settings[settingName] =
        !state.settings[settingName];

    saveState();

    addActivity(
        `Setting changed: ${settingName}`,
        "settings"
    );

    renderSettings();
}

function setSecurityLevel(level) {

    state.settings.securityLevel = level;

    saveState();

    addActivity(
        `Security level changed to ${level}`,
        "settings"
    );

    renderSettings();
}

function renderSettings() {

    const securityElement =
        document.getElementById("security-level");

    if (securityElement) {
        securityElement.value =
            state.settings.securityLevel;
    }

    const localFirst =
        document.getElementById("local-first");

    if (localFirst) {
        localFirst.checked =
            state.settings.localFirst;
    }

    const autoApprove =
        document.getElementById("auto-approve");

    if (autoApprove) {
        autoApprove.checked =
            state.settings.autoApproveSafeActions;
    }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* Navigation */

    document.querySelectorAll("[data-view]").forEach(button => {

        button.addEventListener("click", () => {

            showView(button.dataset.view);

        });

    });


    /* Command input */

    const commandInput =
        document.getElementById("command-input");

    if (commandInput) {

        commandInput.addEventListener("keydown", event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();
                executeCommand();
            }

        });

    }


    /* Modal close when tapping outside */

    const modal =
        document.getElementById("agent-modal");

    if (modal) {

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                closeAgentModal();
            }

        });

    }


    /* Initial rendering */

    renderCurrentView();
    renderSettings();

    addActivity(
        "Nexus initialized",
        "system"
    );
});


/* =========================================================
   SERVICE WORKER
   ========================================================= */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("Nexus service worker registered.");
            })
            .catch(error => {
                console.error(
                    "Service worker registration failed:",
                    error
                );
            });

    });

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.showView = showView;
window.executeCommand = executeCommand;

window.openAgentModal = openAgentModal;
window.closeAgentModal = closeAgentModal;
window.createAgent = createAgent;

window.newProject = newProject;
window.newTask = newTask;
window.openChat = openChat;

window.toggleSetting = toggleSetting;
window.setSecurityLevel = setSecurityLevel;
