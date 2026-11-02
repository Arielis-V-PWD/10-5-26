const form = document.querySelector('#space-form');
const dateInput = document.querySelector('#date');
const statusBox = document.querySelector('#status');
const result = document.querySelector('#result');
const apiMode = document.querySelector('#api-mode');

const today = new Date().toISOString().slice(0, 10);
dateInput.max = today;
dateInput.value = today;

function chooseRandomDate() {
    const start = new Date('1995-06-16T00:00:00Z').getTime();
    const end = new Date(today).getTime();
    const randomMs = Math.random() * (end - start) + start;
    return new Date(randomMs).toISOString().slice(0, 10);
}

apiMode.addEventListener('change', () => {
    if (apiMode.value === 'random') {
        dateInput.value = chooseRandomDate();
    } else if (apiMode.value === 'today') {
        dateInput.value = today;
    }
});

async function loadPicture(date) {
    statusBox.textContent = 'Loading...';
    result.hidden = true;

    const url = date ? `/api/space?date=${encodeURIComponent(date)}` : '/api/space';

    try {
        const response = await fetch(url);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            statusBox.textContent = data.error || 'Could not load the picture.';
            return;
        }

        showPicture(data);
        statusBox.textContent = '';
    } catch (err) {
        statusBox.textContent = 'Could not reach the server. Check your connection.';
    }
}

function showPicture(data) {
    document.querySelector('#title').textContent = data.title;
    document.querySelector('#date-shown').textContent = data.date;
    document.querySelector('#description').textContent = data.description;

    const img = document.querySelector('#picture');
    img.src = data.imageUrl;
    img.alt = data.description;

    document.querySelector('#nasa-link').href = data.nasaPage;

    result.hidden = false;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (apiMode.value === 'random') {
        dateInput.value = chooseRandomDate();
    }
    loadPicture(dateInput.value);
});

loadPicture();