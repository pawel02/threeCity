const startShowing = window.innerHeight / 4;

function handleScrollAnimation()
{
    // Get the first scrolling element
    const elements = document.querySelectorAll(".opacity-animate");
    for (const el of elements)
    {
        const inViewAmount = window.innerHeight - el.getBoundingClientRect().top - startShowing;
        el.style.opacity = inViewAmount / el.getBoundingClientRect().height;
    }
}


window.addEventListener("scroll", (val) => { 
  handleScrollAnimation();
});