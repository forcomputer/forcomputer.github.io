// File: scripts.js

// Prevent the browser from navigating away without confirmation
// window.addEventListener('beforeunload', function (e) {
//   e.preventDefault();
// });

//-----------------------------------------------------------------
//   Global constants and variables
//-----------------------------------------------------------------

// Global constants
window.maxStars = 8;      // Maximum number of stars allowed
window.maxSticker = 20;   // Maximum number of gifts allowed
window.cookieDay = 7;     // Number of days before cookies expire

// Global variables
window.operator = '+';        // Default operator
window.operatorView = '+';    // Default operator view
window.level = 10;           // Default level (Easy)
window.stickerFolder = 'BoySticker/'; // Folder for sticker images
window.starNumber = 0;       // Starting number for the game
window.stickerNumber = 0;    // Starting number for the sticker
window.firstNumber = 0;      // First number in the equation
window.secondNumber = 0;     // Second number in the equation
window.saved = 'no';         // Flag to indicate if settings have been saved

//-----------------------------------------------------------------
//   Sound effects and utility functions
//-----------------------------------------------------------------

// Sound effects
window.soundPositive = new Audio('sound/sound_positive.mp3');
window.soundNegative = new Audio('sound/sound_negative.mp3');
window.soundSticker = new Audio('sound/sound_sticker.mp3');

//-----------------------------------------------------------------
//   Page initialization and event listeners
//-----------------------------------------------------------------

// Global event listeners
window.addEventListener("resize", handleResize);

// Function to determine current page
window.getCurrentPage = function () {
    const path = window.location.pathname;
    return path.split('/').pop(); // Gets the file name from path
}

// Initialize the game with default settings
window.onload = function () {
    window.getAllCookies();
    window.handleResize();

    // Determine which page is currently loaded and update accordingly
    const currentPage = window.getCurrentPage();
    if (currentPage === 'instruction.html') {
        window.updateSelector();
    }
    else if (currentPage === 'the_numbers.html') {
        if (window.saved === 'no') {
            window.location.href = './instruction.html';
        } else {
            window.updateStar();
            window.updateSticker();
            window.resetNumbers();
        }
    }
}

// Function to decrease font sizes of all elements by 1px
window.decreaseAllFontSizes = function () {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        const style = window.getComputedStyle(el).getPropertyValue('font-size');
        const currentSize = parseFloat(style);
        if (!isNaN(currentSize) && currentSize > 1) {
            el.style.fontSize = (currentSize - 60) + 'px';
        }
    });
}

