let allocation = [];
let max = [];
let available = [];
let need = [];
let history = [];
let simulationState = [];
let isSimulationRunning = false;
let currentStep = 0;

// Performance metrics
let performanceMetrics = {
    executionTime: 0,
    processesChecked: 0,
    resourcesAnalyzed: 0,
    deadlockedCount: 0
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Load dark mode preference
    loadDarkModePreference();
    updateDarkModeButton();
    
    // Load saved history
    loadHistory();
});

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    updateDarkModeButton();
}

function loadDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

function updateDarkModeButton() {
    const btn = document.getElementById('darkModeToggle');
    if (document.body.classList.contains('dark-mode')) {
        btn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('validation-errors');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
}

function hideError() {
    const errorDiv = document.getElementById('validation-errors');
    errorDiv.classList.add('d-none');
}

function validateInput(processes, resources) {
    hideError();
    
    if (processes <= 0 || resources <= 0) {
        showError('Number of processes and resources must be positive integers');
        return false;
    }
    if (processes > 20 || resources > 20) {
        showError('Maximum 20 processes and resources allowed');
        return false;
    }
    return true;
}

function validateMatrices() {
    const processes = parseInt(document.getElementById('processes').value);
    const resources = parseInt(document.getElementById('resources').value);

    for (let j = 0; j < resources; j++) {
        if (available[j] < 0) {
            showError('Available resources cannot be negative');
            return false;
        }
    }

    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            if (allocation[i][j] < 0 || max[i][j] < 0) {
                showError('Resource values cannot be negative');
                return false;
            }
            if (allocation[i][j] > max[i][j]) {
                showError(`Process ${i} has allocated resources exceeding its maximum need`);
                return false;
            }
        }
    }

    return true;
}

function generateMatrices() {
    const processes = parseInt(document.getElementById('processes').value) || 0;
    const resources = parseInt(document.getElementById('resources').value) || 0;

    if (!validateInput(processes, resources)) {
        return;
    }

    let availableHtml = '<div class="matrix-row">';
    for (let j = 0; j < resources; j++) {
        availableHtml += `<input type="number" class="form-control matrix-input" id="available_${j}" value="0" min="0" 
            onchange="updateMatrices()">`;
    }
    availableHtml += '</div>';
    document.getElementById('available-resources').innerHTML = availableHtml;

    let allocationHtml = '';
    for (let i = 0; i < processes; i++) {
        allocationHtml += '<div class="matrix-row">';
        for (let j = 0; j < resources; j++) {
            allocationHtml += `<input type="number" class="form-control matrix-input" id="allocation_${i}_${j}" value="0" min="0" 
                onchange="updateMatrices()">`;
        }
        allocationHtml += '</div>';
    }
    document.getElementById('allocation-matrix').innerHTML = allocationHtml;

    let maxHtml = '';
    for (let i = 0; i < processes; i++) {
        maxHtml += '<div class="matrix-row">';
        for (let j = 0; j < resources; j++) {
            maxHtml += `<input type="number" class="form-control matrix-input" id="max_${i}_${j}" value="0" min="0" 
                onchange="updateMatrices()">`;
        }
        maxHtml += '</div>';
    }
    document.getElementById('max-matrix').innerHTML = maxHtml;

    updateMatrices();
}

function updateMatrices() {
    const processes = parseInt(document.getElementById('processes').value);
    const resources = parseInt(document.getElementById('resources').value);

    available = [];
    for (let j = 0; j < resources; j++) {
        available[j] = parseInt(document.getElementById(`available_${j}`).value) || 0;
    }

    allocation = Array(processes).fill().map(() => Array(resources).fill(0));
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            allocation[i][j] = parseInt(document.getElementById(`allocation_${i}_${j}`).value) || 0;
        }
    }

    max = Array(processes).fill().map(() => Array(resources).fill(0));
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            max[i][j] = parseInt(document.getElementById(`max_${j}`).value) || 0;
        }
    }

    need = Array(processes).fill().map(() => Array(resources).fill(0));
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            need[i][j] = max[i][j] - allocation[i][j];
        }
    }
}

// Main analysis runner
function runAnalysis() {
    if (!validateMatrices()) {
        return;
    }

    const algorithm = document.getElementById('algorithm').value;
    const startTime = performance.now();

    switch(algorithm) {
        case 'banker':
            runBankersAlgorithm();
            break;
        case 'detection':
            checkDeadlock();
            break;
        case 'wait-for':
            analyzeWaitForGraph();
            break;
    }

    const endTime = performance.now();
    performanceMetrics.executionTime = (endTime - startTime).toFixed(2);
    displayPerformanceMetrics();
}

