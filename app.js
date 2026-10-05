/* =========================================================
   NEXUS — Phase 1 Frontend Engine
   Compatible with current Nexus HTML
   ========================================================= */

const STORAGE_KEY = "nexus_state_v1";


/* =========================================================
   DEFAULT STATE
   ========================================================= */

const defaultState = {
    agents: [
        {
            id: "general",
            name: "General",
            description: "General-purpose AI assistant",
            personality: "Helpful, precise, adaptable",
            instructions:
                "Assist with general tasks and coordinate with other agents when appropriate.",
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
            instructions:
                "Research topics, compare sources, identify important information, and summarize findings.",
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
            instructions:
                "Write, debug, explain, and improve software.",
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
            instructions:
                "Create and improve written content according to the user's goals.",
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
            instructions:
                "Analyze information, identify patterns, and produce useful conclusions.",
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
            instructions:
                "Break objectives into tasks and coordinate specialized agents.",
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

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (saved) {

            const parsed = JSON.parse(saved);

            return {
                ...defaultState,
                ...parsed
            };
        }

    } catch (error) {

        console.error(
            "Nexus state could not be loaded:",
            error
        );

    }

    return JSON.parse(
        JSON.stringify(defaultState)
    );
}


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


/* =========================================================
   UTILITIES
   ========================================================= */

function createId(prefix) {

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

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatTime(timestamp) {

    return new Date(timestamp)
        .toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
}


/* =========================================================
   ACTIVITY
   ========================================================= */

function addActivity(message) {

    state.activity.unshift({

        id: createId("activity"),

        message: message,

        timestamp: Date.now()

    });

    state.activity =
        state.activity.slice(0, 50);

    saveState();

    renderActivity();
}


function renderActivity() {

    const container =
        document.getElementById(
            "activityContainer"
        );

    if (!container) return;


    if (!state.activity.length) {

        container.innerHTML = `
            <div class="empty-state compact">
                <div class="empty-icon">◌</div>

                <strong>
                    No recent activity
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

                    <div class="activity-indicator"></div>

                    <div class="activity-content">

                        <strong>
                            ${escapeHTML(item.message)}
                        </strong>

                        <span>
                            Nexus
                        </span>

                    </div>

                    <time>
                        ${formatTime(item.timestamp)}
                    </time>

                </div>

            `)
            .join("");
}


/* =========================================================
   NAVIGATION
   ========================================================= */

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
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.view === viewId
            );

        });


    renderAll();
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


    if (dashboard) {

        dashboard.innerHTML =
            state.agents
                .map(agent => `

                    <div class="agent-card">

                        <div class="agent-avatar">
                            ${escapeHTML(
                                agent.name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div class="agent-info">

                            <div class="agent-name">
                                ${escapeHTML(agent.name)}
                            </div>

                            <div class="agent-description">
                                ${escapeHTML(
                                    agent.description
                                )}
                            </div>

                            <div class="agent-meta">
                                <span>LOCAL</span>
                                <span>
                                    ${escapeHTML(
                                        agent.personality
                                    )}
                                </span>
                            </div>

                        </div>

                    </div>

                `)
                .join("");

    }


    if (full) {

        full.innerHTML =
            state.agents
                .map(agent => `

                    <div class="agent-card">

                        <div class="agent-avatar">
                            ${escapeHTML(
                                agent.name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div class="agent-info">

                            <div class="agent-name">
                                ${escapeHTML(agent.name)}
                            </div>

                            <div class="agent-description">
                                ${escapeHTML(
                                    agent.description
                                )}
                            </div>

                            <div class="agent-meta">

                                <span>
                                    LOCAL
                                </span>

                                <span>
                                    ${escapeHTML(
                                        agent.personality
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>

                `)
                .join("");

    }
}


/* =========================================================
   AGENT MODAL
   ========================================================= */

function openAgentModal() {

    const modal =
        document.getElementById(
            "agentModal"
        );

    if (!modal) {

        console.error(
            "Nexus: agentModal not found."
        );

        return;
    }


    modal.classList.remove("hidden");


    const nameInput =
        document.getElementById(
            "agentName"
        );

    if (nameInput) {

        setTimeout(() => {

            nameInput.focus();

        }, 100);

    }
}


function closeAgentModal() {

    const modal =
        document.getElementById(
            "agentModal"
        );

    if (!modal) return;

    modal.classList.add("hidden");
}


function clearAgentForm() {

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


    [
        "permissionFiles",
        "permissionWeb",
        "permissionTools"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.checked = false;

        }

    });

}


function createAgent() {

    const name =
        document
            .getElementById("agentName")
            ?.value
            .trim();


    if (!name) {

        alert(
            "Please enter a name for your agent."
        );

        return;

    }


    const description =
        document
            .getElementById("agentDescription")
            ?.value
            .trim();


    const instructions =
        document
            .getElementById("agentInstructions")
            ?.value
            .trim();


    const personality =
        document
            .getElementById("agentPersonality")
            ?.value
            .trim();


    const agent = {

        id: createId("agent"),

        name: name,

        description:
            description ||
            "Custom Nexus AI worker",

        instructions:
            instructions ||
            "Assist the user according to the assigned objective.",

        personality:
            personality ||
            "Professional, helpful, adaptable",

        permissions: {

            files:
                document
                    .getElementById(
                        "permissionFiles"
                    )
                    ?.checked || false,

            web:
                document
                    .getElementById(
                        "permissionWeb"
                    )
                    ?.checked || false,

            tools:
                document
                    .getElementById(
                        "permissionTools"
                    )
                    ?.checked || false

        },

        createdAt: Date.now()

    };


    state.agents.push(agent);

    saveState();


    addActivity(
        `Agent created: ${agent.name}`
    );


    clearAgentForm();

    closeAgentModal();

    renderAgents();

}