// Function to check if the device is mobile
window.isMobile = function () {
    return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

// Function to get the current orientation of the device
function handleResize() {
    const currentPage = window.getCurrentPage();
    if (currentPage === 'instruction.html') {
        if (!window.isMobile()) {
            // if (window.innerHeight < window.innerWidth) window.decreaseAllFontSizes()
        }
    }
    else if (currentPage === 'the_numbers.html') {
        const container = document.querySelector('.numbers-container');
        const additionalContainer = document.querySelector('.additional-container');
        const imageBorderLeft = document.querySelector('.imgBorderLeft');
        const imageBorderRight = document.querySelector('.imgBorderRight');
        additionalContainer.style.gridTemplateColumns = 'auto auto auto auto auto auto';
        additionalContainer.style.gridTemplateRows = '9vw 17vw';
        imageBorderLeft.style.height = 'auto';
        imageBorderRight.style.height = 'auto';

        if (window.innerHeight > window.innerWidth) {
            //alert('Portrait');
            container.style.gridTemplateColumns = 'auto auto auto auto auto';
            imageBorderLeft.style.width = '0vw';
            imageBorderRight.style.width = '0vw';
        } else {
            //alert('Landscape');
            container.style.gridTemplateColumns = 'auto auto auto auto auto auto auto auto auto auto';
            imageBorderLeft.style.width = '7vw';
            imageBorderRight.style.width = '7vw';
        }
    }
}

// Prevent F5 key from refreshing the page
// This is useful for preventing accidental page refreshes during gameplay
document.addEventListener('keydown', function (event) {
    // F5 has key code 116
    if (event.key === 'F5' || event.keyCode === 116) {
        event.preventDefault(); // Prevent the default refresh behavior
        console.log('F5 was pressed!');
        // You can trigger your custom logic here
    }
});

//-----------------------------------------------------------------
//   Game start function
//-----------------------------------------------------------------

window.startGame = function () {
    // reset star and sticker cookies
    window.starNumber = 0;
    window.stickerNumber = 0;
    window.saved = 'yes';

    // Save current settings to cookies before starting the game
    window.updateCookies();

    // Redirect to the game page
    window.location.href = './the_numbers.html';
}

//-----------------------------------------------------------------
//   Cookie management functions
//-----------------------------------------------------------------

// Function to update cookies with current settings
window.updateCookies = function () {
    setCookie('stickerFolder', window.stickerFolder, cookieDay);
    setCookie('operator', window.operator, cookieDay);
    setCookie('starNumber', window.starNumber.toString(), cookieDay);
    setCookie('stickerNumber', window.stickerNumber.toString(), cookieDay);
    setCookie('level', window.level.toString(), cookieDay);
    setCookie('saved', window.saved, cookieDay);
}

// Function to set a cookie
window.setCookie = function (name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Function to get all cookies and set default values if not present
window.getAllCookies = function () {
    window.getCookie('stickerFolder') ? window.stickerFolder = getCookie('stickerFolder') : window.stickerFolder = 'BoySticker/';
    window.getCookie('operator') ? window.operator = getCookie('operator') : window.operator = '+';
    window.getCookie('starNumber') ? window.starNumber = parseInt(getCookie('starNumber')) : window.starNumber = 0;
    window.getCookie('stickerNumber') ? window.stickerNumber = parseInt(getCookie('stickerNumber')) : window.stickerNumber = 0;
    window.getCookie('level') ? window.level = parseInt(getCookie('level')) : window.level = 10;
    window.getCookie('saved') ? window.saved = getCookie('saved') : window.saved = 'no';
}

// Function to get a cookie
window.getCookie = function (name) {
    try {
        // Add validation for cookie name
        if (!name || typeof name !== 'string') {
            throw new Error('Invalid cookie name');
        }

        const cookieName = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);

        // Use array method find() instead of for loop
        const cookieValue = decodedCookie.split(';')
            .map(c => c.trim())
            .find(c => c.startsWith(cookieName));

        // Return cookie value or null if not found
        return cookieValue ? cookieValue.substring(cookieName.length) : null;
    } catch (error) {
        console.error('Error getting cookie:', error);
        return null;
    }
}

// Function to delete all cookies
window.resetCookies = function () {
    window.setCookie('stickerFolder', 'BoySticker/', -1);
    window.setCookie('operator', '+', -1);
    window.setCookie('level', '10', -1);
    window.setCookie('starNumber', '0', -1);
    window.setCookie('stickerNumber', '0', -1);
}

//-----------------------------------------------------------------
//   Event handlers for dropdown changes and UI updates
//-----------------------------------------------------------------

// Handle operator change from dropdown
window.onOperatorChange = function () {
    const op = document.getElementById('operatorSelect').value;
    window.operator = op;
}

// Handle level change from dropdown
window.onLevelChange = function () {
    const lvl = document.getElementById('levelSelect').value;
    // Level 1: 0-10, Level 2: 0-12, Level 3: 0-100
    if (lvl === '1') window.level = 10;
    else if (lvl === '2') window.level = 12;
    else if (lvl === '3') window.level = 100;
}

// Handle gender change from dropdown
window.onGenderChange = function () {
    const gender = document.getElementById('genderSelect').value;
    if (gender === 'boy') window.stickerFolder = 'BoySticker/';
    else if (gender === 'girl') window.stickerFolder = 'GirlSticker/';
}

// Update the dropdown selectors to reflect current settings
window.updateSelector = function () {
    // Set operator selector
    if (window.operator === '+') document.getElementById('operatorSelect').value = '+';
    else if (window.operator === '-') document.getElementById('operatorSelect').value = '-';
    else if (window.operator === '*') document.getElementById('operatorSelect').value = '*';
    else if (window.operator === '/') document.getElementById('operatorSelect').value = '/';

    // Set level selector
    if (window.level === 10) document.getElementById('levelSelect').value = '1';
    else if (window.level === 12) document.getElementById('levelSelect').value = '2';
    else if (window.level === 100) document.getElementById('levelSelect').value = '3';

    // Set Gender selector
    if (window.stickerFolder === 'BoySticker/') document.getElementById('genderSelect').value = 'boy';
    else if (window.stickerFolder === 'GirlSticker/') document.getElementById('genderSelect').value = 'girl';
}

//-----------------------------------------------------------------
//   Game logic and UI interaction functions
//-----------------------------------------------------------------

// Convert all functions to global scope
window.updateStar = function () {
    const starContainer = document.getElementById('starContainer');
    for (let i = 0; i < window.starNumber; i++) {
        let img = document.createElement('img');
        img.src = 'images/star.png';
        img.alt = 'Star';
        img.className = 'imgStar';
        starContainer.appendChild(img);
    }
}

window.updateSticker = function () {
    const stickerContainer = document.getElementById('stickerContainer');
    for (let i = 0; i < window.stickerNumber; i++) {
        let img = document.createElement('img');
        img.src = `${window.stickerFolder}${i + 1}.png`;
        img.alt = 'Sticker';
        img.className = 'imgSticker';
        stickerContainer.appendChild(img);
    }
}

window.resetNumbers = function () {
    // Set operatorView based on operator
    if (window.operator === '+') window.operatorView = '+';
    else if (window.operator === '-') window.operatorView = '-';
    else if (window.operator === '*') window.operatorView = '×';
    else if (window.operator === '/') window.operatorView = '÷';

    // Generate two random numbers based on the selected operator and level
    if (window.operator === '+') {
        window.firstNumber = Math.floor(Math.random() * (window.level + 1));
        window.secondNumber = Math.floor(Math.random() * (window.level - window.firstNumber + 1));
    }
    else if (window.operator === '-') {
        window.firstNumber = Math.floor(Math.random() * (window.level + 1));
        window.secondNumber = Math.floor(Math.random() * (window.firstNumber + 1));
    }
    else if (window.operator === '*') {
        window.firstNumber = Math.floor(Math.random() * (window.level + 1));
        window.secondNumber = Math.floor(Math.random() * (window.level + 1));
    }
    else if (window.operator === '/') {
        window.secondNumber = Math.floor((Math.random() * window.level) + 1); // Avoid division by zero
        window.firstNumber = window.secondNumber * (Math.floor(Math.random() * (window.level + 1)));
    }

    // Update the HTML elements with the new numbers and operator
    document.getElementById('firstNumber').innerHTML = window.firstNumber;
    document.getElementById('secondNumber').innerHTML = window.secondNumber;
    document.getElementById('operator1').innerHTML = window.operatorView;
    document.getElementById('operator2').innerHTML = window.operatorView;

    // Reset the images to block
    document.getElementById('imgFirstNumber').src = `images/block.png`;
    document.getElementById('imgSecondNumber').src = `images/block.png`;
    document.getElementById('imgResultNumber').src = `images/block.png`;

    // Reset the result display
    document.getElementById('result').innerHTML = '';
}

// Function to handle image click events
window.imgClick = function (element) {
    if (element === 'imgFirstNumber') {
        if (window.firstNumber > 12) {
            document.getElementById(element).src = `images/13.png`;
        }
        else {
            document.getElementById(element).src = `images/${window.firstNumber}.png`;
        }
    } else if (element === 'imgSecondNumber') {
        if (window.secondNumber > 12) {
            document.getElementById(element).src = `images/13.png`;
        }
        else {
            document.getElementById(element).src = `images/${window.secondNumber}.png`;
        }
    } else if (element === 'imgResultNumber') {
        if (eval(`${window.firstNumber} ${window.operator} ${window.secondNumber}`) > 12) {
            document.getElementById(element).src = `images/13.png`;
        }
        else {
            document.getElementById(element).src = "images/" + eval(`${window.firstNumber} ${window.operator} ${window.secondNumber}`) + ".png";
        }
    }
    const intervalID = setTimeout(imgLeave, 10000, element);
}

window.imgLeave = function (element) {
    document.getElementById(element).src = `images/block.png`;
}

window.addNumber = function (element) {
    let result = document.getElementById('result').innerHTML;
    result += element;
    document.getElementById('result').innerHTML = result;
}

window.clearResult = function () {
    document.getElementById('result').innerHTML = '';
}

window.pointerOver = function (element) {
    document.getElementById(`${element}`).style.borderColor = 'black';
}

window.pointerLeave = function (element) {
    document.getElementById(`${element}`).style.borderColor = 'white';
}

// Check the result when the user clicks the "Enter" button
window.checkResult = function () {
    // Pause all sound effects to avoid overlap
    window.soundPositive.pause();
    window.soundNegative.pause();
    window.soundSticker.pause();

    // Get the user's answer from the result display
    let result = document.getElementById('result').innerHTML;
    const imgStar = document.getElementsByClassName('imgStar');
    const imgSticker = document.getElementsByClassName('imgSticker');
    const starContainer = document.getElementById('starContainer');
    const stickerContainer = document.getElementById('stickerContainer');

    // Check if the result is empty
    if (result === '') {
        alert('Please enter your answer first!');
        return; // Exit the function if no answer is provided
    }
    
    // Calculate the correct answer
    let correctResult = eval(`${window.firstNumber} ${window.operator} ${window.secondNumber}`);

    // Check if the user's answer is correct
    if (parseInt(result) === correctResult) {
        if (imgStar.length < maxStars) {
            window.soundPositive.currentTime = 0; // Ensure sound starts from the beginning
            window.soundPositive.play(); // Play positive sound effect
            let img = document.createElement('img');
            img.src = 'images/star.png'; // Change to your actual image path
            img.alt = 'Star';
            img.className = 'imgStar';
            starContainer.appendChild(img);
        }
        else {
            if (imgSticker.length > maxSticker) {
                alert(`You have already earned the maximum number of sticker! (${maxSticker})`);
            }
            else {
                window.soundSticker.play(); // Play sticker sound effect
                while (imgStar.length > 0) {
                    imgStar[imgStar.length - 1].remove();
                }
                let img = document.createElement('img');
                img.src = `${stickerFolder}${imgSticker.length}.png`; // Change to your actual image path
                img.alt = 'Sticker';
                img.className = 'imgSticker';
                stickerContainer.appendChild(img);
                alert(`Good job! 😊 See your sticker below!`);
            }
        }
    } else {
        window.soundNegative.currentTime = 0; // Ensure sound starts from the beginning
        window.soundNegative.play(); // Play negative sound effect
        // Show an alert with the correct answer
        alert(`Incorrect! The correct answer is ${correctResult}.`);
        if (imgStar.length > 0) {
            imgStar[imgStar.length - 1].remove(); // Remove the last star if the answer is incorrect
        }
    }
    starNumber = imgStar.length;
    stickerNumber = imgSticker.length - 1; // Adjusted to match the number of stickers
    updateCookies();
    resetNumbers();
}

// Get keydown events for number input
document.addEventListener("keydown", function (event) {
    if (window.isDigit(event.key)) {
        window.addNumber(event.key);
    }
    else if (event.key === 'Enter') {
        window.checkResult();
    }
    else if (event.key === 'Escape') {
        window.clearResult();
    }
    else if (event.key === 'Backspace' || event.key === 'Delete') {
        let result = document.getElementById('result').innerHTML;
        result = result.slice(0, -1); // Remove the last character
        document.getElementById('result').innerHTML = result;
    }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // Prevent default behavior of arrow keys
        event.preventDefault();
    }
});

// Function to check if the key pressed is a digit
window.isDigit = function (key) {
    return /^[0-9]$/.test(key); // Accepts only single digits 0–9
}