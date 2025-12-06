// Loading Screen
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.querySelector('.loading-screen');
    const desktop = document.querySelector('.desktop');
    
    // Simulate loading time (3 seconds)
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        desktop.classList.add('show');
        
        // Remove loading screen after animation
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 3000);
});

// Update time and date in taskbar
function updateTime() {
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    
    timeElement.textContent = timeString;
    dateElement.textContent = dateString;
}

// Update time every second
setInterval(updateTime, 1000);
updateTime();

// Window management
let activeWindows = new Set();

function openFolder(folderName) {
    const window = document.getElementById(`${folderName}-window`);
    
    // Reset display style if it was set inline (fixes terminal reopen issue)
    if (window.style.display === 'none') {
        window.style.display = '';
    }
    
    // Close other windows if they're not in the same row
    const windowRect = window.getBoundingClientRect();
    activeWindows.forEach(activeWindow => {
        const activeRect = activeWindow.getBoundingClientRect();
        if (Math.abs(activeRect.top - windowRect.top) > 50) {
            closeFolder(activeWindow.id.replace('-window', ''));
        }
    });
    
    window.classList.add('active');
    activeWindows.add(window);
    
    // Make window draggable
    makeDraggable(window);
    
    // Add window to taskbar
    addToTaskbar(folderName);
}

function closeFolder(folderName) {
    const window = document.getElementById(`${folderName}-window`);
    window.classList.remove('active');
    activeWindows.delete(window);
    
    // Remove from taskbar
    removeFromTaskbar(folderName);
}

// Taskbar management
function addToTaskbar(folderName) {
    // Check if taskbar item already exists to prevent duplicates
    const existingItem = document.querySelector(`.taskbar-item[data-folder="${folderName}"]`);
    if (existingItem) {
        return; // Already exists, don't add duplicate
    }
    
    const taskbar = document.querySelector('.taskbar');
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-item';
    taskbarItem.dataset.folder = folderName; // Add data attribute for identification
    taskbarItem.innerHTML = `
        <i class="fas ${getIconForFolder(folderName)}"></i>
        <span>${folderName.charAt(0).toUpperCase() + folderName.slice(1)}</span>
    `;
    taskbarItem.onclick = () => toggleWindow(folderName);
    taskbar.insertBefore(taskbarItem, document.querySelector('.weather-widget'));
}

function removeFromTaskbar(folderName) {
    const taskbarItem = document.querySelector(`.taskbar-item[data-folder="${folderName}"]`);
    if (taskbarItem) {
        taskbarItem.remove();
    }
}

function getIconForFolder(folderName) {
    const icons = {
        academics: 'fa-graduation-cap',
        projects: 'fa-project-diagram',
        skills: 'fa-tools',
        links: 'fa-link',
        contact: 'fa-address-card',
        introduction: 'fa-user',
        howto: 'fa-book',
        howtouse: 'fa-book',
        notepad: 'fa-file-alt',
        terminal: 'fa-terminal',
        clock: 'fa-clock',
        weather: 'fa-cloud-sun',
        resume: 'fa-file-pdf'
    };
    return icons[folderName] || 'fa-folder';
}

// Print Resume Function
function printResume() {
    const iframe = document.querySelector('.resume-preview iframe');
    if (iframe) {
        iframe.contentWindow.print();
    } else {
        window.open('assets/resume.pdf', '_blank');
    }
}

function toggleWindow(folderName) {
    const window = document.getElementById(`${folderName}-window`);
    if (window.classList.contains('active')) {
        closeFolder(folderName);
    } else {
        openFolder(folderName);
    }
}

// Make windows draggable
function makeDraggable(element) {
    const header = element.querySelector('.window-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target === header || e.target.parentElement === header) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            
            // Bring window to front
            element.style.zIndex = getHighestZIndex() + 1;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, element);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }
}

function getHighestZIndex() {
    return Math.max(
        ...Array.from(document.querySelectorAll('.window'))
            .map(el => parseFloat(window.getComputedStyle(el).zIndex) || 0)
    );
}

// Close window when clicking outside
document.addEventListener('click', (e) => {
    const windows = document.querySelectorAll('.window');
    windows.forEach(window => {
        if (!window.contains(e.target) && !e.target.closest('.icon') && !e.target.closest('.taskbar-item')) {
            closeFolder(window.id.replace('-window', ''));
        }
    });
});