function checkDeadlock() {
    const processes = allocation.length;
    const resources = available.length;
    
    let work = [...available];
    let finish = Array(processes).fill(false);
    let deadlocked = [];

    performanceMetrics.processesChecked = processes;
    performanceMetrics.resourcesAnalyzed = resources;

    let changed;
    do {
        changed = false;
        for (let i = 0; i < processes; i++) {
            if (!finish[i]) {
                let possible = true;
                for (let j = 0; j < resources; j++) {
                    if (need[i][j] > work[j]) {
                        possible = false;
                        break;
                    }
                }
                if (possible) {
                    finish[i] = true;
                    changed = true;
                    for (let j = 0; j < resources; j++) {
                        work[j] += allocation[i][j];
                    }
                }
            }
        }
    } while (changed);

    for (let i = 0; i < processes; i++) {
        if (!finish[i]) {
            deadlocked.push(i);
        }
    }

    performanceMetrics.deadlockedCount = deadlocked.length;

    const resultDiv = document.getElementById('result');
    const explanationDiv = document.getElementById('explanation');
    
    if (deadlocked.length === 0) {
        resultDiv.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> No deadlock detected. System is in a safe state.</div>';
        explanationDiv.innerHTML = `
            <strong>Analysis:</strong><br>
            - All processes can complete their execution<br>
            - Resources are properly allocated<br>
            - No circular wait condition exists
        `;
        addToHistory('No Deadlock', 'detection', 'Safe State');
    } else {
        resultDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Deadlock detected! Deadlocked processes: P${deadlocked.join(', P')}</div>`;
        explanationDiv.innerHTML = `
            <strong>Analysis:</strong><br>
            - Processes ${deadlocked.map(p => 'P'+p).join(', ')} are in deadlock<br>
            - These processes are waiting for resources held by each other<br>
            - System needs intervention to resolve the deadlock
        `;
        addToHistory('Deadlock Detected', 'detection', `Processes: ${deadlocked.join(', ')}`);
    }
}

function runBankersAlgorithm() {
    const processes = allocation.length;
    const resources = available.length;
    
    let work = [...available];
    let finish = Array(processes).fill(false);
    let safeSequence = [];
    let processDetails = [];

    performanceMetrics.processesChecked = processes;
    performanceMetrics.resourcesAnalyzed = resources;

    simulationState = [];

    while (safeSequence.length < processes) {
        let found = false;
        for (let i = 0; i < processes; i++) {
            if (!finish[i]) {
                let possible = true;
                for (let j = 0; j < resources; j++) {
                    if (need[i][j] > work[j]) {
                        possible = false;
                        break;
                    }
                }
                if (possible) {
                    let details = {
                        process: i,
                        work: [...work],
                        need: need[i].slice(),
                        allocation: allocation[i].slice(),
                        workAfter: work.map((w, j) => w + allocation[i][j])
                    };
                    processDetails.push(details);
                    simulationState.push(details);

                    for (let j = 0; j < resources; j++) {
                        work[j] += allocation[i][j];
                    }
                    finish[i] = true;
                    safeSequence.push(i);
                    found = true;
                }
            }
        }
        if (!found) break;
    }

    const resultDiv = document.getElementById('result');
    const explanationDiv = document.getElementById('explanation');
    
    if (safeSequence.length === processes) {
        let explanation = '<strong>Safe Sequence Found:</strong><br>';
        explanation += `P${safeSequence.join(' → P')}<br><br>`;
        explanation += '<strong>Step-by-step execution:</strong><br>';
        
        processDetails.forEach((detail, index) => {
            explanation += `
                <strong>Step ${index + 1}:</strong> Execute P${detail.process}<br>
                - Available resources: [${detail.work.join(', ')}]<br>
                - Needed resources: [${detail.need.join(', ')}]<br>
                - After completion: [${detail.workAfter.join(', ')}]<br>
            `;
        });

        resultDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-shield-alt"></i> System is in a safe state!<br>
                Safe sequence: P${safeSequence.join(' → P')}
            </div>`;
        explanationDiv.innerHTML = explanation;
        addToHistory('Banker\'s Algorithm', 'banker', `Safe: ${safeSequence.join(',')}`);
    } else {
        resultDiv.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> System is not in a safe state. No safe sequence exists.</div>';
        explanationDiv.innerHTML = `
            <strong>Analysis:</strong><br>
            - No safe sequence exists<br>
            - Current resource allocation is unsafe<br>
            - Executing processes might lead to deadlock
        `;
        addToHistory('Banker\'s Algorithm', 'banker', 'Unsafe State');
    }
}

