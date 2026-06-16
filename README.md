# BigQuery Release Notes Explorer & X Composer

A modern, high-performance, and visually stunning web application built to parse, explore, filter, and share release notes from Google Cloud BigQuery.

---

## 🚀 Key Features

- **Live Aggregation**: Real-time parsing of the official Google Cloud BigQuery RSS/Atom XML feed.
- **Granular Update Splits**: Automatically isolates compound date logs into discrete feature, issue, and deprecation cards.
- **Micro-Caching**: Optimizes feed loads and respects rate boundaries via backend cache memory.
- **Modern Glassmorphic UI**: Sleek dark mode styled with frost glass panels, custom color-coded categories, and radial lighting details.
- **Live Search & Filter Chips**: Filter updates instantly by keywords or click-to-filter categories (Features, Issues, Deprecations).
- **Interactive X (Twitter) Composer**: Draft tweets with a custom preview card, circular progress character count, and native Web Intent integration.

---

## 🛠️ Technology Stack

- **Backend**: Python, Flask
- **Frontend**: Vanilla JavaScript (ES6+), HTML5
- **Styling**: Modern CSS3 (Variables, Backdrop Blurs, Grid layouts, custom animations)
- **External Feeds**: Google Cloud BigQuery Atom RSS Feed

---

## 📁 Repository Structure

```text
├── static/
│   ├── app.js        # Client-side state, filters, and composer logic
│   └── style.css     # CSS custom variables and glassmorphic designs
├── templates/
│   └── index.html    # Layout structure and modal layout
├── app.py            # Flask server, Atom XML parser, and caching
├── .gitignore        # Local configuration & environment blockages
└── README.md         # Project documentation
```

---

## 💻 Local Setup & Installation

### Prerequisites
- Python 3.8 or higher installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/sahas268/sos-event-talks-app.git
cd sos-event-talks-app
```

### 2. Install Flask
```bash
pip install flask
```

### 3. Run the Development Server
```bash
python app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser to view the application.

---

## ☁️ How to Deploy to Google Cloud Run

To host this web application in the cloud, you can deploy it directly to **Google Cloud Run** using the Google Cloud CLI (`gcloud`).

### 1. Create a `Dockerfile`
Create a file named `Dockerfile` in the root directory:
```dockerfile
FROM python:3.11-slim
ENV PYTHONUNBUFFERED True
ENV PORT 8080
WORKDIR /app
COPY . ./
RUN pip install --no-cache-dir -r requirements.txt
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
```

### 2. Prepare dependencies
Ensure you have a `requirements.txt` file listing your dependencies:
```text
flask
gunicorn
```

### 3. Deploy Command
Run the following command from the root of your project directory:
```bash
gcloud run deploy sos-event-talks-app \
    --source . \
    --region us-central1 \
    --allow-unauthenticated
```

*(Note: Follow the prompts to build the container on Google Cloud Build and deploy it to Cloud Run.)*
