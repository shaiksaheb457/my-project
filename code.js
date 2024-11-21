// Event listener for page load
window.addEventListener('load', function() {
  // Dynamic text change effect
  const dynamicText = document.getElementById('dynamic-text');
  const words = ["MANHUB", "FOR THE MEN WHO LEAD"];
  let currentWordIndex = 0;

  function changeWord() {
    dynamicText.style.opacity = '0'; // Fade out current text

    setTimeout(() => {
      dynamicText.textContent = words[currentWordIndex]; // Change text content
      dynamicText.style.opacity = '1'; // Fade in new text
      currentWordIndex = (currentWordIndex + 1) % words.length; // Cycle through words
    }, 1000); // Delay between fade-out and fade-in
  }

  // Initial call and set interval for repeated change
  changeWord();
  setInterval(changeWord, 3000); // Adjusted timing to avoid abrupt switching
});

// Ripple effect for button
document.querySelector('.our-story-btn').addEventListener('click', function(e) {
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(button.offsetWidth, button.offsetHeight);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  ripple.classList.add('ripple');
  button.appendChild(ripple);

  // Remove ripple effect after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
});
document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent the form from reloading the page

  // Get input values from the form
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
      // Send login data to the backend
      const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
      });

      // Parse the response
      const data = await response.json();

      if (response.ok) {
          alert('Login successful!');
          // Store the token (optional, for authenticated requests)
          localStorage.setItem('token', data.token);
          // Redirect to another page if needed
          window.location.href = '/index.html';
      } else {
          alert(data.message || 'Login failed');
      }
  } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred. Please try again.');
  }
});


document.getElementById('signupForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
      const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
          alert('Sign-up successful!');
          window.location.href = '/login.html';
      } else {
          alert(data.message);
      }
  } catch (error) {
      console.error('Error during sign-up:', error);
  }
});