function analyzeWaitForGraph() {
    const processes = allocation.length;
    const resources = available.length;

    let graph = Array(processes).fill().map(() => []);
    let hasCycle = false;
    let cycleProcesses = [];

    // Build wait-for graph
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < processes; j++) {
            if (i !== j) {
                for (let k = 0; k < resources; k++) {
                    if (need[i][k] > 0 && allocation[j][k] > 0) {
                        if (!graph[i].includes(j)) {
                            graph[i].push(j);
                        }
                    }
                }
            }
        }
    }

    // Detect cycles using DFS
    for (let i = 0; i < processes; i++) {
        let visited = Array(processes).fill(false);
        let recStack = Array(processes).fill(false);
        
        if (detectCycleDFS(i, graph, visited, recStack)) {
            hasCycle = true;
            cycleProcesses.push(i);
        }
    }

    const resultDiv = document.getElementById('result');
    const explanationDiv = document.getElementById('explanation');

    if (hasCycle) {
        resultDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-link"></i> Cycle detected in wait-for graph. Processes: P${cycleProcesses.join(', P')}</div>`;
        explanationDiv.innerHTML = `
            <strong>Wait-For Graph Analysis:</strong><br>
            - A circular dependency has been detected<br>
            - This indicates a potential deadlock situation<br>
            - Involved processes: P${cycleProcesses.join(', P')}
        `;
    } else {
        resultDiv.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> No cycle detected in wait-for graph. System is safe.</div>';
        explanationDiv.innerHTML = `
            <strong>Wait-For Graph Analysis:</strong><br>
            - No circular dependencies found<br>
            - All processes can proceed independently<br>
            - System is in a safe state
        `;
    }
}

function detectCycleDFS(node, graph, visited, recStack) {
    visited[node] = true;
    recStack[node] = true;

    for (let neighbor of graph[node]) {
        if (!visited[neighbor]) {
            if (detectCycleDFS(neighbor, graph, visited, recStack)) {
                return true;
            }
        } else if (recStack[neighbor]) {
            return true;
        }
    }

    recStack[node] = false;
    return false;
}

// Save/Load Configuration
function saveConfiguration() {
    const config = {
        processes: parseInt(document.getElementById('processes').value),
        resources: parseInt(document.getElementById('resources').value),
        algorithm: document.getElementById('algorithm').value,
        allocation,
        max,
        available,
        timestamp: new Date().toLocaleString()
    };

    const configs = JSON.parse(localStorage.getItem('savedConfigs')) || [];
    configs.push(config);
    localStorage.setItem('savedConfigs', JSON.stringify(configs));

    showError('Configuration saved successfully!');
    setTimeout(() => hideError(), 2000);
    addToHistory('Configuration Saved', 'save', new Date().toLocaleString());
}

function loadConfiguration() {
    const configs = JSON.parse(localStorage.getItem('savedConfigs')) || [];
    
    if (configs.length === 0) {
        showError('No saved configurations found');
        return;
    }

    const config = configs[configs.length - 1];
    
    document.getElementById('processes').value = config.processes;
    document.getElementById('resources').value = config.resources;
    document.getElementById('algorithm').value = config.algorithm;
    
    allocation = config.allocation;
    max = config.max;
    available = config.available;

    generateMatrices();
    updateMatrices();

    showError('Configuration loaded successfully!');
    setTimeout(() => hideError(), 2000);
    addToHistory('Configuration Loaded', 'load', config.timestamp);
}

// Visualization
function toggleVisualization() {
    const container = document.getElementById('visualization-container');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        drawResourceGraph();
    } else {
        container.style.display = 'none';
    }
}

function drawResourceGraph() {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const processes = allocation.length;
    const resources = available.length;
    
    const processY = 80;
    const resourceY = 300;
    const spacing = canvas.width / (Math.max(processes, resources) + 1);

    // Draw processes
    ctx.fillStyle = '#0d6efd';
    for (let i = 0; i < processes; i++) {
        const x = (i + 1) * spacing;
        ctx.beginPath();
        ctx.arc(x, processY, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`P${i}`, x, processY);
        ctx.fillStyle = '#0d6efd';
    }

    // Draw resources
    ctx.fillStyle = '#198754';
    for (let j = 0; j < resources; j++) {
        const x = (j + 1) * spacing;
        ctx.fillRect(x - 15, resourceY - 15, 30, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`R${j}`, x, resourceY);
        ctx.fillStyle = '#198754';
    }

    // Draw edges (process -> resource, resource -> process)
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            if (allocation[i][j] > 0) {
                const fromX = (i + 1) * spacing;
                const toX = (j + 1) * spacing;
                
                // Draw arrow from R->P (resource allocated to process)
                drawArrow(ctx, toX, resourceY - 20, fromX, processY + 20, '#198754');
            }
        }
    }

    // Check for circular wait
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            if (need[i][j] > 0 && allocation[i][j] === 0) {
                const fromX = (i + 1) * spacing;
                const toX = (j + 1) * spacing;
                drawArrow(ctx, fromX, processY + 20, toX, resourceY - 20, '#dc3545');
            }
        }
    }
}

