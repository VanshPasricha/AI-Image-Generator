const themetoggle = document.querySelector(".theme-toggle");
const promptbtn = document.querySelector(".prompt-btn");
const generatebtn = document.querySelector(".generate-btn");
const promptinput = document.querySelector(".prompt-input");
const promptform = document.querySelector(".prompt-form");
const modelsel = document.querySelector("#modelselect");
const countimg = document.querySelector("#countimg");
const sizeimg = document.querySelector("#sizeimg");
const grid = document.querySelector(".gallery-grid");



const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

(() => {
  const savetheme = localStorage.getItem("theme");
  const systemPrefer = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const istheme = savetheme === "dark" || (!savetheme && systemPrefer);
  document.body.classList.toggle("dark-theme", istheme);
  themetoggle.querySelector("i").className = istheme ? "fa-solid fa-sun" : "fa-solid fa-moon"

})();
function toggling() {
  const isdark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isdark ? "dark" : "light");
  themetoggle.querySelector("i").className = isdark ? "fa-solid fa-sun" : "fa-solid fa-moon"
}
promptbtn.addEventListener('click', () => {
  const index = Math.floor(Math.random() * examplePrompts.length)
  promptinput.value = examplePrompts[index]
})

const getImageSize = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);
  // Ensure dimensions are multiples of 16
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};

const updateImageCard = (i, imgurl) => {
  const imgCard = document.getElementById(`img-card-${i}`);
  if (i === undefined || i === null) return;
  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
        <img src="${imgurl}" class="result-img">
        <div class="img-overlay">
            <a href="${imgurl}" class="img-download-btn" download="${Date.now()}.png">
                <button class="img-download-btn">
                    <i class="fa-solid fa-download"></i>
                </button>
            </a>
        </div>`;
};



const generateImages = async (model, counti, countsize, prompttext) => {
  const { width, height } = getImageSize(countsize);
  generatebtn.setAttribute("disabled", "true");
  const imagePromises = Array.from({ length: counti }, async (_, i) => {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          inputs: prompttext,
          parameters: { width, height },
          options: { wait_for_model: true, user_cache: false },
        }),
      });
      if (!response.ok) throw new Error((await response.json())?.error);
      const result = await response.blob();
      updateImageCard(i, URL.createObjectURL(result));

    } catch (error) {
      console.log(error);
      const imgCard = document.getElementById(`img-card-${i}`);
      imgCard.classList.replace("loading", "error");
      imgCard.querySelector(".status-text").textContent = "Generation failed! Check  console for more details.";
    }
  })
  await Promise.allSettled(imagePromises);
  generatebtn.removeAttribute("disabled");
}
const createcard = (model, counti, countsize, prompttext) => {


  // Clear existing cards first
  grid.innerHTML = "";

  // Generate the selected number of image cards
  for (let i = 0; i < counti; i++) {
    const card = document.createElement("div");
    card.className = "img-card loading";
    card.id = `img-card-${i}`;
    card.style.aspectRatio = countsize;

    card.innerHTML = `
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
        <img src="images/test.png" class="result-img" alt="Generated Image">
      `;

    grid.appendChild(card); // Append card to gallery
  }
  generateImages(model, counti, countsize, prompttext);
};
function handleformsubmit(e) {
  e.preventDefault();
  const modsel = modelsel.value;
  const counti = parseInt(countimg.value) || 1;
  const sizei = sizeimg.value || "1/1";
  const prompttxt = promptinput.value.trim();
  createcard(modsel, counti, sizei, prompttxt);
}
promptform.addEventListener('submit', handleformsubmit);
themetoggle.addEventListener('click', toggling);