// Add styles for taskbar items
const style = document.createElement('style');
style.textContent = `
    .taskbar-item {
        display: flex;
        align-items: center;
        padding: 0 10px;
        height: 100%;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .taskbar-item:hover {
        background-color: rgba(0, 120, 212, 0.1);
    }
    
    .taskbar-item i {
        margin-right: 5px;
        color: #0078d4;
    }
    
    .taskbar-item span {
        color: #333;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

// Start Menu functionality
const startButton = document.querySelector('.start-button');
const startMenu = document.querySelector('.start-menu');

function toggleStartMenu() {
    startMenu.classList.toggle('active');
    // Bring start menu to front
    if (startMenu.classList.contains('active')) {
        startMenu.style.zIndex = getHighestZIndex() + 1;
    }
}

// Add click event listener to start button
startButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    toggleStartMenu();
});

// Close start menu when clicking outside
document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
        startMenu.classList.remove('active');
    }
});

// Prevent start menu from closing when clicking inside it
startMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Add folder navigation to start menu
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const folderName = item.getAttribute('data-folder');
        if (folderName) {
            openFolder(folderName);
            startMenu.classList.remove('active');
        }
    });
});

// Link desktop icons with start menu
const desktopIcons = document.querySelectorAll('.desktop-icons .icon');
desktopIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        const folderName = icon.getAttribute('onclick').match(/'([^']+)'/)[1];
        openFolder(folderName);
    });
});

// Terminal functionality
const terminalBtn = document.querySelector('.terminal-btn');
const terminal = document.querySelector('.terminal');
const terminalInput = document.querySelector('.terminal-input');
let currentDirectory = 'C:\\Users\\Ariyan';

// Define valid directories
const validDirectories = {
    'C:\\Users\\Ariyan': ['Desktop', 'Documents', 'Downloads', 'Pictures', 'txt'],
    'C:\\Users\\Ariyan\\Desktop': ['Projects', 'Resume', 'Documents'],
    'C:\\Users\\Ariyan\\Documents': ['Work', 'Personal', 'Studies'],
    'C:\\Users\\Ariyan\\Downloads': [],
    'C:\\Users\\Ariyan\\Pictures': ['Screenshots', 'Photos'],
    'C:\\Users\\Ariyan\\txt': [] // Virtual folder for session text files
};

// Define valid commands
const validCommands = {
    'cd': 'Change directory',
    'dir': 'List directory contents',
    'ls': 'List directory contents (with -l, -a flags)',
    'cls': 'Clear screen',
    'clear': 'Clear screen',
    'help': 'Show available commands',
    'echo': 'Display a message',
    'date': 'Show current date',
    'time': 'Show current time',
    'mkdir': 'Create a new folder',
    'touch': 'Create a new empty file',
    'open': 'Open a saved text file',
    'type': 'Display file contents',
    'cat': 'Display file contents',
    'pwd': 'Print current working directory',
    'notepad': 'Open file in notepad',
    'exit': 'Close terminal'
};

function updatePrompt() {
    document.querySelector('.prompt').textContent = `${currentDirectory}>`;
}

// Get list of saved text files from sessionStorage
function getSavedTextFiles() {
    const files = [];
    const savedFilesList = sessionStorage.getItem('txtfiles-list');
    if (savedFilesList) {
        return JSON.parse(savedFilesList);
    }
    return files;
}

// Add a file to the saved files list
function addToSavedFiles(fileName) {
    const files = getSavedTextFiles();
    if (!files.includes(fileName)) {
        files.push(fileName);
        sessionStorage.setItem('txtfiles-list', JSON.stringify(files));
    }
}

// Remove a file from the saved files list
function removeFromSavedFiles(fileName) {
    const files = getSavedTextFiles();
    const index = files.indexOf(fileName);
    if (index > -1) {
        files.splice(index, 1);
        sessionStorage.setItem('txtfiles-list', JSON.stringify(files));
    }
}

// Create a desktop icon for a folder
function createDesktopIcon(folderName) {
    const desktopIcons = document.querySelector('.desktop-icons');
    
    // Check if icon already exists
    if (document.getElementById(`icon-${folderName}`)) {
        return;
    }
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.id = `icon-${folderName}`;
    icon.onclick = () => openFolder(folderName);
    icon.innerHTML = `
        <i class="fas fa-folder"></i>
        <span>${folderName.charAt(0).toUpperCase() + folderName.slice(1)}</span>
    `;
    
    desktopIcons.appendChild(icon);
    
    // Save icon to sessionStorage so it persists during session
    saveDesktopIcon(folderName);
}

// Save desktop icon info to sessionStorage
function saveDesktopIcon(folderName) {
    const icons = getDesktopIcons();
    if (!icons.includes(folderName)) {
        icons.push(folderName);
        sessionStorage.setItem('desktop-icons', JSON.stringify(icons));
    }
}

// Get saved desktop icons
function getDesktopIcons() {
    const icons = sessionStorage.getItem('desktop-icons');
    return icons ? JSON.parse(icons) : [];
}

// Restore desktop icons on page load
function restoreDesktopIcons() {
    const icons = getDesktopIcons();
    icons.forEach(folderName => {
        createDesktopIcon(folderName);
    });
}

function addTerminalOutput(text, isError = false) {
    const output = document.createElement('div');
    output.textContent = text;
    output.style.color = isError ? '#ff4444' : '#ffffff';
    document.querySelector('.terminal-content').insertBefore(output, document.querySelector('.terminal-input-line'));
}

function executeCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case 'cd':
            if (args.length === 0) {
                return currentDirectory;
            }
            if (args[0] === '..') {
                const dirs = currentDirectory.split('\\');
                if (dirs.length > 1) {
                    dirs.pop();
                    currentDirectory = dirs.join('\\');
                }
                return '';
            }
            
            // Check if the argument matches any folder name
            const folderName = args[0].toLowerCase();
            const validFolders = ['introduction', 'academics', 'projects', 'skills', 'links', 'contact', 'notepad'];
            
            if (validFolders.includes(folderName)) {
                openFolder(folderName);
                return `Opening ${folderName} folder...`;
            }
            
            // Check if it's a user-created folder
            const createdFolders = getDesktopIcons();
            if (createdFolders.includes(folderName)) {
                // Check if the folder has content in txt folder or as foldertext
                const txtContent = sessionStorage.getItem(`txtfile-${folderName}`);
                const folderContent = sessionStorage.getItem(`foldertext-${folderName}`);
                
                if (txtContent || folderContent) {
                    // Create window if it doesn't exist
                    if (!document.getElementById(`${folderName}-window`)) {
                        createTextFolderWindow(folderName);
                    }
                    openFolder(folderName);
                    return `Opening ${folderName}...`;
                } else {
                    return `Folder '${folderName}' is empty.`;
                }
            }
            
            const newPath = `${currentDirectory}\\${args[0]}`;
            if (validDirectories[newPath]) {
                currentDirectory = newPath;
                return '';
            } else {
                return `The system cannot find the path specified: ${newPath}`;
            }

        case 'pwd':
            return currentDirectory;

        case 'touch':
            if (args.length === 0) {
                return 'Usage: touch <filename>';
            }
            const touchFileName = args[0].toLowerCase().replace(/\.txt$/, '');
            // Check if file already exists
            if (sessionStorage.getItem(`txtfile-${touchFileName}`)) {
                return `File '${touchFileName}' already exists.`;
            }
            // Create empty file
            sessionStorage.setItem(`txtfile-${touchFileName}`, '');
            addToSavedFiles(touchFileName);
            return `Created empty file '${touchFileName}'.`;

        case 'dir':
        case 'ls':
            if (!validDirectories[currentDirectory]) {
                return `Directory not found: ${currentDirectory}`;
            }
            
            // Parse flags
            const lsFlags = args.filter(arg => arg.startsWith('-')).join('');
            const showLong = lsFlags.includes('l');
            const showAll = lsFlags.includes('a');
            
            let output = '';
            
            if (showLong) {
                output += `\n Directory of ${currentDirectory}\n\n`;
                output += `Mode          LastWriteTime      Name\n`;
                output += `----          -------------      ----\n`;
                
                // Show hidden items if -a flag
                if (showAll) {
                    output += `d----         ${new Date().toLocaleDateString()}       .\n`;
                    output += `d----         ${new Date().toLocaleDateString()}       ..\n`;
                }
                
                // Show directories
                validDirectories[currentDirectory].forEach(item => {
                    output += `d----         ${new Date().toLocaleDateString()}       ${item}\n`;
                });
                
                // If in txt folder, show saved text files
                if (currentDirectory === 'C:\\Users\\Ariyan\\txt') {
                    const savedFiles = getSavedTextFiles();
                    savedFiles.forEach(file => {
                        const content = sessionStorage.getItem(`txtfile-${file}`) || '';
                        output += `-a---         ${new Date().toLocaleDateString()}       ${file}.txt (${content.length} bytes)\n`;
                    });
                }
            } else {
                output += `\n Directory of ${currentDirectory}\n\n`;
                
                // Show hidden items if -a flag
                if (showAll) {
                    output += `.  ..  `;
                }
                
                // Show directories
                validDirectories[currentDirectory].forEach(item => {
                    output += `[DIR]  ${item}\n`;
                });
                
                // If in txt folder, show saved text files
                if (currentDirectory === 'C:\\Users\\Ariyan\\txt') {
                    const savedFiles = getSavedTextFiles();
                    if (savedFiles.length > 0) {
                        savedFiles.forEach(file => {
                            output += `[FILE] ${file}\n`;
                        });
                    } else {
                        output += '\n(No text files saved yet)\n';
                    }
                }
            }
            
            return output;

        case 'cls':
        case 'clear':
            document.querySelector('.terminal-content').innerHTML = '';
            document.querySelector('.terminal-content').appendChild(document.querySelector('.terminal-input-line'));
            return '';

        case 'help':
            let helpText = '\nAvailable commands:\n';
            for (const [cmd, desc] of Object.entries(validCommands)) {
                helpText += `${cmd.padEnd(10)} - ${desc}\n`;
            }
            return helpText;

        case 'echo':
            return args.join(' ');

        case 'date':
            return new Date().toLocaleDateString();

        case 'time':
            return new Date().toLocaleTimeString();

        case 'exit':
            closeFolder('terminal');
            return '';

        case 'mkdir':
            if (args.length === 0) {
                return 'Usage: mkdir <foldername>';
            }
            const newFolder = args[0].toLowerCase();
            if (document.getElementById(`${newFolder}-window`)) {
                return `Folder '${newFolder}' already exists.`;
            }
            createTextFolderWindow(newFolder);
            createDesktopIcon(newFolder);
            openFolder(newFolder);
            return `Folder '${newFolder}' created. You can write text in it.`;

        case 'open':
            if (args.length === 0) {
                return 'Usage: open <filename>';
            }
            const fileName = args[0];
            const fileContent = sessionStorage.getItem(`txtfile-${fileName}`);
            if (fileContent) {
                createTextFolderWindow(fileName);
                createDesktopIcon(fileName);
                const win = document.getElementById(`${fileName}-window`);
                const textarea = win.querySelector(`#${fileName}-textarea`);
                textarea.value = fileContent;
                openFolder(fileName);
                return `Opening '${fileName}'...`;
            } else {
                return `File '${fileName}' not found. Use 'cd txt' and 'dir' to see saved files.`;
            }

        case 'type':
        case 'cat':
            if (args.length === 0) {
                return cmd === 'cat' ? 'Usage: cat <filename>' : 'Usage: type <filename>';
            }
            const typeFileName = args[0].toLowerCase().replace(/\.txt$/, '');
            
            // Check if it's a directory
            const possibleDir = `${currentDirectory}\\${args[0]}`;
            if (validDirectories[possibleDir]) {
                return `cat: ${args[0]}: Is a directory`;
            }
            
            // Check txt folder
            const typeContent = sessionStorage.getItem(`txtfile-${typeFileName}`);
            if (typeContent !== null) {
                if (typeContent === '') {
                    return `(empty file)`;
                }
                return `\n--- Content of ${typeFileName} ---\n\n${typeContent}\n\n--- End of file ---`;
            }
            
            // Check foldertext
            const folderTextContent = sessionStorage.getItem(`foldertext-${typeFileName}`);
            if (folderTextContent !== null) {
                if (folderTextContent === '') {
                    return `(empty file)`;
                }
                return `\n--- Content of ${typeFileName} ---\n\n${folderTextContent}\n\n--- End of file ---`;
            }
            
            return `cat: ${typeFileName}: No such file or directory`;

        case 'notepad':
            if (args.length === 0) {
                // Open blank notepad
                openFolder('notepad');
                return 'Opening Notepad...';
            } else {
                const notepadFileName = args[0].toLowerCase();
                
                // Check if file exists
                const notepadContent = sessionStorage.getItem(`txtfile-${notepadFileName}`) || 
                                      sessionStorage.getItem(`foldertext-${notepadFileName}`);
                
                if (notepadContent) {
                    // Open notepad with the file content
                    const notepadWindow = document.getElementById('notepad-window');
                    const notepadTextarea = document.getElementById('notepad-textarea');
                    
                    if (notepadTextarea) {
                        notepadTextarea.value = notepadContent;
                        openFolder('notepad');
                        return `Opening '${notepadFileName}' in Notepad...`;
                    }
                } else {
                    return `File '${notepadFileName}' not found. Opening blank Notepad...`;
                }
            }
            openFolder('notepad');
            return 'Opening Notepad...';

        default:
            return `'${cmd}' is not recognized as an internal or external command, operable program or batch file.`;
    }
}

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = terminalInput.value.trim();
        if (command) {
            addTerminalOutput(`${currentDirectory}> ${command}`);
            const output = executeCommand(command);
            if (output) {
                addTerminalOutput(output, output.includes('not recognized') || output.includes('cannot find'));
            }
            terminalInput.value = '';
            updatePrompt();
        }
    }
});

