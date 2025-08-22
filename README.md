# AI Image Generator 🪄✨

A sleek, responsive web application that allows you to generate AI images directly in your browser using various models from the Hugging Face Inference API. Describe your imagination and watch it come to life!




---

## ✨ Features

-   **Multi-Model Support**: Generate images using different AI models, including `FLUX`, `Stable Diffusion XL`, `Stable Diffusion v1.5`, and `Openjourney`.
-   **Customizable Generation**: Control the output by selecting the number of images (1-4) and the aspect ratio (Square, Landscape, Portrait).
-   **"Surprise Me" Prompts**: Not sure what to create? Use the dice button 🎲 to get a random creative prompt.
-   **Light & Dark Mode**: A beautiful theme toggle that respects your system preference and saves your choice in local storage. 🌓
-   **Fully Responsive**: A clean, modern UI that works perfectly on desktops, tablets, and mobile devices.
-   **Real-time Status**: See the status of each image generation in real-time with loading spinners and clear error messages.
-   **Download Images**: Easily save your favorite creations with a one-click download button.
-   **Vanilla JS**: Built with pure HTML, CSS, and JavaScript, with no external frameworks needed (besides Font Awesome for icons).

---

## 🛠️ Technologies Used

-   **HTML5**
-   **CSS3** (with CSS Variables for theming)
-   **Vanilla JavaScript**
-   **[Hugging Face Inference API](https://huggingface.co/inference-api)**
-   **[Font Awesome](https://fontawesome.com/)** for icons

---

## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a **Hugging Face API Key** to use the image generation features.

1.  Create a free account on [Hugging Face](https://huggingface.co/join).
2.  Go to your profile settings and navigate to the **Access Tokens** section.
3.  Create a new token with `read` permissions.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd your-repository-name
    ```
3.  **Add your API Key:**
    -   Open the `hand.js` file.
    -   Find the line `const API_KEY="hf_..."`.
    -   Replace `"hf_..."` with your own Hugging Face API Key.

    ```javascript
    const API_KEY = "YOUR_HUGGING_FACE_API_KEY_HERE";
    ```

    > **⚠️ Security Warning:**
    > Do not commit your API key directly to a public GitHub repository. If you plan to deploy this project, use environment variables to keep your key secure. For local use, it's fine as is.

4.  **Open `index.html` in your browser.**
    You can do this by double-clicking the file or using a live server extension in your code editor (like VS Code's "Live Server").

---

## 📖 How to Use

1.  **Describe your image**: Type a detailed description of the image you want to create in the text area.
2.  **Get Inspired**: Click the dice button (🎲) if you need a random prompt idea.
3.  **Select Options**:
    -   Choose an AI model from the first dropdown.
    -   Select the number of images to generate.
    -   Choose the desired aspect ratio.
4.  **Generate**: Click the **Generate** button and wait for the magic to happen!
5.  **Download**: Once an image is generated, hover over it and click the download icon (📥) to save it.

## License

Distributed under the MIT License. See `LICENSE` for more information.
