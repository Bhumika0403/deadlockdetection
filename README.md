# Deadlock Detection and Avoidance System

A comprehensive web-based application for detecting and avoiding deadlocks in operating systems using multiple algorithms and advanced visualization techniques.

## 🎯 Features

### Core Functionality
- **Deadlock Detection Analysis** - Detect circular wait conditions and identify deadlocked processes
- **Banker's Algorithm** - Implement safe sequence detection for deadlock avoidance
- **Wait-For Graph Analysis** - Analyze process-resource dependencies and detect cycles

### Advanced Features
- 🌙 **Dark Mode Toggle** - Switch between light and dark themes with persistent preferences
- 📊 **Resource-Process Visualization** - Interactive graph showing resource allocation and process dependencies
- ▶️ **Real-Time Simulation** - Animate the execution of safe sequences with step-by-step logging
- 💾 **Save/Load Configuration** - Store and restore system configurations in browser localStorage
- 📈 **Performance Metrics** - Real-time display of execution time, processes checked, and deadlock count
- 📜 **History Tracking** - Complete history of all analyses with timestamps
- 📥 **Export Results** - Download analysis reports as HTML documents

### Algorithm Support
1. **Banker's Algorithm** - Deadlock avoidance using safe sequence detection
2. **Deadlock Detection** - Identify existing deadlocks in the system
3. **Wait-For Graph** - Cycle detection in process-resource graphs

## 🚀 Quick Start

1. Open `index.html` in a modern web browser
2. Set the number of processes and resources
3. Input the allocation matrix, maximum need matrix, and available resources
4. Select an algorithm from the dropdown
5. Click **Run Analysis** to execute
6. Use visualization, simulation, and export features for detailed analysis

## 📋 System Configuration

- **Processes**: 1-20 (number of concurrent processes)
- **Resources**: 1-20 (number of resource types)
- **Allocation Matrix**: Resources currently allocated to each process
- **Maximum Need Matrix**: Maximum resources each process may request
- **Available Resources**: Current available instances of each resource type

## 🎨 User Interface Components

### Configuration Panel
- Set number of processes and resources
- Choose analysis algorithm
- Generate and edit system matrices

### Visualization
- Resource-Process graph with color-coded edges:
  - Green edges: Allocated resources (R→P)
  - Red edges: Waiting resources (P→R)
- Interactive canvas display

### Simulation
- Play/Pause/Reset controls
- Adjustable simulation speed
- Real-time execution log
- Step-by-step process execution tracking

### Results and Analysis
- Detailed safety analysis
- Deadlock detection results
- Safe sequence information
- System recommendations

### Performance Dashboard
- Execution time measurement
- Process checking statistics
- Resource analysis metrics
- Deadlock count tracking

## 💾 Browser Storage
- Dark mode preferences
- Saved configurations
- Analysis history
- All data persists across sessions

## 🛠 Technologies Used
- **HTML5** - Markup and structure
- **CSS3** - Styling with dark mode support
- **JavaScript** - Core algorithm implementations and interactivity
- **Bootstrap 5** - Responsive UI framework
- **Font Awesome** - Icon library
- **Canvas API** - Graph visualization

## 📊 Algorithm Details

### Banker's Algorithm
Detects if a request can be safely granted by checking if granting it would leave the system in a safe state.

### Deadlock Detection
Uses a resource allocation graph to find processes that cannot proceed due to circular wait conditions.

### Wait-For Graph
Simplifies the resource allocation graph by only showing process-to-process dependencies, enabling faster cycle detection.

## 🎓 Educational Use
This tool is ideal for:
- Learning operating system deadlock concepts
- Testing different resource allocation scenarios
- Understanding safe and unsafe states
- Visualizing deadlock conditions
- Experimenting with deadlock avoidance strategies

## 📝 Notes
- Maximum 20 processes and 20 resources for optimal UI performance
- All analysis is performed client-side (no server required)
- Data is stored only in local browser storage
- Clear the browser cache to reset all saved data

## 👨‍💻 Author
Created for deadlock detection and avoidance simulation in operating systems.