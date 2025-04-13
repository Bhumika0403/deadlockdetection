let allocation = [];
let max = [];
let available = [];
let need = [];

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

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
    return true;
}

function validateMatrices() {
    const processes = parseInt(document.getElementById('processes').value);
    const resources = parseInt(document.getElementById('resources').value);

    // Validate available resources
    for (let j = 0; j < resources; j++) {
        if (available[j] < 0) {
            showError('Available resources cannot be negative');
            return false;
        }
    }

    // Validate allocation and maximum matrices
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

    // Generate Available Resources Input
    let availableHtml = '<div class="matrix-row">';
    for (let j = 0; j < resources; j++) {
        availableHtml += `<input type="number" class="form-control matrix-input" id="available_${j}" value="0" min="0" 
            onchange="updateMatrices()">`;
    }
    availableHtml += '</div>';
    document.getElementById('available-resources').innerHTML = availableHtml;

    // Generate Allocation Matrix
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

    // Generate Maximum Need Matrix
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

    // Update Available Resources
    available = [];
    for (let j = 0; j < resources; j++) {
        available[j] = parseInt(document.getElementById(`available_${j}`).value) || 0;
    }

    // Update Allocation Matrix
    allocation = Array(processes).fill().map(() => Array(resources).fill(0));
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            allocation[i][j] = parseInt(document.getElementById(`allocation_${i}_${j}`).value) || 0;
        }
    }

    // Update Maximum Need Matrix
    max = Array(processes).fill().map(() => Array(resources).fill(0));
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            max[i][j] = parseInt(document.getElementById(`max_${i}_${j}`).value) || 0;
        }
    }

    // Calculate Need Matrix
    need = Array(processes).fill().map(() => Array(resources).fill(0));
    for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
            need[i][j] = max[i][j] - allocation[i][j];
        }
    }
}

function checkDeadlock() {
    if (!validateMatrices()) {
        return;
    }

    const processes = allocation.length;
    const resources = available.length;
    
    // Initialize work array with available resources
    let work = [...available];
    let finish = Array(processes).fill(false);
    let deadlocked = [];

    // Find processes that can finish
    let changed;
    do {
        changed = false;
        for (let i = 0; i < processes; i++) {
            if (!finish[i]) {
                let possible = true;
                // Check if process can get needed resources
                for (let j = 0; j < resources; j++) {
                    if (need[i][j] > work[j]) {
                        possible = false;
                        break;
                    }
                }
                if (possible) {
                    // Process can complete, release its resources
                    finish[i] = true;
                    changed = true;
                    for (let j = 0; j < resources; j++) {
                        work[j] += allocation[i][j];
                    }
                }
            }
        }
    } while (changed);

    // Find deadlocked processes
    for (let i = 0; i < processes; i++) {
        if (!finish[i]) {
            deadlocked.push(i);
        }
    }

    // Display results with explanation
    const resultDiv = document.getElementById('result');
    const explanationDiv = document.getElementById('explanation');
    
    if (deadlocked.length === 0) {
        resultDiv.innerHTML = '<div class="alert alert-success">No deadlock detected. System is in a safe state.</div>';
        explanationDiv.innerHTML = `
            <strong>Analysis:</strong><br>
            - All processes can complete their execution<br>
            - Resources are properly allocated<br>
            - No circular wait condition exists
        `;
    } else {
        resultDiv.innerHTML = `<div class="alert alert-danger">Deadlock detected! Deadlocked processes: P${deadlocked.join(', P')}</div>`;
        explanationDiv.innerHTML = `
            <strong>Analysis:</strong><br>
            - Processes ${deadlocked.map(p => 'P'+p).join(', ')} are in deadlock<br>
            - These processes are waiting for resources held by each other<br>
            - System needs intervention to resolve the deadlock
        `;
    }
}

function runBankersAlgorithm() {
    if (!validateMatrices()) {
        return;
    }

    const processes = allocation.length;
    const resources = available.length;
    
    // Initialize work array with available resources
    let work = [...available];
    let finish = Array(processes).fill(false);
    let safeSequence = [];
    let processDetails = [];

    // Find a safe sequence
    while (safeSequence.length < processes) {
        let found = false;
        for (let i = 0; i < processes; i++) {
            if (!finish[i]) {
                let possible = true;
                // Check if process can get needed resources
                for (let j = 0; j < resources; j++) {
                    if (need[i][j] > work[j]) {
                        possible = false;
                        break;
                    }
                }
                if (possible) {
                    // Process can safely execute
                    let details = {
                        process: i,
                        work: [...work],
                        need: need[i].slice(),
                        allocation: allocation[i].slice(),
                        workAfter: work.map((w, j) => w + allocation[i][j])
                    };
                    processDetails.push(details);

                    // Update system state
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

    // Display results with explanation
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
                System is in a safe state!<br>
                Safe sequence: P${safeSequence.join(' → P')}
            </div>`;
        explanationDiv.innerHTML = explanation;
    } else {
        resultDiv.innerHTML = '<div class="alert alert-danger">System is not in a safe state. No safe sequence exists.</div>';
        explanationDiv.innerHTML = `
            <strong>Analysis:</strong><br>
            - No safe sequence exists<br>
            - Current resource allocation is unsafe<br>
            - Executing processes might lead to deadlock<br>
            - Consider reallocating resources or reducing maximum needs
        `;
    }
}

// Initialize the matrices when the page loads
window.onload = generateMatrices;
