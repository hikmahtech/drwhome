(() => {
  let t;
  try {
    t = localStorage.getItem("drwho-theme");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