// Search functionality
const searchBox = document.querySelector('.search-box input');
const searchResults = document.createElement('div');
searchResults.className = 'search-results';
document.querySelector('.search-box').appendChild(searchResults);

searchBox.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    searchResults.innerHTML = '';
    
    if (searchTerm.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    let results = [];
    
    // Search windows
    const windows = document.querySelectorAll('.window');
    windows.forEach(window => {
        const title = window.querySelector('.window-header').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            results.push({
                name: title,
                icon: window.querySelector('.window-header i')?.className || 'fas fa-window-maximize',
                type: 'window',
                action: () => {
                    window.style.display = 'block';
                    window.style.zIndex = getTopZIndex() + 1;
                }
            });
        }
    });

    // Search social apps
    const socialApps = [
        { name: 'Gmail', icon: 'fab fa-google', url: 'https://gmail.com' },
        { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
        { name: 'Twitter', icon: 'fab fa-twitter', url: 'https://twitter.com' },
        { name: 'Chess.com', icon: 'fas fa-chess', url: 'https://chess.com' },
        { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://youtube.com' },
        { name: 'Spotify', icon: 'fab fa-spotify', url: 'https://spotify.com' },
        { name: 'Google', icon: 'fab fa-google', url: 'https://google.com' },
        { name: 'Amazon', icon: 'fab fa-amazon', url: 'https://amazon.com' },
        { name: 'LeetCode', icon: 'fas fa-code', url: 'https://leetcode.com/u/Ariyan_/' },
        { name: 'GitHub', icon: 'fab fa-github', url: 'https://github.com/Ar404-dotcom' }
    ];

    socialApps.forEach(app => {
        if (app.name.toLowerCase().includes(searchTerm)) {
            results.push({
                name: app.name,
                icon: app.icon,
                type: 'app',
                action: () => window.open(app.url, '_blank')
            });
        }
    });

    if (results.length > 0) {
        searchResults.style.display = 'block';
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <i class="${result.type === 'app' ? result.icon : result.icon}"></i>
                <span>${result.name}</span>
            `;
            resultItem.addEventListener('click', () => {
                result.action();
                searchBox.value = '';
                searchResults.style.display = 'none';
            });
            searchResults.appendChild(resultItem);
        });
    } else {
        searchResults.style.display = 'none';
    }
});

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        searchResults.style.display = 'none';
    }
});

// Terminal window controls functionality
const terminalWindow = document.querySelector('.terminal');
const minimizeBtn = terminalWindow.querySelector('.minimize-btn');
const maximizeBtn = terminalWindow.querySelector('.maximize-btn');
const terminalCloseBtn = terminalWindow.querySelector('.close-btn');

minimizeBtn.addEventListener('click', () => {
    closeFolder('terminal');
});

maximizeBtn.addEventListener('click', () => {
    if (terminalWindow.style.width === '100%') {
        terminalWindow.style.width = '600px';
        terminalWindow.style.height = '400px';
        terminalWindow.style.top = '50%';
        terminalWindow.style.left = '50%';
        terminalWindow.style.transform = 'translate(-50%, -50%)';
    } else {
        terminalWindow.style.width = '100%';
        terminalWindow.style.height = 'calc(100vh - 40px)';
        terminalWindow.style.top = '0';
        terminalWindow.style.left = '0';
        terminalWindow.style.transform = 'none';
    }
});

terminalCloseBtn.addEventListener('click', () => {
    closeFolder('terminal');
});

// Add social media apps to taskbar
const socialApps = [
    { name: 'Gmail', icon: 'fab fa-google', url: 'https://gmail.com' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: 'https://twitter.com' },
    { name: 'Chess.com', icon: 'fas fa-chess', url: 'https://chess.com' },
    { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://youtube.com' },
    { name: 'Spotify', icon: 'fab fa-spotify', url: 'https://spotify.com' },
    { name: 'Google', icon: 'fab fa-google', url: 'https://google.com' },
    { name: 'Amazon', icon: 'fab fa-amazon', url: 'https://amazon.com' },
    { name: 'LeetCode', icon: 'fas fa-code', url: 'https://leetcode.com/u/Ariyan_/' },
    { name: 'GitHub', icon: 'fab fa-github', url: 'https://github.com/Ar404-dotcom' }
];

function addSocialAppsToTaskbar() {
    const taskbarLeft = document.querySelector('.taskbar-left');
    
    socialApps.forEach(app => {
        const appButton = document.createElement('div');
        appButton.className = 'taskbar-item social-app';
        appButton.innerHTML = `<i class="${app.icon}"></i>`;
        appButton.title = app.name;
        
        appButton.addEventListener('click', () => {
            window.open(app.url, '_blank');
        });
        
        taskbarLeft.appendChild(appButton);
    });
}

// Call the function to add social apps
addSocialAppsToTaskbar();

// Weather functionality
async function getWeather() {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=16.5074&longitude=80.6466&hourly=temperature_2m,relative_humidity_2m,rain,cloud_cover&current_weather=true`);
        const data = await response.json();

        const temperature = Math.round(data.current_weather.temperature);
        const weatherIcon = getWeatherIcon(data.current_weather.weathercode);
        
        // Update the existing weather widget instead of creating a new one
        const weatherTemp = document.querySelector('.weather-widget .weather-temp');
        const weatherIconEl = document.querySelector('.weather-widget i');
        
        if (weatherTemp && weatherIconEl) {
            weatherTemp.textContent = `${temperature}°C`;
            weatherIconEl.className = weatherIcon;
        }

        // Update the weather window if it's open
        if (document.getElementById('weather-window').style.display === 'block') {
            updateWeatherWindow(data);
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

function getWeatherIcon(weatherCode) {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    const icons = {
        0: 'fa-sun', // Clear sky
        1: 'fa-sun', // Mainly clear
        2: 'fa-cloud-sun', // Partly cloudy
        3: 'fa-cloud', // Overcast
        45: 'fa-smog', // Foggy
        48: 'fa-smog', // Depositing rime fog
        51: 'fa-cloud-rain', // Light drizzle
        53: 'fa-cloud-rain', // Moderate drizzle
        55: 'fa-cloud-rain', // Dense drizzle
        61: 'fa-cloud-rain', // Slight rain
        63: 'fa-cloud-rain', // Moderate rain
        65: 'fa-cloud-showers-heavy', // Heavy rain
        71: 'fa-snowflake', // Slight snow fall
        73: 'fa-snowflake', // Moderate snow fall
        75: 'fa-snowflake', // Heavy snow fall
        77: 'fa-snowflake', // Snow grains
        80: 'fa-cloud-rain', // Slight rain showers
        81: 'fa-cloud-rain', // Moderate rain showers
        82: 'fa-cloud-showers-heavy', // Violent rain showers
        85: 'fa-snowflake', // Slight snow showers
        86: 'fa-snowflake', // Heavy snow showers
        95: 'fa-bolt', // Thunderstorm
        96: 'fa-bolt', // Thunderstorm with slight hail
        99: 'fa-bolt', // Thunderstorm with heavy hail
    };
    return 'fas ' + (icons[weatherCode] || 'fa-cloud');
}

function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Light Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Light Snow',
        73: 'Moderate Snow',
        75: 'Heavy Snow',
        77: 'Snow Grains',
        80: 'Light Rain Showers',
        81: 'Moderate Rain Showers',
        82: 'Violent Rain Showers',
        85: 'Light Snow Showers',
        86: 'Heavy Snow Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Hail',
        99: 'Thunderstorm with Heavy Hail',
    };
    return descriptions[weatherCode] || 'Partly Cloudy';
}

function updateWeatherBackground(weatherWindow, weatherCode) {
    // Remove all existing weather background classes
    weatherWindow.classList.remove('clear-bg', 'cloudy-bg', 'rainy-bg', 'snowy-bg', 'stormy-bg', 'foggy-bg');
    
    // Add appropriate background class based on weather code
    if (weatherCode === 0 || weatherCode === 1) {
        // Clear/Mainly clear
        weatherWindow.classList.add('clear-bg');
    } else if (weatherCode === 2 || weatherCode === 3) {
        // Partly cloudy/Overcast
        weatherWindow.classList.add('cloudy-bg');
    } else if (weatherCode === 45 || weatherCode === 48) {
        // Foggy
        weatherWindow.classList.add('foggy-bg');
    } else if (weatherCode >= 51 && weatherCode <= 67 || weatherCode >= 80 && weatherCode <= 82) {
        // Rain/Drizzle
        weatherWindow.classList.add('rainy-bg');
    } else if (weatherCode >= 71 && weatherCode <= 77 || weatherCode >= 85 && weatherCode <= 86) {
        // Snow
        weatherWindow.classList.add('snowy-bg');
    } else if (weatherCode >= 95 && weatherCode <= 99) {
        // Thunderstorm
        weatherWindow.classList.add('stormy-bg');
    } else {
        // Default to cloudy
        weatherWindow.classList.add('cloudy-bg');
    }
}

// Initialize weather and clock widgets
document.addEventListener('DOMContentLoaded', () => {
    const weatherWidget = document.querySelector('.weather-widget');
    const weatherWindow = document.getElementById('weather-window');
    const clockWidget = document.querySelector('.time-date');
    const clockWindow = document.getElementById('clock-window');

    // Restore desktop icons from session
    restoreDesktopIcons();

    // Fetch weather on page load to update the taskbar widget
    getWeather();

    // Weather widget click handler
    if (weatherWidget) {
        weatherWidget.onclick = function() {
            if (weatherWindow) {
                weatherWindow.style.display = weatherWindow.style.display === 'block' ? 'none' : 'block';
                if (weatherWindow.style.display === 'block') {
                    weatherWindow.style.zIndex = getHighestZIndex() + 1;
                    getWeather();
                }
            }
        };
    }

    // Clock widget click handler
    if (clockWidget) {
        clockWidget.onclick = function() {
            if (clockWindow) {
                clockWindow.style.display = clockWindow.style.display === 'block' ? 'none' : 'block';
                if (clockWindow.style.display === 'block') {
                    clockWindow.style.zIndex = getHighestZIndex() + 1;
                    updateClockWindow();
                    initAnalogClock();
                }
            }
        };
    }

    // Make windows draggable
    if (weatherWindow) makeDraggable(weatherWindow);
    if (clockWindow) makeDraggable(clockWindow);

    // Initialize Notepad
    initNotepad();

    // Add close button functionality to both windows
    const closeButtons = document.querySelectorAll('#weather-window .close-btn, #clock-window .close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const window = button.closest('.window');
            if (window) {
                window.style.display = 'none';
                
                // Clear any intervals if it's the clock window
                if (window.id === 'clock-window' && window.dataset.intervalId) {
                    clearInterval(parseInt(window.dataset.intervalId));
                }
            }
        });
    });
});