function drawArrow(ctx, fromX, fromY, toX, toY, color) {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

// Simulation
function showSimulation() {
    document.getElementById('simulation-container').style.display = 'block';
    initializeSimulation();
}

function initializeSimulation() {
    currentStep = 0;
    document.getElementById('simulation-log').innerHTML = '';
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function playSimulation() {
    isSimulationRunning = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;

    if (simulationState.length === 0) {
        showError('Run analysis first to generate simulation data');
        isSimulationRunning = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        return;
    }

    simulateStep();
}

function simulateStep() {
    if (!isSimulationRunning || currentStep >= simulationState.length) {
        isSimulationRunning = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        return;
    }

    const step = simulationState[currentStep];
    const speed = parseFloat(document.getElementById('speedControl').value) || 1;
    const logDiv = document.getElementById('simulation-log');
    
    const logEntry = `[Step ${currentStep + 1}] Execute P${step.process}\n` +
                     `Work: [${step.work.join(', ')}]\n` +
                     `After: [${step.workAfter.join(', ')}]\n\n`;
    
    logDiv.innerHTML += logEntry;
    logDiv.scrollTop = logDiv.scrollHeight;
    
    currentStep++;
    setTimeout(() => simulateStep(), 1000 / speed);
}

function pauseSimulation() {
    isSimulationRunning = false;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function resetSimulation() {
    isSimulationRunning = false;
    currentStep = 0;
    document.getElementById('simulation-log').innerHTML = '';
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

// Export Results
function exportResults() {
    const resultContent = document.getElementById('result').innerText;
    const explanationContent = document.getElementById('explanation').innerText;
    
    const htmlContent = `
        <html>
            <head>
                <title>Deadlock Analysis Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #0d6efd; }
                    .section { margin-top: 20px; border: 1px solid #ddd; padding: 10px; }
                    pre { background-color: #f5f5f5; padding: 10px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <h1>Deadlock Detection and Avoidance Analysis Report</h1>
                <p>Generated: ${new Date().toLocaleString()}</p>
                <div class="section">
                    <h2>Configuration</h2>
                    <p>Processes: ${parseInt(document.getElementById('processes').value)}</p>
                    <p>Resources: ${parseInt(document.getElementById('resources').value)}</p>
                    <p>Algorithm: ${document.getElementById('algorithm').value}</p>
                </div>
                <div class="section">
                    <h2>Results</h2>
                    <pre>${resultContent}</pre>
                </div>
                <div class="section">
                    <h2>Analysis</h2>
                    <pre>${explanationContent}</pre>
                </div>
                <div class="section">
                    <h2>Performance Metrics</h2>
                    <pre>Execution Time: ${performanceMetrics.executionTime}ms
Processes Checked: ${performanceMetrics.processesChecked}
Resources Analyzed: ${performanceMetrics.resourcesAnalyzed}
Deadlocked: ${performanceMetrics.deadlockedCount}</pre>
                </div>
            </body>
        </html>
    `;

    const link = document.createElement('a');
    link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
    link.download = `deadlock_analysis_${Date.now()}.html`;
    link.click();

    addToHistory('Results Exported', 'export', new Date().toLocaleString());
}

// Performance Metrics Display
function displayPerformanceMetrics() {
    const metricsDiv = document.getElementById('performance-metrics');
    metricsDiv.innerHTML = `
        <div class="metric-row">
            <span>Execution Time:</span>
            <strong>${performanceMetrics.executionTime}ms</strong>
        </div>
        <div class="metric-row">
            <span>Processes Checked:</span>
            <strong>${performanceMetrics.processesChecked}</strong>
        </div>
        <div class="metric-row">
            <span>Resources Analyzed:</span>
            <strong>${performanceMetrics.resourcesAnalyzed}</strong>
        </div>
        <div class="metric-row">
            <span>Deadlocked:</span>
            <strong>${performanceMetrics.deadlockedCount}</strong>
        </div>
    `;
}

// History Management
function addToHistory(action, type, details) {
    history.push({
        action,
        type,
        details,
        timestamp: new Date().toLocaleString()
    });

    saveHistory();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    if (history.length === 0) {
        historyList.innerHTML = '<small class="text-muted">No history yet</small>';
        return;
    }

    let html = '';
    history.slice().reverse().forEach((item, index) => {
        html += `
            <div class="history-item">
                <strong>${item.action}</strong><br>
                <small>${item.details}</small><br>
                <tiny>${item.timestamp}</tiny>
            </div>
        `;
    });
    historyList.innerHTML = html;
}

function saveHistory() {
    localStorage.setItem('history', JSON.stringify(history));
}

function loadHistory() {
    const saved = localStorage.getItem('history');
    if (saved) {
        history = JSON.parse(saved);
        updateHistoryDisplay();
    }
}

// Initialize on page load
window.onload = function() {
    generateMatrices();
};

