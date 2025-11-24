function toggleMenu(){
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

window.addEventListener("load", () => {
  const intro = document.getElementById("intro");
  const text = document.getElementById("intro-text");

  const hellos = [
    "Hello",
    "Hola",
    "Bonjour",
    "Ciao",
    "Hallo",
    "こんにちは",
    "Γεια"
];

  let index = 0;

  function showNextHello() {
    text.style.opacity = 0;

    setTimeout(() => {
      text.textContent = hellos[index];
      text.style.opacity = 1;
      index++;

      if (index < hellos.length) {
        setTimeout(showNextHello, 150);
      }
    }, 200);
  }

  showNextHello();

  // Hide intro completely after the sequence + fade-out
  setTimeout(() => {
    intro.style.display = "none";
  }, 6000); // adjust if needed
});