// Add analog clock functionality
function initAnalogClock() {
    const clockContent = document.querySelector('#clock-window .clock-details');
    const analogClock = document.createElement('div');
    analogClock.className = 'analog-clock';
    
    analogClock.innerHTML = `
        <div class="clock-face">
            <div class="center-dot"></div>
            <div class="hand hour-hand"></div>
            <div class="hand minute-hand"></div>
            <div class="hand second-hand"></div>
            ${Array.from({length: 12}, (_, i) => 
                `<div class="hour-marker" style="transform: rotate(${i * 30}deg)"></div>`
            ).join('')}
        </div>
    `;
    
    // Insert analog clock at the beginning of clock content
    clockContent.insertBefore(analogClock, clockContent.firstChild);
    
    updateAnalogClock();
    setInterval(updateAnalogClock, 1000);
}

function updateAnalogClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;
    
    const secondDeg = (seconds / 60) * 360;
    const minuteDeg = ((minutes + seconds / 60) / 60) * 360;
    const hourDeg = ((hours + minutes / 60) / 12) * 360;
    
    const hourHand = document.querySelector('.hour-hand');
    const minuteHand = document.querySelector('.minute-hand');
    const secondHand = document.querySelector('.second-hand');
    
    if (hourHand && minuteHand && secondHand) {
        hourHand.style.transform = `rotate(${hourDeg}deg)`;
        minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
        secondHand.style.transform = `rotate(${secondDeg}deg)`;
    }
}