/* =========================================================
   TASK SYSTEM
   ========================================================= */

function executeCommand() {

    const input =
        document.getElementById(
            "commandInput"
        );


    if (!input) return;


    const objective =
        input.value.trim();


    if (!objective) {

        input.focus();

        return;

    }


    const manager =
        state.agents.find(
            agent =>
                agent.id === "manager"
        ) ||
        state.agents[0];


    const task = {

        id: createId("task"),

        objective: objective,

        agentId: manager.id,

        agentName: manager.name,

        status: "queued",

        createdAt: Date.now()

    };


    state.tasks.unshift(task);

    saveState();


    addActivity(
        `New task created: ${objective}`
    );


    input.value = "";


    renderTasks();


    showView("tasksView");

}


function renderTasks() {

    const container =
        document.getElementById(
            "tasksContainer"
        );


    if (!container) return;


    const activeTasks =
        state.tasks.filter(
            task =>
                task.status === "queued" ||
                task.status === "running"
        );


    if (!activeTasks.length) {

        container.innerHTML = `

            <div class="empty-state compact">

                <div class="empty-icon">
                    ✓
                </div>

                <strong>
                    No active tasks
                </strong>

                <span>
                    Tasks will appear here when Nexus is working.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML =
        activeTasks
            .map(task => `

                <div class="task-card">

                    <div class="task-status">
                        <span class="status-dot"></span>
                    </div>

                    <div class="task-info">

                        <strong>
                            ${escapeHTML(
                                task.objective
                            )}
                        </strong>

                        <span>
                            Agent:
                            ${escapeHTML(
                                task.agentName
                            )}
                        </span>

                    </div>

                    <div class="task-state">
                        ${escapeHTML(
                            task.status
                        )}
                    </div>

                </div>

            `)
            .join("");
}


/* =========================================================
   PROJECTS
   ========================================================= */

function newProject() {

    const name =
        prompt("Enter a project name:");

    if (!name) return;


    const project = {

        id: createId("project"),

        name: name.trim(),

        description:
            "Nexus workspace",

        createdAt: Date.now()

    };


    state.projects.push(project);

    saveState();


    addActivity(
        `Project created: ${project.name}`
    );


    showView("projectsView");

}


function renderProjects() {

    /* Projects are intentionally simple
       in Phase 1. The full project workspace
       comes later. */

}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function newTask() {

    showView("dashboardView");


    const input =
        document.getElementById(
            "commandInput"
        );


    if (input) {

        setTimeout(() => {

            input.focus();

        }, 100);

    }

}


function openChat() {

    showView("dashboardView");


    const input =
        document.getElementById(
            "commandInput"
        );


    if (input) {

        setTimeout(() => {

            input.focus();

        }, 100);

    }

}


/* =========================================================
   RENDER
   ========================================================= */

function renderAll() {

    renderAgents();

    renderTasks();

    renderProjects();

    renderActivity();

}


/* =========================================================
   EVENT WIRING
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* -----------------------------------------
           Navigation
        ----------------------------------------- */

        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        showView(
                            button.dataset.view
                        );

                    }
                );

            });


        /* -----------------------------------------
           Quick Actions
        ----------------------------------------- */

        document
            .querySelectorAll(
                ".action-card"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;


                        if (
                            action ===
                            "agent"
                        ) {

                            openAgentModal();

                        }


                        if (
                            action ===
                            "project"
                        ) {

                            newProject();

                        }


                        if (
                            action ===
                            "task"
                        ) {

                            newTask();

                        }


                        if (
                            action ===
                            "chat"
                        ) {

                            openChat();

                        }

                    }
                );

            });


        /* -----------------------------------------
           Create Agent button
        ----------------------------------------- */

        const createButton =
            document.getElementById(
                "createAgentButton"
            );


        if (createButton) {

            createButton.addEventListener(
                "click",
                openAgentModal
            );

        }


        /* -----------------------------------------
           Save Agent
        ----------------------------------------- */

        const saveButton =
            document.getElementById(
                "saveAgent"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                createAgent
            );

        }


        /* -----------------------------------------
           Close Agent Modal
        ----------------------------------------- */

        const closeButton =
            document.getElementById(
                "closeAgentModal"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeAgentModal
            );

        }


        /* -----------------------------------------
           Close modal by tapping outside
        ----------------------------------------- */

        const modal =
            document.getElementById(
                "agentModal"
            );


        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeAgentModal();

                    }

                }
            );

        }


        /* -----------------------------------------
           Execute Command
        ----------------------------------------- */

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


        /* -----------------------------------------
           Command keyboard shortcut
        ----------------------------------------- */

        const commandInput =
            document.getElementById(
                "commandInput"
            );


        if (commandInput) {

            commandInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                            "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        executeCommand();

                    }

                }
            );

        }


        /* -----------------------------------------
           Initial render
        ----------------------------------------- */

        renderAll();


        console.log(
            "Nexus initialized successfully."
        );

    }
);


/* =========================================================
   SERVICE WORKER
   ========================================================= */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(() => {

                    console.log(
                        "Nexus service worker registered."
                    );

                })
                .catch(error => {

                    console.error(
                        "Service worker registration failed:",
                        error
                    );

                });

        }
    );

}
