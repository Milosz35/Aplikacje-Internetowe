type StyleDefinition = {
  id: string;
  name: string;
  href: string;
};

const styles: StyleDefinition[] = [
  { id: "style1", name: "Styl jasny", href: "/style.css" },
  { id: "style2", name: "Styl neonowy", href: "/style2.css" },
  { id: "style3", name: "Styl trzeci", href: "/style3.css" }, 
];

function applyStyle(href: string) {
   let linkEl = document.querySelector<HTMLLinkElement>(
    'link[data-dynamic-style="true"]'
  );

  if (!linkEl) {
    linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.dataset.dynamicStyle = "true"; 
    document.head.appendChild(linkEl);
  }
  linkEl.href = href;
}

function renderStyleLinks() {
  const container = document.getElementById("style-links");
  if (!container) return;

  container.innerHTML = ""; 

  styles.forEach((style) => {
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = style.name;
    a.dataset.styleHref = style.href;
    a.style.marginRight = "1rem";

    a.addEventListener("click", (event) => {
      event.preventDefault();
      applyStyle(style.href);
    });

    container.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyStyle(styles[0].href);
  renderStyleLinks();
});