// Update weather window with detailed information
function updateWeatherWindow(data) {
    const weatherWindow = document.getElementById('weather-window');
    const tempLarge = document.getElementById('weather-temp-large');
    const locationLarge = document.getElementById('weather-location-large');
    const feelsLike = document.getElementById('weather-feels-like');
    const humidity = document.getElementById('weather-humidity');
    const wind = document.getElementById('weather-wind');
    const weatherIcon = weatherWindow.querySelector('.weather-icon-main');
    const cloudEl = document.getElementById('weather-cloud');
    const weatherDesc = document.getElementById('weather-description');

    // Use Open-Meteo API structure
    // Get current values
    const temp = data.current_weather.temperature;
    const cloud = data.hourly.cloud_cover[0];
    const humid = data.hourly.relative_humidity_2m[0];
    const windSpeed = data.current_weather.windspeed;
    const location = 'Vijayawada'; // Or use a variable if available

    // Update main temperature and location
    tempLarge.textContent = Math.round(temp);
    locationLarge.textContent = location;

    // Update detailed information
    feelsLike.textContent = `${Math.round(temp)}°C`;
    humidity.textContent = `${humid}%`;
    wind.textContent = `${windSpeed} km/h`;
    if (cloudEl) cloudEl.textContent = `${cloud}%`;

    // Update weather icon and description based on weather condition
    const weatherCode = data.current_weather.weathercode;
    weatherIcon.className = 'weather-icon-main ' + getWeatherIcon(weatherCode).replace('fas ', '');
    
    // Update weather description
    const description = getWeatherDescription(weatherCode);
    if (weatherDesc) weatherDesc.textContent = description;

    // Change background based on weather condition
    updateWeatherBackground(weatherWindow, weatherCode);

    weatherWindow.style.display = 'block';
}

