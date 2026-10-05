function testButton() {
    const output = document.getElementById("output");

    output.textContent = "It works! 🎉";
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js");
    });
}
