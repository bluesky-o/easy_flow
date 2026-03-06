document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementsByClassName("btn-click")[0] as HTMLElement;
    const counter = document.querySelector(".counter") as HTMLElement;

    let count: number = 0;

    btn.addEventListener("click", () => {
        count += 1;
        counter.textContent = count.toString();
    });
});