function updateClockWindow() {
    const digitalClock = document.querySelector('#clock-window .digital-clock');
    const dateFull = document.querySelector('#clock-window .date-full');
    const utcTime = document.querySelector('#clock-window .utc-time');
    const localTime = document.querySelector('#clock-window .local-time');

    if (!digitalClock || !dateFull || !utcTime || !localTime) {
        console.error('Clock window elements not found');
        return;
    }

    function update() {
        const now = new Date();
        
        digitalClock.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        dateFull.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
            
        });

        utcTime.textContent = now.toUTCString().split(' ')[4];
        localTime.textContent = now.toLocaleTimeString('en-US');
    }

    update();
    const intervalId = setInterval(update, 1000);

    // Store the interval ID on the window element
    clockWindow.dataset.intervalId = intervalId;

    // Clear interval when window is closed
    const closeBtn = clockWindow.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearInterval(intervalId);
        });
    }
}

// Mobile touch handling
let touchStartX = 0;
let touchStartY = 0;
let initialWindowX = 0;
let initialWindowY = 0;
let isDragging = false;

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    const window = e.target.closest('.window');
    if (window && e.target.closest('.window-header')) {
        isDragging = true;
        const rect = window.getBoundingClientRect();
        initialWindowX = rect.left;
        initialWindowY = rect.top;
    }
}

