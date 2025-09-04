class LofiTimer {
    constructor() {
        this.workTime = 25 * 60; // 25 minutes in seconds
        this.breakTime = 5 * 60; // 5 minutes in seconds
        this.longBreakTime = 15 * 60; // 15 minutes in seconds
        this.currentTime = this.workTime;
        this.isRunning = false;
        this.isWorkTime = true;
        this.sessionCount = 0;
        this.timer = null;
        this.circumference = 2 * Math.PI * 140; // For progress ring
        this.soundcloudWidget = null; // SoundCloud widget instance
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.initializeSoundCloud();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.sessionCountElement = document.getElementById('session-count');
        this.modeIndicator = document.getElementById('mode-indicator');
        this.progressCircle = document.querySelector('.progress-ring-circle');
    }

    setupEventListeners() {
        console.log("Setting up event listeners...");
        console.log("Start button:", this.startBtn);
        console.log("Pause button:", this.pauseBtn);
        console.log("Reset button:", this.resetBtn);
        
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Background switching
        document.querySelectorAll('.bg-option').forEach(option => {
            option.addEventListener('click', (e) => this.switchBackground(e.target.closest('.bg-option').dataset.bg));
        });

        
        // Weather effect switching
        document.querySelectorAll('.weather-option').forEach(option => {
            option.addEventListener('click', (e) => this.switchWeather(e.target.closest('.weather-option').dataset.weather));
        });
    }

    initializeSoundCloud() {
        // Initialize SoundCloud Widget API
        const iframe = document.getElementById('soundcloud-widget');
        if (iframe && window.SC) {
            this.soundcloudWidget = window.SC.Widget(iframe);
            
            // Wait for widget to be ready
            this.soundcloudWidget.bind(window.SC.Widget.Events.READY, () => {
                console.log('SoundCloud widget is ready');
                // Set initial volume (0-100)
                this.soundcloudWidget.setVolume(50);
            });
            
            // Bind events for better control
            this.soundcloudWidget.bind(window.SC.Widget.Events.PLAY, () => {
                console.log('SoundCloud started playing');
            });
            
            this.soundcloudWidget.bind(window.SC.Widget.Events.PAUSE, () => {
                console.log('SoundCloud paused');
            });
            
            this.soundcloudWidget.bind(window.SC.Widget.Events.FINISH, () => {
                console.log('SoundCloud track finished');
            });
        } else {
            console.log('SoundCloud Widget API not available');
        }
    }

    playSoundCloud() {
        if (this.soundcloudWidget) {
            this.soundcloudWidget.play();
        }
    }

    pauseSoundCloud() {
        if (this.soundcloudWidget) {
            this.soundcloudWidget.pause();
        }
    }

    startTimer() {
        console.log("startTimer called");
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'flex';
            
            // Start playing SoundCloud playlist
            this.playSoundCloud();
            
            this.timer = setInterval(() => {
                this.currentTime--;
                this.updateDisplay();
                
                if (this.currentTime <= 0) {
                    this.completeSession();
                }
            }, 1000);
        }
    }

    pauseTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startBtn.style.display = 'flex';
            this.pauseBtn.style.display = 'none';
            
            // Pause SoundCloud playlist
            this.pauseSoundCloud();
            
            clearInterval(this.timer);
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.currentTime = this.workTime;
        this.isWorkTime = true;
        this.sessionCount = 0;
        this.updateDisplay();
        this.updateModeIndicator();
        this.updateSessionCount();
        // Pause SoundCloud when resetting
        this.pauseSoundCloud();
    }

    completeSession() {
        this.pauseTimer();
        
        if (this.isWorkTime) {
            this.sessionCount++;
            this.updateSessionCount();
            
            // Show completion notification
            this.showNotification('Work session completed! Take a break.');
            
            // Switch to break time
            if (this.sessionCount % 4 === 0) {
                this.currentTime = this.longBreakTime;
                this.modeIndicator.textContent = 'Long Break';
            } else {
                this.currentTime = this.breakTime;
                this.modeIndicator.textContent = 'Short Break';
            }
            this.isWorkTime = false;
        } else {
            // Break completed, back to work
            this.currentTime = this.workTime;
            this.isWorkTime = true;
            this.modeIndicator.textContent = 'Work Time';
            this.showNotification('Break completed! Time to focus.');
        }
        
        this.updateDisplay();
        this.updateModeIndicator();
        
        // Add completion animation
        this.timeDisplay.classList.add('timer-complete');
        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 500);
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress ring
        this.updateProgressRing();
    }

    updateProgressRing() {
        const totalTime = this.isWorkTime ? this.workTime : (this.sessionCount % 4 === 0 ? this.longBreakTime : this.breakTime);
        const progress = 1 - (this.currentTime / totalTime);
        const offset = this.circumference - (progress * this.circumference);
        
        this.progressCircle.style.strokeDashoffset = offset;
    }

    updateSessionCount() {
        this.sessionCountElement.textContent = this.sessionCount;
    }

    updateModeIndicator() {
        if (this.isWorkTime) {
            this.modeIndicator.textContent = 'Work Time';
        } else if (this.sessionCount % 4 === 0) {
            this.modeIndicator.textContent = 'Long Break';
        } else {
            this.modeIndicator.textContent = 'Short Break';
        }
    }

    switchBackground(backgroundId) {
        console.log("switchBackground called with:", backgroundId);
        // Remove active class from all backgrounds
        document.querySelectorAll('.background').forEach(bg => {
            bg.classList.remove('active');
            // Pause all videos
            const video = bg.querySelector('video');
            if (video) {
                video.pause();
            }
        });
        
        // Add active class to selected background
        const activeBg = document.getElementById(backgroundId);
        activeBg.classList.add('active');
        
        // Play the video in the active background
        const activeVideo = activeBg.querySelector('video');
        if (activeVideo) {
            activeVideo.currentTime = 0;
            activeVideo.play().catch(e => {
                console.log('Video play failed:', e);
            });
        }
        
        // Update button states
        document.querySelectorAll('.bg-option').forEach(option => {
            option.classList.remove('active');
        });
        
        document.querySelector(`[data-bg="${backgroundId}"]`).classList.add('active');
    }

    switchWeather(weatherType) {
        console.log("switchWeather called with:", weatherType);
        // Hide all weather overlays
        document.querySelectorAll('.weather-overlay').forEach(overlay => {
            overlay.style.display = 'none';
        });
        
        // Show selected weather overlay
        if (weatherType !== 'none') {
            document.getElementById(`${weatherType}-overlay`).style.display = 'block';
        }
        
        // Update button states
        document.querySelectorAll('.weather-option').forEach(option => {
            option.classList.remove('active');
        });
        
        document.querySelector(`[data-weather="${weatherType}"]`).classList.add('active');
    }


    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(46, 204, 113, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing LofiTimer...");
    const lofiTimer = new LofiTimer();
    
    // Ensure the initial video plays
    const initialVideo = document.querySelector('#rayquaza-bg video');
    if (initialVideo) {
        initialVideo.play().catch(e => {
            console.log('Initial video play failed:', e);
        });
    }
    
    // Add video event listeners for better playback handling
    document.querySelectorAll('video').forEach(video => {
        video.addEventListener('loadeddata', () => {
            console.log('Video loaded:', video.src);
            if (video.parentElement.classList.contains('active')) {
                video.play().catch(e => {
                    console.log('Video autoplay failed:', e);
                });
            }
        });
        
        video.addEventListener('error', (e) => {
            console.log('Video error:', e);
        });
        
        video.addEventListener('play', () => {
            console.log('Video started playing:', video.src);
        });
    });
    
    // Add rain and snow particles
    function addParticles() {
        // Add rain particles to rain overlay
        const rainOverlay = document.getElementById("rain-overlay");
        if (rainOverlay) {
            for (let i = 0; i < 20; i++) {
                const rain = document.createElement("div");
                rain.className = "rain";
                rain.style.left = Math.random() * 100 + "%";
                rain.style.animationDuration = (Math.random() * 1 + 1) + "s";
                rain.style.animationDelay = Math.random() * 2 + "s";
                rainOverlay.appendChild(rain);
            }
        }
        
        // Add snow particles to snow overlay
        const snowOverlay = document.getElementById("snow-overlay");
        if (snowOverlay) {
            for (let i = 0; i < 15; i++) {
                const snow = document.createElement("div");
                snow.className = "snow";
                snow.style.left = Math.random() * 100 + "%";
                snow.style.animationDuration = (Math.random() * 4 + 8) + "s";
                snow.style.animationDelay = Math.random() * 5 + "s";
                snowOverlay.appendChild(snow);
            }
        }
    }
    
    // Add particles after a short delay
    setTimeout(addParticles, 1000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (lofiTimer.isRunning) {
                lofiTimer.pauseTimer();
            } else {
                lofiTimer.startTimer();
            }
        } else if (e.code === 'KeyR') {
            lofiTimer.resetTimer();
        }
    });
    
    // Add service worker for PWA capabilities (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }
});