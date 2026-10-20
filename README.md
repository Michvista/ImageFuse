# ImageFuse

ImageFuse is an AI-powered web application that merges specific elements from one image into another using natural language instructions. It leverages Google Gemini’s multimodal reasoning to simplify creative visualization.

---

## 🚀 Features
- Upload two images
- Describe which elements to combine
- AI-powered visual fusion using Gemini
- Simple and intuitive interface

---

## 🧠 Inspiration
The project was inspired by a real-life scenario where two different fashion designs needed to be combined into one visual concept. Traditional tools were either too complex or time-consuming, which led to the idea of building a conversational, AI-driven solution.

---

## 🛠 Tech Stack
- **Frontend:** Next.js
- **Backend:** Next.js API Routes
- **AI:** Google Gemini Multimodal API
- **Language:** JavaScript / TypeScript

---

## ⚙️ How It Works
1. Users upload images and enter a prompt
2. Images and instructions are sent to Gemini
3. Gemini analyzes visual elements and text
4. A fused image is generated and returned

## Gemini model configuration

Set `GEMINI_API_KEY` in your deployment environment. ImageFuse uses
`gemini-nano-banana-2.1` for image fusion because Gemini 3.8 Flash returns text
only. If an image model fails, the API tries the models listed in
`GEMINI_IMAGE_FALLBACK_MODELS` in order. Set `GEMINI_IMAGE_MODEL` and
`GEMINI_IMAGE_FALLBACK_MODELS` to change the model order without changing code.
See `.env.example` for the current defaults.

---

## 🚧 Challenges
- Prompt clarity for image reasoning
- Handling different image structures
- Maintaining fast response times

---

## 📚 What I Learned
- Multimodal AI workflows
- Prompt design for visual reasoning
- Building clean UX around AI systems


---

## 🔗 Links
- Demo Video: (https://youtu.be/8gkYurDbbew)
- Live Demo: (https://image-fuse.vercel.app/)