function handleTouchMove(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    const window = e.target.closest('.window');
    if (window) {
        window.style.left = `${initialWindowX + deltaX}px`;
        window.style.top = `${initialWindowY + deltaY}px`;
        window.style.transform = 'none';
    }
}

function handleTouchEnd() {
    isDragging = false;
}

// Add touch event listeners
document.addEventListener('touchstart', handleTouchStart, { passive: false });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd);

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Adjust behavior for mobile
if (isMobile) {
    // Double tap to close windows
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        const window = e.target.closest('.window');
        
        if (tapLength < 500 && tapLength > 0 && window) {
            window.style.display = 'none';
        }
        lastTap = currentTime;
    });

    // Prevent zoom on double tap
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
            e.preventDefault();
        }
        lastTap = now;
    }, { passive: false });

    // Adjust window positioning for mobile
    const windows = document.querySelectorAll('.window');
    windows.forEach(window => {
        window.style.transform = 'none';
        window.style.left = '5%';
        window.style.top = '10%';
        window.style.width = '90%';
    });
}

// Handle orientation change
window.addEventListener('orientationchange', () => {
    const windows = document.querySelectorAll('.window');
    windows.forEach(window => {
        if (window.style.display === 'block') {
            window.style.left = '5%';
            window.style.top = '10%';
        }
    });
});

// Improve mobile scrolling
document.querySelectorAll('.window-content, .terminal-content, .start-menu-items').forEach(element => {
    element.addEventListener('touchstart', () => {
        element.style.overflow = 'auto';
    });
});

// Helper to create a folder window with a textarea for text
function createTextFolderWindow(folderName) {
    // Create window element
    const win = document.createElement('div');
    win.className = 'window';
    win.id = `${folderName}-window`;
    win.innerHTML = `
        <div class="window-header">
            <span><i class="fas fa-folder"></i> ${folderName.charAt(0).toUpperCase() + folderName.slice(1)}</span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="window-content">
            <textarea id="${folderName}-textarea" style="width:100%;height:200px;resize:vertical;padding:10px;background:rgba(20,20,20,0.8);color:#fff;border:1px solid rgba(255,255,255,0.1);font-family:Consolas,monospace;"></textarea>
            <div style="display:flex;gap:10px;margin-top:10px;align-items:center;">
                <button id="${folderName}-save-btn" style="padding:8px 16px;background:rgba(96,165,250,0.2);border:1px solid rgba(96,165,250,0.3);color:#fff;border-radius:6px;cursor:pointer;">
                    <i class="fas fa-save"></i> Save
                </button>
                <button id="${folderName}-savetxt-btn" style="padding:8px 16px;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.3);color:#fff;border-radius:6px;cursor:pointer;">
                    <i class="fas fa-folder-plus"></i> Save to txt Folder
                </button>
                <button id="${folderName}-download-btn" style="padding:8px 16px;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.3);color:#fff;border-radius:6px;cursor:pointer;">
                    <i class="fas fa-download"></i> Download
                </button>
                <span id="${folderName}-save-status" style="margin-left:10px;color:#4caf50;"></span>
            </div>
        </div>
    `;
    document.body.appendChild(win);
    makeDraggable(win);

    // Save/load logic
    const textarea = win.querySelector(`#${folderName}-textarea`);
    const saveBtn = win.querySelector(`#${folderName}-save-btn`);
    const saveTxtBtn = win.querySelector(`#${folderName}-savetxt-btn`);
    const downloadBtn = win.querySelector(`#${folderName}-download-btn`);
    const saveStatus = win.querySelector(`#${folderName}-save-status`);
    
    // Load saved text from sessionStorage (temporary storage)
    textarea.value = sessionStorage.getItem(`foldertext-${folderName}`) || '';
    
    // Save button - saves to current session only
    saveBtn.onclick = function() {
        sessionStorage.setItem(`foldertext-${folderName}`, textarea.value);
        saveStatus.textContent = 'Saved!';
        setTimeout(()=>{ saveStatus.textContent = ''; }, 1500);
    };
    
    // Save to txt folder button - saves to virtual txt folder
    saveTxtBtn.onclick = function() {
        const content = textarea.value;
        if (content.trim() === '') {
            saveStatus.textContent = 'Nothing to save!';
            saveStatus.style.color = '#ff6b6b';
            setTimeout(()=>{ saveStatus.textContent = ''; saveStatus.style.color = '#4caf50'; }, 2000);
            return;
        }
        sessionStorage.setItem(`txtfile-${folderName}`, content);
        addToSavedFiles(folderName);
        saveStatus.textContent = `Saved to txt folder! Use 'cd txt' and 'dir' to see it.`;
        setTimeout(()=>{ saveStatus.textContent = ''; }, 3000);
    };
    
    // Download button - downloads as real .txt file
    downloadBtn.onclick = function() {
        const content = textarea.value;
        if (content.trim() === '') {
            saveStatus.textContent = 'Nothing to download!';
            saveStatus.style.color = '#ff6b6b';
            setTimeout(()=>{ saveStatus.textContent = ''; saveStatus.style.color = '#4caf50'; }, 2000);
            return;
        }
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        saveStatus.textContent = 'Downloaded!';
        setTimeout(()=>{ saveStatus.textContent = ''; }, 2000);
    };
    
    // Close button
    win.querySelector('.close-btn').onclick = function() {
        win.style.display = 'none';
    };
}

