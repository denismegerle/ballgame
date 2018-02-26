var app = {
	initialize : function() {
		this.bindEvents();

		// getting device type and operating system through user agent
		deviceType = detectDeviceType();
		operatingSystem = getMobileOperatingSystem();
		isTablet = isTablet();
		
		init();
	},
	bindEvents : function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	onDeviceReady : function() {
		app.receivedEvent('deviceready');
	},
	receivedEvent : function(id) {
		var parentElement = document.getElementById(id);
		var listeningElement = parentElement.querySelector('.listening');
		var receivedElement = parentElement.querySelector('.received');

		listeningElement.setAttribute('style', 'display:none;');
		receivedElement.setAttribute('style', 'display:block;');

		console.log('Received Event: ' + id);
	}
};

/**
 * Detecting the device type through UA.
 */
const detectDeviceType = () =>
/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ? 'Mobile'
    : 'Desktop';

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * from an answer here... https://stackoverflow.com/questions/21741841/detecting-ios-android-operating-system
 * @returns {String}
 */
function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}

function isTablet() {
	return /Tablet|iPad/i.test(navigator.userAgent);
}

var operatingSystem;
var deviceType;
var isTablet;

if (!window.requestAnimationFrame) {

	window.requestAnimationFrame = (function() {

		return window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| window.oRequestAnimationFrame
				|| window.msRequestAnimationFrame
				|| function(callback, element) {
					window.setTimeout(callback, 1000 / 60);
				};

	})();

}

var ball;
var ballRadius = 80 / 2;
var goalRadius = 50 / 2;
var goal;
var paused = false;
var over = false;
var timerInterval;
var standardDesktopVelocity = 10;

var score = 0;
var time = 0;

var w;
var h;

function init() {
	ball = document.getElementById("ball");
	w = window.innerWidth;
	h = window.innerHeight;

	ball.style.left = (w / 2) - ballRadius + "px";
	ball.style.top = (h / 2) - ballRadius + "px";
	ball.velocity = {
		x : 0,
		y : 0
	}
	ball.pos = {
		x : 0,
		y : 0
	}

	if (deviceType == "Mobile") {
		initMobile();
	} else if (deviceType == "Desktop") {
		initDesktop();
	} else {
		alert("Device type not recognized, defaulting to mobile...");
		initMobile();
	}

	createGoal();
	updateScore();
	timerInterval = setInterval(updateTimer, 100);
	
	update();
}

function initMobile() {	
	if ("ondevicemotion" in window) {
		window.ondevicemotion = function(e) {
			if (operatingSystem == "Android") {
				ball.velocity.y = Math.round(4 * event.accelerationIncludingGravity.y);
				ball.velocity.x = Math.round(-4 * event.accelerationIncludingGravity.x);
			} else if (operatingSystem == "iOS") {
				ball.velocity.y = Math.round(-3 * event.accelerationIncludingGravity.y);
				ball.velocity.x = Math.round(3 * event.accelerationIncludingGravity.x);
			}
		}
			
		var shakeEvent = new Shake({threshold: 15});
	    shakeEvent.start();
	    window.addEventListener('shake', function(){
	        resetGame();
	    }, false);

	    //stop listening
	    function stopShake(){
	        shakeEvent.stop();
	    }
	}
	
	window.addEventListener('orientationchange', function() {
		if (isTablet) {
			if (window.orientation == 0) {
				pauseGame();
			} else {
				unpauseGame();
			}	
		} else {
			if (window.orientation == 90 || window.orientation == -90) {
				pauseGame();
			} else {
				unpauseGame();
			}	
		}
		
	});
}

function initDesktop() {
	document.onkeydown = function(e) {
		e = e || window.event;
		var charCode = e.keyCode;
		
		if (charCode == 40) {			// down key
			ball.velocity.y = standardDesktopVelocity;
		} else if (charCode == 39) {	// right key
			ball.velocity.x = standardDesktopVelocity;
		} else if (charCode == 38) {	// up key
			ball.velocity.y = -standardDesktopVelocity;
		} else if (charCode == 37) {	// left key
			ball.velocity.x = -standardDesktopVelocity;
		}
	}
	
	document.onkeyup = function(e) {
		e = e || window.event;
		var charCode = e.keyCode;
		
		if (charCode == 40) {			// down key
			ball.velocity.y = 0;
		} else if (charCode == 39) {	// right key
			ball.velocity.x = 0;
		} else if (charCode == 38) {	// up key
			ball.velocity.y = 0;
		} else if (charCode == 37) {	// left key
			ball.velocity.x = 0;
		}
	}
	
	document.onkeypress = function(e) {
		e = e || window.event;
		var charCode = e.keyCode;
		
		if (charCode == 112) {			// p button, pause
			if (!paused) {
				pauseGame();
			} else {
				unpauseGame();
			}
		} else if (charCode == 114) {
			resetGame();
		}
	}
}

function pauseGame() {
	paused = true;
	document.getElementById("pause").style.visibility = 'visible';
}

function unpauseGame() {
	paused = false;
	document.getElementById("pause").style.visibility = 'hidden';
}

function createGoal() {
	goal = document.getElementById("goal");
	goal.pos = {
		x : 0,
		y : 0
	}

	goal.pos.x = Math.floor(Math.random() * (w - goalRadius));
	goal.pos.y = Math.floor(Math.random() * (h - goalRadius));

	goal.style.left = goal.pos.x + "px";
	goal.style.top = goal.pos.y + "px";
}

function updateScore() {
	document.getElementById("score").innerHTML = score;
}

function round(num, precision = 2) {
	var scaled = Math.round(num + "e" + precision);
	return Number(scaled + "e" + -precision);
}

function updateTimer() {
	if (over) return;
	if (time >= 30) { 
		paused = true; 
		over = true;
		document.getElementById("over").style.visibility = 'visible';
	};
	if (paused)
		return;
	
	time += 0.1;
	timer = document.getElementById("timer");
	timer.innerHTML = round(time);
}

/**
 * Simple round object collision checker through radius
 * 
 * @returns
 */
function checkCollision() {
	var dx = (ball.pos.x + ballRadius)
			- (goal.pos.x + goalRadius);
	var dy = (ball.pos.y + ballRadius)
			- (goal.pos.y + goalRadius);
	var distance = Math.sqrt(dx * dx + dy * dy);

	if (distance < ballRadius + goalRadius) {
		return true;
	}
	return false;
}

function resetGame() {
	time = 0;
	score = 0;
	
	over = false;
	document.getElementById("over").style.visibility = 'hidden';
	updateScore();
	unpauseGame();
	
	createGoal();
}

function update() {
	ball.pos.x += ball.velocity.x;
	ball.pos.y += ball.velocity.y;

	if (ball.pos.y > (h - ballRadius * 2) && ball.velocity.y > 0) {
		ball.pos.y = h - ballRadius * 2;
	}

	if (ball.pos.y < 0 && ball.velocity.y < 0) {
		ball.pos.y = 0;
	}
	
	if (ball.pos.x > (w - ballRadius * 2) && ball.velocity.x > 0) {
		ball.pos.x = w - ballRadius * 2;
	}

	if (ball.pos.x < 0 && ball.velocity.x < 0) {
		ball.pos.x = 0;
	}

	if (!paused) {	// if paused just dont move them
		ball.style.top = ball.pos.y + "px"
		ball.style.left = ball.pos.x + "px"
	}
	
	if (checkCollision()) {
		score++;
		updateScore();
		createGoal();
	}
	
	requestAnimationFrame(update);
}