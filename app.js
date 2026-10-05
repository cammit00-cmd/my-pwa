/* =========================================================
   NEXUS — PHASE 2
   TASK ENGINE
   ========================================================= */

const STORAGE_KEY = "nexus_state_v2";


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
            "Nexus state loading failed:",
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
            "Nexus state saving failed:",
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
            .substring(2, 9)
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
   ACTIVITY ENGINE
   ========================================================= */

function addActivity(message) {

    state.activity.unshift({

        id: createId("activity"),

        message,

        timestamp: Date.now()

    });


    state.activity =
        state.activity.slice(0, 100);


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

                <div class="empty-icon">
                    ◌
                </div>

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
            .slice(0, 15)
            .map(item => `

                <div class="activity-item">

                    <div class="activity-indicator"></div>

                    <div class="activity-content">

                        <strong>
                            ${escapeHTML(
                                item.message
                            )}
                        </strong>

                        <span>
                            Nexus
                        </span>

                    </div>

                    <time>
                        ${formatTime(
                            item.timestamp
                        )}
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


    const agentHTML =
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

                            ${escapeHTML(
                                agent.name
                            )}

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


    if (dashboard) {

        dashboard.innerHTML =
            agentHTML;

    }


    if (full) {

        full.innerHTML =
            agentHTML;

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


    if (!modal) return;


    modal.classList.remove(
        "hidden"
    );


    const name =
        document.getElementById(
            "agentName"
        );


    if (name) {

        setTimeout(
            () => name.focus(),
            100
        );

    }
}


function closeAgentModal() {

    const modal =
        document.getElementById(
            "agentModal"
        );


    if (!modal) return;


    modal.classList.add(
        "hidden"
    );
}


function clearAgentForm() {

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
            .getElementById(
                "agentName"
            )
            ?.value
            .trim();


    if (!name) {

        alert(
            "Please enter an agent name."
        );

        return;

    }


    const agent = {

        id: createId("agent"),

        name,

        description:
            document
                .getElementById(
                    "agentDescription"
                )
                ?.value
                .trim() ||
            "Custom Nexus AI worker",

        instructions:
            document
                .getElementById(
                    "agentInstructions"
                )
                ?.value
                .trim() ||
            "Assist the user according to the assigned objective.",

        personality:
            document
                .getElementById(
                    "agentPersonality"
                )
                ?.value
                .trim() ||
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
   TASK CREATION
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


    createTask(objective);

    input.value = "";

}


function createTask(objective) {

    const manager =
        state.agents.find(
            agent =>
                agent.id === "manager"
        ) ||
        state.agents[0];


    const task = {

        id: createId("task"),

        objective,

        agentId:
            manager.id,

        agentName:
            manager.name,

        status: "queued",

        progress: 0,

        createdAt: Date.now(),

        startedAt: null,

        completedAt: null,

        cancelledAt: null,

        steps: [

            {
                id: createId("step"),

                name:
                    "Understand objective",

                status: "pending"

            },

            {
                id: createId("step"),

                name:
                    "Create execution plan",

                status: "pending"

            },

            {
                id: createId("step"),

                name:
                    "Execute work",

                status: "pending"

            },

            {
                id: createId("step"),

                name:
                    "Evaluate result",

                status: "pending"

            }

        ]

    };


    state.tasks.unshift(task);

    saveState();


    addActivity(
        `Task created: ${objective}`
    );


    renderTasks();


    showView("tasksView");


    /*
       Start the Phase 2 simulation.

       This gives us the task lifecycle
       before connecting a real AI model.
    */

    startTask(task.id);
}


/* =========================================================
   TASK EXECUTION ENGINE
   ========================================================= */

function startTask(taskId) {

    const task =
        state.tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) return;


    task.status =
        "running";

    task.startedAt =
        Date.now();

    task.progress =
        10;

    task.steps[0].status =
        "complete";


    saveState();


    addActivity(
        `Task started: ${task.objective}`
    );


    renderTasks();


    /*
       Simulated execution stages.

       These will eventually be replaced
       by real agent/model execution.
    */

    setTimeout(
        () => advanceTask(
            taskId,
            1,
            35
        ),
        1000
    );

}


function advanceTask(
    taskId,
    stepIndex,
    progress
) {

    const task =
        state.tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) return;


    if (
        task.status ===
            "cancelled" ||
        task.status ===
            "completed"
    ) {

        return;

    }


    task.steps[stepIndex].status =
        "complete";


    task.progress =
        progress;


    saveState();


    addActivity(
        `${task.steps[stepIndex].name}: ${task.objective}`
    );


    renderTasks();


    if (
        stepIndex <
        task.steps.length - 1
    ) {

        setTimeout(
            () =>
                advanceTask(
                    taskId,
                    stepIndex + 1,
                    Math.min(
                        progress + 25,
                        90
                    )
                ),
            1200
        );

        return;

    }


    completeTask(taskId);
}


/* =========================================================
   TASK COMPLETION
   ========================================================= */

function completeTask(taskId) {

    const task =
        state.tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) return;


    task.status =
        "completed";

    task.progress =
        100;

    task.completedAt =
        Date.now();


    saveState();


    addActivity(
        `Task completed: ${task.objective}`
    );


    renderTasks();

}


/* =========================================================
   TASK CANCELLATION
   ========================================================= */

function cancelTask(taskId) {

    const task =
        state.tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) return;


    if (
        task.status ===
        "completed"
    ) {

        return;

    }


    task.status =
        "cancelled";

    task.cancelledAt =
        Date.now();


    saveState();


    addActivity(
        `Task cancelled: ${task.objective}`
    );


    renderTasks();

}


/* =========================================================
   TASK DISPLAY
   ========================================================= */

function renderTasks() {

    const dashboardContainer =
        document.getElementById(
            "tasksContainer"
        );

    const fullContainer =
        document.getElementById(
            "fullTasksContainer"
        );


    const activeTasks =
        state.tasks.filter(
            task =>
                task.status === "queued" ||
                task.status === "running"
        );


    const taskHTML = activeTasks.length

        ? activeTasks
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


    if (dashboardContainer) {

        dashboardContainer.innerHTML =
            taskHTML;

    }


    if (fullContainer) {

        fullContainer.innerHTML =
            taskHTML;

    }
}

    if (!container) return;


    const activeTasks =
        state.tasks.filter(
            task =>
                task.status ===
                    "queued" ||
                task.status ===
                    "running"
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


                        <div class="task-progress">

                            <div
                                class="task-progress-bar"
                                style="
                                    width: ${task.progress}%;
                                "
                            ></div>

                        </div>

                    </div>


                    <div class="task-state">

                        ${task.progress}%

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
        prompt(
            "Enter a project name:"
        );


    if (!name) return;


    const project = {

        id: createId("project"),

        name:
            name.trim(),

        description:
            "Nexus workspace",

        createdAt:
            Date.now()

    };


    state.projects.push(
        project
    );


    saveState();


    addActivity(
        `Project created: ${project.name}`
    );


    showView(
        "projectsView"
    );
}


function renderProjects() {
    /*
       Full project system comes
       in a later phase.
    */
}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function newTask() {

    showView(
        "dashboardView"
    );


    const input =
        document.getElementById(
            "commandInput"
        );


    if (input) {

        setTimeout(
            () => input.focus(),
            100
        );

    }
}


function openChat() {

    showView(
        "dashboardView"
    );


    const input =
        document.getElementById(
            "commandInput"
        );


    if (input) {

        setTimeout(
            () => input.focus(),
            100
        );

    }
}


/* =========================================================
   RENDER EVERYTHING
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


        /* Navigation */

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


        /* Quick Actions */

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


        /* Create Agent */

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


        /* Save Agent */

        const saveAgent =
            document.getElementById(
                "saveAgent"
            );


        if (saveAgent) {

            saveAgent.addEventListener(
                "click",
                createAgent
            );

        }


        /* Close Agent */

        const closeAgentModalButton =
            document.getElementById(
                "closeAgentModal"
            );


        if (
            closeAgentModalButton
        ) {

            closeAgentModalButton.addEventListener(
                "click",
                closeAgentModal
            );

        }


        /* Modal background */

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


        /* Execute */

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


        /* Enter = Execute */

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


        /* Initial render */

        renderAll();


        console.log(
            "Nexus Phase 2 initialized."
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