// Notepad functionality
function initNotepad() {
    const notepadWindow = document.getElementById('notepad-window');
    const textarea = document.getElementById('notepad-textarea');
    const saveBtn = document.getElementById('notepad-save');
    const saveTxtBtn = document.getElementById('notepad-savetxt');
    const downloadBtn = document.getElementById('notepad-download');
    const newBtn = document.getElementById('notepad-new');
    const clearBtn = document.getElementById('notepad-clear');
    const status = document.getElementById('notepad-status');
    const savedFilesList = document.getElementById('saved-files-list');

    if (!notepadWindow || !textarea) return;

    // Make notepad draggable
    makeDraggable(notepadWindow);

    // Load and display saved files
    updateSavedFilesList();

    // Load saved content from sessionStorage (temporary storage)
    const savedContent = sessionStorage.getItem('notepad-content');
    if (savedContent) {
        textarea.value = savedContent;
    }

    // Auto-save on typing (with debounce)
    let saveTimeout;
    textarea.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            sessionStorage.setItem('notepad-content', textarea.value);
            showStatus('Auto-saved', 2000);
        }, 1000);
    });

    // Save button
    saveBtn.addEventListener('click', () => {
        sessionStorage.setItem('notepad-content', textarea.value);
        showStatus('Saved successfully!', 2000);
    });

    // Save to txt folder button
    saveTxtBtn.addEventListener('click', () => {
        const content = textarea.value;
        if (content.trim() === '') {
            showStatus('Nothing to save!', 2000, '#ff6b6b');
            return;
        }
        
        const fileName = prompt('Enter filename (without .txt extension):');
        if (fileName && fileName.trim() !== '') {
            const cleanFileName = fileName.trim().toLowerCase().replace(/\s+/g, '_');
            sessionStorage.setItem(`txtfile-${cleanFileName}`, content);
            addToSavedFiles(cleanFileName);
            updateSavedFilesList();
            showStatus(`Saved as '${cleanFileName}' in txt folder!`, 3000);
        }
    });

    // Download button
    downloadBtn.addEventListener('click', () => {
        const content = textarea.value;
        if (content.trim() === '') {
            showStatus('Nothing to download!', 2000, '#ff6b6b');
            return;
        }
        
        const fileName = prompt('Enter filename (without .txt extension):', 'note');
        if (fileName && fileName.trim() !== '') {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName.trim()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showStatus('Downloaded successfully!', 2000);
        }
    });

    // New button
    newBtn.addEventListener('click', () => {
        if (textarea.value.trim() !== '') {
            if (confirm('Create a new note? Current content will be cleared.')) {
                textarea.value = '';
                sessionStorage.removeItem('notepad-content');
                showStatus('New note created', 2000);
            }
        } else {
            textarea.value = '';
            showStatus('New note created', 2000);
        }
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all content?')) {
            textarea.value = '';
            sessionStorage.removeItem('notepad-content');
            showStatus('Content cleared', 2000);
        }
    });

    function showStatus(message, duration = 2000, color = '#4caf50') {
        status.textContent = message;
        status.style.color = color;
        status.style.opacity = '1';
        setTimeout(() => {
            status.style.opacity = '0';
        }, duration);
    }

    function updateSavedFilesList() {
        if (!savedFilesList) return;
        
        const files = getSavedTextFiles();
        
        if (files.length === 0) {
            savedFilesList.innerHTML = '<p style="color:rgba(255,255,255,0.5);font-size:12px;padding:10px;">No saved files yet</p>';
            return;
        }
        
        savedFilesList.innerHTML = '';
        files.forEach(fileName => {
            const fileItem = document.createElement('div');
            fileItem.className = 'saved-file-item';
            fileItem.innerHTML = `<i class="fas fa-file-alt"></i> ${fileName}`;
            fileItem.onclick = () => {
                const content = sessionStorage.getItem(`txtfile-${fileName}`);
                if (content) {
                    textarea.value = content;
                    showStatus(`Opened '${fileName}'`, 2000);
                }
            };
            savedFilesList.appendChild(fileItem);
        });
    }

    // Refresh saved files list when notepad is opened
    notepadWindow.addEventListener('click', () => {
        if (notepadWindow.style.display === 'block') {
            updateSavedFilesList();
        }
    });
}
